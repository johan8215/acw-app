/* ACW App v3.5 Secure */
const { BACKEND_URL } = window.ACW_CONFIG || {};

let state = { lang: 'es', googleEmail: '', profile: null };

document.querySelectorAll('.lang-toggle .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-toggle .chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); state.lang = btn.dataset.lang; applyLang();
  });
});
function applyLang(){
  const es = state.lang==='es';
  document.querySelector('#welcome-title').textContent = es ? 'Bienvenido' : 'Welcome';
  document.querySelector('.muted').textContent = es ? 'Inicia sesión con Google y escribe tu contraseña temporal.' : 'Sign in with Google and enter your temporary password.';
  document.querySelector('#btn-login').textContent = es ? 'Entrar' : 'Login';
  document.querySelector('#btn-change-pass').textContent = es ? 'Cambiar contraseña' : 'Change Password';
  document.querySelector('#btn-logout').textContent = es ? 'Salir' : 'Logout';
}
applyLang();

window.onGoogleSignIn = function (response) {
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    state.googleEmail = (payload.email || '').toLowerCase();
  } catch (e) { console.warn('Google parse error', e); }
};

document.getElementById('btn-login').addEventListener('click', async () => {
  const pwd = (document.getElementById('password').value || '').trim();
  const err = document.getElementById('auth-error'); err.classList.remove('show');
  if (!state.googleEmail){ err.textContent = state.lang==='es' ? 'Primero inicia sesión con Google.' : 'Please sign in with Google first.'; err.classList.add('show'); return; }
  if (!pwd){ err.textContent = state.lang==='es' ? 'Escribe tu contraseña.' : 'Enter your password.'; err.classList.add('show'); return; }
  try {
    const url = new URL(BACKEND_URL); url.searchParams.set('action','login'); url.searchParams.set('email',state.googleEmail); url.searchParams.set('password',pwd);
    const res = await fetch(url.toString()); const data = await res.json();
    if (!data.ok){ err.textContent = data.error || (state.lang==='es' ? 'Acceso denegado.' : 'Access denied.'); err.classList.add('show'); return; }
    state.profile = data; localStorage.setItem('acw_profile', JSON.stringify(data));
    showEmployee(); await loadSchedule();
  } catch { err.textContent = state.lang==='es' ? 'Error de red.' : 'Network error.'; err.classList.add('show'); }
});

function showEmployee(){
  document.getElementById('view-auth').classList.remove('visible');
  document.getElementById('view-change').classList.remove('visible');
  document.getElementById('view-employee').classList.add('visible');
  const name = state.profile?.name || 'Employee';
  document.getElementById('hello').textContent = (state.lang==='es'?'Hola ':'Hello ') + name;
}

async function loadSchedule(){
  const url = new URL(BACKEND_URL); url.searchParams.set('action','getScheduleByEmail'); url.searchParams.set('email', state.profile.email);
  const res = await fetch(url.toString()); const data = await res.json();
  const weekEl = document.getElementById('week-range'); const ul = document.getElementById('schedule-list'); const totalEl = document.getElementById('total-hours');
  if (data.error){ weekEl.textContent = state.lang==='es'?'No se encontró horario.':'Schedule not found.'; ul.innerHTML=''; totalEl.textContent=''; return; }
  weekEl.textContent = data.week || ''; ul.innerHTML='';
  data.days.forEach(d => { const li=document.createElement('li'); li.innerHTML=`<strong>${d.name}</strong><span>${d.shift||'-'}</span><b>${d.hours? '('+d.hours+')':''}</b>`; ul.appendChild(li); });
  totalEl.textContent = (state.lang==='es'?'Total: ':'Total: ') + (data.total||0) + 'h';
}

document.getElementById('btn-change-pass').addEventListener('click',()=>{document.getElementById('view-employee').classList.remove('visible');document.getElementById('view-change').classList.add('visible');});
document.getElementById('btn-cancel-change').addEventListener('click',()=>{document.getElementById('view-change').classList.remove('visible');document.getElementById('view-employee').classList.add('visible');});
document.getElementById('btn-save-pass').addEventListener('click', async ()=>{
  const msg = document.getElementById('change-msg');
  const cur = document.getElementById('cur-pass').value.trim(), np1 = document.getElementById('new-pass').value.trim(), np2 = document.getElementById('new-pass-2').value.trim();
  if(!cur||!np1||!np2){ msg.textContent = state.lang==='es'?'Completa todos los campos.':'Fill all fields.'; return;}
  if(np1!==np2){ msg.textContent = state.lang==='es'?'Las contraseñas no coinciden.':'Passwords do not match.'; return;}
  if(np1.length<4){ msg.textContent = state.lang==='es'?'Mínimo 4 caracteres.':'Min 4 characters.'; return;}
  const url = new URL(BACKEND_URL); url.searchParams.set('action','changePassword'); url.searchParams.set('email', state.profile.email); url.searchParams.set('old', cur); url.searchParams.set('new', np1);
  const res = await fetch(url.toString()); const data = await res.json();
  msg.textContent = data.ok ? (state.lang==='es'?'Contraseña actualizada. ✅':'Password updated. ✅') : (data.error || (state.lang==='es'?'Error al actualizar.':'Update failed.'));
});
document.getElementById('btn-logout').addEventListener('click',()=>{localStorage.removeItem('acw_profile');state.profile=null;document.getElementById('view-employee').classList.remove('visible');document.getElementById('view-change').classList.remove('visible');document.getElementById('view-auth').classList.add('visible');});

(function restore(){ try{const saved=JSON.parse(localStorage.getItem('acw_profile')||'null'); if(saved&&saved.email){ state.profile=saved; showEmployee(); loadSchedule();}}catch(_){}})();