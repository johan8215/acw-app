/* ===========================================================
   ACW-App v3.8 – Connected Lite Edition
   Author: Johan A. Giraldo (JAG) & Sky
   Date: October 2025
   =========================================================== */

/* 🌐 LOGIN HANDLER */
async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  try {
    const url = `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok) {
      // 🔓 Mostrar panel de bienvenida
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";

      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = data.role;

      // 🔁 Cargar horario
      getSchedule(email);
    } else {
      alert("Invalid credentials ❌");
    }
  } catch (err) {
    console.error("❌ Login error:", err);
    alert("Connection error. Please try again later.");
  }
}

/* 📅 GET SCHEDULE */
async function getSchedule(email) {
  try {
    // Convierte el email a nombre corto (ej. johan8215@jag15.com → johan8215)
    const shortName = email.split("@")[0];
    const url = `${CONFIG.BASE_URL}?action=getSchedule&short=${encodeURIComponent(shortName)}`;

    console.log("🔗 Fetching:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("📦 Data recibida:", data);

    if (!data.ok) {
      document.getElementById("schedule").innerHTML = `
        <p style="color:red;">No schedule found for this account.</p>`;
      return;
    }

    renderSchedule(data);

  } catch (err) {
    console.error("❌ Error loading schedule:", err);
    document.getElementById("schedule").innerHTML =
      `<p style="color:red;">Error connecting to the server.</p>`;
  }
}

/* 🎨 RENDER FUNCTION */
function renderSchedule(data) {
  const name = data.name || "Employee";
  const week = data.week || "N/A";
  const days = data.days || [];

  let html = `
    <div class="week-header">
      <h3>📅 Week of ${week}</h3>
      <p><b>${name}</b></p>
    </div>
    <table class="schedule-table">
      <thead>
        <tr><th>Day</th><th>Shift</th><th>Hours</th></tr>
      </thead>
      <tbody>
  `;

  for (const d of days) {
    const shift = d.shift?.trim() || "—";
    const hours = d.hours || "";
    let color = "#111";

    if (/off/i.test(shift)) color = "#999";
    else if (!shift || shift === "—") color = "#bbb";
    else color = "#0a3d62";

    html += `
      <tr style="color:${color}; font-weight:500;">
        <td>${d.name}</td>
        <td>${shift}</td>
        <td>${hours}</td>
      </tr>`;
  }

  html += `
      </tbody>
    </table>
    <p class="total">🕓 Total Hours: <b>${data.total}</b></p>
  `;

  document.getElementById("schedule").innerHTML = html;
}