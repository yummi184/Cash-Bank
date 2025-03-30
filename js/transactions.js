document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    // Redirect to login if not logged in
    window.location.href = "index.html"
    return
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
          // Render transactions
          data.transactions.forEach((transaction) => {
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

  // Transaction search functionality
  const transactionSearch = document.getElementById("transactionSearch")
  if (transactionSearch) {
    transactionSearch.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      const transactionItems = transactionsList.querySelectorAll(".transaction-item")

      transactionItems.forEach((item) => {
        const details = item.querySelector(".transaction-details h4").textContent.toLowerCase()
        const date = item.querySelector(".transaction-date").textContent.toLowerCase()
        const amount = item.querySelector(".transaction-amount").textContent.toLowerCase()

        if (details.includes(searchTerm) || date.includes(searchTerm) || amount.includes(searchTerm)) {
          item.style.display = "flex"
        } else {
          item.style.display = "none"
        }
      })
    })
  }

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
})

