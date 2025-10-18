/* ===========================================================
   ACW-App v3.8 Connected Lite (Restored Stable Build)
   Author: Johan A. Giraldo (JG) | Allston Car Wash
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
    console.log("🌐 Connecting to:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("🔐 Login response:", data);

    if (!data || !data.ok) {
      alert("Invalid credentials");
      return;
    }

    // Mostrar secciones correctas
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";

    // Mostrar datos del usuario
    document.getElementById("userName").textContent = data.name;
    document.getElementById("userRole").textContent = data.role;

    // Mostrar semana activa correctamente
    document.getElementById("activeWeek").textContent =
      data.week ? `Active week: ${data.week}` : "Active week not found";

    // Guardar sesión local
    localStorage.setItem("acw_user", JSON.stringify({ email, name: data.name }));
    getSchedule(email);

  } catch (err) {
    console.error("❌ Connection error details:", err);
    alert("⚠️ Connection error. Please verify the backend deployment.");
  }
}

// Cargar horario del usuario
async function getSchedule(email) {
  try {
    const url = `${CONFIG.BASE_URL}?action=getScheduleByEmail&email=${encodeURIComponent(email)}`;
    console.log("📅 Fetching schedule:", url);

    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      document.getElementById("schedule").innerHTML =
        `<p style="color:red;">No schedule found for this account.</p>`;
      return;
    }

    // Construcción de tabla
    let html = `<h3>Week of ${data.week}</h3><table>
        <thead><tr><th>Day</th><th>Shift</th><th>Hours</th></tr></thead>
        <tbody>`;

    data.days.forEach(d => {
      html += `<tr>
        <td>${d.name}</td>
        <td>${d.shift || "—"}</td>
        <td>${d.hours || ""}</td>
      </tr>`;
    });

    html += `</tbody></table>
      <p><b>Total Hours:</b> ${data.total}</p>`;
    document.getElementById("schedule").innerHTML = html;

  } catch (err) {
    console.error("❌ Schedule load error:", err);
    document.getElementById("schedule").innerHTML =
      `<p style="color:red;">Error loading schedule.</p>`;
  }
}

// Mantener sesión abierta
window.addEventListener("load", () => {
  const saved = localStorage.getItem("acw_user");
  if (saved) {
    const user = JSON.parse(saved);
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";
    document.getElementById("userName").textContent = user.name;
    document.getElementById("activeWeek").textContent = "Loading week...";
    getSchedule(user.email);
  }
});
