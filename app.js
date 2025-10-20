/* ===========================================================
   ⚙️ ACW-App v4.5.1 – Connected & Messaging (STABLE BUILD)
   Author: Johan A. Giraldo (JAG15) & Sky
   =========================================================== */

const LANG = navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
const TXT = {
  en: { welcome:"Welcome,", role:"Role", day:"Day", shift:"Shift", hours:"Hours", total:"Total Hours", weekOf:"Week of", weekOverview:"Week Overview", sendMsg:"Send Message", typeMsg:"Type your message here…" },
  es: { welcome:"Bienvenido,", role:"Rol", day:"Día", shift:"Horario", hours:"Horas", total:"Total Horas", weekOf:"Semana del", weekOverview:"Resumen semanal", sendMsg:"Enviar Mensaje", typeMsg:"Escribe tu mensaje aquí…" }
}[LANG];

const DAY_ORDER = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* ---------- On Load ---------- */
window.addEventListener("load", async () => {
  // Safety: Always hide splash after 1.5s
  setTimeout(() => {
    const s = document.getElementById("splash");
    if (s) s.style.display = "none";
    // Force login visible as fallback
    const loginBox = document.getElementById("login");
    if (loginBox && loginBox.style.display !== "none") loginBox.style.display = "block";
  }, 1500);

  const saved = localStorage.getItem("acw_email");
  if (saved) {
    try {
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      await hydrateUserHeader(saved);
      await getSchedule(saved);
      await maybeEnableTeam(saved);
    } catch (e) {
      console.warn("⚠️ Autologin failed:", e);
      document.getElementById("login").style.display = "block";
    }
  } else {
    document.getElementById("login").style.display = "block";
  }
});

/* ---------- Login ---------- */
async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Please enter your email and password.");

  try {
    const res = await fetch(`${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    const data = await res.json();

    if (!data.ok) {
      alert("❌ Invalid credentials. Please try again.");
      return;
    }

    // ✅ Save session
    localStorage.setItem("acw_email", email);
    localStorage.setItem("acw_name", data.name || "");
    localStorage.setItem("acw_role", data.role || "employee");

    // ✅ Show main view
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";
    document.getElementById("userName").textContent =
      data.name || email.split("@")[0].toUpperCase();
    document.getElementById("userRole").textContent =
      capitalizeRole(data.role || "employee");

    // ✅ Load schedule
    await getSchedule(email);

    // ✅ Manager access
    if (isManagerRole(data.role)) {
      document.getElementById("teamOverviewBtn").style.display = "block";
    }
  } catch (err) {
    console.error("⚠️ Connection error:", err);
    alert("⚠️ Connection error. Please try again.");
    document.getElementById("login").style.display = "block";
  }
}

/* ---------- Helpers ---------- */
function capitalizeRole(role) {
  if (!role) return "Employee";
  const r = role.toLowerCase();
  return r.charAt(0).toUpperCase() + r.slice(1);
}
function isManagerRole(role) {
  const r = (role || "").toLowerCase();
  return ["owner","manager","supervisor"].includes(r);
}

/* ---------- Autologin Header ---------- */
async function hydrateUserHeader(email) {
  const r = await fetch(`${CONFIG.BASE_URL}?action=getUser&email=${encodeURIComponent(email)}`);
  const d = await r.json();
  document.getElementById("userName").textContent =
    d.ok ? (d.name || email.split("@")[0].toUpperCase()) : email.split("@")[0].toUpperCase();
  document.getElementById("userRole").textContent =
    d.ok ? (capitalizeRole(d.role || "Employee")) : "Employee";
}

/* ---------- Schedule ---------- */
async function getSchedule(email) {
  const el = document.getElementById("schedule");
  el.innerHTML = "<p>⏳ Loading schedule...</p>";
  try {
    const res = await fetch(`${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!data.ok) {
      el.innerHTML = `<p style="color:#b30000;">No schedule found.</p>`;
      return;
    }

    const map = new Map((data.days||[]).map(r=>[String(r.name||"").slice(0,3), r]));
    const fixed = DAY_ORDER.map(d=>{
      const r = map.get(d) || {};
      return { name: dayFull(d),
               shift: (r.shift||"OFF").toString(),
               hours: (r.hours ?? calcHoursFromShift(r.shift) || 0) };
    });

    let total = 0;
    let html = `<div class="week-header"><h3>${TXT.weekOf} ${data.week||""}</h3><p><b>${data.name||""}</b></p></div>`;
    html += `<table class="schedule-table"><thead><tr><th>${TXT.day}</th><th>${TXT.shift}</th><th>${TXT.hours}</th></tr></thead><tbody>`;
    fixed.forEach(d=>{
      const h = (typeof d.hours==="number") ? (total+=d.hours, d.hours) : "—";
      html += `<tr><td>${d.name}</td><td>${d.shift}</td><td>${h}</td></tr>`;
    });
    html += `</tbody></table><p class="total">${TXT.total}: <b>${Math.round(total*10)/10}</b></p>`;
    el.innerHTML = html;
  } catch(e) {
    console.error("❌ Schedule fetch error:", e);
    el.innerHTML = `<p style="color:#b30000;">Connection error.</p>`;
  }
}

function dayFull(a){ return ({Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun"})[a]||a; }
function calcHoursFromShift(shift){
  const s=String(shift||"").trim(); if(/off/i.test(s)) return 0;
  const m=s.replace(/\s+/g,"").replace(/\./g,":").match(/^(\d{1,2})(?::(\d{2}))?[-–](\d{1,2})(?::(\d{2}))?$/i);
  if(!m) return 0;
  const sh=+m[1]||0, sm=+m[2]||0, eh=+m[3]||0, em=+m[4]||0;
  let start=sh+sm/60, end=eh+em/60; let diff=end-start; if(diff<0) diff+=12;
  return Math.round(diff*10)/10;
}

/* ---------- Roles & Permissions ---------- */
async function maybeEnableTeam(email){
  try{
    const r = await fetch(`${CONFIG.BASE_URL}?action=getUser&email=${encodeURIComponent(email)}`);
    const d = await r.json();
    if(d.ok && isManagerRole(d.role))
      document.getElementById("teamOverviewBtn").style.display="block";
  }catch(_){}
}

/* ---------- Team Overview / Employee Modal ---------- */
function openTeamOverview(){ /* ... same as before ... */ }
function closeTeamOverview(){ document.getElementById("teamModal").style.display="none"; }
function openEmployee(emp){ /* ... same as before ... */ }
function closeEmployeeModal(){ document.getElementById("employeeModal").style.display="none"; }
async function sendEmpMessage(){ /* ... same as before ... */ }

/* ---------- Settings / Logout ---------- */
function openSettings(){ document.getElementById("settingsModal").style.display="flex"; }
function closeSettings(){ document.getElementById("settingsModal").style.display="none"; }
function logoutUser(){ localStorage.removeItem("acw_email"); location.reload(); }

/* ---------- ESC close ---------- */
document.addEventListener("keydown",e=>{
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
