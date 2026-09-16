var accounts=JSON.parse(localStorage.getItem("contripays_accounts")||"[]");
var currentUser=localStorage.getItem("contripays_current_user");
var selectedContributorId=null;
var calendarDate=new Date();
var calendarPaymentDate=null;
var paymentFilter="all";

function $(id){return document.getElementById(id)}

function save(){
 localStorage.setItem("contripays_accounts",JSON.stringify(accounts));
}

function user(){
 return accounts.find(function(x){
  return String(x.id)===String(currentUser);
 });
}

function money(n){
 return "₦"+Number(n||0).toLocaleString();
}

function today(){
 var d=new Date();
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function escapeHtml(s){
 return String(s||"").replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c];
 });
}

function hideAll(){
 document.querySelectorAll(".screen").forEach(function(x){
  x.style.display="none";
 });
}

function showWelcome(){
 hideAll();
 $("welcomeScreen").style.display="block";
}

function openLogin(){
 hideAll();
 $("loginScreen").style.display="block";
}

function openRegister(){
 hideAll();
 $("registerScreen").style.display="block";
}

function showScreen(id){
 hideAll();
 var x=$(id);
 if(x)x.style.display="block";
}

function getUser(){
 return user();
}

function loadUser(){
 accounts=JSON.parse(localStorage.getItem("contripays_accounts")||"[]");
 currentUser=localStorage.getItem("contripays_current_user");
}

function openMainApp(){
 loadUser();
 hideAll();
 $("mainScreen").style.display="block";
 showScreen("dashboardScreen");
 updateDashboard();
 renderContributors();
 renderPayments();
 renderPayouts();
 renderReports();
}

function registerAccount(){
 var name=$("registerName").value.trim();
 var organizer=$("registerOrganizer").value.trim();
 var phone=$("registerPhone").value.trim();
 var password=$("registerPassword").value;
 var confirm=$("registerConfirm").value;

 if(!name||!organizer||!phone||!password){
  alert("Please fill all fields.");
  return;
 }

 if(password!==confirm){
  alert("Passwords do not match.");
  return;
 }

 if(accounts.some(function(x){return x.phone===phone;})){
  alert("An account with this phone already exists.");
  return;
 }

 var a={
  id:Date.now(),
  name:name,
  organizer:organizer,
  phone:phone,
  password:password,
  contributors:[],
  payouts:[]
 };

 accounts.push(a);
 save();

 currentUser=a.id;
 localStorage.setItem("contripays_current_user",currentUser);

 openMainApp();
}

function loginAccount(){
 var phone=$("loginPhone").value.trim();
 var password=$("loginPassword").value;

 var a=accounts.find(function(x){
  return x.phone===phone&&x.password===password;
 });

 if(!a){
  alert("Invalid phone number or password.");
  return;
 }

 currentUser=a.id;
 localStorage.setItem("contripays_current_user",currentUser);
 openMainApp();
}

function logoutAccount(){
 localStorage.removeItem("contripays_current_user");
 currentUser=null;
 showWelcome();
}

function openAddContributor(){
 var m=$("contributorModal");
 if(m)m.style.display="flex";
}

function closeContributorModal(){
 var m=$("contributorModal");
 if(m)m.style.display="none";
}

function closeAddContributor(){
 closeContributorModal();
}

function addContributor(){
 var u=user();
 if(!u)return;

 var name=$("contributorName").value.trim();
 var phone=$("contributorPhone").value.trim();
 var daily=Number($("contributorDaily").value)||50;

 if(!name||!phone){
  alert("Enter contributor name and phone.");
  return;
 }

 if(!u.contributors)u.contributors=[];

 u.contributors.push({
  id:Date.now(),
  name:name,
  phone:phone,
  daily:daily,
  payments:[],
  payouts:[]
 });

 save();
 closeContributorModal();

 $("contributorForm").reset();

 renderContributors();
 updateDashboard();

 alert("Contributor added successfully.");
}

function findContributor(id){
 var u=user();
 if(!u||!u.contributors)return null;

 return u.contributors.find(function(c){
  return String(c.id)===String(id);
 });
}

function getBalance(c){
 if(!c)return 0;

 var total=0;

 (c.payments||[]).forEach(function(p,i){
  if(i>0)total+=Number(p.amount)||0;
 });

 (c.payouts||[]).forEach(function(p){
  total-=Number(p.amount)||0;
 });

 return Math.max(0,total);
}
function renderContributors(){
 var u=user();
 var box=$("contributorsList");
 if(!box||!u)return;

 var list=u.contributors||[];

 if(!list.length){
  box.innerHTML="<p>No contributors yet.</p>";
  return;
 }

 box.innerHTML=list.map(function(c){
  return '<div class="contributor-card" onclick="openContributorProfile('+c.id+')">'+
   '<div><strong>'+escapeHtml(c.name)+'</strong><br><small>'+escapeHtml(c.phone)+'</small></div>'+
   '<div><strong>'+money(getBalance(c))+'</strong><br><small>Balance</small></div>'+
  '</div>';
 }).join("");
}

function filterContributors(){
 var q=($("contributorSearch").value||"").toLowerCase();
 document.querySelectorAll(".contributor-card").forEach(function(card){
  card.style.display=card.innerText.toLowerCase().includes(q)?"flex":"none";
 });
}

function openContributorProfile(id){
 selectedContributorId=id;
 var c=findContributor(id);
 var box=$("contributorProfile");

 if(!c||!box)return;

 var payments=c.payments||[];
 var paid=payments.reduce(function(s,p){
  return s+(Number(p.amount)||0);
 },0);

 box.innerHTML=
 '<div class="profile-card">'+
 '<h2>'+escapeHtml(c.name)+'</h2>'+
 '<p>'+escapeHtml(c.phone)+'</p>'+
 '<p>Daily contribution: <strong>'+money(c.daily)+'</strong></p>'+
 '<p>Total paid: <strong>'+money(paid)+'</strong></p>'+
 '<p>Current balance: <strong>'+money(getBalance(c))+'</strong></p>'+
 '<button class="primary-btn" onclick="openCalendar('+c.id+')">Open Calendar</button>'+
 '<button class="primary-btn" onclick="makeContributorPayout('+c.id+')">Pay Out</button>'+
 '</div>';

 showScreen("contributorProfileScreen");
}

function recordPayment(c,date){
 if(!c)return;

 if(!c.payments)c.payments=[];

 if(c.payments.some(function(p){return p.date===date;})){
  return false;
 }

 c.payments.push({
  date:date,
  amount:Number(c.daily)||50
 });

 save();
 return true;
}

function choosePaymentContributor(){
 var u=user();
 if(!u||!u.contributors||!u.contributors.length){
  alert("Add a contributor first.");
  return;
 }

 var names=u.contributors.map(function(c,i){
  return (i+1)+". "+c.name;
 }).join("\n");

 var choice=prompt("Choose contributor:\n\n"+names);

 if(!choice)return;

 var index=Number(choice)-1;
 var c=u.contributors[index];

 if(!c){
  alert("Invalid choice.");
  return;
 }

 if(recordPayment(c,today())){
  renderPayments();
  updateDashboard();
  alert("Payment recorded.");
 }else{
  alert("Payment already recorded for today.");
 }
}

function renderPayments(){
 var u=user();
 var box=$("paymentsList");
 if(!box||!u)return;

 var rows=[];

 (u.contributors||[]).forEach(function(c){
  (c.payments||[]).forEach(function(p){
   rows.push({
    name:c.name,
    date:p.date,
    amount:p.amount
   });
  });
 });

 if(paymentFilter!=="all"){
  rows=rows.filter(function(p){
   if(paymentFilter==="today")return p.date===today();
   return true;
  });
 }

 rows.sort(function(a,b){
  return b.date.localeCompare(a.date);
 });

 if(!rows.length){
  box.innerHTML="<p>No payments found.</p>";
  return;
 }

 box.innerHTML=rows.map(function(p){
  return '<div class="payment-row">'+
   '<div><strong>'+escapeHtml(p.name)+'</strong><br><small>'+p.date+'</small></div>'+
   '<strong>'+money(p.amount)+'</strong>'+
  '</div>';
 }).join("");
}

function setPaymentFilter(filter){
 paymentFilter=filter;
 renderPayments();
}

function makeContributorPayout(id){
 var c=findContributor(id);
 if(!c)return;

 var balance=getBalance(c);

 if(balance<=0){
  alert("This contributor has no available balance.");
  return;
 }

 var amount=prompt(
  "Available balance: "+money(balance)+"\n\nEnter payout amount:"
 );

 if(amount===null)return;

 amount=Number(amount);

 if(!amount||amount<=0){
  alert("Enter a valid amount.");
  return;
 }

 if(amount>balance){
  alert("Payout cannot be greater than the balance.");
  return;
 }

 if(!c.payouts)c.payouts=[];

 c.payouts.push({
  id:Date.now(),
  date:today(),
  amount:amount,
  contributorId:c.id
 });

 save();

 renderPayouts();
 renderContributors();
 updateDashboard();

 alert("Payout recorded successfully.");
}

function makePayout(){
 if(selectedContributorId){
  makeContributorPayout(selectedContributorId);
 }else{
  alert("Open a contributor profile first.");
 }
}

function renderPayouts(){
 var u=user();
 var box=$("payoutsList");

 if(!box||!u)return;

 var rows=[];

 (u.contributors||[]).forEach(function(c){
  (c.payouts||[]).forEach(function(p){
   rows.push({
    name:c.name,
    date:p.date,
    amount:p.amount
   });
  });
 });

 var pending=0;

 (u.contributors||[]).forEach(function(c){
  pending+=getBalance(c);
 });

 var completed=rows.reduce(function(s,p){
  return s+(Number(p.amount)||0);
 },0);

 if($("payoutPendingTotal"))$("payoutPendingTotal").textContent=money(pending);
 if($("payoutCompletedTotal"))$("payoutCompletedTotal").textContent=money(completed);

 if(!rows.length){
  box.innerHTML="<p>No payouts recorded.</p>";
  return;
 }

 rows.sort(function(a,b){
  return b.date.localeCompare(a.date);
 });

 box.innerHTML=rows.map(function(p){
  return '<div class="payment-row">'+
   '<div><strong>'+escapeHtml(p.name)+'</strong><br><small>'+p.date+'</small></div>'+
   '<strong>'+money(p.amount)+'</strong>'+
  '</div>';
 }).join("");
 function openCalendar(id){
 selectedContributorId=id;
 var c=findContributor(id);

 if(!c)return;

 if($("calendarContributorName"))
  $("calendarContributorName").textContent=c.name;

 renderCalendar();
 showScreen("calendarScreen");
}

function backToContributorProfile(){
 openContributorProfile(selectedContributorId);
}

function previousMonth(){
 calendarDate.setMonth(calendarDate.getMonth()-1);
 renderCalendar();
}

function nextMonth(){
 calendarDate.setMonth(calendarDate.getMonth()+1);
 renderCalendar();
}

function formatCalendarDate(d){
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function renderCalendar(){
 var c=findContributor(selectedContributorId);
 if(!c)return;

 var year=calendarDate.getFullYear();
 var month=calendarDate.getMonth();

 var title=calendarDate.toLocaleString("default",{
  month:"long",
  year:"numeric"
 });

 if($("calendarMonth"))$("calendarMonth").textContent=title;
 if($("calendarDailyAmount"))$("calendarDailyAmount").textContent=money(c.daily);

 var first=new Date(year,month,1);
 var last=new Date(year,month+1,0);

 var paid=0;
 var total=0;

 var days="";

 for(var i=1;i<=last.getDate();i++){
  var d=new Date(year,month,i);
  var date=formatCalendarDate(d);

  var payment=(c.payments||[]).find(function(p){
   return p.date===date;
  });

  if(payment){
   paid++;
   total+=Number(payment.amount)||0;
  }

  days+=
   '<button class="calendar-day '+(payment?"paid":"")+'" '+
   'onclick="openPaymentForDate(\''+date+'\')">'+
   '<span>'+i+'</span>'+
   (payment?'<small>Paid</small>':'')+
   '</button>';
 }

 if($("calendarDays"))$("calendarDays").innerHTML=days;
 if($("calendarPaidDays"))$("calendarPaidDays").textContent=paid;
 if($("calendarTotalAmount"))$("calendarTotalAmount").textContent=money(total);

 updateCalendarAction();
}

function updateCalendarAction(){
 var c=findContributor(selectedContributorId);
 if(!c)return;

 if($("calendarAction")){
  $("calendarAction").textContent=
   "Mark payment for "+c.name;
 }
}

function openPaymentForDate(date){
 var c=findContributor(selectedContributorId);
 if(!c)return;

 calendarPaymentDate=date;

 var paid=(c.payments||[]).some(function(p){
  return p.date===date;
 });

 if($("paymentModalTitle"))
  $("paymentModalTitle").textContent=paid?"Payment Recorded":"Mark Payment";

 if($("paymentModalText"))
  $("paymentModalText").textContent=
   paid?"This day is already paid.":"Record this day's contribution.";

 if($("paymentModalAmount"))
  $("paymentModalAmount").textContent=money(c.daily);

 var btn=$("confirmPaymentBtn");

 if(btn){
  btn.disabled=paid;
  btn.textContent=paid?"Already Paid":"Mark as Paid";
  btn.onclick=confirmCalendarPayment;
 }

 var modal=$("paymentModal");
 if(modal)modal.style.display="flex";
}

function confirmCalendarPayment(){
 var c=findContributor(selectedContributorId);

 if(!c||!calendarPaymentDate)return;

 if(recordPayment(c,calendarPaymentDate)){
  closePaymentModal();
  renderCalendar();
  renderPayments();
  renderContributors();
  updateDashboard();
 }else{
  closePaymentModal();
  alert("This day has already been marked as paid.");
 }
}

function closePaymentModal(){
 var modal=$("paymentModal");
 if(modal)modal.style.display="none";

 calendarPaymentDate=null;
}

function calculateFinancials(){
 var u=user();

 var received=0;
 var earnings=0;
 var disbursed=0;

 if(!u)return{
  received:0,
  earnings:0,
  disbursed:0,
  outstanding:0
 };

 (u.contributors||[]).forEach(function(c){
  var payments=c.payments||[];

  payments.forEach(function(p,i){
   var amount=Number(p.amount)||0;
   received+=amount;

   if(i===0)earnings+=amount;
  });

  (c.payouts||[]).forEach(function(p){
   disbursed+=Number(p.amount)||0;
  });
 });

 return{
  received:received,
  earnings:earnings,
  disbursed:disbursed,
  outstanding:received-earnings-disbursed
 };
}

function renderRecentActivity(){
 var u=user();
 var box=$("recentActivity");

 if(!box||!u)return;

 var rows=[];

 (u.contributors||[]).forEach(function(c){
  (c.payments||[]).forEach(function(p){
   rows.push({
    text:c.name+" paid "+money(p.amount),
    date:p.date
   });
  });
 });

 rows.sort(function(a,b){
  return b.date.localeCompare(a.date);
 });

 rows=rows.slice(0,5);

 if(!rows.length){
  box.innerHTML="<p>No recent activity.</p>";
  return;
 }

 box.innerHTML=rows.map(function(r){
  return "<div class=\"activity-row\">"+
   "<strong>"+escapeHtml(r.text)+"</strong><br>"+
   "<small>"+r.date+"</small>"+
  "</div>";
 }).join("");
}

function updateDashboard(){
 var u=user();
 if(!u)return;

 var f=calculateFinancials();
 var contributors=u.contributors||[];

 var active=contributors.filter(function(c){
  return (c.payments||[]).length>0;
 }).length;

 var month=new Date().toISOString().slice(0,7);
 var monthly=0;

 contributors.forEach(function(c){
  (c.payments||[]).forEach(function(p){
   if(p.date.indexOf(month)===0)
    monthly+=Number(p.amount)||0;
  });
 });

 if($("dashboardOrganizer"))
  $("dashboardOrganizer").textContent=u.organizer||u.name;

 if($("todayTotal"))
  $("todayTotal").textContent=money(
   contributors.reduce(function(s,c){
    return s+(c.payments||[]).some(function(p){
     return p.date===today();
    })?(Number(c.daily)||50):0;
   },0)
  );

 if($("monthlyTotal"))$("monthlyTotal").textContent=money(monthly);
 if($("totalContributors"))$("totalContributors").textContent=contributors.length;
 if($("activeContributors"))$("activeContributors").textContent=active;
 if($("pendingPayouts"))$("pendingPayouts").textContent=money(
  contributors.reduce(function(s,c){return s+getBalance(c)},0)
 );
 if($("organizerEarnings"))$("organizerEarnings").textContent=money(f.earnings);

 renderRecentActivity();
 renderReports();
}
                    }
