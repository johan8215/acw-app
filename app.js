/* ===========================================================
   ⚙️ ACW-App v4.5.2 – Red Glass LIVE (app.js)
   Author: Johan A. Giraldo (JAG15) & Sky
   Uses CONFIG from config.js
   =========================================================== */

/* ---------- i18n ---------- */
const LANG = navigator.language?.toLowerCase().startsWith("es") ? "es" : (CONFIG.LANG_DEFAULT || "en");
const TXT = {
  en:{welcome:"Welcome,",role:"Role",day:"Day",shift:"Shift",hours:"Hours",total:"Total Hours",weekOf:"Week of",weekOverview:"Week Overview",sendMsg:"Send Message",typeMsg:"Type your message here…"},
  es:{welcome:"Bienvenido,",role:"Rol",day:"Día",shift:"Horario",hours:"Horas",total:"Total Horas",weekOf:"Semana del",weekOverview:"Resumen semanal",sendMsg:"Enviar Mensaje",typeMsg:"Escribe tu mensaje aquí…"}
}[LANG];

const DAY_ORDER = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* ---------- Small connection badge (optional) ---------- */
(async () => {
  try{
    const r = await fetch(`${CONFIG.BASE_URL}?action=ping`);
    const ok = await r.text();
    if(!ok) return;
    const tag = document.createElement("div");
    tag.textContent = CONFIG.APP_VERSION || "ACW-App";
    Object.assign(tag.style,{
      position:"fixed",bottom:"4px",right:"8px",fontSize:"11px",
      color:"rgba(204,0,0,0.8)",background:"rgba(255,255,255,0.75)",
      border:"1px solid rgba(204,0,0,0.25)",borderRadius:"6px",
      padding:"2px 6px",zIndex:"9999",fontFamily:"SF Pro Display, Segoe UI, sans-serif"
    });
    document.body.appendChild(tag);
  }catch(_){/* silent */}
})();

/* ---------- App boot ---------- */
window.addEventListener("load", async () => {
  // Hide splash after 0.8s no matter what
  setTimeout(()=>{ const s=document.getElementById("splash"); if(s) s.style.display="none"; },800);

  const saved = localStorage.getItem("acw_email");
  if(!saved){
    // show login
    const login = document.getElementById("login");
    if(login) login.style.display="block";
    return;
  }

  // autologin path
  document.getElementById("login").style.display="none";
  document.getElementById("welcome").style.display="block";
  try{
    await hydrateUserHeader(saved);
    await getSchedule(saved);
    await maybeEnableTeam(saved);
  }catch(e){
    console.warn("Autologin failed:", e);
    document.getElementById("welcome").style.display="none";
    document.getElementById("login").style.display="block";
  }
});

/* =======================================================
   LOGIN (refactor: robust + readable)
   ======================================================= */
async function loginUser(){
  const emailEl = document.getElementById("email");
  const passEl  = document.getElementById("password");
  const email = (emailEl?.value||"").trim().toLowerCase();
  const password = (passEl?.value||"").trim();

  if(!email || !password){
    alert("Please enter your email and password.");
    return;
  }

  const url = `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

  try{
    const res = await fetch(url, { method:"GET" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if(!data.ok){
      alert("❌ Invalid credentials. Please try again.");
      return;
    }

    // Save session
    localStorage.setItem("acw_email", email);
    localStorage.setItem("acw_name", data.name || "");
    localStorage.setItem("acw_role", data.role || "employee");

    // Show main
    document.getElementById("login").style.display="none";
    document.getElementById("welcome").style.display="block";

    document.getElementById("userName").textContent =
      data.name || (email.split("@")[0]||"").toUpperCase();

    document.getElementById("userRole").textContent =
      capitalizeRole(data.role || "employee");

    // Data
    await getSchedule(email);
    if(isManagerRole(data.role)){
      document.getElementById("teamOverviewBtn").style.display="block";
    }

  }catch(err){
    console.error("Login error:", err);
    alert("⚠️ Connection error. Please try again.");
    // Keep login visible for retry
    document.getElementById("login").style.display="block";
    document.getElementById("welcome").style.display="none";
  }
}

/* ---------- Helpers ---------- */
function capitalizeRole(role){
  if(!role) return "Employee";
  const r = String(role).toLowerCase();
  return r.charAt(0).toUpperCase() + r.slice(1);
}
function isManagerRole(role){
  const r = String(role||"").toLowerCase();
  return ["owner","manager","supervisor"].includes(r);
}

/* =======================================================
   HEADER (autologin user info)
   ======================================================= */
async function hydrateUserHeader(email){
  const url = `${CONFIG.BASE_URL}?action=getUser&email=${encodeURIComponent(email)}`;
  try{
    const r = await fetch(url);
    const d = await r.json();
    const nameUI = document.getElementById("userName");
    const roleUI = document.getElementById("userRole");
    const fallback = (email.split("@")[0]||"").toUpperCase();

    nameUI.textContent = d.ok ? (d.name || fallback) : fallback;
    roleUI.textContent = d.ok ? capitalizeRole(d.role || "employee") : "Employee";
  }catch{
    document.getElementById("userName").textContent = (email.split("@")[0]||"").toUpperCase();
    document.getElementById("userRole").textContent = "Employee";
  }
}

/* =======================================================
   SCHEDULE
   ======================================================= */
async function getSchedule(email){
  const box = document.getElementById("schedule");
  if(box) box.innerHTML = "<p>⏳ Loading schedule…</p>";

  try{
    const res = await fetch(`${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if(!data.ok){
      box.innerHTML = `<p style="color:#ff7777;">No schedule found.</p>`;
      return;
    }

    const map = new Map((data.days||[]).map(r => [String(r.name||"").slice(0,3), r]));
    const fixed = DAY_ORDER.map(d=>{
      const r = map.get(d) || {};
      return {
        name: dayFull(d),
        shift: (r.shift || "OFF").toString(),
        hours: (r.hours ?? calcHoursFromShift(r.shift) || 0)
      };
    });

    let total = 0;
    let html = `
      <div class="week-header">
        <h3>${TXT.weekOf} ${data.week||""}</h3>
        <p><b>${data.name||""}</b></p>
      </div>
      <table class="schedule-table">
        <thead><tr><th>${TXT.day}</th><th>${TXT.shift}</th><th>${TXT.hours}</th></tr></thead>
        <tbody>`;

    fixed.forEach(d=>{
      const h = typeof d.hours==="number" ? (total+=d.hours, d.hours) : "—";
      html += `<tr><td>${d.name}</td><td>${d.shift}</td><td>${h}</td></tr>`;
    });

    html += `</tbody></table>
      <p class="total">${TXT.total}: <b>${Math.round(total*10)/10}</b></p>`;

    box.innerHTML = html;

  }catch(e){
    console.error("Schedule error:", e);
    box.innerHTML = `<p style="color:#ff7777;">Connection error.</p>`;
  }
}

function dayFull(a){ return ({Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun"})[a]||a; }
function calcHoursFromShift(shift){
  const s = String(shift||"").trim();
  if(/off/i.test(s)) return 0;
  const m = s.replace(/\s+/g,"").replace(/\./g,":").match(/^(\d{1,2})(?::(\d{2}))?[-–](\d{1,2})(?::(\d{2}))?$/i);
  if(!m) return 0;
  const sh=+m[1]||0, sm=+m[2]||0, eh=+m[3]||0, em=+m[4]||0;
  let start=sh+sm/60, end=eh+em/60, diff=end-start;
  if(diff<0) diff+=12; // 12h logic when no am/pm
  return Math.round(diff*10)/10;
}

/* =======================================================
   PERMISSIONS (show Team Overview if manager)
   ======================================================= */
async function maybeEnableTeam(email){
  try{
    const r = await fetch(`${CONFIG.BASE_URL}?action=getUser&email=${encodeURIComponent(email)}`);
    const d = await r.json();
    if(d.ok && isManagerRole(d.role)){
      document.getElementById("teamOverviewBtn").style.display="block";
    }
  }catch(_){}
}

/* =======================================================
   TEAM OVERVIEW (Demo) + Employee Modal + WhatsApp
   ======================================================= */
function openTeamOverview(){
  const modal = document.getElementById("teamModal");
  modal.style.display="flex";

  // Demo data (can replace later with real endpoint)
  const team = [
    { name: "Wendy",  phone:"(617) 254-3210", days:[
      {name:"Mon",shift:"OFF"},{name:"Tue",shift:"8:00-4"},
      {name:"Wed",shift:"7:30-3"},{name:"Thu",shift:"7:30-6"},
      {name:"Fri",shift:"7:30-2:30"},{name:"Sat",shift:"7:30-5"},
      {name:"Sun",shift:"OFF"} ]},
    { name: "Carlos", phone:"(617) 555-1234", days:[
      {name:"Mon",shift:"7:30-3"},{name:"Tue",shift:"8:00-4"},
      {name:"Wed",shift:"7:30-3"},{name:"Thu",shift:"OFF"},
      {name:"Fri",shift:"7:30-3"},{name:"Sat",shift:"OFF"},
      {name:"Sun",shift:"OFF"} ]}
  ];

  const todayAbbr = DAY_ORDER[new Date().getDay()===0?6:new Date().getDay()-1];
  let html = `<table><thead><tr><th>Name</th><th>Phone</th><th>Shift (today)</th><th></th></tr></thead><tbody>`;
  team.forEach(emp=>{
    const t = emp.days.find(d=>d.name.slice(0,3)===todayAbbr) || emp.days[0];
    html += `<tr>
      <td>${emp.name}</td>
      <td>${emp.phone}</td>
      <td>${t?.shift||"—"}</td>
      <td><button onclick='openEmployee(${JSON.stringify(emp).replace(/"/g,"&quot;")})'>Open</button></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById("teamTable").innerHTML = html;
}
function closeTeamOverview(){ document.getElementById("teamModal").style.display="none"; }

let currentEmp=null;
function openEmployee(emp){
  currentEmp=emp;
  const m=document.getElementById("employeeModal");
  m.style.display="flex";
  document.getElementById("empName").textContent = emp.name;
  document.getElementById("empPhone").textContent = emp.phone||"";

  const days = DAY_ORDER.map(d=>{
    const r=(emp.days||[]).find(x=>x.name.slice(0,3)===d)||{};
    return { name:dayFull(d), shift:(r.shift||"OFF").toString() };
  });

  let html = `<div class="week-header"><h3>${TXT.weekOverview}</h3></div>
    <table class="schedule-table">
      <thead><tr><th>${TXT.day}</th><th>${TXT.shift}</th><th>${TXT.hours}</th></tr></thead><tbody>`;
  let tot=0;
  days.forEach(d=>{
    const h=calcHoursFromShift(d.shift); if(typeof h==="number") tot+=h;
    html += `<tr><td>${d.name}</td><td>${d.shift}</td><td>${h||0}</td></tr>`;
  });
  html += `</tbody></table><p class="total">${TXT.total}: <b>${Math.round(tot*10)/10}</b></p>`;
  document.getElementById("empTable").innerHTML = html;
}
function closeEmployeeModal(){ document.getElementById("employeeModal").style.display="none"; }

async function sendEmpMessage(){
  if(!currentEmp) return;
  const msg = document.getElementById("empMessage").value.trim();
  if(!msg){ alert("Write a message first."); return; }

  const digits = String(currentEmp.phone||"").replace(/\D/g,"");
  if(digits.length < 10){ alert("Invalid phone."); return; }

  const phone = digits.length===10 ? `1${digits}` : digits;
  const api = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(msg)}&apikey=${CONFIG.API_KEY}`;
  try{
    await fetch(api,{method:"GET",mode:"no-cors"});
    alert("✅ Message sent.");
  }catch{
    alert("❌ Could not send the message.");
  }
}

/* =======================================================
   SETTINGS & EXIT
   ======================================================= */
function openSettings(){ document.getElementById("settingsModal").style.display="flex"; }
function closeSettings(){ document.getElementById("settingsModal").style.display="none"; }
function logoutUser(){ localStorage.removeItem("acw_email"); localStorage.removeItem("acw_name"); localStorage.removeItem("acw_role"); location.reload(); }

/* ---------- ESC + click-out closes ---------- */
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    ["employeeModal","teamModal","settingsModal"].forEach(id=>{
      const el=document.getElementById(id); if(el) el.style.display="none";
    });
  }
});
["employeeModal","teamModal","settingsModal"].forEach(id=>{
  const el=document.getElementById(id); if(!el) return;
  el.addEventListener("click",ev=>{ if(ev.target===el) el.style.display="none"; });
});