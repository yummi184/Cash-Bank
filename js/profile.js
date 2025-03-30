document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    // Redirect to login if not logged in
    window.location.href = "index.html"
    return
  }

  // Set user profile data
  const profileName = document.getElementById("profileName")
  const profileEmail = document.getElementById("profileEmail")
  const profileInitial = document.getElementById("profileInitial")
  const nameInput = document.getElementById("name")
  const emailInput = document.getElementById("email")

  if (profileName && currentUser.name) {
    profileName.textContent = currentUser.name
  }

  if (profileEmail && currentUser.email) {
    profileEmail.textContent = currentUser.email
  }

  if (profileInitial && currentUser.name) {
    profileInitial.textContent = currentUser.name.charAt(0).toUpperCase()
  }

  if (nameInput && currentUser.name) {
    nameInput.value = currentUser.name
  }

  if (emailInput && currentUser.email) {
    emailInput.value = currentUser.email
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtnProfile")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Clear user data from localStorage
      localStorage.removeItem("currentUser")
      localStorage.removeItem("token")

      // Redirect to login page
      window.location.href = "index.html"
    })
  }

  // Profile form handling
  const profileForm = document.getElementById("profileForm")
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const name = document.getElementById("name").value
      const errorElement = document.getElementById("profileError")

      // Clear previous errors
      errorElement.textContent = ""

      // Make API request to update profile
      fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Update user data in localStorage
            currentUser.name = name
            localStorage.setItem("currentUser", JSON.stringify(currentUser))

            // Update profile display
            profileName.textContent = name
            profileInitial.textContent = name.charAt(0).toUpperCase()

            // Show success message
            alert("Profile updated successfully")
          } else {
            errorElement.textContent = data.message || "Failed to update profile"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Profile update error:", error)
        })
    })
  }

  // Change password modal
  const changePasswordBtn = document.getElementById("changePasswordBtn")
  const changePasswordModal = document.getElementById("changePasswordModal")
  const changePasswordForm = document.getElementById("changePasswordForm")
  const changePasswordError = document.getElementById("changePasswordError")

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", () => {
      changePasswordModal.classList.add("active")
    })
  }

  // Change password form handling
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const currentPassword = document.getElementById("currentPassword").value
      const newPassword = document.getElementById("newPassword").value
      const confirmNewPassword = document.getElementById("confirmNewPassword").value

      // Clear previous errors
      changePasswordError.textContent = ""

      // Validate passwords match
      if (newPassword !== confirmNewPassword) {
        changePasswordError.textContent = "New passwords do not match"
        return
      }

      // Make API request to change password
      fetch("/api/users/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Close modal and show success message
            changePasswordModal.classList.remove("active")
            alert("Password changed successfully")
            changePasswordForm.reset()
          } else {
            changePasswordError.textContent = data.message || "Failed to change password"
          }
        })
        .catch((error) => {
          changePasswordError.textContent = "An error occurred. Please try again."
          console.error("Password change error:", error)
        })
    })
  }

  // Two-factor authentication button (coming soon)
  const twoFactorBtn = document.getElementById("twoFactorBtn")
  const comingSoonModal = document.getElementById("comingSoonModal")

  if (twoFactorBtn) {
    twoFactorBtn.addEventListener("click", () => {
      comingSoonModal.classList.add("active")
    })
  }

  // Dark mode toggle
  const darkModeToggle = document.getElementById("darkModeToggle")
  if (darkModeToggle) {
    // Check if dark mode is enabled
    const isDarkMode = localStorage.getItem("darkMode") === "true"
    darkModeToggle.checked = isDarkMode

    // Apply dark mode if enabled
    if (isDarkMode) {
      document.body.classList.add("dark-mode")
    }

    // Toggle dark mode
    darkModeToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("dark-mode")
        localStorage.setItem("darkMode", "true")
      } else {
        document.body.classList.remove("dark-mode")
        localStorage.setItem("darkMode", "false")
      }
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
})

