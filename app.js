
(function(){
  const $ = (s,el=document)=>el.querySelector(s);

  const i18n = {
    en:{phoneLabel:"Phone:",loginTitle:"Sign in",email:"Email",password:"Password",signIn:"Sign in",
        changePass:"Change password",currentPass:"Current",newPass:"New",update:"Update",
        welcome:"Welcome",yourWeek:"Your schedule this week",total:"Total",activeWeek:"Active week",
        invalid:"Access denied. Check email/password.",missing:"Please enter email and password.",
        passChanged:"Password updated ✅",passWrong:"Wrong current password",notFound:"Schedule not found for this user"},
    es:{phoneLabel:"Teléfono:",loginTitle:"Iniciar sesión",email:"Correo",password:"Contraseña",signIn:"Entrar",
        changePass:"Cambiar contraseña",currentPass:"Actual",newPass:"Nueva",update:"Actualizar",
        welcome:"Bienvenido",yourWeek:"Tu horario de esta semana",total:"Total",activeWeek:"Semana activa",
        invalid:"Acceso denegado. Verifica correo/contraseña.",missing:"Por favor escribe correo y contraseña.",
        passChanged:"Contraseña actualizada ✅",passWrong:"Contraseña actual incorrecta",notFound:"No se encontró horario para este usuario"}
  };

  const langFromDevice = (navigator.language||"en").toLowerCase().startsWith("es") ? "es" : "en";
  let LANG = localStorage.getItem("acw_lang") || langFromDevice;
  const t = k => (i18n[LANG] && i18n[LANG][k]) || k;

  async function fetchJSON(url){ const r=await fetch(url,{cache:"no-store"}); return r.json(); }

  function renderStrings(){
    $("#phoneLabel").textContent = t("phoneLabel");
    $("#loginTitle").textContent = t("loginTitle");
    $("#email").placeholder = t("email");
    $("#password").placeholder = t("password");
    $("#signInBtn").textContent = t("signIn");
    $("#changePassTitle").textContent = t("changePass");
    $("#currentPass").placeholder = t("currentPass");
    $("#newPass").placeholder = t("newPass");
    $("#updateBtn").textContent = t("update");
    $("#weekLabel").textContent = t("activeWeek");
    $("#welcomeTitle").textContent = t("welcome");
  }

  async function loadActiveWeek(){
    try{
      const j=await fetchJSON(`${window.ACW_CONFIG.BACKEND_URL}?action=getActiveWeek`);
      $("#activeWeek").textContent = j && j.week ? j.week : "---";
    }catch(_){ $("#activeWeek").textContent="---"; }
  }

  function pickMotivation(){
    const msgs=(window.ACW_MESSAGES && window.ACW_MESSAGES[LANG])||[];
    return msgs.length? msgs[Math.floor(Math.random()*msgs.length)] : "";
  }

  function showAlert(msg,isError=false){
    const el=$("#alert"); el.textContent=msg; el.className="alert "+(isError?"error":"ok"); el.style.display="block";
    setTimeout(()=>el.style.display="none",3200);
  }

  async function doLogin(e){
    e.preventDefault();
    const email=$("#email").value.trim().toLowerCase();
    const password=$("#password").value.trim();
    if(!email||!password){ showAlert(t("missing"),true); return; }
    try{
      const j=await fetchJSON(`${window.ACW_CONFIG.BACKEND_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      if(!j.ok){ showAlert(t("invalid"),true); return; }
      sessionStorage.setItem("acw_email", j.email);
      sessionStorage.setItem("acw_name", j.name||"");
      sessionStorage.setItem("acw_role", j.role||"employee");
      showDashboard(j);
    }catch(_){ showAlert("Network error",true); }
  }

  async function loadSchedule(email){
    return fetchJSON(`${window.ACW_CONFIG.BACKEND_URL}?action=getScheduleByEmail&email=${encodeURIComponent(email)}`);
  }

  async function showDashboard(user){
    $("#loginCard").style.display="none";
    $("#dashCard").style.display="block";
    $("#welcomeName").textContent = user.name||"";
    $("#motivation").textContent = pickMotivation();

    const email=sessionStorage.getItem("acw_email");
    const data=await loadSchedule(email);
    if(data && data.days){
      $("#dashWeek").textContent=data.week||"";
      const list=$("#daysList"); list.innerHTML="";
      data.days.forEach(d=>{
        const row=document.createElement("div"); row.className="day";
        const a=document.createElement("div"); a.textContent=d.name;
        const b=document.createElement("div"); b.textContent=`${d.shift||"-"}${d.hours?` (${d.hours})`:""}`;
        row.appendChild(a); row.appendChild(b); list.appendChild(row);
      });
      $("#totalHrs").textContent=`${t("total")}: ${Math.round((data.total||0)*10)/10}h`;
    }else{ showAlert(t("notFound"),true); }
  }

  async function changePass(e){
    e.preventDefault();
    const email=sessionStorage.getItem("acw_email") || $("#email").value.trim().toLowerCase();
    const oldp=$("#currentPass").value.trim();
    const newp=$("#newPass").value.trim();
    if(!email||!oldp||!newp){ showAlert(t("missing"),true); return; }
    const j=await fetchJSON(`${window.ACW_CONFIG.BACKEND_URL}?action=changePassword&email=${encodeURIComponent(email)}&old=${encodeURIComponent(oldp)}&new=${encodeURIComponent(newp)}`);
    if(j && j.ok){ showAlert(t("passChanged")); $("#currentPass").value=""; $("#newPass").value=""; }
    else { showAlert(j && j.error==="wrong_current_password" ? t("passWrong") : "Error", true); }
  }

  function switchLang(next){ LANG=next; localStorage.setItem("acw_lang",LANG); renderStrings(); $("#motivation").textContent=pickMotivation(); }

  window.addEventListener("DOMContentLoaded", async ()=>{
    renderStrings(); await loadActiveWeek();
    const em=sessionStorage.getItem("acw_email"); const nm=sessionStorage.getItem("acw_name")||"";
    if(em){ showDashboard({email:em,name:nm}); }
    $("#signInForm").addEventListener("submit", doLogin);
    $("#passForm").addEventListener("submit", changePass);
    $("#btnES").addEventListener("click", ()=>switchLang("es"));
    $("#btnEN").addEventListener("click", ()=>switchLang("en"));
  });
})();
