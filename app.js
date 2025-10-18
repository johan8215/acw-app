/* ===========================================================
   ACW-App Login + Schedule Viewer (Restored Original)
   =========================================================== */

async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter your email and password");
    return;
  }

  try {
    const url = `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url);
    const data = await res.json();

    console.log("🔐 Login response:", data);

    if (data.ok) {
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = data.role;

      // Mostrar semana activa
      document.getElementById("weekTitle").textContent = data.week
        ? `Week of ${data.week}`
        : "Active Week Not Found";

      getSchedule(email);
    } else {
      alert("Invalid credentials");
    }
  } catch (err) {
    alert("Connection error");
    console.error("❌ Login error:", err);
  }
}

async function getSchedule(email) {
  try {
    const url = `${CONFIG.BASE_URL}?action=getScheduleByEmail&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();

    console.log("📅 Schedule data:", data);

    if (!data.ok) {
      document.getElementById("schedule").innerHTML =
        `<p style="color:red;">No schedule found for this account.</p>`;
      return;
    }

    let html = `
      <h3>Week: ${data.week}</h3>
      <table>
        <thead><tr><th>Day</th><th>Shift</th><th>Hours</th></tr></thead>
        <tbody>
    `;

    data.days.forEach(d => {
      html += `<tr>
        <td>${d.name}</td>
        <td>${d.shift || "—"}</td>
        <td>${d.hours || ""}</td>
      </tr>`;
    });

    html += `</tbody></table>
      <p><b>Total Hours:</b> ${data.total}</p>
    `;

    document.getElementById("schedule").innerHTML = html;
  } catch (err) {
    console.error("❌ Connection error details:", err);

    // Intentar mostrar respuesta real si el servidor respondió
    if (err && err.message) {
      alert("Server error: " + err.message);
    } else {
      alert("❌ Connection failed. Please check the deployment permissions or BASE_URL.");
    }
  }
