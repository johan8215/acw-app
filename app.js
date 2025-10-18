/* ===========================================================
   ACW-App Login + Schedule Viewer (v3.8 Connected)
   Johan A. Giraldo & Sky
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

    if (data.ok) {
      // ✅ Guarda el email del usuario para usarlo luego en "changeUserPassword()"
      localStorage.setItem("acw_email", email);

      // 👇 Aquí continúa tu código normal
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = data.role;

      // Llama al horario del usuario logueado
      getSchedule(email);
    } else {
      alert("Invalid credentials");
    }
  } catch (err) {
    alert("Connection error");
    console.error(err);
  }
}

/* ===========================================================
   Obtener Horario del Empleado
   =========================================================== */
async function getSchedule(email) {
  try {
    // 🔗 Cambiado: usa el endpoint "getSchedule" (con email)
    const url = `${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`;
    console.log("📡 Fetching schedule from:", url);

    const res = await fetch(url);
    const data = await res.json();
    console.log("📦 Data recibida:", data);

    if (!data.ok) {
      document.getElementById("schedule").innerHTML =
        `<p style="color:red;">No schedule found for this account.</p>`;
      return;
    }

    const name = data.name || "Employee";
    const week = data.week || "N/A";
    const days = data.days || [];

    // 💎 Construir tabla de horario
    let html = `
      <div class="week-header">
        <h3> Week of ${week}</h3>
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
      const hours = d.hours ? d.hours : "";
      let rowStyle = "";

      if (/off/i.test(shift)) rowStyle = "style='color:#888;'";
      else if (shift === "—") rowStyle = "style='color:#bbb;'";
      else rowStyle = "style='color:#111; font-weight:500;'";

      html += `<tr ${rowStyle}>
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

  } catch (err) {
    console.error("❌ Error loading schedule:", err);
    document.getElementById("schedule").innerHTML =
      `<p style="color:red;">Error connecting to server.</p>`;
  }
}
async function changeUserPassword() {
  const email = localStorage.getItem("acw_email");
  const newPass = document.getElementById("newPassword").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();
  const msg = document.getElementById("settingsMsg");

  if (!newPass || !confirm) {
    msg.textContent = "⚠️ Please fill out both fields.";
    msg.style.color = "#ffcc00";
    return;
  }

  if (newPass !== confirm) {
    msg.textContent = "❌ Passwords do not match.";
    msg.style.color = "#ff6666";
    return;
  }

  msg.textContent = "⏳ Updating password...";
  msg.style.color = "#bcd4ff";

  try {
    const response = await fetch(`${CONFIG.BASE_URL}?action=changePassword`, {
      method: "POST",
      body: JSON.stringify({ email, newPassword: newPass }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.success) {
      msg.textContent = "✅ Password updated successfully!";
      msg.style.color = "#7CFC00";
    } else {
      msg.textContent = "⚠️ Failed to update. Try again.";
      msg.style.color = "#ff6666";
    }
  } catch (err) {
    msg.textContent = "🚨 Connection error. Try again later.";
    msg.style.color = "#ff6666";
  }
}
/* ===========================================================
   Toggle Settings Panel
   =========================================================== */
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}
