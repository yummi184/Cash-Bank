// Receipt functionality
function showReceipt(transactionData) {
  // Format the current date and time
  const now = new Date()
  const formattedDateTime = now.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Generate a random transaction ID if not provided
  const transactionId = transactionData.id || generateTransactionId()

  // Set receipt values
  document.getElementById("receiptDateTime").textContent = formattedDateTime
  document.getElementById("receiptTransactionId").textContent = transactionId
  document.getElementById("receiptFrom").textContent = transactionData.from || "Your Account"
  document.getElementById("receiptTo").textContent = transactionData.to || "Recipient"
  document.getElementById("receiptAmount").textContent = `$${Number(transactionData.amount).toFixed(2)}`
  document.getElementById("receiptType").textContent = transactionData.type || "Transfer"

  // Handle note (optional)
  const noteRow = document.getElementById("receiptNoteRow")
  const noteValue = document.getElementById("receiptNote")

  if (transactionData.note) {
    noteValue.textContent = transactionData.note
    noteRow.style.display = "flex"
  } else {
    noteRow.style.display = "none"
  }

  // Show the receipt modal
  document.getElementById("receiptModal").classList.add("active")

  // Add event listener for download button
  document.getElementById("downloadReceiptBtn").addEventListener("click", () => {
    downloadReceipt(transactionData, formattedDateTime, transactionId)
  })
}

// Generate a random transaction ID
function generateTransactionId() {
  return "TXN" + Math.random().toString(36).substr(2, 9).toUpperCase()
}

// Download receipt as PDF or print
function downloadReceipt(transactionData, dateTime, transactionId) {
  window.print()
}

// Add receipt modal to the page
document.addEventListener("DOMContentLoaded", () => {
  // Load receipt HTML
  fetch("receipt-modal.html")
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div")
      div.innerHTML = html
      document.body.appendChild(div.firstChild)

      // Add close button functionality
      const closeBtn = document.querySelector("#receiptModal .close-modal")
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          document.getElementById("receiptModal").classList.remove("active")
        })
      }
    })
    .catch((error) => console.error("Error loading receipt modal:", error))
})

