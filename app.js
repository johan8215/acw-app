/* ACW front-end v3.8 */
(() => {
  const $ = (sel) => document.querySelector(sel);
  const CFG = window.ACW_CONFIG || {};

  const userLang = (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
  let lang = userLang;
  const i18n = {
    en: { signIn:"Sign in", email:"Email", password:"Password (e.g., 0000)", thisWeek:"This week", total:"Total", welcome:"Welcome HRS", invalid:"Access denied", notFound:"Employee not found", missing:"Missing fields", server:"Server unavailable" },
    es: { signIn:"Entrar", email:"Correo", password:"Contraseña (ej. 0000)", thisWeek:"Esta semana", total:"Total", welcome:"Bienvenido HRS", invalid:"Acceso denegado", notFound:"Empleado no encontrado", missing:"Faltan datos", server:"Servidor no disponible" }
  };
  const weekLabel = $("#weekLabel"), weekMobile=$("#weekMobile"), nowEl=$("#now"), errEl=$("#err");
  const btnEN=$("#btnEN"), btnES=$("#btnES"), btnLogin=$("#btnLogin"), form=$("#loginForm"), panel=$("#panel");
  const panelTitle=$("#panelTitle"), scheduleEl=$("#schedule"), totalEl=$("#total");

  function setLang(l){
    lang=l; const t=i18n[l];
    btnLogin.textContent = t.signIn;
    $("#email").placeholder=t.email;
    $("#password").placeholder=t.password;
    panelTitle.textContent=t.thisWeek;
    renderClock();
  }
  btnEN.onclick=()=>{btnEN.classList.add("active");btnES.classList.remove("active");setLang("en");};
  btnES.onclick=()=>{btnES.classList.add("active");btnEN.classList.remove("active");setLang("es");};
  setLang(lang);

  function renderClock(){
    const d=new Date();
    const fmt=new Intl.DateTimeFormat(lang,{dateStyle:"short", timeStyle:"short"});
    nowEl.textContent = fmt.format(d);
  }
  renderClock(); setInterval(renderClock,30000);

  async function fetchWeek(){
    try{
      const url = `${CFG.BACKEND_URL}?action=getActiveWeek`;
      const r = await fetch(url, {cache:"no-store"});
      const j = await r.json();
      const wk = j.week || "—";
      weekLabel.textContent = wk; weekMobile.textContent = wk;
    }catch(_){ weekLabel.textContent="—"; weekMobile.textContent=""; }
  }
  fetchWeek();

  form.addEventListener("submit", async (ev)=>{
    ev.preventDefault(); errEl.textContent=""; btnLogin.disabled=true; btnLogin.style.opacity=.8;
    const email=$("#email").value.trim().toLowerCase();
    const password=$("#password").value.trim();
    if(!email || !password){ errEl.textContent=i18n[lang].missing; btnLogin.disabled=false; btnLogin.style.opacity=1; return; }
    try{
      const url = `${CFG.BACKEND_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const r = await fetch(url, {cache:"no-store"});
      const j = await r.json();
      if(!j.ok){
        errEl.textContent=(j.error==="access_denied")?i18n[lang].invalid:(j.error==="email_not_found")?i18n[lang].notFound:i18n[lang].server;
        btnLogin.disabled=false; btnLogin.style.opacity=1; return;
      }
      await loadSchedule(email);
    }catch(e){ errEl.textContent=i18n[lang].server; }
    finally{ btnLogin.disabled=false; btnLogin.style.opacity=1; }
  });

  async function loadSchedule(email){
    try{
      const url=`${CFG.BACKEND_URL}?action=getScheduleByEmail&email=${encodeURIComponent(email)}`;
      const r = await fetch(url, {cache:"no-store"});
      const j = await r.json();
      if(j.error){ errEl.textContent = i18n[lang].server; return; }
      panel.hidden=false;
      scheduleEl.innerHTML="";
      const days=j.days||[];
      const order=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      const names = {Mon:{en:"Mon",es:"Lun"},Tue:{en:"Tue",es:"Mar"},Wed:{en:"Wed",es:"Mié"},Thu:{en:"Thu",es:"Jue"},Fri:{en:"Fri",es:"Vie"},Sat:{en:"Sat",es:"Sáb"},Sun:{en:"Sun",es:"Dom"}};
      order.forEach(k=>{
        const d=days.find(x=>x.name===k)||{shift:"",hours:0};
        const row=document.createElement("div"); row.className="row";
        row.innerHTML=`<span>${names[k][lang]} ${d.shift?`· <strong>${d.shift}</strong>`:""}</span><span>${d.hours?`(${d.hours}h)`:""}</span>`;
        scheduleEl.appendChild(row);
      });
      totalEl.textContent = `${i18n[lang].total}: ${j.total||0}h`;
    }catch(e){ errEl.textContent=i18n[lang].server; }
  }
})();