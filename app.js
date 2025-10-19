/*********************************************************
 *  ACW-App v4.0 – Smart iOS (EN/ES, Day/Night, Manager)
 *  NOTE: config.js remains your original (BASE_URL intact)
 *********************************************************/

/* ========== I18N ========== */
const I18N = {
  en: {
    sign_in: "Sign In",
    sign_in_btn: "Sign In",
    welcome: "Welcome",
    user: "User",
    role: "Role",
    settings: "Settings",
    logout: "Log Out",
    change_password: "Change Password",
    save: "Save",
    appearance: "Appearance",
    day_mode: "Day Mode",
    night_mode: "Night Mode",
    auto_mode: "Auto",
    manager_hint: "Load an employee by short name, edit shifts, and (optionally) send to Sheets if your backend supports it.",
    load: "Load",
    export_changes: "Export Changes (JSON)",
    save_to_sheets: "Save to Sheets (beta)",
  },
  es: {
    sign_in: "Iniciar sesión",
    sign_in_btn: "Entrar",
    welcome: "Bienvenido",
    user: "Usuario",
    role: "Rol",
    settings: "Ajustes",
    logout: "Cerrar sesión",
    change_password: "Cambiar contraseña",
    save: "Guardar",
    appearance: "Apariencia",
    day_mode: "Modo Día",
    night_mode: "Modo Noche",
    auto_mode: "Auto",
    manager_hint: "Carga un empleado por nombre corto, edita turnos y (opcional) envía al Sheet si tu backend lo permite.",
    load: "Cargar",
    export_changes: "Exportar Cambios (JSON)",
    save_to_sheets: "Guardar en Sheets (beta)",
  }
};
let LANG = (navigator.language || "").toLowerCase().includes("es") ? "es" : "en";

/* ========== THEME ========== */
function applyTheme(mode) {
  // mode: 'day' | 'night' | 'auto'
  const html = document.documentElement;
  if (mode === 'day') { html.classList.remove('theme-night'); localStorage.setItem('acw_theme','day'); return; }
  if (mode === 'night') { html.classList.add('theme-night'); localStorage.setItem('acw_theme','night'); return; }
  // auto
  const h = new Date().getHours();
  const night = (h < 6 || h >= 18);
  html.classList.toggle('theme-night', night);
  localStorage.setItem('acw_theme','auto');
}
function initTheme() {
  const saved = localStorage.getItem('acw_theme') || 'auto';
  applyTheme(saved);
}

/* ========== I18N APPLY ========== */
function setLang(lang) {
  LANG = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    el.textContent = I18N[LANG][key] || el.textContent;
  });
  document.getElementById("langBtn").textContent = LANG === "es" ? "🌐 ES" : "🌐 EN";
}

/* ========== HELPERS (time parsing) ========== */
function parseActiveStart(str) {
  // '7:30.' or '7.' or '7:30' (active)
  const s = (str||"").toString().replace(/\./g, "").trim();
  if (!/^\d{1,2}(:\d{1,2})?$/.test(s)) return null;
  let [h, m="0"] = s.split(":");
  h = parseInt(h, 10); m = parseInt(m, 10) || 0;
  return {h, m};
}
function calcActiveHoursFrom(h, m) {
  const now = new Date();
  const start = new Date();
  start.setHours(h, m, 0, 0);
  let diff = (now - start) / 36e5; // ms->h
  if (diff < 0) diff += 12;       // 12h logic when same day shorthand
  return diff > 0 ? Math.round(diff * 10) / 10 : 0;
}
function calcFixedHours(a, b) {
  // a='7:30' b='5'  -> hours rounded to .1
  const P = s => {
    s = s.toString().replace(/\./g, ":").trim();
    const [hh, mm="0"] = s.split(":");
    return (parseInt(hh,10)||0) + (parseInt(mm,10)||0)/60;
  };
  let d = P(b) - P(a);
  if (d < 0) d += 12;
  return Math.round(d * 10) / 10;
}

/* ========== LOGIN ========== */
async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) { alert(LANG==='es'?'Por favor ingresa email y contraseña':'Please enter your email and password'); return; }

  try {
    const url = `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok) {
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = (data.role||'employee');

      localStorage.setItem("acw_email", email);
      localStorage.setItem("acw_role", (data.role||'employee').toLowerCase());

      // Show manager entry if allowed
      const role = (data.role||'').toLowerCase();
      if (['owner','manager','supervisor'].includes(role)) {
        document.getElementById("btnOpenManager").style.display = "inline-flex";
      } else {
        document.getElementById("btnOpenManager").style.display = "none";
      }

      await getSchedule(email);
    } else {
      alert(LANG==='es'?'Credenciales inválidas':'Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    alert(LANG==='es'?'Error de conexión':'Connection error');
  }
}

/* ========== ACTIVE WEEK LABEL ON LOGIN ========== */
async function loadActiveWeekLabel() {
  const label = document.getElementById("activeWeek");
  try {
    const r = await fetch(`${CONFIG.BASE_URL}?action=getActiveWeek`);
    const d = await r.json();
    label.textContent = d.week ? (`📅 ${LANG==='es'?'Semana activa':'Active Week'}: ${d.week}`) : (LANG==='es'?'No se encontró semana activa':'No active week found');
  } catch {
    label.textContent = LANG==='es'?'No se pudo cargar la semana':'Unable to load week';
  }
}

/* ========== SCHEDULE (with active timers) ========== */
let timerInterval = null;

async function getSchedule(email) {
  try {
    const url = `${CONFIG.BASE_URL}?action=getSchedule&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      document.getElementById("schedule").innerHTML =
        `<p class="muted" style="color:#d33;">${LANG==='es'?'No hay horario para esta cuenta.':'No schedule found for this account.'}</p>`;
      return;
    }

    const name = data.name || "Employee";
    const week = data.week || "N/A";
    const days = data.days || [];

    let html = `
      <div class="week-header">
        <h3>${LANG==='es'?'Semana de':'Week of'} ${week}</h3>
        <p class="muted"><b>${name}</b></p>
      </div>
      <table class="schedule-table">
        <thead><tr><th>${LANG==='es'?'Día':'Day'}</th><th>${LANG==='es'?'Turno':'Shift'}</th><th>${LANG==='es'?'Horas':'Hours'}</th></tr></thead>
        <tbody id="scheduleBody">
    `;

    let dynamicFixedSum = 0;
    const activeRows = [];

    for (const d of days) {
      const shift = (d.shift || "").trim();
      let hoursDisplay = d.hours || "";
      let row = `<tr>`;

      // OFF or empty
      if (!shift || /^off$/i.test(shift) || shift === "—") {
        row += `<td>${d.name}</td><td>${shift || "—"}</td><td>—</td></tr>`;
        html += row;
        continue;
      }

      // Mode 1: active start like "7:30."
      if (/^\d{1,2}[:.]?\d{0,2}\.?$/.test(shift)) {
        const s = parseActiveStart(shift);
        if (s) {
          const h = calcActiveHoursFrom(s.h, s.m);
          activeRows.push({ day: d.name, h: s.h, m: s.m });
          row += `<td>${d.name}</td><td>${shift}</td><td><span class="activeTimer" data-h="${s.h}" data-m="${s.m}">⏱️ ${h.toFixed(1)}h</span></td></tr>`;
          html += row;
          continue;
        }
      }

      // Mode 2: completed like "7:30. - 5" or "8 - 2:30"
      if (/^\d{1,2}[:.]?\d{0,2}\.?\s*[-–]\s*\d{1,2}[:.]?\d{0,2}$/.test(shift)) {
        const [a,b] = shift.split(/[-–]/).map(s=>s.trim().replace(/\.$/,'').replace(/\./g,":"));
        const fixed = calcFixedHours(a,b);
        dynamicFixedSum += fixed;
        row += `<td>${d.name}</td><td>${shift}</td><td>${fixed.toFixed(1)}h</td></tr>`;
        html += row;
        continue;
      }

      // Other text fallback
      row += `<td>${d.name}</td><td>${shift}</td><td>${(hoursDisplay||"—")}</td></tr>`;
      html += row;
      if (!isNaN(parseFloat(hoursDisplay))) dynamicFixedSum += parseFloat(hoursDisplay);
    }

    html += `</tbody></table>
      <p id="totalHours" class="total">🕓 ${LANG==='es'?'Total de horas':'Total Hours'}: <b>${(dynamicFixedSum).toFixed(1)}</b></p>
    `;

    document.getElementById("schedule").innerHTML = html;

    // Timers
    if (timerInterval) clearInterval(timerInterval);
    const updateTimers = () => {
      let sum = dynamicFixedSum;
      document.querySelectorAll(".activeTimer").forEach(el=>{
        const h = parseInt(el.dataset.h,10), m = parseInt(el.dataset.m,10)||0;
        const val = calcActiveHoursFrom(h,m);
        el.textContent = `⏱️ ${val.toFixed(1)}h`;
        sum += val;
      });
      const totalEl = document.getElementById("totalHours");
      if (totalEl) totalEl.innerHTML = `🕓 ${LANG==='es'?'Total de horas':'Total Hours'}: <b>${sum.toFixed(1)}</b>`;
    };
    updateTimers(); // first
    timerInterval = setInterval(updateTimers, 60000); // every minute

  } catch (err) {
    console.error(err);
    document.getElementById("schedule").innerHTML =
      `<p class="muted" style="color:#d33;">${LANG==='es'?'Error conectando al servidor.':'Error connecting to server.'}</p>`;
  }
}

/* ========== CHANGE PASSWORD ========== */
async function changeUserPassword() {
  const email = document.getElementById("email")?.value || localStorage.getItem("acw_email");
  const newPass = document.getElementById("newPassword").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();
  const msg = document.getElementById("settingsMsg");
  if (!newPass || !confirm) { msg.textContent = LANG==='es'?'Completa ambos campos.':'Please fill out both fields.'; msg.style.color = '#cc8'; return; }
  if (newPass !== confirm) { msg.textContent = LANG==='es'?'No coinciden.':'Passwords do not match.'; msg.style.color = '#f66'; return; }
  msg.textContent = LANG==='es'?'Actualizando...':'Updating...'; msg.style.color='#9cf';

  try {
    const response = await fetch(`${CONFIG.BASE_URL}?action=changePassword&email=${encodeURIComponent(email)}&new=${encodeURIComponent(newPass)}`);
    const data = await response.json();
    if (data.ok || data.success) {
      msg.textContent = LANG==='es'?'¡Contraseña actualizada!':'Password updated!';
      msg.style.color = '#7CFC00';
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
      setTimeout(()=>{ msg.textContent=''; }, 3000);
    } else {
      msg.textContent = LANG==='es'?'No se pudo actualizar.':'Failed to update.'; msg.style.color='#f66';
    }
  } catch (err) {
    msg.textContent = LANG==='es'?'Error de conexión.':'Connection error.'; msg.style.color='#f66';
  }
}

/* ========== MANAGER PANEL (Beta sin tocar backend) ========== */
/* Carga por nombre corto usando WebApp Smart v3.8 (short) */
async function mgrLoadByShort() {
  const short = (document.getElementById('mgrSearch').value||'').trim().toLowerCase();
  if (!short) return;
  const url = `${CONFIG.BASE_URL}?action=getSchedule&short=${encodeURIComponent(short)}`; // compatible con getSmartSchedule()
  const r = await fetch(url); const d = await r.json();
  const box = document.getElementById('mgrResult');
  if (!d || !d.ok) { box.innerHTML = `<p class="muted" style="color:#d33;">${LANG==='es'?'No se encontró empleado.':'Employee not found.'}</p>`; return; }

  // Render editable table for days
  const days = d.days || [];
  let out = `
    <div class="week-header">
      <h4>${d.name} — ${d.week}</h4>
    </div>
    <table class="schedule-table" id="mgrTable">
      <thead><tr><th>${LANG==='es'?'Día':'Day'}</th><th>${LANG==='es'?'Turno':'Shift'}</th></tr></thead>
      <tbody>
  `;
  for (const row of days) {
    const value = (row.shift||'').toString();
    out += `<tr>
      <td style="width:120px;">${row.name}</td>
      <td><input class="mgr-cell" data-day="${row.name}" value="${value.replace(/"/g,'&quot;')}" /></td>
    </tr>`;
  }
  out += `</tbody></table>`;
  box.innerHTML = out;

  // store last loaded context for export/save
  box.dataset.week = d.week;
  box.dataset.name = d.name;
}

/* Export JSON of changes (client-side diff vs current inputs) */
function mgrExportChanges() {
  const box = document.getElementById('mgrResult');
  const week = box.dataset.week || '';
  const name = box.dataset.name || '';
  const cells = Array.from(document.querySelectorAll('#mgrTable .mgr-cell'));
  const changes = cells.map(inp => ({ day: inp.dataset.day, value: inp.value.trim() }));
  const payload = { week, name, changes };
  const pretty = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(pretty).catch(()=>{});
  document.getElementById('mgrMsg').textContent = LANG==='es'?'Cambios copiados al portapapeles.':'Changes copied to clipboard.';
}

/* Attempt to save to Sheets if your backend later supports ?action=updateSchedule */
async function mgrSaveToSheets() {
  const box = document.getElementById('mgrResult');
  const week = box.dataset.week || '';
  const name = box.dataset.name || '';
  const cells = Array.from(document.querySelectorAll('#mgrTable .mgr-cell'));
  const changes = cells.map(inp => ({ day: inp.dataset.day, value: inp.value.trim() }));

  document.getElementById('mgrMsg').textContent = LANG==='es'?'Enviando...':'Sending...';

  try {
    const url = `${CONFIG.BASE_URL}?action=updateSchedule`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ week, name, changes })
    });
    const data = await res.json();
    if (data && (data.ok || data.success)) {
      document.getElementById('mgrMsg').textContent = LANG==='es'?'Guardado en Sheets.':'Saved to Sheets.';
    } else {
      document.getElementById('mgrMsg').textContent = LANG==='es'
        ? 'El servidor aún no soporta updateSchedule. (No se escribieron cambios)'
        : 'Server does not support updateSchedule yet. (No changes written)';
    }
  } catch {
    document.getElementById('mgrMsg').textContent = LANG==='es'
      ? 'Error de conexión. (No se escribieron cambios)'
      : 'Connection error. (No changes written)';
  }
}

/* ========== SETTINGS / UI WIRING ========== */
function openSettings(){ document.getElementById('settingsModal').style.display='block'; }
function closeSettings(){ document.getElementById('settingsModal').style.display='none'; }
function logoutUser(){ localStorage.removeItem('acw_email'); localStorage.removeItem('acw_role'); location.reload(); }

/* ========== BOOT ==========
   – mantiene sesión
   – idioma
   – tema
   – eventos
*/
window.addEventListener("load", async () => {
  // I18N + THEME
  initTheme();
  setLang(LANG);
  loadActiveWeekLabel();

  // Buttons
  document.getElementById("btnSignIn").addEventListener("click", loginUser);
  document.getElementById("btnLogout").addEventListener("click", logoutUser);

  document.getElementById("gearButton").addEventListener("click", openSettings);
  document.getElementById("btnSettings").addEventListener("click", openSettings);
  document.getElementById("closeSettings").addEventListener("click", closeSettings);

  document.getElementById("btnChangePass").addEventListener("click", changeUserPassword);

  // Theme buttons
  document.getElementById("themeBtn").addEventListener("click", ()=>{
    const html = document.documentElement;
    if (html.classList.contains('theme-night')) applyTheme('day'); else applyTheme('night');
  });
  document.getElementById("btnDay").addEventListener("click", ()=>applyTheme('day'));
  document.getElementById("btnNight").addEventListener("click", ()=>applyTheme('night'));
  document.getElementById("btnAuto").addEventListener("click", ()=>applyTheme('auto'));

  // Language toggle
  document.getElementById("langBtn").addEventListener("click", ()=>{
    setLang(LANG === "es" ? "en" : "es");
  });

  // Manager wiring
  document.getElementById("btnOpenManager").addEventListener("click", ()=>{
    const el = document.getElementById("managerPanel");
    el.style.display = (el.style.display==='none' || !el.style.display) ? 'block' : 'none';
  });
  document.getElementById("btnMgrLoad").addEventListener("click", mgrLoadByShort);
  document.getElementById("btnMgrExport").addEventListener("click", mgrExportChanges);
  document.getElementById("btnMgrSave").addEventListener("click", mgrSaveToSheets);

  // Auto-login
  const savedEmail = localStorage.getItem("acw_email");
  const savedRole  = (localStorage.getItem("acw_role")||'').toLowerCase();
  if (savedEmail) {
    document.getElementById("login").style.display = "none";
    document.getElementById("welcome").style.display = "block";
    // manager button visibility
    if (['owner','manager','supervisor'].includes(savedRole)) {
      document.getElementById("btnOpenManager").style.display = "inline-flex";
    }
    getSchedule(savedEmail);
  }
});
