/* ===========================================================
   ACW-App Login + Schedule Viewer
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
      getSchedule(email);
    } else {
      alert("Invalid credentials");
    }
  } catch (err) {
    alert("Connection error");
    console.error(err);
  }
}

async function getSchedule(email) {
  try {
    const url = `${CONFIG.BASE_URL}?action=getScheduleByEmail&email=${encodeURIComponent(email)}`;
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

    // 🔹 Genera filas correctamente
    for (const d of days) {
      const shift = d.shift && d.shift.trim() ? d.shift : "—";
      const hours = d.hours ? d.hours : "";
      let style = "";

      if (/off/i.test(shift)) style = "style='color:#888;'";
      else if (shift === "—") style = "style='color:#ccc;'";
      else style = "style='color:#222;'";

      html += `<tr ${style}>
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
