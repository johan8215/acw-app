/* ACW-App v4.5 – Connected Stable (LIVE) */

const LANG = navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
const TXT = {
  en:{welcome:"Welcome,",role:"Role",day:"Day",shift:"Shift",hours:"Hours",total:"Total Hours",weekOf:"Week of",weekOverview:"Week Overview",sendMsg:"Send Message",typeMsg:"Type your message here…"},
  es:{welcome:"Bienvenido,",role:"Rol",day:"Día",shift:"Horario",hours:"Horas",total:"Total Horas",weekOf:"Semana del",weekOverview:"Resumen semanal",sendMsg:"Enviar Mensaje",typeMsg:"Escribe tu mensaje aquí…"}
}[LANG];

const DAY_ORDER = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

window.addEventListener("load", async () => {
  setTimeout(()=>{ const s=document.getElementById("splash"); if(s) s.style.display="none"; },800);
  const saved = localStorage.getItem("acw_email");
  if(saved){
    document.getElementById("login").style.display="none";
    document.getElementById("welcome").style.display="block";
    await hydrateUserHeader(saved);
    await getSchedule(saved);
    maybeEnableTeam(saved);
  }
});

/* ---------- Login ---------- */
async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Please enter your email and password.");

  try {
    const res = await fetch(
      `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    );
    const data = await res.json();

    if (!data.ok) {
      alert("❌ Invalid credentials. Please try again.");
      return;
    }

    // ✅ Guardar sesión
    localStorage.setItem("acw_email", email);
    localStorage.setItem("acw_name", data.name || "");
    localStorage.setItem("acw_role", data.role || "employee");

    // ✅ Mostrar pantalla principal
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";
    document.getElementById("userName").textContent =
      data.name || email.split("@")[0].toUpperCase();
    document.getElementById("userRole").textContent =
      capitalizeRole(data.role || "employee");

    // ✅ Mostrar horario
    await getSchedule(email);

    // ✅ Si es manager, mostrar botón de Team Overview
    if (isManagerRole(data.role)) {
      document.getElementById("teamOverviewBtn").style.display = "block";
    }
  } catch (err) {
    console.error("⚠️ Connection error:", err);
    alert("⚠️ Connection error. Please try again.");
  }
}

/* 🧠 Funciones auxiliares */
function capitalizeRole(role) {
  if (!role) return "Employee";
  const r = role.toLowerCase();
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function isManagerRole(role) {
  const r = (role || "").toLowerCase();
  return ["owner", "manager", "supervisor"].includes(r);
}

/* ---------- Header on autologin ---------- */
async function hydrateUserHeader(email){
  try{
    const r = await fetch(`${CONFIG.BASE_URL}?action=getUser&email=${encodeURIComponent(email)}`);
    const d = await r.json();
    document.getElementById("userName").textContent = d.ok ? (d.name||email.split("@")[0].toUpperCase()) : email.split("@")[0].toUpperCase();
    document.getElementById("userRole").textContent = d.ok ? (d.role||"Employee") : "Employee";
  }catch{
    document.getElementById("userName").textContent = (email.split("@")[0]||"").toUpperCase();
    document.getElementById("userRole").textContent = "Employee";
  }
}

/* ---------- Schedule ---------- */
async function getSchedule(email){
  try{
    const res = await fetch(`${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if(!data.ok){ document.getElementById("schedule").innerHTML = `<p style="color:#b30000;">No schedule found.</p>`; return; }

    const map = new Map((data.days||[]).map(r=>[String(r.name||"").slice(0,3), r]));
    const fixed = DAY_ORDER.map(d=>{
      const r = map.get(d)||{};
      return {name:dayFull(d), shift:(r.shift||"OFF").toString(), hours:(r.hours ?? calcHoursFromShift(r.shift)||0)};
    });

    let total=0;
    let html = `<div class="week-header"><h3>${TXT.weekOf} ${data.week||""}</h3><p><b>${data.name||""}</b></p></div>`;
    html += `<table class="schedule-table"><thead><tr><th>${TXT.day}</th><th>${TXT.shift}</th><th>${TXT.hours}</th></tr></thead><tbody>`;
    fixed.forEach(d=>{ const h=(typeof d.hours==="number")? (total+=d.hours, d.hours) : "—";
      html += `<tr><td>${d.name}</td><td>${d.shift}</td><td>${h}</td></tr>`; });
    html += `</tbody></table><p class="total">${TXT.total}: <b>${Math.round(total*10)/10}</b></p>`;
    document.getElementById("schedule").innerHTML = html;
  }catch(e){
    console.error(e);
    document.getElementById("schedule").innerHTML = `<p style="color:#b30000;">Connection error.</p>`;
  }
}

function dayFull(a){ return ({Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun"})[a]||a; }
function calcHoursFromShift(shift){
  const s=String(shift||"").trim(); if(/off/i.test(s)) return 0;
  const m=s.replace(/\s+/g,"").replace(/\./g,":").match(/^(\d{1,2})(?::(\d{2}))?[-–](\d{1,2})(?::(\d{2}))?$/i);
  if(!m) return 0; const sh=+m[1]||0, sm=+m[2]||0, eh=+m[3]||0, em=+m[4]||0;
  let start=sh+sm/60, end=eh+em/60; let diff=end-start; if(diff<0) diff+=12; return Math.round(diff*10)/10;
}

/* ---------- Roles ---------- */
function isManagerRole(r){ return ["manager","supervisor","owner"].includes(String(r||"").toLowerCase()); }
async function maybeEnableTeam(email){
  try{ const r=await fetch(`${CONFIG.BASE_URL}?action=getUser&email=${encodeURIComponent(email)}`); const d=await r.json();
    if(d.ok && isManagerRole(d.role)) document.getElementById("teamOverviewBtn").style.display="block";
  }catch(_){}
}

/* ---------- Team (DEMO) ---------- */
function openTeamOverview(){
  const modal=document.getElementById("teamModal"); modal.style.display="flex";
  const team=[{name:"Wendy",phone:"(617) 254-3210",days:[{name:"Mon",shift:"OFF"},{name:"Tue",shift:"8:00-4"},{name:"Wed",shift:"7:30-3"},{name:"Thu",shift:"7:30-6"},{name:"Fri",shift:"7:30-2:30"},{name:"Sat",shift:"7:30-5"},{name:"Sun",shift:"OFF"}]},
              {name:"Carlos",phone:"(617) 555-1234",days:[{name:"Mon",shift:"7:30-3"},{name:"Tue",shift:"8:00-4"},{name:"Wed",shift:"7:30-3"},{name:"Thu",shift:"OFF"},{name:"Fri",shift:"7:30-3"},{name:"Sat",shift:"OFF"},{name:"Sun",shift:"OFF"}]}];
  const todayAbbr = DAY_ORDER[new Date().getDay()===0?6:new Date().getDay()-1];
  let html = `<table><thead><tr><th>Name</th><th>Phone</th><th>Shift (today)</th><th></th></tr></thead><tbody>`;
  team.forEach(emp=>{ const t=emp.days.find(d=>d.name.slice(0,3)===todayAbbr)||emp.days[0];
    html += `<tr><td>${emp.name}</td><td>${emp.phone}</td><td>${t?.shift||"—"}</td>
    <td><button onclick='openEmployee(${JSON.stringify(emp).replace(/"/g,"&quot;")})'>Open</button></td></tr>`; });
  html += `</tbody></table>`; document.getElementById("teamTable").innerHTML = html;
}
function closeTeamOverview(){ document.getElementById("teamModal").style.display="none"; }

/* ---------- Employee + Manual WhatsApp ---------- */
let currentEmp=null;
function openEmployee(emp){
  currentEmp=emp; const m=document.getElementById("employeeModal"); m.style.display="flex";
  document.getElementById("empName").textContent = emp.name;
  document.getElementById("empPhone").textContent = emp.phone||"";
  const days = DAY_ORDER.map(d=>{const r=(emp.days||[]).find(x=>x.name.slice(0,3)===d)||{}; return {name:dayFull(d),shift:(r.shift||"OFF").toString()};});
  let html=`<div class="week-header"><h3>${TXT.weekOverview}</h3></div><table class="schedule-table"><thead><tr><th>${TXT.day}</th><th>${TXT.shift}</th><th>${TXT.hours}</th></tr></thead><tbody>`;
  let tot=0; days.forEach(d=>{const h=calcHoursFromShift(d.shift); if(typeof h==="number") tot+=h; html+=`<tr><td>${d.name}</td><td>${d.shift}</td><td>${h||0}</td></tr>`;});
  html+=`</tbody></table><p class="total">${TXT.total}: <b>${Math.round(tot*10)/10}</b></p>`; document.getElementById("empTable").innerHTML=html;
}
function closeEmployeeModal(){ document.getElementById("employeeModal").style.display="none"; }

async function sendEmpMessage(){
  if(!currentEmp) return;
  const msg=document.getElementById("empMessage").value.trim();
  if(!msg) return alert("Write a message first.");
  const digits=(currentEmp.phone||"").replace(/\D/g,""); if(digits.length<10) return alert("Invalid phone.");
  const phone = digits.length===10 ? `1${digits}` : digits;
  const api=`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(msg)}&apikey=${CONFIG.API_KEY}`;
  try{ await fetch(api,{method:"GET",mode:"no-cors"}); alert("✅ Message sent."); }catch{ alert("❌ Could not send the message."); }
}

/* ---------- Settings / Logout / Close on ESC ---------- */
function openSettings(){ document.getElementById("settingsModal").style.display="flex"; }
function closeSettings(){ document.getElementById("settingsModal").style.display="none"; }
function logoutUser(){ localStorage.removeItem("acw_email"); location.reload(); }

document.addEventListener("keydown",e=>{ if(e.key==="Escape"){["employeeModal","teamModal","settingsModal"].forEach(id=>{const el=document.getElementById(id); if(el) el.style.display="none";});}});
["employeeModal","teamModal","settingsModal"].forEach(id=>{const el=document.getElementById(id); if(!el) return; el.addEventListener("click",ev=>{ if(ev.target===el) el.style.display="none"; });});
