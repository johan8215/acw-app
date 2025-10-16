
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const text = {
    en: { signIn:"Sign in", email:"Email", password:"Password", tip:"Tip: default password for new users is 0000. You can change it later in Settings.", total:"Total", settings:"Settings", logout:"Logout", settingsTitle:"Settings", oldPwd:"Current password", newPwd:"New password", changePwd:"Change password", back:"Back", weekPrefix:"Active week: " },
    es: { signIn:"Iniciar sesión", email:"Correo", password:"Contraseña", tip:"Tip: la contraseña por defecto es 0000. Puedes cambiarla luego en Ajustes.", total:"Total", settings:"Ajustes", logout:"Salir", settingsTitle:"Ajustes", oldPwd:"Contraseña actual", newPwd:"Nueva contraseña", changePwd:"Cambiar contraseña", back:"Atrás", weekPrefix:"Semana activa: " }
  };
  let lang = (navigator.language||"en").toLowerCase().startsWith("es") ? "es" : "en";
  const setLang = (lg)=>{
    lang = lg;
    document.getElementById("loginTitle").textContent = text[lg].signIn;
    document.getElementById("lblEmail").textContent = text[lg].email;
    document.getElementById("lblPassword").textContent = text[lg].password;
    document.getElementById("btnSignIn").textContent = text[lg].signIn;
    document.getElementById("loginTips").querySelector("p").textContent = text[lg].tip;
    document.getElementById("totalLabel").textContent = text[lg].total;
    document.getElementById("btnSettings").textContent = text[lg].settings;
    document.getElementById("btnLogout").textContent = text[lg].logout;
    document.getElementById("settingsTitle").textContent = text[lg].settingsTitle;
    document.getElementById("lblOldPwd").textContent = text[lg].oldPwd;
    document.getElementById("lblNewPwd").textContent = text[lg].newPwd;
    document.getElementById("btnChangePwd").textContent = text[lg].changePwd;
    document.getElementById("btnBack").textContent = text[lg].back;
    const wk = sessionStorage.getItem("acw_week") || "—";
    document.getElementById("activeWeek").textContent = text[lg].weekPrefix + wk;
    document.getElementById("langToggle").textContent = lg.toUpperCase();
  };

  const BACKEND = window.ACW_CONFIG && window.ACW_CONFIG.BACKEND_URL;
  const fetchJSON = async (params)=>{
    const url = BACKEND + "?" + new URLSearchParams(params).toString();
    const res = await fetch(url, { method:"GET" });
    return res.json();
  };

  async function loadWeek(){
    try{
      const r = await fetchJSON({ action: "getActiveWeek" });
      if(r && r.week){ sessionStorage.setItem("acw_week", r.week); }
    }catch(_){}
    setLang(lang);
  }

  document.getElementById("langToggle").addEventListener("click", ()=> setLang(lang==="en"?"es":"en"));

  document.getElementById("loginForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    try{
      const r = await fetchJSON({ action:"login", email, password });
      if(!r.ok){ alert((r.error||"Access denied")); return; }
      sessionStorage.setItem("acw_session", JSON.stringify({email, role:r.role, name:r.name}));
      if(r.week) sessionStorage.setItem("acw_week", r.week);
      document.getElementById("empName").textContent = r.name;
      document.getElementById("empRole").textContent = r.role;
      document.getElementById("loginCard").classList.add("hidden");
      document.getElementById("employeeCard").classList.remove("hidden");
      loadSchedule(email);
    }catch(err){ alert("Network error"); }
  });

  async function loadSchedule(email){
    const grid = document.getElementById("scheduleGrid");
    grid.innerHTML = "";
    document.getElementById("totalHours").textContent = "0h";
    try{
      const r = await fetchJSON({ action:"getScheduleByEmail", email });
      if(r && r.days){
        let total = 0;
        r.days.forEach(d=>{
          const el = document.createElement("div");
          el.className = "day";
          el.innerHTML = "<h4>"+d.name+"</h4><div class='shift'>"+(d.shift||"-")+"</div><div class='hours'>"+(d.hours||0)+"h</div>";
          grid.appendChild(el);
          total += Number(d.hours||0);
        });
        document.getElementById("totalHours").textContent = (Math.round(total*10)/10)+"h";
        const wk = r.week || sessionStorage.getItem("acw_week") || "—";
        sessionStorage.setItem("acw_week", wk);
        document.getElementById("activeWeek").textContent = text[lang].weekPrefix + wk;
      }
    }catch(err){ console.error(err); alert("Could not load schedule"); }
  }

  document.getElementById("btnSettings").addEventListener("click", ()=>{
    document.getElementById("employeeCard").classList.add("hidden");
    document.getElementById("settingsCard").classList.remove("hidden");
  });
  document.getElementById("btnBack").addEventListener("click", ()=>{
    document.getElementById("settingsCard").classList.add("hidden");
    document.getElementById("employeeCard").classList.remove("hidden");
  });
  document.getElementById("pwdForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const s = JSON.parse(sessionStorage.getItem("acw_session")||"{}");
    const email = s.email;
    const oldp = document.getElementById("oldPwd").value.trim();
    const newp = document.getElementById("newPwd").value.trim();
    if(!email) return alert("No session");
    try{
      const r = await fetchJSON({ action:"changePassword", email, old:oldp, new:newp });
      if(r && r.ok){ alert(lang==="es" ? "Contraseña actualizada" : "Password updated"); document.getElementById("oldPwd").value=""; document.getElementById("newPwd").value=""; }
      else{ alert(r.error||"Error"); }
    }catch(_){ alert("Network error"); }
  });

  document.getElementById("btnLogout").addEventListener("click", ()=>{
    sessionStorage.removeItem("acw_session");
    document.getElementById("employeeCard").classList.add("hidden");
    document.getElementById("settingsCard").classList.add("hidden");
    document.getElementById("loginCard").classList.remove("hidden");
  });

  loadWeek();
})();
const now = new Date().toLocaleString("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
});
document.getElementById("welcomeTicker").textContent = `Welcome HRS • ${now}`;
