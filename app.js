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
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = data.role;

      // 👇 Nueva llamada con email real (ya autenticado)
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
