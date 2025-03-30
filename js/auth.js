document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (currentUser && window.location.pathname.includes("index.html")) {
    // Redirect to dashboard if already logged in
    if (currentUser.isAdmin) {
      window.location.href = "admin.html"
    } else {
      window.location.href = "dashboard.html"
    }
  }

  // Login form handling
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const errorElement = document.getElementById("loginError")

      // Clear previous errors
      errorElement.textContent = ""

      // Make API request to login
      fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Store user data in localStorage
            localStorage.setItem("currentUser", JSON.stringify(data.user))
            localStorage.setItem("token", data.token)

            // Redirect based on user role
            if (data.user.isAdmin) {
              window.location.href = "admin.html"
            } else {
              window.location.href = "dashboard.html"
            }
          } else {
            errorElement.textContent = data.message || "Invalid email or password"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Login error:", error)
        })
    })
  }

  // Register form handling
  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const name = document.getElementById("name").value
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const confirmPassword = document.getElementById("confirmPassword").value
      const errorElement = document.getElementById("registerError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate passwords match
      if (password !== confirmPassword) {
        errorElement.textContent = "Passwords do not match"
        return
      }

      // Make API request to register
      fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Store user data in localStorage
            localStorage.setItem("currentUser", JSON.stringify(data.user))
            localStorage.setItem("token", data.token)

            // Redirect to dashboard
            window.location.href = "dashboard.html"
          } else {
            errorElement.textContent = data.message || "Registration failed"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Registration error:", error)
        })
    })
  }
})

