/* ===========================================================
   🚗 ACW-App v4.5 – Connected & Messaging (Stable Edition)
   Author: Johan A. Giraldo (JG) & Sky
   =========================================================== */

const LANG = navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
const TXT = {
  en: {
    welcome: "Welcome,",
    role: "Role",
    settings: "Settings",
    logout: "Log Out",
    day: "Day", shift: "Shift", hours: "Hours",
    total: "Total Hours",
    weekOf: "Week of",
    teamOverview: "Team Overview",
    weekOverview: "Week Overview",
    sendMsg: "Send Message",
    close: "Close",
    typeMsg: "Type your message here…"
  },
  es: {
    welcome: "Bienvenido,",
    role: "Rol",
    settings: "Configuraciones",
    logout: "Cerrar sesión",
    day: "Día", shift: "Horario", hours: "Horas",
    total: "Total Horas",
    weekOf: "Semana del",
    teamOverview: "Team Overview",
    weekOverview: "Resumen semanal",
    sendMsg: "Enviar Mensaje",
    close: "Cerrar",
    typeMsg: "Escribe tu mensaje aquí…"
  }
}[LANG];

const DAY_ORDER = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* ===========================================================
   🚀 Splash + Auto-Login
   =========================================================== */
window.addEventListener("load", async () => {
  setTimeout(() => {
    const s = document.getElementById("splash");
    if (s) s.style.display = "none";
  }, 800);

  const savedEmail = localStorage.getItem("acw_email");
  if (savedEmail) {
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";
    await hydrateUserHeader(savedEmail);
    await getSchedule(savedEmail);
    maybeEnableTeam(savedEmail);
  }
});

/* ===========================================================
   🔐 LOGIN — Role siempre visible y estable
   =========================================================== */
async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Please enter your email and password.");

  try {
    const url = `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) return alert("Invalid credentials.");

    localStorage.setItem("acw_email", email);
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";

    const displayName = data.name && data.name.trim()
      ? data.name
      : (email.split("@")[0] || "").toUpperCase();
    document.getElementById("userName").textContent = displayName;

    const role = data.role && data.role.trim() !== "" ? data.role : "Employee";
    document.getElementById("userRole").textContent = role;

    await getSchedule(email);

    if (["manager", "supervisor", "owner"].includes(role.toLowerCase())) {
      document.getElementById("teamOverviewBtn").style.display = "block";
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("🚨 Connection error");
  }
}

/* ===========================================================
   🧱 Auto-Login Header Info
   =========================================================== */
async function hydrateUserHeader(email) {
  try {
    const res = await fetch(`${CONFIG.BASE_URL}?action=getUser&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (data.ok) {
      document.getElementById("userName").textContent = data.name || (email.split("@")[0] || "").toUpperCase();
      document.getElementById("userRole").textContent = data.role || "Employee";
    } else {
      document.getElementById("userName").textContent = (email.split("@")[0] || "").toUpperCase();
      document.getElementById("userRole").textContent = "Employee";
    }
  } catch {
    document.getElementById("userName").textContent = (email.split("@")[0] || "").toUpperCase();
    document.getElementById("userRole").textContent = "Employee";
  }
}

/* ===========================================================
   🗓 Schedule (7 días + Total)
   =========================================================== */
async function getSchedule(email) {
  try {
    const url = `${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      document.getElementById("schedule").innerHTML = `<p style="color:#b30000;">No schedule found.</p>`;
      return;
    }

    const name = data.name || "";
    const week = data.week || "";
    const rows = Array.isArray(data.days) ? data.days : [];

    const map = new Map(rows.map(r => [String(r.name || "").slice(0,3), r]));
    const fixed = DAY_ORDER.map(d => {
      const r = map.get(d) || {};
      return {
        name: dayFull(d),
        shift: (r.shift || "OFF").toString(),
        hours: (r.hours ?? (r.shift ? calcHoursFromShift(r.shift) : "—"))
      };
    });

    let html = `
      <div class="week-header">
        <h3>${TXT.weekOf} ${week}</h3>
        <p><b>${name}</b></p>
      </div>
      <table class="schedule-table">
        <thead><tr><th>${TXT.day}</th><th>${TXT.shift}</th><th>${TXT.hours}</th></tr></thead>
        <tbody>`;

    let total = 0;
    fixed.forEach(d => {
      const hrs = parseFloat(d.hours) || (d.hours === 0 ? 0 : d.hours);
      if (typeof hrs === "number") total += hrs;
      html += `<tr><td>${d.name}</td><td>${d.shift}</td><td>${hrs === "—" ? "—" : hrs}</td></tr>`;
    });

    html += `</tbody></table>
      <p class="total">${TXT.total}: <b>${(Math.round(total*10)/10)}</b></p>`;
    document.getElementById("schedule").innerHTML = html;

  } catch (e) {
    console.error("getSchedule error", e);
    document.getElementById("schedule").innerHTML = `<p style="color:#b30000;">Connection error.</p>`;
  }
}

function dayFull(abbr) {
  return {Mon:"Mon", Tue:"Tue", Wed:"Wed", Thu:"Thu", Fri:"Fri", Sat:"Sat", Sun:"Sun"}[abbr] || abbr;
}

function calcHoursFromShift(shift) {
  const s = String(shift).trim();
  if (/off/i.test(s)) return 0;
  const m = s.replace(/\s+/g,"").replace(/\./g,":").match(/^(\d{1,2})(?::(\d{2}))?[-–](\d{1,2})(?::(\d{2}))?$/i);
  if (!m) return "—";
  const sh = parseInt(m[1]||"0",10);
  const sm = parseInt(m[2]||"0",10);
  const eh = parseInt(m[3]||"0",10);
  const em = parseInt(m[4]||"0",10);
  let start = sh + sm/60, end = eh + em/60;
  let diff = end - start; if (diff < 0) diff += 12;
  return Math.round(diff*10)/10;
}

/* ===========================================================
   👥 Team Overview (DEMO)
   =========================================================== */
function openTeamOverview() {
  const modal = document.getElementById("teamModal");
  modal.style.display = "flex";

  const team = [
    { name: "Wendy", phone: "(617) 254-3210", days:[
      {name:"Mon",shift:"OFF"},{name:"Tue",shift:"8:00-4"},
      {name:"Wed",shift:"7:30-3"},{name:"Thu",shift:"7:30-6"},
      {name:"Fri",shift:"7:30-2:30"},{name:"Sat",shift:"7:30-5"},
      {name:"Sun",shift:"OFF"} ]},
    { name: "Carlos", phone: "(617) 555-1234", days:[
      {name:"Mon",shift:"7:30-3"},{name:"Tue",shift:"8:00-4"},
      {name:"Wed",shift:"7:30-3"},{name:"Thu",shift:"OFF"},
      {name:"Fri",shift:"7:30-3"},{name:"Sat",shift:"OFF"},
      {name:"Sun",shift:"OFF"} ]}
  ];

  const todayAbbr = DAY_ORDER[new Date().getDay()===0?6:new Date().getDay()-1];
  let html = `<table><thead><tr><th>Name</th><th>Phone</th><th>Shift (today)</th><th></th></tr></thead><tbody>`;
  team.forEach(emp=>{
    const today = emp.days.find(d=>d.name.slice(0,3)===todayAbbr) || emp.days[0];
    html += `<tr><td>${emp.name}</td><td>${emp.phone}</td><td>${today?.shift||"—"}</td>
             <td><button onclick='openEmployee(${JSON.stringify(emp).replace(/"/g,"&quot;")})'>Open</button></td></tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById("teamTable").innerHTML = html;
}
function closeTeamOverview(){ document.getElementById("teamModal").style.display = "none"; }

/* ===========================================================
   👤 Employee View + Manual Message (CallMeBot)
   =========================================================== */
let currentEmp = null;

function openEmployee(emp){
  currentEmp = emp;
  const m = document.getElementById("employeeModal");
  m.style.display = "flex";
  document.getElementById("empName").textContent = emp.name;
  document.getElementById("empPhone").textContent = emp.phone || "";
  document.getElementById("empMessage").value = "";

  const days = DAY_ORDER.map(d=>{
    const r = emp.days.find(x=>x.name.slice(0,3)===d)||{};
    return { name: dayFull(d), shift:(r.shift||"OFF").toString() };
  });

  let html = `<div class='week-header'><h3>${TXT.weekOverview}</h3></div>
  <table class='schedule-table'><thead><tr><th>${TXT.day}</th><th>${TXT.shift}</th><th>${TXT.hours}</th></tr></thead><tbody>`;
  let tot = 0;
  days.forEach(d=>{
    const hrs = calcHoursFromShift(d.shift);
    if(typeof hrs==="number") tot += hrs;
    html += `<tr><td>${d.name}</td><td>${d.shift}</td><td>${hrs==="—"?"—":hrs}</td></tr>`;
  });
  html += `</tbody></table><p class='total'>${TXT.total}: <b>${Math.round(tot*10)/10}</b></p>`;
  document.getElementById("empTable").innerHTML = html;
}

function closeEmployeeModal(){ document.getElementById("employeeModal").style.display = "none"; }

async function sendEmpMessage(){
  if(!currentEmp) return;
  const msg = document.getElementById("empMessage").value.trim();
  if(!msg) return alert("Write a message first.");

  const digits = String(currentEmp.phone||"").replace(/\D/g,"");
  if(digits.length < 10) return alert("Invalid phone.");
  const phone = digits.length===10 ? `1${digits}` : digits;

  const api = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(msg)}&apikey=${CONFIG.API_KEY}`;
  try {
    await fetch(api,{method:"GET",mode:"no-cors"});
    alert("✅ Message sent.");
  } catch {
    alert("❌ Could not send the message.");
  }
}

/* ===========================================================
   ⚙️ Settings + Logout + ESC Close
   =========================================================== */
function openSettings(){ document.getElementById("settingsModal").style.display = "flex"; }
function closeSettings(){ document.getElementById("settingsModal").style.display = "none"; }
function logoutUser(){ localStorage.removeItem("acw_email"); location.reload(); }

document.addEventListener("keydown", e=>{
  if(e.key==="Escape"){
    ["employeeModal","teamModal","settingsModal"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.style.display="none";
    });
  }
});
["employeeModal","teamModal","settingsModal"].forEach(id=>{
  const el=document.getElementById(id);
  if(!el) return;
  el.addEventListener("click",ev=>{
    if(ev.target===el) el.style.display="none";
  });
});
