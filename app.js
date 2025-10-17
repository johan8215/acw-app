/* ===========================================================
   ACW-App Login + Schedule Viewer
   =========================================================== */

async function loginUser() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter your email and password");
    return;
  }

  try {
    const url = `${CONFIG.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok) {
      document.getElementById("login").style.display = "none";
      document.getElementById("welcome").style.display = "block";
      document.getElementById("userName").textContent = data.name;
      document.getElementById("userRole").textContent = data.role;
      getSchedule(email);
    } else {
      alert("Invalid credentials");
    }
  } catch (err) {
    alert("Connection error");
    console.error(err);
  }
}

async function getSchedule(email) {
  const url = `${CONFIG.BASE_URL}?action=getScheduleByEmail&email=${encodeURIComponent(email)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.ok) {
    document.getElementById("schedule").innerHTML = "No schedule found.";
    return;
  }

  let html = `<h3>Week: ${data.week}</h3><table>`;
  data.days.forEach(d => {
    html += `<tr><td>${d.name}</td><td>${d.shift}</td><td>${d.hours || ""}</td></tr>`;
  });
  html += `</table><p>Total: <b>${data.total}</b> hours</p>`;
  document.getElementById("schedule").innerHTML = html;
}