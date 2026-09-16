var accounts=JSON.parse(localStorage.getItem("contripay_accounts")||"[]");
var currentUser=localStorage.getItem("contripay_current_user");
var selectedContributorId=null;
var calendarDate=new Date();

function $(id){return document.getElementById(id)}

function saveAccounts(){
 localStorage.setItem("contripay_accounts",JSON.stringify(accounts));
}

function getUser(){
 return accounts.find(function(u){
  return String(u.id)===String(currentUser);
 });
}

function money(n){
 return "₦"+Number(n||0).toLocaleString();
}

function today(){
 var d=new Date();
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function hideAll(){
 document.querySelectorAll(".app-page").forEach(function(p){
  p.style.display="none";
 });
}

function showWelcome(){
 hideAll();
 if($("mainScreen"))$("mainScreen").style.display="none";
 if($("welcomeScreen"))$("welcomeScreen").style.display="block";
}

function openLogin(){
 hideAll();
 if($("mainScreen"))$("mainScreen").style.display="none";
 if($("loginScreen"))$("loginScreen").style.display="block";
}

function openRegister(){
 hideAll();
 if($("mainScreen"))$("mainScreen").style.display="none";
 if($("registerScreen"))$("registerScreen").style.display="block";
}

function showScreen(id){
 hideAll();

 if($("mainScreen"))$("mainScreen").style.display="block";

 var p=$(id);
 if(p)p.style.display="block";

 if(id==="dashboardScreen")updateDashboard();
 if(id==="contributorsScreen")renderContributors();
 if(id==="paymentsScreen")renderPayments();
 if(id==="payoutsScreen")renderPayouts();
 if(id==="reportsScreen")renderReports();
}

function loadUser(){
 var u=getUser();
 if(!u)return;

 if($("dashboardOrganizer"))
  $("dashboardOrganizer").textContent=u.organizerName||"";

 if($("settingsOrganizerName"))
  $("settingsOrganizerName").value=u.organizerName||"";

 if($("settingsPersonalName"))
  $("settingsPersonalName").value=u.personalName||"";

 if($("settingsPhone"))
  $("settingsPhone").value=u.phone||"";
}

function openMainApp(){
 if(!getUser()){
  showWelcome();
  return;
 }

 if($("welcomeScreen"))$("welcomeScreen").style.display="none";
 if($("loginScreen"))$("loginScreen").style.display="none";
 if($("registerScreen"))$("registerScreen").style.display="none";
 if($("mainScreen"))$("mainScreen").style.display="block";

 loadUser();
 showScreen("dashboardScreen");
}

function registerAccount(){
 var name=$("registerName").value.trim();
 var organizer=$("registerOrganizer").value.trim();
 var phone=$("registerPhone").value.trim();
 var password=$("registerPassword").value;
 var confirm=$("registerConfirm").value;

 if(!name||!organizer||!phone||!password){
  alert("Please fill all fields.");
  return false;
 }

 if(password!==confirm){
  alert("Passwords do not match.");
  return false;
 }

 if(accounts.some(function(a){return a.phone===phone})){
  alert("This phone number is already registered.");
  return false;
 }

 var u={
  id:Date.now().toString(),
  personalName:name,
  organizerName:organizer,
  phone:phone,
  password:password,
  contributors:[],
  payouts:[],
  earnings:0
 };

 accounts.push(u);
 currentUser=u.id;
 localStorage.setItem("contripay_current_user",currentUser);
 saveAccounts();

 alert("Account created successfully!");
 openMainApp();
 return false;
}

function loginAccount(){
 var phone=$("loginPhone").value.trim();
 var password=$("loginPassword").value;

 var u=accounts.find(function(a){
  return a.phone===phone&&a.password===password;
 });

 if(!u){
  alert("Incorrect phone number or password.");
  return false;
 }

 currentUser=u.id;
 localStorage.setItem("contripay_current_user",currentUser);

 openMainApp();
 return false;
}

/* =========================
   CONTRIBUTORS
========================= */

function openAddContributor(){
 if($("contributorModal"))
  $("contributorModal").style.display="flex";
}

function closeContributorModal(){
 if($("contributorModal"))
  $("contributorModal").style.display="none";
}

function addContributor(){
 var u=getUser();
 if(!u)return;

 var name=$("contributorName").value.trim();
 var phone=$("contributorPhone").value.trim();
 var daily=Number($("contributorDaily").value)||50;

 if(!name){
  alert("Enter contributor name.");
  return false;
 }

 if(!u.contributors)u.contributors=[];

 u.contributors.push({
  id:Date.now().toString(),
  name:name,
  phone:phone,
  daily:daily,
  payments:[],
  payouts:[]
 });

 saveAccounts();

 $("contributorForm").reset();
 closeContributorModal();
 renderContributors();
 updateDashboard();

 alert("Contributor added successfully.");
 return false;
}

function renderContributors(){
 var u=getUser();
 var box=$("contributorsList");

 if(!box||!u)return;

 if(!u.contributors||u.contributors.length===0){
  box.innerHTML="<p>No contributors yet.</p>";
  return;
 }

 var html="";

 u.contributors.forEach(function(c){
  var balance=getBalance(c);

  html+=`
   <div class="contributor-card" onclick="openContributorProfile('${c.id}')">
    <div>
     <strong>${escapeHtml(c.name)}</strong>
     <small>${escapeHtml(c.phone||"No phone")}</small>
    </div>
    <div>
     <strong>${money(balance)}</strong>
     <small>Available</small>
    </div>
   </div>
  `;
 });

 box.innerHTML=html;
}

function escapeHtml(text){
 return String(text||"")
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&#039;");
}

function findContributor(id){
 var u=getUser();
 if(!u||!u.contributors)return null;

 return u.contributors.find(function(c){
  return String(c.id)===String(id);
 });
}

/* =========================
   BALANCE
========================= */

function getBalance(c){
 if(!c)return 0;

 var payments=c.payments||[];
 var total=0;

 /*
  First payment belongs to organizer.
  Every payment after the first becomes
  contributor's accumulated balance.
 */
 payments.forEach(function(p,index){
  if(index>0){
   total+=Number(p.amount||0);
  }
 });

 var payouts=c.payouts||[];

 payouts.forEach(function(p){
  total-=Number(p.amount||0);
 });

 return Math.max(0,total);
}

/* =========================
   CONTRIBUTOR PROFILE
========================= */

function openContributorProfile(id){
 selectedContributorId=id;

 var c=findContributor(id);
 if(!c)return;

 if($("contributorProfileScreen"))
  showScreen("contributorProfileScreen");

 var box=$("contributorProfile");
 if(!box)return;

 var balance=getBalance(c);
 var payments=c.payments||[];
 var payouts=c.payouts||[];

 var html=`
  <h2>${escapeHtml(c.name)}</h2>
  <p>${escapeHtml(c.phone||"No phone")}</p>

  <div class="profile-stat">
   <strong>${money(balance)}</strong>
   <span>Available Balance</span>
  </div>

  <div class="profile-stat">
   <strong>${payments.length}</strong>
   <span>Payments</span>
  </div>

  <div class="profile-stat">
   <strong>${payouts.length}</strong>
   <span>Payouts</span>
  </div>

  <button class="primary-btn" onclick="makeContributorPayout('${c.id}')">
   Make Payout
  </button>

  <h3>Payment History</h3>
 `;

 if(payments.length===0){
  html+="<p>No payments yet.</p>";
 }else{
  payments.slice().reverse().forEach(function(p){
   html+=`
    <div class="history-row">
     <span>${p.date||""}</span>
     <strong>${money(p.amount)}</strong>
    </div>
   `;
  });
 }

 html+="<h3>Payout History</h3>";

 if(payouts.length===0){
  html+="<p>No payouts yet.</p>";
 }else{
  payouts.slice().reverse().forEach(function(p){
   html+=`
    <div class="history-row">
     <span>${p.date||""}</span>
     <strong>- ${money(p.amount)}</strong>
    </div>
   `;
  });
 }

 box.innerHTML=html;
}

/* =========================
   PAYMENTS
========================= */

function recordPayment(contributorId,date){
 var u=getUser();
 var c=findContributor(contributorId);

 if(!u||!c)return;

 if(!date)date=today();

 if(!c.payments)c.payments=[];

 if(c.payments.some(function(p){return p.date===date})){
  alert("This contributor has already been marked paid for this day.");
  return;
 }

 var amount=Number(c.daily)||50;

 var firstPayment=c.payments.length===0;

 c.payments.push({
  id:Date.now().toString(),
  date:date,
  amount:amount
 });

 if(firstPayment){
  u.earnings=Number(u.earnings||0)+amount;
 }

 saveAccounts();

 alert("Payment recorded: "+money(amount));

 renderPayments();
 renderContributors();
 updateDashboard();

 if(selectedContributorId)
  openContributorProfile(selectedContributorId);
}

function choosePaymentContributor(){
 var u=getUser();

 if(!u||!u.contributors||u.contributors.length===0){
  alert("Add a contributor first.");
  return;
 }

 var text="Select contributor:\n\n";

 u.contributors.forEach(function(c,i){
  text+=(i+1)+". "+c.name+"\n";
 });

 var choice=prompt(text+"\nEnter the number:");

 var index=Number(choice)-1;

 if(index<0||index>=u.contributors.length)return;

 recordPayment(u.contributors[index].id,today());
}

function renderPayments(){
 var u=getUser();
 var box=$("paymentsList");

 if(!box||!u)return;

 if(!u.contributors||u.contributors.length===0){
  box.innerHTML="<p>No payment records yet.</p>";
  return;
 }

 var html="";

 u.contributors.forEach(function(c){
  var payments=c.payments||[];

  payments.slice().reverse().forEach(function(p){
   html+=`
    <div class="payment-row">
     <div>
      <strong>${escapeHtml(c.name)}</strong>
      <small>${p.date}</small>
     </div>
     <strong>${money(p.amount)}</strong>
    </div>
   `;
  });
 });

 if(!html)html="<p>No payments recorded yet.</p>";

 box.innerHTML=html;
}

/* =========================
   PAYOUT SYSTEM
========================= */

function makePayout(){
 var u=getUser();

 if(!u||!u.contributors||u.contributors.length===0){
  alert("Add a contributor first.");
  return;
 }

 var text="SELECT CONTRIBUTOR\n\n";

 u.contributors.forEach(function(c,i){
  text+=(i+1)+". "+c.name+" — Available: "+money(getBalance(c))+"\n";
 });

 var choice=prompt(text+"\nEnter contributor number:");

 if(choice===null)return;

 var index=Number(choice)-1;

 if(index<0||index>=u.contributors.length){
  alert("Invalid contributor.");
  return;
 }

 makeContributorPayout(u.contributors[index].id);
}

function makeContributorPayout(contributorId){
 var u=getUser();
 var c=findContributor(contributorId);

 if(!u||!c)return;

 var balance=getBalance(c);

 if(balance<=0){
  alert(c.name+" has no available balance.");
  return;
 }

 var amount=prompt(
  "Contributor: "+c.name+
  "\nAvailable balance: "+money(balance)+
  "\n\nEnter payout amount:"
 );

 if(amount===null)return;

 amount=Number(amount);

 if(!amount||amount<=0){
  alert("Enter a valid payout amount.");
  return;
 }

 if(amount>balance){
  alert("Payout cannot be greater than the available balance.");
  return;
 }

 if(!c.payouts)c.payouts=[];
 if(!u.payouts)u.payouts=[];

 var payout={
  id:Date.now().toString(),
  contributorId:c.id,
  contributorName:c.name,
  amount:amount,
  date:today()
 };

 c.payouts.push(payout);
 u.payouts.push(payout);

 saveAccounts();

 alert(
  "Payout successful!\n\n"+
  c.name+" received "+money(amount)+
  "\nRemaining balance: "+money(getBalance(c))
 );

 renderPayouts();
 renderContributors();
 updateDashboard();

 if(selectedContributorId)
  openContributorProfile(selectedContributorId);
}

function renderPayouts(){
 var u=getUser();
 var box=$("payoutsList");

 if(!box||!u)return;

 var payouts=u.payouts||[];

 var pending=0;
 var completed=0;

 payouts.forEach(function(p){
  completed+=Number(p.amount||0);
 });

 if($("payoutCompletedTotal"))
  $("payoutCompletedTotal").textContent=money(completed);

 if(!payouts.length){
  box.innerHTML="<p>No payouts yet.</p>";
  return;
 }

 var html="";

 payouts.slice().reverse().forEach(function(p){
  html+=`
   <div class="payout-row">
    <div>
     <strong>${escapeHtml(p.contributorName)}</strong>
     <small>${p.date}</small>
    </div>
    <strong>${money(p.amount)}</strong>
   </div>
  `;
 });

 box.innerHTML=html;

 u.contributors.forEach(function(c){
  pending+=getBalance(c);
 });

 if($("payoutPendingTotal"))
  $("payoutPendingTotal").textContent=money(pending);
}

/* =========================
   DASHBOARD
========================= */

function updateDashboard(){
 var u=getUser();
 if(!u)return;

 var contributors=u.contributors||[];
 var total=0;
 var month=0;
 var balances=0;
 var active=0;
 var todayKey=today();

 contributors.forEach(function(c){
  var payments=c.payments||[];

  if(payments.length>0)active++;

  payments.forEach(function(p){
   total+=Number(p.amount||0);

   if(String(p.date).slice(0,7)===todayKey.slice(0,7))
    month+=Number(p.amount||0);
  });

  balances+=getBalance(c);
 });

 if($("dashboardOrganizer"))
  $("dashboardOrganizer").textContent=u.organizerName||"";

 if($("todayTotal")){
  var todayTotal=0;

  contributors.forEach(function(c){
   (c.payments||[]).forEach(function(p){
    if(p.date===todayKey)todayTotal+=Number(p.amount||0);
   });
  });

  $("todayTotal").textContent=money(todayTotal);
 }

 if($("monthlyTotal"))
  $("monthlyTotal").textContent=money(month);

 if($("totalContributors"))
  $("totalContributors").textContent=contributors.length;

 if($("activeContributors"))
  $("activeContributors").textContent=active;

 if($("pendingPayouts"))
  $("pendingPayouts").textContent=money(balances);

 if($("organizerEarnings"))
  $("organizerEarnings").textContent=money(u.earnings||0);
}

/* =========================
   REPORTS
========================= */

function renderReports(){
 var u=getUser();
 if(!u)return;

 var total=0;
 var payouts=0;
 var balances=0;

 (u.contributors||[]).forEach(function(c){
  (c.payments||[]).forEach(function(p){
   total+=Number(p.amount||0);
  });

  balances+=getBalance(c);
 });

 (u.payouts||[]).forEach(function(p){
  payouts+=Number(p.amount||0);
 });

 var box=$("reportsScreen");

 if(box){
  var items=box.querySelectorAll(".report-value");

  if(items.length>=4){
   items[0].textContent=money(total);
   items[1].textContent=money(u.earnings||0);
   items[2].textContent=money(payouts);
   items[3].textContent=money(balances);
  }
 }
}

/* =========================
   SETTINGS
========================= */

function saveSettings(){
 var u=getUser();
 if(!u)return;

 if($("settingsOrganizerName"))
  u.organizerName=$("settingsOrganizerName").value.trim();

 if($("settingsPersonalName"))
  u.personalName=$("settingsPersonalName").value.trim();

 if($("settingsPhone"))
  u.phone=$("settingsPhone").value.trim();

 saveAccounts();
 loadUser();

 alert("Settings saved.");
}

function logout(){
 localStorage.removeItem("contripay_current_user");
 currentUser=null;
 showWelcome();
}

/* =========================
   SIMPLE NAVIGATION
========================= */

function goDashboard(){
 showScreen("dashboardScreen");
}

function goContributors(){
 showScreen("contributorsScreen");
}

function goPayments(){
 showScreen("paymentsScreen");
}

function goPayouts(){
 showScreen("payoutsScreen");
}

function goReports(){
 showScreen("reportsScreen");
}

/* =========================
   STARTUP
========================= */

document.addEventListener("DOMContentLoaded",function(){

 var loginForm=$("loginForm");
 if(loginForm){
  loginForm.addEventListener("submit",function(e){
   e.preventDefault();
   loginAccount();
  });
 }

 var registerForm=$("registerForm");
 if(registerForm){
  registerForm.addEventListener("submit",function(e){
   e.preventDefault();
   registerAccount();
  });
 }

 var contributorForm=$("contributorForm");
 if(contributorForm){
  contributorForm.addEventListener("submit",function(e){
   e.preventDefault();
   addContributor();
  });
 }

 if(currentUser&&getUser()){
  openMainApp();
 }else{
  showWelcome();
 }

});
/* =========================
   CALENDAR RESTORATION
========================= */

var calendarPaymentDate=null;

function openCalendar(contributorId){
    selectedContributorId=contributorId;

    var c=findContributor(contributorId);
    if(!c)return;

    calendarDate=new Date();

    showScreen("calendarScreen");
    renderCalendar();
}

function backToContributorProfile(){
    if(selectedContributorId){
        openContributorProfile(selectedContributorId);
    }else{
        showScreen("contributorsScreen");
    }
}

function previousMonth(){
    calendarDate.setMonth(calendarDate.getMonth()-1);
    renderCalendar();
}

function nextMonth(){
    calendarDate.setMonth(calendarDate.getMonth()+1);
    renderCalendar();
}

function renderCalendar(){
    var c=findContributor(selectedContributorId);

    if(!c)return;

    var year=calendarDate.getFullYear();
    var month=calendarDate.getMonth();

    if($("calendarContributorName"))
        $("calendarContributorName").textContent=c.name;

    if($("calendarMonth")){
        $("calendarMonth").textContent=
            new Date(year,month,1).toLocaleDateString("en-US",{
                month:"long",
                year:"numeric"
            });
    }

    var daily=Number(c.daily)||50;

    if($("calendarDailyAmount"))
        $("calendarDailyAmount").textContent=money(daily);

    var payments=c.payments||[];

    var paidDays=payments.length;
    var totalPaid=0;

    payments.forEach(function(p){
        totalPaid+=Number(p.amount||0);
    });

    if($("calendarPaidDays"))
        $("calendarPaidDays").textContent=paidDays+" days";

    if($("calendarTotalAmount"))
        $("calendarTotalAmount").textContent=money(totalPaid);

    var box=$("calendarDays");

    if(!box)return;

    var firstDay=new Date(year,month,1).getDay();
    var daysInMonth=new Date(year,month+1,0).getDate();

    var todayKeyValue=today();

    var html="";

    /* Empty spaces before first day */
    for(var i=0;i<firstDay;i++){
        html+='<div class="calendar-day empty"></div>';
    }

    for(var day=1;day<=daysInMonth;day++){

        var dateKey=
            year+"-"+
            String(month+1).padStart(2,"0")+"-"+
            String(day).padStart(2,"0");

        var paid=payments.some(function(p){
            return p.date===dateKey;
        });

        var isToday=dateKey===todayKeyValue;

        var classes="calendar-day";

        if(paid)classes+=" paid";
        else if(isToday)classes+=" today";
        else classes+=" unpaid";

        html+=`
            <button
                class="${classes}"
                onclick="openPaymentForDate('${dateKey}')"
            >
                <span>${day}</span>
                ${paid ? '<small>✓</small>' : ''}
            </button>
        `;
    }

    box.innerHTML=html;

    updateCalendarAction();
}

function openPaymentForDate(dateKey){

    var c=findContributor(selectedContributorId);

    if(!c)return;

    var alreadyPaid=(c.payments||[]).some(function(p){
        return p.date===dateKey;
    });

    if(alreadyPaid){
        alert("This day has already been marked as paid.");
        return;
    }

    calendarPaymentDate=dateKey;

    var amount=Number(c.daily)||50;

    if($("paymentModalTitle"))
        $("paymentModalTitle").textContent="Mark Payment";

    if($("paymentModalText"))
        $("paymentModalText").textContent=
            "Record contribution for "+formatCalendarDate(dateKey)+".";

    if($("paymentModalAmount"))
        $("paymentModalAmount").textContent=money(amount);

    if($("paymentModal"))
        $("paymentModal").style.display="flex";

    var button=$("confirmPaymentBtn");

    if(button){
        button.onclick=function(){
            confirmCalendarPayment();
        };
    }
}

function confirmCalendarPayment(){

    var c=findContributor(selectedContributorId);

    if(!c||!calendarPaymentDate)return;

    if(!c.payments)c.payments=[];

    var alreadyPaid=c.payments.some(function(p){
        return p.date===calendarPaymentDate;
    });

    if(alreadyPaid){
        closePaymentModal();
        alert("This day has already been marked as paid.");
        return;
    }

    var u=getUser();

    var amount=Number(c.daily)||50;

    var firstPayment=c.payments.length===0;

c.payments.push({
 id:Date.now().toString(),
 date:calendarPaymentDate,
 amount:amount
});

if(firstPayment){
 u.earnings=Number(u.earnings||0)+amount;
}

saveAccounts();

closePaymentModal();

alert("Payment recorded: "+money(amount));

renderCalendar();
renderPayments();
renderContributors();
renderPayouts();
updateDashboard();

if(selectedContributorId){
 openContributorProfile(selectedContributorId);
}
}

function closePaymentModal(){
 if($("paymentModal"))
  $("paymentModal").style.display="none";

 calendarPaymentDate=null;
}

function formatCalendarDate(dateKey){
 var parts=dateKey.split("-");

 var d=new Date(
  Number(parts[0]),
  Number(parts[1])-1,
  Number(parts[2])
 );

 return d.toLocaleDateString("en-US",{
  weekday:"long",
  month:"long",
  day:"numeric",
  year:"numeric"
 });
}

function updateCalendarAction(){

 var c=findContributor(selectedContributorId);
 var action=$("calendarAction");

 if(!c||!action)return;

 var paidToday=(c.payments||[]).some(function(p){
  return p.date===today();
 });

 if(paidToday){

  action.textContent=
   "Today's payment has been recorded.";

  action.disabled=true;

 }else{

  action.textContent=
   "Mark Today's Payment";

  action.disabled=false;

  action.onclick=function(){
   openPaymentForDate(today());
  };
 }
}
