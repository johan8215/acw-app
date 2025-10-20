window.addEventListener("load", () => {
  // ⏱️ Splash auto-hide
  setTimeout(() => {
    const s = document.getElementById("splash");
    if (s) s.style.display = "none";
  }, 2500);
});

function openTeamOverview() {
  document.getElementById("teamModal").style.display = "block";
  const team = [
    { name: "Wendy", phone: "(617) 254-3210", shift: "7:30 - 3", hours: 7.5 },
    { name: "Carlos", phone: "(617) 555-1234", shift: "8:00 - 4", hours: 8.0 },
    { name: "Luis", phone: "(617) 444-3322", shift: "OFF", hours: 0.0 }
  ];
  let html = `<table><thead><tr><th>Name</th><th>Phone</th><th>Shift</th><th>Hours</th><th></th></tr></thead><tbody>`;
  team.forEach(e=>{
    html += `<tr>
      <td>${e.name}</td>
      <td>${e.phone}</td>
      <td>${e.shift}</td>
      <td>${e.hours}</td>
      <td><button onclick="openEmployee(${JSON.stringify(e).replace(/"/g, '&quot;')})">Open</button></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById("teamTable").innerHTML = html;
}
function closeTeamOverview(){ document.getElementById("teamModal").style.display = "none"; }

function openEmployee(emp){
  const modal=document.getElementById("employeeModal");
  modal.style.display="block";
  document.getElementById("empName").textContent=emp.name;
  document.getElementById("empPhone").textContent="Phone: "+emp.phone;
  document.getElementById("empShift").value=emp.shift;
}
function closeEmployeeModal(){ document.getElementById("employeeModal").style.display="none"; }

async function sendEmpMessage(){
  const phone=document.getElementById("empPhone").textContent.replace(/\D/g,"");
  const msg=document.getElementById("empMessage").value.trim();
  if(!msg)return alert("Please write a message first.");
  const api=`https://api.callmebot.com/whatsapp.php?phone=1${phone}&text=${encodeURIComponent(msg)}&apikey=${CONFIG.API_KEY}`;
  await fetch(api);
  alert("Message sent successfully!");
}
