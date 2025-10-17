// ACW-App v3.8 Connected Lite (Apple Style)
// Developed by Johan A. Giraldo | jag15.com | Allston Car Wash © 2025

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const statusEl = document.getElementById("status");

  statusEl.textContent = "⏳ Connecting...";

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbwXnB6kBsbgbpGAo0g6YyWnmqr0LjBmNmDh0zZxnQVCSHS7Ms1rd8h2YwSG_GyGC-9R/exec?email=" +
      encodeURIComponent(email)
    );
    const data = await response.json();

    if (data.ok && data.email) {
      statusEl.textContent = `✅ Welcome ${data.name || "Employee"} (${data.role || "Team"})`;
    } else {
      statusEl.textContent = "❌ Login failed. Please check your email.";
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "⚠️ Server unavailable. Try again later.";
  }
});