/*********************************************************
 *  ALLSTON CAR WASH – ACW-App (v4.1 Red Glass Edition)
 *  Fusionado con conexión estable del v3.8
 *********************************************************/

const LANG = navigator.language.startsWith("es") ? "es" : "en";
const TXT = {
  en: {
    welcome: "Welcome,",
    settings: "Settings",
    logout: "Log Out",
    sendMsg: "Send Message",
    close: "Close",
    shift: "Shift:",
  },
  es: {
    welcome: "Bienvenido,",
    settings: "Configuraciones",
    logout: "Cerrar Sesión",
    sendMsg: "Enviar Mensaje",
    close: "Cerrar",
    shift: "Horario:",
  }
}[LANG];

/* ===========================================================
   🚀 SPLASH SCREEN
   =========================================================== */
window.addEventListener("load", async () => {
  setTimeout(() => {
    const s = document.getElementById("splash");
    if (s) s.style.display = "none";
  }, 2500);

  // AUTO-LOGIN
  const savedEmail = localStorage.getItem("acw_email");
  if (savedEmail) {
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";
    await getSchedule(savedEmail);
  }
});

/* ===========================================================
   🔐 LOGIN
   =========================================================== */
async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Please enter your email and password");

  try {
    const url = `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok) {
      localStorage.setItem("acw_email", email);
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = data.role;
      await getSchedule(email);

      // 🔓 Si es Manager → activar botón Team Overview
      if (["manager","supervisor","owner"].includes(data.role.toLowerCase())) {
        document.getElementById("teamOverviewBtn").style.display = "block";
      }
    } else alert("Invalid credentials");
  } catch (err) {
    alert("Connection error");
    console.error(err);
  }
}

/* ===========================================================
   🕓 HORARIO + CRONÓMETRO
   =========================================================== */
async function getSchedule(email) {
  const url = `${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.ok) {
    document.getElementById("schedule").innerHTML = `<p style="color:red;">No schedule found.</p>`;
    return;
  }

  const week = data.week || "N/A";
  const name = data.name || "Employee";
  const days = data.days || [];

  let html = `
    <div class="week-header">
      <h3>Week of ${week}</h3>
      <p><b>${name}</b></p>
    </div>
    <table class="schedule-table">
      <thead><tr><th>Day</th><th>Shift</th><th>Hours</th></tr></thead>
      <tbody id="scheduleBody">`;

  for (const d of days) {
    const shift = (d.shift || "").trim();
    let hoursDisplay = d.hours || "";

    if (/^\d{1,2}[:.]?\d{0,2}\s*[-–]\s*\d{1,2}/.test(shift)) {
      const [start, end] = shift.split("-");
      const fixed = calcFixedHours(start, end);
      hoursDisplay = `${fixed.toFixed(1)}h`;
    }

    html += `<tr><td>${d.name}</td><td>${shift}</td><td>${hoursDisplay}</td></tr>`;
  }

  html += `</tbody></table><p class="total">Total Hours: <b>${data.total}</b></p>`;
  document.getElementById("schedule").innerHTML = html;
}

/* HORAS */
function calcFixedHours(a, b) {
  const parse = s => {
    s = s.replace(/\./g, ":").trim();
    const [h, m = 0] = s.split(":").map(Number);
    return h + m / 60;
  };
  let diff = parse(b) - parse(a);
  if (diff < 0) diff += 12;
  return diff;
}

/* ===========================================================
   ⚙️ SETTINGS
   =========================================================== */
function openSettings() {
  document.getElementById("settingsModal").style.display = "block";
}
function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

/* ===========================================================
   👥 TEAM OVERVIEW
   =========================================================== */
function openTeamOverview() {
  document.getElementById("teamModal").style.display = "block";
  const team = [
    { name: "Wendy", phone: "(617) 254-3210", shift: "7:30 - 3", hours: 7.5 },
    { name: "Carlos", phone: "(617) 555-1234", shift: "8:00 - 4", hours: 8.0 },
    { name: "Luis", phone: "(617) 444-3322", shift: "OFF", hours: 0.0 }
  ];
  let html = `<table><thead><tr><th>Name</th><th>Phone</th><th>Shift</th><th>Hours</th><th></th></tr></thead><tbody>`;
  team.forEach(e=>{
    html += `<tr>
      <td>${e.name}</td>
      <td>${e.phone}</td>
      <td>${e.shift}</td>
      <td>${e.hours}</td>
      <td><button onclick="openEmployee(${JSON.stringify(e).replace(/"/g, '&quot;')})">Open</button></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById("teamTable").innerHTML = html;
}
function closeTeamOverview(){ document.getElementById("teamModal").style.display = "none"; }

/* ===========================================================
   👤 EMPLOYEE VIEW (centrado y con rol)
   =========================================================== */
function openEmployee(emp) {
  currentEmp = emp;
  const modal = document.getElementById("employeeModal");
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";

  const weekData = [
    { day: "Mon", shift: "OFF", hours: "—" },
    { day: "Tue", shift: "8:00 - 4", hours: 8 },
    { day: "Wed", shift: "7:30 - 3", hours: 7.5 },
    { day: "Thu", shift: "7:30 - 6", hours: 10.5 },
    { day: "Fri", shift: "7:30 - 2:30", hours: 7 },
    { day: "Sat", shift: "7:30 - 5", hours: 9.5 },
    { day: "Sun", shift: "OFF", hours: "—" }
  ];

  let html = `
    <div class="modal-content">
      <span class="close" onclick="closeEmployeeModal()">&times;</span>
      <h2>${emp.name}</h2>
      <p>${emp.role || "Employee"}</p>
      <p>${emp.phone}</p>
      <div class="week-header">Week Overview</div>
      <table class="schedule-table">
        <thead><tr><th>Day</th><th>Shift</th><th>Hours</th></tr></thead>
        <tbody>
          ${weekData.map(d => `<tr><td>${d.day}</td><td>${d.shift}</td><td>${d.hours}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="total">Total Hours: <b>42.5</b></p>
      <textarea id="empMessage" placeholder="Type your message here…"></textarea>
      <button onclick="sendEmpMessage()">Send Message</button>
    </div>
  `;

  modal.innerHTML = html;
}

  modal.innerHTML = `
    <div class="modal-content emp-view">
      <span class="close" onclick="closeEmployeeModal()">&times;</span>
      ${html}
    </div>
  `;
}

/* ===========================================================
   🚪 LOGOUT
   =========================================================== */
function logoutUser(){
  localStorage.removeItem("acw_email");
  location.reload();
}
