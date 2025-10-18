/* ===========================================================
   ACW-App v3.8 Connected Lite – FIX JSON Compatibility
   Author: Johan A. Giraldo (JG) + Sky
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
      document.getElementById("userName").textContent = data.name || "Employee";
      document.getElementById("userRole").textContent = data.role || "staff";
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
    const url = `${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("📦 JSON recibido:", data);

    if (!data.ok) {
      document.getElementById("schedule").innerHTML =
        `<p style="color:red;">No schedule found for this account.</p>`;
      return;
    }

    // Detecta nombre del campo correcto (name o employee)
    const name = data.name || data.employee || "Employee";
    const week = data.week || "N/A";
    const total = data.total || 0;
    const days = data.days || [];

    let html = `
      <h3>📅 Week of ${week}</h3>
      <p><b>${name}</b></p>
      <table class="schedule-table">
        <thead>
          <tr><th>Day</th><th>Shift</th><th>Hours</th></tr>
        </thead>
        <tbody>
    `;

    for (const d of days) {
      const shift = d.shift?.trim() || "—";
      const hours = d.hours || "";
      let color = "";

      if (/off/i.test(shift)) color = "style='color:#888;'";
      else if (!shift || shift === "—") color = "style='color:#bbb;'";
      else color = "style='color:#111;font-weight:500;'";

      html += `<tr ${color}><td>${d.name}</td><td>${shift}</td><td>${hours}</td></tr>`;
    }

    html += `
        </tbody>
      </table>
      <p class="total">🕓 Total Hours: <b>${total}</b></p>
    `;

    document.getElementById("schedule").innerHTML = html;
  } catch (err) {
    console.error("❌ Error loading schedule:", err);
    document.getElementById("schedule").innerHTML =
      `<p style="color:red;">Error connecting to server.</p>`;
  }
}
