document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in and is admin
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token || !currentUser.isAdmin) {
    // Redirect to login if not logged in or not admin
    window.location.href = "index.html"
    return
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Clear user data from localStorage
      localStorage.removeItem("currentUser")
      localStorage.removeItem("token")

      // Redirect to login page
      window.location.href = "index.html"
    })
  }

  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Show corresponding tab content
      const tabId = this.getAttribute("data-tab") + "-tab"
      document.getElementById(tabId).classList.add("active")
    })
  })

  // Bottom nav buttons
  const adminFundBtn = document.getElementById("adminFundBtn")
  const adminTransactionsBtn = document.getElementById("adminTransactionsBtn")
  const adminUsersBtn = document.getElementById("adminUsersBtn")

  if (adminFundBtn) {
    adminFundBtn.addEventListener("click", () => {
      // Scroll to fund user section
      document.querySelector(".fund-user-card").scrollIntoView({ behavior: "smooth" })
    })
  }

  if (adminTransactionsBtn) {
    adminTransactionsBtn.addEventListener("click", () => {
      // Switch to transactions tab
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      document.querySelector('[data-tab="transactions"]').classList.add("active")
      document.getElementById("transactions-tab").classList.add("active")
    })
  }

  if (adminUsersBtn) {
    adminUsersBtn.addEventListener("click", () => {
      // Switch to users tab
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      document.querySelector('[data-tab="users"]').classList.add("active")
      document.getElementById("users-tab").classList.add("active")
    })
  }

  // Load users
  const usersList = document.getElementById("usersList")
  const usersLoading = document.getElementById("usersLoading")
  const noUsers = document.getElementById("noUsers")

  function loadUsers() {
    fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Hide loading spinner
        usersLoading.classList.add("hidden")

        if (data.success && data.users.length > 0) {
          // Render users
          usersList.innerHTML = ""
          data.users.forEach((user) => {
            if (!user.isAdmin) {
              // Don't show admin in the list
              const userItem = createUserItem(user)
              usersList.appendChild(userItem)
            }
          })
        } else {
          // Show no users message
          noUsers.classList.remove("hidden")
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error)
        usersLoading.classList.add("hidden")
        noUsers.classList.remove("hidden")
      })
  }

  // Create user item
  function createUserItem(user) {
    const div = document.createElement("div")
    div.className = "user-item"
    div.innerHTML = `
          <div class="user-info">
              <h4>${user.name}</h4>
              <div class="user-email">${user.email}</div>
              <div class="user-balance">$${Number.parseFloat(user.balance).toFixed(2)}</div>
              <div class="user-status status-${user.status}">${user.status}</div>
          </div>
          <div class="user-actions">
              <button class="user-action-btn view" data-id="${user.id}" title="View User">
                  <i class="fas fa-eye"></i>
              </button>
              <button class="user-action-btn edit" data-id="${user.id}" title="Edit User">
                  <i class="fas fa-edit"></i>
              </button>
              <button class="user-action-btn delete" data-id="${user.id}" title="Delete User">
                  <i class="fas fa-trash"></i>
              </button>
          </div>
      `

    // Add event listeners for action buttons
    const viewBtn = div.querySelector(".view")
    const editBtn = div.querySelector(".edit")
    const deleteBtn = div.querySelector(".delete")

    viewBtn.addEventListener("click", function () {
      const userId = this.getAttribute("data-id")
      viewUser(userId)
    })

    editBtn.addEventListener("click", function () {
      const userId = this.getAttribute("data-id")
      editUser(userId)
    })

    deleteBtn.addEventListener("click", function () {
      const userId = this.getAttribute("data-id")
      deleteUser(userId)
    })

    return div
  }

  // View user
  function viewUser(userId) {
    fetch(`/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert(
            `User Details:\nName: ${data.user.name}\nEmail: ${data.user.email}\nBalance: $${data.user.balance}\nStatus: ${data.user.status}`,
          )
        } else {
          alert(data.message || "Failed to load user details")
        }
      })
      .catch((error) => {
        console.error("Error viewing user:", error)
        alert("An error occurred. Please try again.")
      })
  }

  // Edit user
  function editUser(userId) {
    // Get user data
    fetch(`/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Populate edit form
          document.getElementById("editUserId").value = data.user.id
          document.getElementById("editUserName").value = data.user.name
          document.getElementById("editUserEmail").value = data.user.email
          document.getElementById("editUserStatus").value = data.user.status

          // Show edit modal
          document.getElementById("userEditModal").classList.add("active")
        } else {
          alert(data.message || "Failed to load user details")
        }
      })
      .catch((error) => {
        console.error("Error loading user for edit:", error)
        alert("An error occurred. Please try again.")
      })
  }

  // Delete user
  function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user?")) {
      fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Reload users
            loadUsers()
          } else {
            alert(data.message || "Failed to delete user")
          }
        })
        .catch((error) => {
          console.error("Error deleting user:", error)
          alert("An error occurred. Please try again.")
        })
    }
  }

  // Edit user form
  const editUserForm = document.getElementById("editUserForm")
  if (editUserForm) {
    editUserForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const userId = document.getElementById("editUserId").value
      const name = document.getElementById("editUserName").value
      const email = document.getElementById("editUserEmail").value
      const status = document.getElementById("editUserStatus").value
      const errorElement = document.getElementById("editUserError")

      // Clear previous errors
      errorElement.textContent = ""

      // Make API request to update user
      fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          status,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Close modal and reload users
            document.getElementById("userEditModal").classList.remove("active")
            loadUsers()
          } else {
            errorElement.textContent = data.message || "Failed to update user"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Edit user error:", error)
        })
    })
  }

  // Close modal
  const closeModalButtons = document.querySelectorAll(".close-modal")
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.classList.remove("active")
      })
    })
  })

  // Load transactions
  const adminTransactionsList = document.getElementById("adminTransactionsList")
  const adminTransactionsLoading = document.getElementById("adminTransactionsLoading")
  const noAdminTransactions = document.getElementById("noAdminTransactions")

  function loadTransactions() {
    fetch("/api/admin/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Hide loading spinner
        adminTransactionsLoading.classList.add("hidden")

        if (data.success && data.transactions.length > 0) {
          // Render transactions
          adminTransactionsList.innerHTML = ""
          data.transactions.forEach((transaction) => {
            const transactionItem = createAdminTransactionItem(transaction)
            adminTransactionsList.appendChild(transactionItem)
          })
        } else {
          // Show no transactions message
          noAdminTransactions.classList.remove("hidden")
        }
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error)
        adminTransactionsLoading.classList.add("hidden")
        noAdminTransactions.classList.remove("hidden")
      })
  }

  // Create admin transaction item
  function createAdminTransactionItem(transaction) {
    const div = document.createElement("div")
    div.className = "transaction-item"

    div.innerHTML = `
          <div class="transaction-info">
              <div class="transaction-details">
                  <h4>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</h4>
                  <div class="transaction-date">${formatDate(transaction.createdAt)}</div>
                  <div class="transaction-type">${transaction.type}</div>
                  <div class="transaction-parties">
                      <div>From: ${transaction.fromName || "N/A"}</div>
                      <div>To: ${transaction.toName || "N/A"}</div>
                  </div>
              </div>
          </div>
          <div class="transaction-meta">
              <div class="transaction-amount">$${Number.parseFloat(transaction.amount).toFixed(2)}</div>
              <div class="transaction-status">${transaction.status}</div>
          </div>
      `

    return div
  }

  // Fund user form handling
  const fundUserForm = document.getElementById("fundUserForm")
  if (fundUserForm) {
    fundUserForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const userEmail = document.getElementById("userEmail").value
      const fundAmount = document.getElementById("fundAmount").value
      const errorElement = document.getElementById("fundError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate amount
      if (Number.parseFloat(fundAmount) <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to fund user
      fetch("/api/admin/fund-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userEmail,
          amount: Number.parseFloat(fundAmount),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Show success message with receipt details
            const receiptMessage = `
        ----------------------
         Admin Funding Receipt:✅
        ---------------------
        💠 To: ${userEmail} 💠
        💠 Amount: $${Number.parseFloat(fundAmount).toFixed(2)} 💠
        💠 Date: ${new Date().toLocaleString()} 💠
        💠 Status: Completed💠
        💠 Admin Funding Reciept💠
      -------------------------
          `
            alert(receiptMessage)
            fundUserForm.reset()

            // Reload users to show updated balance
            loadUsers()
            // Reload transactions to show the funding transaction
            loadTransactions()
          } else {
            errorElement.textContent = data.message || "Failed to fund user"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Fund user error:", error)
        })
    })
  }

  // User search functionality
  const userSearch = document.getElementById("userSearch")
  if (userSearch) {
    userSearch.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      const userItems = usersList.querySelectorAll(".user-item")

      userItems.forEach((item) => {
        const name = item.querySelector("h4").textContent.toLowerCase()
        const email = item.querySelector(".user-email").textContent.toLowerCase()

        if (name.includes(searchTerm) || email.includes(searchTerm)) {
          item.style.display = ""
        } else {
          item.style.display = "none"
        }
      })
    })
  }

  // Transaction search functionality
  const transactionSearch = document.getElementById("transactionSearch")
  if (transactionSearch) {
    transactionSearch.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      const transactionItems = adminTransactionsList.querySelectorAll(".transaction-item")

      transactionItems.forEach((item) => {
        const type = item.querySelector(".transaction-type").textContent.toLowerCase()
        const from = item.querySelector(".transaction-parties div:first-child").textContent.toLowerCase()
        const to = item.querySelector(".transaction-parties div:last-child").textContent.toLowerCase()

        if (type.includes(searchTerm) || from.includes(searchTerm) || to.includes(searchTerm)) {
          item.style.display = ""
        } else {
          item.style.display = "none"
        }
      })
    })
  }

  // Helper function to format date
  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // Load data on page load
  loadUsers()
  loadTransactions()
})

