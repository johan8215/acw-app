/* ===== ACW Frontend v3.8 ===== */

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const LANG = {
  en: {
    signin: "Sign in",
    email: "Email",
    password: "Password",
    help: "Need help? Ask your manager to reset your password.",
    welcomeHrs: () => {
      const now = new Date();
      return `Welcome HRS ${fmtDateTime(now, 'en')}`;
    },
    activeWeek: "Active week:",
    totalHours: "Total hours:",
    logout: "Logout",
    days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    role: r => r
  },
  es: {
    signin: "Iniciar sesión",
    email: "Correo",
    password: "Contraseña",
    help: "¿Necesitas ayuda? Pide a tu manager restablecer tu contraseña.",
    welcomeHrs: () => {
      const now = new Date();
      return `Bienvenido HRS ${fmtDateTime(now, 'es')}`;
    },
    activeWeek: "Semana activa:",
    totalHours: "Horas totales:",
    logout: "Salir",
    days: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"],
    role: r => ({
      owner:"Propietario", manager:"Manager", supervisor:"Supervisor", employee:"Empleado"
    }[r] || r)
  }
};

const MESSAGES = {
  en: [
    "Thanks for your effort this week 💪",
    "Please be on time ⏰",
    "Great energy today! ⚡",
    "We appreciate your dedication 🙏",
    "Let's make it a great day! 🌟",
  ],
  es: [
    "Gracias por tu esfuerzo esta semana 💪",
    "Por favor, llega puntual ⏰",
    "¡Gran energía hoy! ⚡",
    "Apreciamos tu dedicación 🙏",
    "¡Hagamos un gran día! 🌟",
  ]
};

let ui = LANG.en;

function detectLang() {
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("es")) return "es";
  return "en";
}

function fmtDateTime(d, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-US':'en-US', {
      timeZone: "America/New_York",
      month: "2-digit", day: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function tickClock() {
  const el = $("#live-clock");
  if (!el) return;
  const now = new Date();
  el.textContent = fmtDateTime(now, ui === LANG.es ? 'es' : 'en');
}

function setLang(code){
  ui = code === 'es' ? LANG.es : LANG.en;
  $("#title-login").textContent = ui.signin;
  $("#label-email").textContent = ui.email;
  $("#label-password").textContent = ui.password;
  $("#hint-text").textContent = ui.help;
  $("#btn-login").textContent = ui.signin;
  $("#week-label").textContent = ui.activeWeek;
  $("#total-label").textContent = ui.totalHours;
  $("#btn-logout").textContent = ui.logout;
  $("#subtitle-welcome").textContent = ui.welcomeHrs();

  // days headers when we render schedule
}

async function fetchJSON(url){
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  return res.json();
}

function renderSchedule(daysArr) {
  const ids = ["#day-mon","#day-tue","#day-wed","#day-thu","#day-fri","#day-sat","#day-sun"];
  ids.forEach((id, i) => {
    const d = daysArr[i] || { name: ui.days[i], shift: "", hours: 0 };
    $(id).innerHTML = `
      <h3>${ui.days[i]}</h3>
      <div class="shift">${(d.shift || "").toString().trim() || "—"}</div>
      <div class="hours">${(d.hours || 0)} h</div>
    `;
  });
}

function randomMessage(){
  const arr = (ui === LANG.es) ? MESSAGES.es : MESSAGES.en;
  return arr[Math.floor(Math.random()*arr.length)];
}

async function getActiveWeek(){
  const url = `${window.ACW_CONFIG.BACKEND_URL}?action=getActiveWeek`;
  const j = await fetchJSON(url);
  if (j && j.week) {
    $("#active-week").textContent = j.week;
    $("#week-value").textContent = j.week;
  }
}

async function doLogin(email, password){
  const base = window.ACW_CONFIG.BACKEND_URL;
  const url = `${base}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const j = await fetchJSON(url);
  return j;
}

async function loadScheduleByEmail(email){
  const base = window.ACW_CONFIG.BACKEND_URL;
  const url = `${base}?action=getScheduleByEmail&email=${encodeURIComponent(email)}`;
  const j = await fetchJSON(url);
  return j;
}

function showDashboard(user){
  // topbar visible + spinner logo small
  $("#topbar").classList.remove("hidden");
  $("#login-view").classList.add("hidden");
  $("#dashboard").classList.remove("hidden");

  $("#hello-name").textContent = (ui === LANG.es ? "Hola" : "Welcome") + ", " + user.name;
  $("#role-badge").textContent = ui.role(user.role);

  // motivational
  $("#motivation").textContent = randomMessage();

  // live clock
  tickClock();
  if (window.__clock) clearInterval(window.__clock);
  window.__clock = setInterval(tickClock, 1000);
}

function showLogin() {
  $("#topbar").classList.add("hidden");
  $("#dashboard").classList.add("hidden");
  $("#login-view").classList.remove("hidden");
}

function persistUser(u){
  localStorage.setItem("acw_user", JSON.stringify(u));
}
function restoreUser(){
  try{
    const raw = localStorage.getItem("acw_user");
    if (!raw) return null;
    return JSON.parse(raw);
  }catch{return null}
}
function clearUser(){
  localStorage.removeItem("acw_user");
}

/* ===== Boot ===== */
window.addEventListener("DOMContentLoaded", async () => {
  // Language init
  const detected = detectLang();
  $("#lang-select").value = detected;
  setLang(detected);
  $("#lang-select").addEventListener("change", e => setLang(e.target.value));

  // Active week (header + card)
  getActiveWeek();

  // Try restore
  const saved = restoreUser();
  if (saved && saved.email) {
    showDashboard(saved);
    // re-load schedule silently
    try {
      const data = await loadScheduleByEmail(saved.email);
      if (data && data.days) {
        $("#week-value").textContent = data.week || $("#week-value").textContent;
        renderSchedule(data.days);
        $("#total-hours").textContent = (data.total || 0);
      }
    } catch {}
  }

  // welcome dynamic line on login
  $("#subtitle-welcome").textContent = ui.welcomeHrs();
  setInterval(() => $("#subtitle-welcome").textContent = ui.welcomeHrs(), 60_000);

  // Login submit
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase();
    const pass  = $("#password").value.trim();

    if (!email || !pass) return;

    try {
      const res = await doLogin(email, pass);
      if (!res || !res.ok) {
        alert(res?.error || "Access denied");
        return;
      }

      // header week from login response if present
      if (res.week) {
        $("#active-week").textContent = res.week;
        $("#week-value").textContent = res.week;
      } else {
        await getActiveWeek();
      }

      const user = { email: res.email, name: res.name || email, role: res.role || "employee" };
      persistUser(user);
      showDashboard(user);

      // schedule
      const data = await loadScheduleByEmail(user.email);
      if (data && data.days) {
        $("#week-value").textContent = data.week || $("#week-value").textContent;
        renderSchedule(data.days);
        $("#total-hours").textContent = (data.total || 0);
      } else {
        renderSchedule([]);
        $("#total-hours").textContent = "0";
      }

    } catch (err) {
      alert("Network / endpoint error");
    }
  });

  // Logout
  $("#btn-logout").addEventListener("click", () => {
    clearUser();
    showLogin();
  });
});
