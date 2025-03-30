document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    // Redirect to login if not logged in
    window.location.href = "index.html"
    return
  }

  // Send money form handling
  const sendMoneyForm = document.getElementById("sendMoneyForm")
  if (sendMoneyForm) {
    sendMoneyForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const recipientEmail = document.getElementById("recipientEmail").value
      const amount = document.getElementById("amount").value
      const note = document.getElementById("note").value
      const errorElement = document.getElementById("sendError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to send money
      fetch("/api/transactions/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail,
          amount: Number.parseFloat(amount),
          note,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
  // Store receipt data before redirect
  localStorage.setItem('lastReceipt', JSON.stringify({
    recipient: recipientEmail,
    amount: amount,
    note: note
  }));
  
  window.location.href = "dashboard.html";
          } else {
            errorElement.textContent = data.message || "Failed to send money"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Send money error:", error)
        })
    })
  }
})

