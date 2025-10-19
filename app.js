/* ===========================================================
   ACW-App v4.0 Red Glass Edition
   =========================================================== */

const LANG = navigator.language.startsWith("es") ? "es" : "en";
const TXT = {
  en: {
    welcome: "Welcome,",
    settings: "Settings",
    change: "Change Password",
    logout: "Log Out",
    save: "Save",
    sendMsg: "Send Message",
    saveChanges: "Save Changes",
    close: "Close",
    typeMsg: "Type your message here…",
    shift: "Shift:"
  },
  es: {
    welcome: "Bienvenido,",
    settings: "Configuraciones",
    change: "Cambiar Contraseña",
    logout: "Cerrar Sesión",
    save: "Guardar",
    sendMsg: "Enviar Mensaje",
    saveChanges: "Guardar Cambios",
    close: "Cerrar",
    typeMsg: "Escribe tu mensaje aquí…",
    shift: "Horario:"
  }
}[LANG];

/* LOGIN / LOGOUT / SETTINGS same as before ... */

/* ===========================================================
   EMPLOYEE MODAL (Manager)
   =========================================================== */
let currentEmp = null;

function openEmployee(emp) {
  currentEmp = emp;
  document.getElementById("employeeModal").style.display = "block";
  document.getElementById("empName").textContent = emp.name;
  document.getElementById("empShift").value = emp.shift || "";
  document.getElementById("empMessage").placeholder = TXT.typeMsg;
  document.getElementById("shiftLabel").textContent = TXT.shift;
  document.getElementById("sendMsgBtn").textContent = TXT.sendMsg;
  document.getElementById("saveShiftBtn").textContent = TXT.saveChanges;
}

function closeEmployeeModal() {
  document.getElementById("employeeModal").style.display = "none";
}

/* CallMeBot send */
async function sendEmpMessage() {
  if (!currentEmp) return;
  const phone = currentEmp.phone;
  const msg = document.getElementById("empMessage").value.trim();
  if (!msg) return alert("Please write a message first.");
  const api = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(msg)}&apikey=${CONFIG.API_KEY}`;
  await fetch(api);
  alert("Message sent successfully!");
}

/* ===========================================================
   SHOW MANAGER PANEL
   =========================================================== */
function showManagerPanel(list) {
  let html = `<div class='week-header'>Team Schedule Overview</div>
  <table class='schedule-table'>
  <thead><tr><th>Name</th><th>Shift</th><th>Hours</th><th></th></tr></thead><tbody>`;
  list.forEach(emp=>{
    html += `<tr><td>${emp.name}</td><td>${emp.shift}</td><td>${emp.hours}</td>
      <td><button onclick='openEmployee(${JSON.stringify(emp)})'>Open</button></td></tr>`;
  });
  html += "</tbody></table>";
  document.getElementById("schedule").insertAdjacentHTML("beforeend", html);
}
