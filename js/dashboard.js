// Check for receipt data on page load
document.addEventListener("DOMContentLoaded", () => {
  const receiptData = JSON.parse(localStorage.getItem('lastReceipt'));
  
  if (receiptData) {
    showReceipt(receiptData);
    localStorage.removeItem('lastReceipt');
  }
});

function showReceipt({ recipient, amount, note }) {
  document.getElementById('receiptDateTime').textContent = new Date().toLocaleString();
  document.getElementById('receiptRecipient').textContent = recipient;
  document.getElementById('receiptAmount').textContent = Number(amount).toFixed(2);
  document.getElementById('receiptNote').textContent = note || '-';
  
  document.getElementById('receiptOverlay').style.display = 'block';
  document.getElementById('receiptModal').style.display = 'block';
}

// Close receipt when clicking outside
document.getElementById('receiptOverlay').addEventListener('click', () => {
  document.getElementById('receiptOverlay').style.display = 'none';
  document.getElementById('receiptModal').style.display = 'none';
});

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    // Redirect to login if not logged in
    window.location.href = "index.html"
    return
  }

  // Set user name and initial in avatar
  const userName = document.getElementById("userName")
  const userInitial = document.getElementById("userInitial")

  if (userName && currentUser.name) {
    userName.textContent = currentUser.name.split(" ")[0]
  }

  if (userInitial && currentUser.name) {
    userInitial.textContent = currentUser.name.charAt(0).toUpperCase()
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

  // Load user balance
  const balanceAmount = document.getElementById("balanceAmount")
  if (balanceAmount) {
    fetch("/api/users/balance", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          balanceAmount.textContent = `$${Number.parseFloat(data.balance).toFixed(2)}`
        }
      })
      .catch((error) => {
        console.error("Error fetching balance:", error)
        balanceAmount.textContent = "Error loading balance"
      })
  }

  // Load Bitcoin balance
  const bitcoinBalance = document.getElementById("bitcoinBalance")
  if (bitcoinBalance) {
    fetch("/api/users/bitcoin-balance", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          bitcoinBalance.textContent = `$${Number.parseFloat(data.balance).toFixed(2)}`
        }
      })
      .catch((error) => {
        console.error("Error fetching bitcoin balance:", error)
        bitcoinBalance.textContent = "$0.00"
      })
  }

  // Load transactions
  const transactionsList = document.getElementById("transactionsList")
  const transactionsLoading = document.getElementById("transactionsLoading")
  const noTransactions = document.getElementById("noTransactions")

  if (transactionsList) {
    fetch("/api/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Hide loading spinner
        transactionsLoading.classList.add("hidden")

        if (data.success && data.transactions.length > 0) {
          // Render transactions (limit to 5 for dashboard)
          const recentTransactions = data.transactions.slice(0, 5)
          recentTransactions.forEach((transaction) => {
            const transactionItem = createTransactionItem(transaction)
            transactionsList.appendChild(transactionItem)
          })
        } else {
          // Show no transactions message
          noTransactions.classList.remove("hidden")
        }
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error)
        transactionsLoading.classList.add("hidden")
        noTransactions.classList.remove("hidden")
        noTransactions.querySelector("p").textContent = "Error loading transactions"
      })
  }

  // Bitcoin Transfer Modal
  const transferToBtcBtn = document.getElementById("transferToBtcBtn")
  const bitcoinTransferModal = document.getElementById("bitcoinTransferModal")
  const bitcoinTransferForm = document.getElementById("bitcoinTransferForm")
  const btcTransferError = document.getElementById("btcTransferError")

  if (transferToBtcBtn) {
    transferToBtcBtn.addEventListener("click", () => {
      bitcoinTransferModal.classList.add("active")
    })
  }

  // Fund from Bitcoin Modal
  const fundFromBtcBtn = document.getElementById("fundFromBtcBtn")
  const fundFromBtcModal = document.getElementById("fundFromBtcModal")
  const fundFromBtcForm = document.getElementById("fundFromBtcForm")
  const btcFundError = document.getElementById("btcFundError")

  if (fundFromBtcBtn) {
    fundFromBtcBtn.addEventListener("click", () => {
      fundFromBtcModal.classList.add("active")
    })
  }

  // Close modals
  const closeModalButtons = document.querySelectorAll(".close-modal")
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.classList.remove("active")
      })
    })
  })

  // Bitcoin Transfer Form
  if (bitcoinTransferForm) {
    bitcoinTransferForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const amount = document.getElementById("btcAmount").value

      // Clear previous errors
      btcTransferError.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        btcTransferError.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to transfer to Bitcoin
      fetch("/api/users/transfer-to-bitcoin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Close modal and refresh page
            bitcoinTransferModal.classList.remove("active")
            alert(`Successfully transferred $${amount} to Bitcoin wallet`)
            window.location.reload()
          } else {
            btcTransferError.textContent = data.message || "Failed to transfer to Bitcoin wallet"
          }
        })
        .catch((error) => {
          btcTransferError.textContent = "An error occurred. Please try again."
          console.error("Bitcoin transfer error:", error)
        })
    })
  }

  // Fund from Bitcoin Form
  if (fundFromBtcForm) {
    fundFromBtcForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = document.getElementById("btcFundEmail").value
      const amount = document.getElementById("btcFundAmount").value

      // Clear previous errors
      btcFundError.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        btcFundError.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to fund from Bitcoin
      fetch("/api/transactions/fund-from-bitcoin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: email,
          amount: Number.parseFloat(amount),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Close modal and refresh page
            fundFromBtcModal.classList.remove("active")
            alert(`Successfully sent $${amount} from Bitcoin wallet to ${email}`)
            window.location.reload()
          } else {
            btcFundError.textContent = data.message || "Failed to send from Bitcoin wallet"
          }
        })
        .catch((error) => {
          btcFundError.textContent = "An error occurred. Please try again."
          console.error("Bitcoin fund error:", error)
        })
    })
  }

  // Feature cards "Coming Soon" functionality
  const featureCards = document.querySelectorAll(".feature-card")
  const comingSoonModal = document.getElementById("comingSoonModal")

  featureCards.forEach((card) => {
    card.addEventListener("click", () => {
      comingSoonModal.classList.add("active")
    })
  })

  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-btn")
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Get tab to show
      const tabToShow = this.getAttribute("data-tab")

      // Filter transactions based on tab
      filterTransactions(tabToShow)
    })
  })

  // Helper function to create transaction item
  function createTransactionItem(transaction) {
    const div = document.createElement("div")
    div.className = "transaction-item"
    div.setAttribute("data-type", transaction.type)

    const isReceived = transaction.type === "received"
    const iconClass = isReceived ? "fa-arrow-down received" : "fa-arrow-up sent"
    const amountClass = isReceived ? "amount-received" : "amount-sent"
    const amountPrefix = isReceived ? "+" : "-"

    div.innerHTML = `
          <div class="transaction-info">
              <div class="transaction-icon ${isReceived ? "received" : "sent"}">
                  <i class="fas ${iconClass}"></i>
              </div>
              <div class="transaction-details">
                  <h4>${isReceived ? `From ${transaction.from}` : `To ${transaction.to}`}</h4>
                  <div class="transaction-date">${formatDate(transaction.date)}</div>
              </div>
          </div>
          <div class="transaction-meta">
              <div class="transaction-amount ${amountClass}">${amountPrefix}$${Number.parseFloat(transaction.amount).toFixed(2)}</div>
              <div class="transaction-status">${transaction.status}</div>
          </div>
      `

    return div
  }

  // Helper function to filter transactions
  function filterTransactions(type) {
    const allTransactions = document.querySelectorAll(".transaction-item")

    if (type === "all") {
      // Show all transactions
      allTransactions.forEach((item) => (item.style.display = "flex"))
    } else {
      // Filter by type
      allTransactions.forEach((item) => {
        if (item.getAttribute("data-type") === type) {
          item.style.display = "flex"
        } else {
          item.style.display = "none"
        }
      })
    }
  }

  // Helper function to format date
  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
})


