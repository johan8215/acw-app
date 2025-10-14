
// ACW APP 2.0 - Frontend
const cfg = window.ACW_CONFIG;

const t = {
  es: (k)=>({
    email:'Correo (Google)',
    code:'Nombre corto (ej. J. Giraldo)',
    view:'Ver mi horario',
    today:'Enviar Hoy',
    tomorrow:'Enviar Mañana',
    updates:'Enviar Updates',
    who:'Verás tus turnos y horas. Managers pueden enviar mensajes.',
    week:'Semana',
    total:'Total',
  })[k],
  en: (k)=>({
    email:'Email (Google)',
    code:'Short name (e.g., J. Giraldo)',
    view:'View my schedule',
    today:'Send Today',
    tomorrow:'Send Tomorrow',
    updates:'Send Updates',
    who:'You will see your shifts & hours. Managers can send messages.',
    week:'Week',
    total:'Total',
  })[k]
};

const langSel = document.getElementById('lang');
const emailEl = document.getElementById('email');
const codeEl  = document.getElementById('code');
const btnView = document.getElementById('btnView');
const btnToday= document.getElementById('btnToday');
const btnTomorrow= document.getElementById('btnTomorrow');
const btnUpdates= document.getElementById('btnUpdates');
const resCard = document.getElementById('result');
const weekLabel = document.getElementById('weekLabel');
const listEl = document.getElementById('list');
const totalEl = document.getElementById('total');
const whoSees = document.getElementById('whoSees');
const labelEmail = document.getElementById('labelEmail');
const labelCode = document.getElementById('labelCode');
const resTitle = document.getElementById('resTitle');

function applyLang(){
  const L = langSel.value === 'en' ? t.en : t.es;
  labelEmail.textContent = L('email');
  labelCode.textContent  = L('code');
  btnView.textContent    = L('view');
  btnToday.textContent   = L('today');
  btnTomorrow.textContent= L('tomorrow');
  btnUpdates.textContent = L('updates');
  whoSees.textContent    = L('who');
  resTitle.textContent   = L('week');
}
langSel.addEventListener('change', applyLang);
applyLang();

function toast(msg, ok=true){ 
  if ('Notification' in window && Notification.permission === 'granted') { 
    navigator.serviceWorker?.ready.then(r=>{
      r.showNotification('Shift Manager ACW', { body: msg, icon:'acw-notify.png' });
    });
  } else {
    alert(msg);
  }
}

async function call(action, payload={}){
  const url = cfg.WEBAPP_URL + '?' + new URLSearchParams({ action, ...payload }).toString();
  const res = await fetch(url, { method: 'GET', mode:'cors' });
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json().catch(async _=>({ raw: await res.text() }));
}

function renderSchedule(data){
  // Expecting data: { week:'10/13 - 10/19/25', days:[{name:'Monday', shift:'8 - 5 (9)'},...], total:'40' }
  resCard.classList.remove('hidden');
  weekLabel.textContent = (data.week||'Semana');
  listEl.innerHTML = '';
  (data.days||[]).forEach(d=>{
    const li = document.createElement('li');
    li.className='day';
    li.innerHTML = `<span class="name">${d.name}</span><span class="shift">${d.shift||'-'}</span>`;
    listEl.appendChild(li);
  });
  totalEl.textContent = (langSel.value==='en'?'Total':'Total') + ': ' + (data.total||'');
}

btnView.addEventListener('click', async()=>{
  try {
    const email = emailEl.value.trim();
    const code  = codeEl.value.trim();
    const payload = { action:'view', email, code, sheet: cfg.SHEET_ID };
    const data = await call('view', payload);
    renderSchedule(data);
  } catch(e){
    toast('No se pudo cargar el horario. Revisa tu email/nombre.', false);
  }
});

async function sendGeneric(kind){
  try {
    const email = emailEl.value.trim();
    const code  = codeEl.value.trim();
    const r = await call(kind, { email, code, sheet: cfg.SHEET_ID });
    toast('✅ Mensajes enviados ('+kind+').');
  } catch(e){
    toast('⚠️ Error enviando ('+kind+'). Revisa Sheet.', false);
  }
}

btnToday.addEventListener('click', ()=> sendGeneric('sendToday'));
btnTomorrow.addEventListener('click', ()=> sendGeneric('sendTomorrow'));
btnUpdates.addEventListener('click', ()=> sendGeneric('sendUpdates'));

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
if ('Notification' in window) {
  Notification.requestPermission();
}
