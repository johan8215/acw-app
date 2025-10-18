/*********************************************************
 *  ALLSTON CAR WASH – ACW-App (v3.8 Connected Stable)
 *  Author: Johan A. Giraldo (JAG) & Sky (AI Assistant)
 *  Date: October 2025
 *********************************************************/

/* ===========================================================
   🔐 LOGIN (email + password)
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
    console.log("🔗 Logging in:", url);

    const res = await fetch(url);
    const data = await res.json();
    console.log("✅ Login response:", data);

    if (data.ok) {
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = data.role;
      localStorage.setItem("acw_email", email);
      getSchedule(email);
    } else {
      alert("Invalid credentials");
    }
  } catch (err) {
    alert("🚨 Connection error");
    console.error("❌ Login error:", err);
  }
}

/* ===========================================================
   📅 OBTENER HORARIO DEL EMPLEADO (con cronómetro ⏱️)
   =========================================================== */
async function getSchedule(email) {
  try {
    const url = `${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`;
    console.log("📡 Fetching schedule from:", url);

    const res = await fetch(url);
    const data = await res.json();
    console.log("📦 Schedule data:", data);

    if (!data.ok) {
      document.getElementById("schedule").innerHTML =
        `<p style="color:red;">No schedule found for this account.</p>`;
      return;
    }

    const name = data.name || "Employee";
    const week = data.week || "N/A";
    const days = data.days || [];

    let html = `
      <div class="week-header">
        <h3>Week of ${week}</h3>
        <p><b>${name}</b></p>
      </div>
      <table class="schedule-table">
        <thead><tr><th>Day</th><th>Shift</th><th>Hours</th></tr></thead>
        <tbody id="scheduleBody">
    `;

    window.activeShifts = [];

    for (const d of days) {
      const shift = d.shift?.trim() || "";
      let hoursDisplay = d.hours || "";
      let rowStyle = "";

      if (/off/i.test(shift)) rowStyle = "style='color:#888;'";
      else if (shift === "—") rowStyle = "style='color:#bbb;'";
      else rowStyle = "style='color:#eaf1ff; font-weight:500;'";

      // Cronómetro cuando hay “7:30.” activo
      if (/^\d{1,2}[:.]?\d{0,2}\.?$/.test(shift)) {
        const startTime = shift.replace(/\./g, "").trim();
        window.activeShifts.push({ day: d.name, startTime });
        hoursDisplay = `<span class='activeTimer' data-time='${startTime}'>⏱️ 0.0</span>`;
      }

      html += `<tr ${rowStyle}>
        <td>${d.name}</td>
        <td>${shift || "—"}</td>
        <td>${hoursDisplay || "—"}</td>
      </tr>`;
    }

    html += `
        </tbody>
      </table>
      <p class="total">🕓 Total Hours: <b>${data.total}</b></p>
    `;

    document.getElementById("schedule").innerHTML = html;

    updateTimers();
    setInterval(updateTimers, 60000);

  } catch (err) {
    console.error("❌ Error loading schedule:", err);
    document.getElementById("schedule").innerHTML =
      `<p style="color:red;">Error connecting to server.</p>`;
  }
}

/* ===========================================================
   ⏱️ ACTUALIZADOR DE CRONÓMETROS
   =========================================================== */
function updateTimers() {
  const now = new Date();
  const timers = document.querySelectorAll(".activeTimer");

  timers.forEach(el => {
    const startStr = el.dataset.time;
    if (!startStr) return;

    const [h, m = 0] = startStr.split(":").map(Number);
    const start = new Date();
    start.setHours(h);
    start.setMinutes(m);

    let diff = (now - start) / (1000 * 60 * 60);
    if (diff < 0) diff += 12;
    const rounded = Math.round(diff * 10) / 10;

    el.textContent = `⏱️ ${rounded.toFixed(1)}h`;
  });
}

/* ===========================================================
   ⚙️ CAMBIO DE CONTRASEÑA
   =========================================================== */
async function changeUserPassword() {
  const email = document.getElementById("email")?.value || localStorage.getItem("acw_email");
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
    const response = await fetch(`${CONFIG.BASE_URL}?action=changePassword&email=${encodeURIComponent(email)}&new=${encodeURIComponent(newPass)}`, { method: "GET" });
    const data = await response.json();
    console.log("🔄 Password change response:", data);

    if (data.ok || data.success) {
      msg.textContent = "✅ Password updated successfully!";
      msg.style.color = "#7CFC00";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
      setTimeout(() => { msg.textContent = ""; }, 3000);
    } else {
      msg.textContent = "⚠️ Failed to update. Try again.";
      msg.style.color = "#ff6666";
    }

  } catch (err) {
    msg.textContent = "🚨 Connection error. Try again later.";
    msg.style.color = "#ff6666";
    console.error("❌ Error:", err);
  }
}

/* ===========================================================
   🚪 LOGOUT USER (cierra sesión limpia)
   =========================================================== */
function logoutUser() {
  localStorage.removeItem("acw_email");
  location.reload();
}

/* ===========================================================
   🔁 AUTO-LOGIN (mantiene la sesión activa)
   =========================================================== */
window.addEventListener("load", () => {
  const savedEmail = localStorage.getItem("acw_email");
  if (savedEmail) {
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";
    getSchedule(savedEmail);
  }
});
