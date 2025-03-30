const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const path = require("path")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 7860
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Middleware
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname)))

// Helper functions for file operations
function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath)
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

function writeJSONFile(filePath, data) {
  const dirPath = path.dirname(filePath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// File paths
const USERS_FILE = path.join(__dirname, "data", "users.json")
const TRANSACTIONS_FILE = path.join(__dirname, "data", "transactions.json")
const WALLETS_FILE = path.join(__dirname, "data", "wallets.json")
const BITCOIN_WALLETS_FILE = path.join(__dirname, "data", "bitcoin-wallets.json")

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"))
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  // Create admin user
  const adminUser = {
    id: uuidv4(),
    name: "Admin User",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", 10),
    balance: 5000000000.0,
    isAdmin: true,
    status: "active",
    createdAt: new Date().toISOString(),
  }
  writeJSONFile(USERS_FILE, [adminUser])
}

if (!fs.existsSync(TRANSACTIONS_FILE)) {
  writeJSONFile(TRANSACTIONS_FILE, [])
}

if (!fs.existsSync(WALLETS_FILE)) {
  writeJSONFile(WALLETS_FILE, [])
}

if (!fs.existsSync(BITCOIN_WALLETS_FILE)) {
  writeJSONFile(BITCOIN_WALLETS_FILE, [])
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" })
    }

    req.user = user
    next()
  })
}

// Admin middleware
function isAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access required" })
  }
  next()
}

// Routes

// Auth routes
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }

  // Check if email already exists
  const users = readJSONFile(USERS_FILE)
  if (users.some((user) => user.email === email)) {
    return res.status(400).json({ success: false, message: "Email already in use" })
  }

  // Create new user
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    balance: 0,
    isAdmin: false,
    status: "active",
    createdAt: new Date().toISOString(),
  }

  // Add user to file
  users.push(newUser)
  writeJSONFile(USERS_FILE, users)

  // Create token
  const token = jwt.sign({ id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin }, JWT_SECRET, {
    expiresIn: "24h",
  })

  // Return user data (without password)
  const { password: _, ...userWithoutPassword } = newUser
  res.status(201).json({ success: true, user: userWithoutPassword, token })
})

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" })
  }

  // Find user
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.email === email)

  // Check if user exists and password is correct
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, message: "Invalid email or password" })
  }

  // Create token
  const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "24h" })

  // Return user data (without password)
  const { password: _, ...userWithoutPassword } = user
  res.json({ success: true, user: userWithoutPassword, token })
})

// User routes
app.get("/api/users/balance", authenticateToken, (req, res) => {
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.id === req.user.id)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  res.json({ success: true, balance: user.balance })
})

app.get("/api/users/bitcoin-balance", authenticateToken, (req, res) => {
  const bitcoinWallets = readJSONFile(BITCOIN_WALLETS_FILE)
  const wallet = bitcoinWallets.find((wallet) => wallet.userId === req.user.id)

  if (!wallet) {
    // Create a new Bitcoin wallet for the user
    const newWallet = {
      id: uuidv4(),
      userId: req.user.id,
      balance: 0,
      createdAt: new Date().toISOString(),
    }

    bitcoinWallets.push(newWallet)
    writeJSONFile(BITCOIN_WALLETS_FILE, bitcoinWallets)

    return res.json({ success: true, balance: 0 })
  }

  res.json({ success: true, balance: wallet.balance })
})

app.put("/api/users/profile", authenticateToken, (req, res) => {
  const { name } = req.body
  const userId = req.user.id

  // Validate input
  if (!name) {
    return res.status(400).json({ success: false, message: "Name is required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Update user
  users[userIndex].name = name

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  res.json({ success: true, message: "Profile updated successfully" })
})

app.put("/api/users/change-password", authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current password and new password are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Verify current password
  if (!bcrypt.compareSync(currentPassword, users[userIndex].password)) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" })
  }

  // Update password
  users[userIndex].password = bcrypt.hashSync(newPassword, 10)

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  res.json({ success: true, message: "Password changed successfully" })
})

app.post("/api/users/transfer-to-bitcoin", authenticateToken, (req, res) => {
  const { amount } = req.body
  const userId = req.user.id

  // Validate input
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid amount is required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Check if user has enough balance
  if (users[userIndex].balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance" })
  }

  // Get Bitcoin wallets
  const bitcoinWallets = readJSONFile(BITCOIN_WALLETS_FILE)
  let wallet = bitcoinWallets.find((wallet) => wallet.userId === userId)

  if (!wallet) {
    // Create a new Bitcoin wallet for the user
    wallet = {
      id: uuidv4(),
      userId,
      balance: 0,
      createdAt: new Date().toISOString(),
    }

    bitcoinWallets.push(wallet)
  }

  // Update balances
  users[userIndex].balance -= amount
  wallet.balance += amount

  // Save updated data
  writeJSONFile(USERS_FILE, users)
  writeJSONFile(BITCOIN_WALLETS_FILE, bitcoinWallets)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "bitcoin-transfer",
    amount,
    fromUserId: userId,
    toUserId: userId,
    fromName: "Main Wallet",
    toName: "Bitcoin Wallet",
    note: "Transfer to Bitcoin wallet",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "Transfer to Bitcoin wallet successful" })
})

// Transaction routes
app.get("/api/transactions", authenticateToken, (req, res) => {
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const userId = req.user.id

  // Filter transactions for current user
  const userTransactions = transactions.filter(
    (transaction) =>
      (transaction.fromUserId === userId || transaction.toUserId === userId) &&
      (transaction.type !== "admin-funding" || transaction.toUserId === userId),
  )

  // Format transactions for response
  const formattedTransactions = userTransactions.map((transaction) => {
    const isReceived = transaction.toUserId === userId

    return {
      id: transaction.id,
      type: isReceived ? "received" : "sent",
      amount: transaction.amount,
      from: transaction.fromName,
      to: transaction.toName,
      date: transaction.createdAt,
      status: transaction.status,
      note: transaction.note,
    }
  })

  res.json({ success: true, transactions: formattedTransactions })
})

app.post("/api/transactions/send", authenticateToken, (req, res) => {
  const { recipientEmail, amount, note } = req.body
  const senderId = req.user.id

  // Validate input
  if (!recipientEmail || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid recipient and amount are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const sender = users.find((user) => user.id === senderId)
  const recipient = users.find((user) => user.email === recipientEmail)

  // Check if recipient exists
  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  // Check if sender has enough balance
  if (sender.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance" })
  }

  // Update balances
  sender.balance -= Number.parseFloat(amount)
  recipient.balance += Number.parseFloat(amount)

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "transfer",
    amount: Number.parseFloat(amount),
    fromUserId: sender.id,
    toUserId: recipient.id,
    fromName: sender.name,
    toName: recipient.name,
    note: note || "",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "Transfer successful" })
})

app.post("/api/transactions/fund-from-bitcoin", authenticateToken, (req, res) => {
  const { recipientEmail, amount } = req.body
  const senderId = req.user.id

  // Validate input
  if (!recipientEmail || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid recipient and amount are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const sender = users.find((user) => user.id === senderId)
  const recipient = users.find((user) => user.email === recipientEmail)

  // Check if recipient exists
  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  // Get Bitcoin wallets
  const bitcoinWallets = readJSONFile(BITCOIN_WALLETS_FILE)
  const senderBitcoinWallet = bitcoinWallets.find((wallet) => wallet.userId === senderId)

  // Check if sender has a Bitcoin wallet
  if (!senderBitcoinWallet) {
    return res.status(404).json({ success: false, message: "Bitcoin wallet not found" })
  }

  // Check if sender has enough balance in Bitcoin wallet
  if (senderBitcoinWallet.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient Bitcoin wallet balance" })
  }

  // Update balances
  senderBitcoinWallet.balance -= amount
  recipient.balance += amount

  // Save updated data
  writeJSONFile(BITCOIN_WALLETS_FILE, bitcoinWallets)
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "bitcoin-funding",
    amount,
    fromUserId: sender.id,
    toUserId: recipient.id,
    fromName: `${sender.name} (Bitcoin)`,
    toName: recipient.name,
    note: "Funding from Bitcoin wallet",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "Bitcoin funding successful" })
})

app.post("/api/transactions/deposit", authenticateToken, (req, res) => {
  const { amount, method } = req.body
  const userId = req.user.id

  // Validate input
  if (!amount || amount <= 0 || !method) {
    return res.status(400).json({ success: false, message: "Valid amount and payment method are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.id === userId)

  // Update balance
  user.balance += amount

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "deposit",
    amount,
    fromUserId: null,
    toUserId: user.id,
    fromName: `${method.charAt(0).toUpperCase() + method.slice(1)} Deposit`,
    toName: user.name,
    note: `Deposit via ${method}`,
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "Deposit successful" })
})

app.post("/api/transactions/withdraw", authenticateToken, (req, res) => {
  const { amount, destination, address } = req.body
  const userId = req.user.id

  // Validate input
  if (!amount || amount <= 0 || !destination || !address) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.id === userId)

  // Check if user has enough balance
  if (user.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance" })
  }

  // Update balance
  user.balance -= amount

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "withdrawal",
    amount,
    fromUserId: user.id,
    toUserId: null,
    fromName: user.name,
    toName: `${destination.charAt(0).toUpperCase() + destination.slice(1)} Wallet`,
    note: `Withdrawal to ${address}`,
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "Withdrawal successful" })
})

// Wallet routes
app.get("/api/wallets", authenticateToken, (req, res) => {
  const wallets = readJSONFile(WALLETS_FILE)
  const userId = req.user.id

  // Filter wallets for current user
  const userWallets = wallets.filter((wallet) => wallet.userId === userId)

  res.json({ success: true, wallets: userWallets })
})

app.post("/api/wallets", authenticateToken, (req, res) => {
  const { type, address, label } = req.body
  const userId = req.user.id

  // Validate input
  if (!type || !address) {
    return res.status(400).json({ success: false, message: "Wallet type and address are required" })
  }

  // Create new wallet
  const wallets = readJSONFile(WALLETS_FILE)
  const newWallet = {
    id: uuidv4(),
    userId,
    type,
    address,
    label: label || "",
    createdAt: new Date().toISOString(),
  }

  wallets.push(newWallet)
  writeJSONFile(WALLETS_FILE, wallets)

  res.status(201).json({ success: true, wallet: newWallet })
})

app.delete("/api/wallets/:id", authenticateToken, (req, res) => {
  const walletId = req.params.id
  const userId = req.user.id

  // Get wallets
  const wallets = readJSONFile(WALLETS_FILE)

  // Find wallet index
  const walletIndex = wallets.findIndex((wallet) => wallet.id === walletId && wallet.userId === userId)

  if (walletIndex === -1) {
    return res.status(404).json({ success: false, message: "Wallet not found" })
  }

  // Remove wallet
  wallets.splice(walletIndex, 1)
  writeJSONFile(WALLETS_FILE, wallets)

  res.json({ success: true, message: "Wallet deleted successfully" })
})

// Admin routes
app.get("/api/admin/users", authenticateToken, isAdmin, (req, res) => {
  const users = readJSONFile(USERS_FILE)

  // Format users for response (remove passwords)
  const formattedUsers = users.map((user) => {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  })

  res.json({ success: true, users: formattedUsers })
})

app.get("/api/admin/users/:id", authenticateToken, isAdmin, (req, res) => {
  const userId = req.params.id

  // Get users
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.id === userId)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Remove password from user data
  const { password, ...userWithoutPassword } = user

  res.json({ success: true, user: userWithoutPassword })
})

app.put("/api/admin/users/:id", authenticateToken, isAdmin, (req, res) => {
  const userId = req.params.id
  const { name, email, status } = req.body

  // Validate input
  if (!name || !email || !status) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Prevent editing admin user if not admin
  if (users[userIndex].isAdmin && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Cannot edit admin user" })
  }

  // Update user
  users[userIndex].name = name
  users[userIndex].email = email
  users[userIndex].status = status

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  res.json({ success: true, message: "User updated successfully" })
})

app.delete("/api/admin/users/:id", authenticateToken, isAdmin, (req, res) => {
  const userId = req.params.id

  // Get users
  const users = readJSONFile(USERS_FILE)

  // Find user index
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Prevent deleting admin user
  if (users[userIndex].isAdmin) {
    return res.status(400).json({ success: false, message: "Cannot delete admin user" })
  }

  // Remove user
  users.splice(userIndex, 1)
  writeJSONFile(USERS_FILE, users)

  res.json({ success: true, message: "User deleted successfully" })
})

app.get("/api/admin/transactions", authenticateToken, isAdmin, (req, res) => {
  const transactions = readJSONFile(TRANSACTIONS_FILE)

  res.json({ success: true, transactions })
})

app.post("/api/admin/fund-user", authenticateToken, isAdmin, (req, res) => {
  const { email, amount } = req.body
  const adminId = req.user.id

  // Validate input
  if (!email || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid email and amount are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const admin = users.find((user) => user.id === adminId)
  const user = users.find((user) => user.email === email)

  // Check if user exists
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Update user balance
  user.balance += Number.parseFloat(amount)

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "admin-funding",
    amount: Number.parseFloat(amount),
    fromUserId: admin.id,
    toUserId: user.id,
    fromName: "Admin",
    toName: user.name,
    note: "Admin funding",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "User funded successfully" })
})

// Serve HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.get("*", (req, res) => {
  // For any other route, try to serve the file from the directory
  const filePath = path.join(__dirname, req.path)

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath)
  } else {
    // If file doesn't exist, redirect to index
    res.redirect("/")
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

