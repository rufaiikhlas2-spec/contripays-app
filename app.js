let A=JSON.parse(localStorage.getItem("cp_accounts")||"[]"),U=localStorage.getItem("cp_user"),C=null,CD=new Date(),PD=null,F="all";
const $=x=>document.getElementById(x),save=()=>localStorage.setItem("cp_accounts",JSON.stringify(A));
const me=()=>A.find(x=>String(x.id)===String(U)),money=n=>"₦"+Number(n||0).toLocaleString();
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s||"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[x]));

function hideScreens(){
 document.querySelectorAll(".screen").forEach(x=>x.style.display="none");
}
function showWelcome(){hideScreens();$("welcomeScreen").style.display="flex"}
function openLogin(){hideScreens();$("loginScreen").style.display="flex"}
function openRegister(){hideScreens();$("registerScreen").style.display="flex"}

function showScreen(id){
 document.querySelectorAll(".app-section").forEach(x=>x.style.display="none");
 let x=$(id);if(x)x.style.display="block";
}

function openApp(){
 hideScreens();
 $("mainScreen").style.display="block";
 showScreen("dashboardScreen");
 loadSettings();
 renderAll();
}

function registerAccount(){
 let n=$("registerName").value.trim(),o=$("registerOrganizer").value.trim();
 let p=$("registerPhone").value.trim(),w=$("registerPassword").value;
 if(!n||!o||!p||!w)return alert("Please fill all fields.");
 if(w!==$("registerConfirm").value)return alert("Passwords do not match.");
 if(A.some(x=>x.phone===p))return alert("Phone number already registered.");
 let a={id:Date.now(),name:n,organizer:o,phone:p,password:w,contributors:[]};
 A.push(a);U=a.id;
 localStorage.setItem("cp_user",U);
 save();
 openApp();
}

function loginAccount(){
 let p=$("loginPhone").value.trim(),w=$("loginPassword").value;
 let a=A.find(x=>x.phone===p&&x.password===w);
 if(!a)return alert("Invalid phone number or password.");
 U=a.id;
 localStorage.setItem("cp_user",U);
 openApp();
}

function logoutAccount(){
 localStorage.removeItem("cp_user");
 U=null;
 showWelcome();
}

function openAddContributor(){$("contributorModal").style.display="flex"}
function closeAddContributor(){$("contributorModal").style.display="none"}

function addContributor(){
 let u=me();if(!u)return;
 let n=$("contributorName").value.trim(),p=$("contributorPhone").value.trim();
 let d=Number($("contributorDaily").value)||50;
 if(!n||!p)return alert("Enter name and phone.");
 u.contributors.push({id:Date.now(),name:n,phone:p,daily:d,payments:[],payouts:[]});
 save();$("contributorForm").reset();closeAddContributor();renderAll();
 alert("Contributor added.");
}

function con(id){
 let u=me();return u&&u.contributors.find(x=>String(x.id)===String(id));
}

function balance(c){
 let b=0;
 c.payments.forEach((p,i)=>{if(i>0)b+=Number(p.amount)||0});
 c.payouts.forEach(p=>b-=Number(p.amount)||0);
 return Math.max(0,b);
}

function renderContributors(){
 let b=$("contributorsList"),u=me();if(!b||!u)return;
 b.innerHTML=u.contributors.length?u.contributors.map(c=>
 `<div class="contributor-card" onclick="openProfile(${c.id})">
 <div><b>${esc(c.name)}</b><br><small>${esc(c.phone)}</small></div>
 <div><b>${money(balance(c))}</b><br><small>Balance</small></div>
 </div>`).join(""):"<p>No contributors yet.</p>";
}

function filterContributors(){
 let q=$("contributorSearch").value.toLowerCase();
 document.querySelectorAll(".contributor-card").forEach(x=>{
  x.style.display=x.innerText.toLowerCase().includes(q)?"flex":"none";
 });
}

function openProfile(id){
 C=id;let c=con(id);if(!c)return;
 let total=c.payments.reduce((s,p)=>s+Number(p.amount||0),0);
 $("contributorProfile").innerHTML=
 `<div class="profile-card"><h2>${esc(c.name)}</h2>
 <p>${esc(c.phone)}</p>
 <p>Daily: <b>${money(c.daily)}</b></p>
 <p>Total paid: <b>${money(total)}</b></p>
 <p>Balance: <b>${money(balance(c))}</b></p>
 <button class="primary-btn" onclick="openCalendar(${c.id})">Open Calendar</button>
 <button class="primary-btn" onclick="payout(${c.id})">Pay Out</button></div>`;
 showScreen("contributorProfileScreen");
}

function pay(c,date){
 if(c.payments.some(x=>x.date===date))return false;
 c.payments.push({date,amount:Number(c.daily)||50});
 save();return true;
}

function choosePaymentContributor(){
 let u=me();if(!u||!u.contributors.length)return alert("Add a contributor first.");
 let s=u.contributors.map((c,i)=>(i+1)+". "+c.name).join("\n");
 let n=prompt("Choose contributor:\n\n"+s);
 if(n===null)return;
 let c=u.contributors[Number(n)-1];
 if(!c)return alert("Invalid choice.");
 alert(pay(c,today())?"Payment recorded.":"Already paid today.");
 renderAll();
}

function renderPayments(){
 let b=$("paymentsList"),u=me();if(!b||!u)return;
 let r=[];
 u.contributors.forEach(c=>c.payments.forEach(p=>r.push({n:c.name,...p})));
 if(F==="today")r=r.filter(x=>x.date===today());
 r.sort((a,b)=>b.date.localeCompare(a.date));
 b.innerHTML=r.length?r.map(x=>
 `<div class="payment-row"><div><b>${esc(x.n)}</b><br><small>${x.date}</small></div>
 <b>${money(x.amount)}</b></div>`).join(""):"<p>No payments found.</p>";
}

function setPaymentFilter(x){F=x;renderPayments()}

function openCalendar(id){
 C=id;let c=con(id);if(!c)return;
 $("calendarContributorName").textContent=c.name;
 renderCalendar();
 showScreen("calendarScreen");
}

function backToContributorProfile(){openProfile(C)}
function previousMonth(){CD.setMonth(CD.getMonth()-1);renderCalendar()}
function nextMonth(){CD.setMonth(CD.getMonth()+1);renderCalendar()}

function renderCalendar(){
 let c=con(C);if(!c)return;
 let y=CD.getFullYear(),m=CD.getMonth(),last=new Date(y,m+1,0);
 $("calendarMonth").textContent=CD.toLocaleString("default",{month:"long",year:"numeric"});
 $("calendarDailyAmount").textContent=money(c.daily);
 let paid=0,total=0,h="";
 for(let i=1;i<=last.getDate();i++){
  let d=y+"-"+String(m+1).padStart(2,"0")+"-"+String(i).padStart(2,"0");
  let p=c.payments.find(x=>x.date===d);
  if(p){paid++;total+=Number(p.amount||0)}
  h+=`<button class="calendar-day ${p?"paid":""}" onclick="openPay('${d}')">
  <span>${i}</span>${p?"<small>Paid</small>":""}</button>`;
 }
 $("calendarDays").innerHTML=h;
 $("calendarPaidDays").textContent=paid;
 $("calendarTotalAmount").textContent=money(total);
}

function openPay(date){
 let c=con(C);if(!c)return;
 PD=date;
 let paid=c.payments.some(x=>x.date===date);
 $("paymentModalTitle").textContent=paid?"Payment Recorded":"Mark Payment";
 $("paymentModalText").textContent=paid?"This day is already paid.":"Record this day's contribution.";
 $("paymentModalAmount").textContent=money(c.daily);
 let b=$("confirmPaymentBtn");
 b.disabled=paid;
 b.textContent=paid?"Already Paid":"Mark as Paid";
 b.onclick=confirmPay;
 $("paymentModal").style.display="flex";
}

function confirmPay(){
 let c=con(C);if(!c||!PD)return;
 if(pay(c,PD)){
  closePaymentModal();
  renderAll();
  renderCalendar();
 }else alert("Already paid.");
}

function closePaymentModal(){
 $("paymentModal").style.display="none";
 PD=null;
}

function payout(id){
 let c=con(id);if(!c)return;
 let b=balance(c);
 if(b<=0)return alert("No available balance.");
 let n=Number(prompt("Available balance: "+money(b)+"\n\nEnter payout amount:"));
 if(!n||n<=0||n>b)return alert("Enter a valid payout amount.");
 c.payouts.push({id:Date.now(),date:today(),amount:n});
 save();renderAll();alert("Payout recorded.");
}

function renderPayouts(){
 let u=me(),b=$("payoutsList"),pending=0,done=0,r=[];
 if(!u||!b)return;
 u.contributors.forEach(c=>{
  pending+=balance(c);
  c.payouts.forEach(p=>{
   done+=Number(p.amount||0);
   r.push({n:c.name,...p});
  });
 });
 $("payoutPendingTotal").textContent=money(pending);
 $("payoutCompletedTotal").textContent=money(done);
 b.innerHTML=r.length?r.map(x=>
 `<div class="payment-row"><div><b>${esc(x.n)}</b><br><small>${x.date}</small></div>
 <b>${money(x.amount)}</b></div>`).join(""):"<p>No payouts recorded.</p>";
}

function financials(){
 let u=me(),received=0,earn=0,dis=0;
 if(!u)return{received:0,earn:0,dis:0,out:0};
 u.contributors.forEach(c=>{
  c.payments.forEach((p,i)=>{
   let n=Number(p.amount)||0;
   received+=n;
   if(i===0)earn+=n;
  });
  c.payouts.forEach(p=>dis+=Number(p.amount)||0);
 });
 return{received,earn,dis,out:received-earn-dis};
}

function renderReports(){
 let f=financials();
 $("reportReceived").textContent=money(f.received);
 $("reportDisbursed").textContent=money(f.dis);
 $("reportEarnings").textContent=money(f.earn);
 $("reportOutstanding").textContent=money(f.out);
}

function updateDashboard(){
 let u=me();if(!u)return;
 let f=financials(),month=today().slice(0,7),daily=0,monthly=0;
 u.contributors.forEach(c=>c.payments.forEach(p=>{
  if(p.date===today())daily+=Number(p.amount)||0;
  if(p.date.startsWith(month))monthly+=Number(p.amount)||0;
 }));
 $("dashboardOrganizer").textContent=u.organizer;
 $("todayTotal").textContent=money(daily);
 $("monthlyTotal").textContent=money(monthly);
 $("totalContributors").textContent=u.contributors.length;
 $("activeContributors").textContent=u.contributors.filter(c=>c.payments.length).length;
 $("pendingPayouts").textContent=money(u.contributors.reduce((s,c)=>s+balance(c),0));
 $("organizerEarnings").textContent=money(f.earn);

 let r=[];
 u.contributors.forEach(c=>c.payments.forEach(p=>r.push({n:c.name,...p})));
 r.sort((a,b)=>b.date.localeCompare(a.date));
 r=r.slice(0,5);
 $("recentActivity").innerHTML=r.length?
 r.map(x=>`<div class="card"><b>${esc(x.n)} paid ${money(x.amount)}</b><br><small>${x.date}</small></div>`).join(""):
 "No recent activity.";
}

function saveSettings(){
 let u=me();if(!u)return;
 u.organizer=$("settingsOrganizerName").value.trim();
 u.name=$("settingsPersonalName").value.trim();
 u.phone=$("settingsPhone").value.trim();
 save();loadSettings();updateDashboard();alert("Settings saved.");
}

function loadSettings(){
 let u=me();if(!u)return;
 $("settingsOrganizerName").value=u.organizer||"";
 $("settingsPersonalName").value=u.name||"";
 $("settingsPhone").value=u.phone||"";
 $("settingsGroupText").textContent=u.organizer||"";
 $("settingsNameText").textContent=u.name||"";
 $("profileInitial").textContent=(u.name||"C")[0].toUpperCase();
}

function renderAll(){
 renderContributors();
 renderPayments();
 renderPayouts();
 renderReports();
 updateDashboard();
}

document.addEventListener("DOMContentLoaded",()=>{
 $("loginForm").onsubmit=e=>{e.preventDefault();loginAccount()};
 $("registerForm").onsubmit=e=>{e.preventDefault();registerAccount()};
 $("contributorForm").onsubmit=e=>{e.preventDefault();addContributor()};
 if(U&&me())openApp();else showWelcome();
});
/* BACKUP & RESTORE */

function backupData(){
  let data={
    app:"ContriPays",
    version:1,
    date:new Date().toISOString(),
    accounts:A
  };

  let blob=new Blob(
    [JSON.stringify(data,null,2)],
    {type:"application/json"}
  );

  let url=URL.createObjectURL(blob);
  let a=document.createElement("a");
  a.href=url;
  a.download="ContriPays-Backup-"+today()+".json";
  a.click();
  URL.revokeObjectURL(url);
}

function restoreData(input){
  let file=input.files[0];
  if(!file)return;

  let reader=new FileReader();

  reader.onload=function(e){
    try{
      let data=JSON.parse(e.target.result);

      if(!data.accounts||!Array.isArray(data.accounts)){
        alert("Invalid ContriPays backup.");
        return;
      }

      if(!confirm(
        "Restore this backup?\n\nYour current ContriPays data will be replaced."
      ))return;

      A=data.accounts;
      save();

      alert("Backup restored successfully.");
      location.reload();

    }catch(err){
      alert("Could not read this backup file.");
    }
  };

  reader.readAsText(file);
  input.value="";
}

function addBackupButtons(){
  let s=$("settingsScreen");
  if(!s||$("backupBox"))return;

  let box=document.createElement("div");
  box.id="backupBox";
  box.style.cssText=
    "background:white;padding:16px;border-radius:14px;margin-top:15px;box-shadow:0 2px 8px #0001";

  box.innerHTML=
    '<h3 style="margin-top:0">Data Backup</h3>'+
    '<p style="font-size:13px;color:#666">Save your ContriPays records or restore them on this phone.</p>'+
    '<button class="primary-btn" onclick="backupData()">Backup Data</button>'+
    '<input id="restoreFile" type="file" accept=".json" style="display:none" onchange="restoreData(this)">'+
    '<button class="secondary-btn" style="margin-top:8px" onclick="$(\'restoreFile\').click()">Restore Backup</button>';

  s.appendChild(box);
}

document.addEventListener("DOMContentLoaded",function(){
  setTimeout(addBackupButtons,300);
});
/* CONTRIBUTOR SEARCH */

function addContributorSearch(){
  let s=$("contributorsScreen");
  if(!s||$("contributorSearch"))return;

  let box=document.createElement("div");
  box.style.margin="12px 0";

  box.innerHTML=
    '<input id="contributorSearch" type="search" placeholder="Search contributor..." '+
    'style="width:100%;box-sizing:border-box;padding:13px;border:1px solid #ddd;border-radius:10px;font-size:15px">';

  s.insertBefore(box,s.children[1]||null);

  $("contributorSearch").oninput=function(){
    let q=this.value.toLowerCase().trim();

    s.querySelectorAll(".card,.contributor-card,.person-card,.contributor-item").forEach(function(x){
      if(x.id==="contributorSearch")return;
      x.style.display=
        !q||x.textContent.toLowerCase().includes(q)
        ?""
        :"none";
    });
  };
}

document.addEventListener("DOMContentLoaded",function(){
  setTimeout(addContributorSearch,400);
});
function editContributor(id){
  let c=con(id);
  if(!c)return;

  let name=prompt("Contributor name:",c.name);
  if(name===null)return;

  let phone=prompt("Phone number:",c.phone||"");
  if(phone===null)return;

  let daily=prompt("Daily contribution:",c.daily||50);
  if(daily===null)return;

  name=name.trim();
  daily=Number(daily);

  if(!name||!daily||daily<1){
    alert("Enter a valid name and daily amount.");
    return;
  }

  c.name=name;
  c.phone=phone.trim();
  c.daily=daily;

  save();
  renderAll();

  if(C===id){
    $("calendarContributorName").textContent=c.name;
    renderCalendar();
  }

  alert("Contributor updated successfully.");
}
function addEditButton(){
  let p=$("contributorProfileScreen");
  if(!p||$("editContributorBtn"))return;

  let b=document.createElement("button");
  b.id="editContributorBtn";
  b.className="secondary-btn";
  b.textContent="Edit Contributor";
  b.onclick=function(){editContributor(C)};

  p.appendChild(b);
}

document.addEventListener("DOMContentLoaded",function(){
  setTimeout(addEditButton,500);
});
