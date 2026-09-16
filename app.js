var accounts=JSON.parse(localStorage.getItem("contripay_accounts")||"[]");
var currentUser=localStorage.getItem("contripay_current_user");
var selectedContributorId=null;
var calendarDate=new Date();
var calendarPaymentDate=null;
var paymentFilter="all";

function $(id){
 return document.getElementById(id);
}

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
 return d.getFullYear()+"-"+
  String(d.getMonth()+1).padStart(2,"0")+"-"+
  String(d.getDate()).padStart(2,"0");
}

function escapeHtml(t){
 return String(t||"")
 .replace(/&/g,"&amp;")
 .replace(/</g,"&lt;")
 .replace(/>/g,"&gt;")
 .replace(/"/g,"&quot;")
 .replace(/'/g,"&#039;");
}

/* SCREEN NAVIGATION */

function hideAll(){
 document.querySelectorAll(".app-page").forEach(function(p){
  p.style.display="none";
 });
}

function showWelcome(){
 hideAll();

 if($("mainScreen"))
  $("mainScreen").style.display="none";

 if($("welcomeScreen"))
  $("welcomeScreen").style.display="block";
}

function openLogin(){
 hideAll();

 if($("mainScreen"))
  $("mainScreen").style.display="none";

 if($("loginScreen"))
  $("loginScreen").style.display="block";
}

function openRegister(){
 hideAll();

 if($("mainScreen"))
  $("mainScreen").style.display="none";

 if($("registerScreen"))
  $("registerScreen").style.display="block";
}

function showScreen(id){
 hideAll();

 if($("mainScreen"))
  $("mainScreen").style.display="block";

 var page=$(id);

 if(page)
  page.style.display="block";

 if(id==="dashboardScreen")
  updateDashboard();

 if(id==="contributorsScreen")
  renderContributors();

 if(id==="paymentsScreen")
  renderPayments();

 if(id==="payoutsScreen")
  renderPayouts();

 if(id==="reportsScreen")
  renderReports();

 if(id==="calendarScreen")
  renderCalendar();

 if(id==="settingsScreen")
  loadUser();
}

/* ACCOUNT */

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

 if($("settingsNameText"))
  $("settingsNameText").textContent=u.personalName||"";

 var initial=(u.personalName||"U").charAt(0).toUpperCase();

 if($("profileInitial"))
  $("profileInitial").textContent=initial;

 if($("settingsInitial"))
  $("settingsInitial").textContent=initial;
}

function openMainApp(){
 var u=getUser();

 if(!u){
  showWelcome();
  return;
 }

 if($("welcomeScreen"))
  $("welcomeScreen").style.display="none";

 if($("loginScreen"))
  $("loginScreen").style.display="none";

 if($("registerScreen"))
  $("registerScreen").style.display="none";

 if($("mainScreen"))
  $("mainScreen").style.display="block";

 loadUser();
 showScreen("dashboardScreen");
}

function registerAccount(){
 var name=$("registerName")?
  $("registerName").value.trim():"";

 var organizer=$("registerOrganizer")?
  $("registerOrganizer").value.trim():"";

 var phone=$("registerPhone")?
  $("registerPhone").value.trim():"";

 var password=$("registerPassword")?
  $("registerPassword").value:"";

 var confirm=$("registerConfirm")?
  $("registerConfirm").value:"";

 if(!name||!organizer||!phone||!password){
  alert("Please fill all fields.");
  return false;
 }

 if(password!==confirm){
  alert("Passwords do not match.");
  return false;
 }

 if(accounts.some(function(a){
  return a.phone===phone;
 })){
  alert("This phone number is already registered.");
  return false;
 }

 var user={
  id:Date.now().toString(),
  personalName:name,
  organizerName:organizer,
  phone:phone,
  password:password,
  contributors:[],
  payouts:[],
  earnings:0
 };

 accounts.push(user);

 currentUser=user.id;

 localStorage.setItem(
  "contripay_current_user",
  currentUser
 );

 saveAccounts();

 alert("Account created successfully!");

 openMainApp();

 return false;
}

function loginAccount(){
 var phone=$("loginPhone")?
  $("loginPhone").value.trim():"";

 var password=$("loginPassword")?
  $("loginPassword").value:"";

 var user=accounts.find(function(a){
  return a.phone===phone &&
         a.password===password;
 });

 if(!user){
  alert("Incorrect phone number or password.");
  return false;
 }

 currentUser=user.id;

 localStorage.setItem(
  "contripay_current_user",
  currentUser
 );

 openMainApp();

 return false;
}

function logoutAccount(){
 currentUser=null;

 localStorage.removeItem(
  "contripay_current_user"
 );

 showWelcome();
}
function openAddContributor(){
 if($("contributorModal"))
  $("contributorModal").style.display="flex";
}

function closeContributorModal(){
 if($("contributorModal"))
  $("contributorModal").style.display="none";
}

function closeAddContributor(){
 closeContributorModal();
}

function addContributor(){
 var u=getUser();

 if(!u)return false;

 var name=$("contributorName")?
  $("contributorName").value.trim():"";

 var phone=$("contributorPhone")?
  $("contributorPhone").value.trim():"";

 var daily=$("contributorDaily")?
  Number($("contributorDaily").value):50;

 if(!daily)daily=50;

 if(!name){
  alert("Enter contributor name.");
  return false;
 }

 if(!u.contributors)
  u.contributors=[];

 u.contributors.push({
  id:Date.now().toString(),
  name:name,
  phone:phone,
  daily:daily,
  payments:[],
  payouts:[]
 });

 saveAccounts();

 if($("contributorForm"))
  $("contributorForm").reset();

 closeContributorModal();

 renderContributors();
 updateDashboard();

 alert("Contributor added successfully.");

 return false;
}

function findContributor(id){
 var u=getUser();

 if(!u||!u.contributors)
  return null;

 return u.contributors.find(function(c){
  return String(c.id)===String(id);
 });
}

function getBalance(c){
 if(!c)return 0;

 var total=0;

 (c.payments||[]).forEach(function(p,index){
  if(index>0)
   total+=Number(p.amount||0);
 });

 (c.payouts||[]).forEach(function(p){
  total-=Number(p.amount||0);
 });

 return Math.max(0,total);
}

function renderContributors(){
 var u=getUser();
 var box=$("contributorsList");

 if(!box||!u)return;

 var list=u.contributors||[];

 if(list.length===0){
  box.innerHTML="<p>No contributors yet.</p>";
  return;
 }

 var html="";

 list.forEach(function(c){

  html+=
   '<div class="contributor-card" '+
   'onclick="openContributorProfile(\''+c.id+'\')">'+

   '<div>'+
   '<strong>'+escapeHtml(c.name)+'</strong>'+
   '<small>'+escapeHtml(c.phone||"No phone")+
   '</small>'+
   '</div>'+

   '<div>'+
   '<strong>'+money(getBalance(c))+'</strong>'+
   '<small>Available</small>'+
   '</div>'+

   '</div>';

 });

 box.innerHTML=html;
}

function filterContributors(){
 var search=$("contributorSearch");

 if(!search)return;

 var q=search.value.toLowerCase();

 document.querySelectorAll(
  ".contributor-card"
 ).forEach(function(card){

  card.style.display=
   card.textContent.toLowerCase().indexOf(q)>=0
   ?""
   :"none";

 });
}

/* CONTRIBUTOR PROFILE */

function openContributorProfile(id){

 selectedContributorId=id;

 var c=findContributor(id);

 if(!c)return;

 showScreen("contributorProfileScreen");

 var box=$("contributorProfile");

 if(!box)return;

 var payments=c.payments||[];
 var payouts=c.payouts||[];

 var html=
  "<h2>"+escapeHtml(c.name)+"</h2>"+
  "<p>"+escapeHtml(c.phone||"No phone")+"</p>"+

  '<div class="profile-stat">'+
  "<strong>"+money(getBalance(c))+"</strong>"+
  "<span>Available Balance</span>"+
  "</div>"+

  '<div class="profile-stat">'+
  "<strong>"+payments.length+"</strong>"+
  "<span>Payments</span>"+
  "</div>"+

  '<div class="profile-stat">'+
  "<strong>"+payouts.length+"</strong>"+
  "<span>Payouts</span>"+
  "</div>"+

  '<button class="primary-btn" '+
  'onclick="openCalendar(\''+c.id+'\')">'+
  "📅 Open Payment Calendar"+
  "</button>"+

  '<button class="primary-btn" '+
  'onclick="makeContributorPayout(\''+c.id+'\')">'+
  "Make Payout"+
  "</button>"+

  "<h3>Payment History</h3>";

 if(payments.length===0){

  html+="<p>No payments yet.</p>";

 }else{

  payments.slice().reverse().forEach(function(p){

   html+=
    '<div class="history-row">'+
    "<span>"+escapeHtml(p.date||"")+"</span>"+
    "<strong>"+money(p.amount)+"</strong>"+
    "</div>";

  });

 }

 html+="<h3>Payout History</h3>";

 if(payouts.length===0){

  html+="<p>No payouts yet.</p>";

 }else{

  payouts.slice().reverse().forEach(function(p){

   html+=
    '<div class="history-row">'+
    "<span>"+escapeHtml(p.date||"")+"</span>"+
    "<strong>- "+money(p.amount)+"</strong>"+
    "</div>";

  });

 }

 box.innerHTML=html;
}

function recordPayment(id,date){

 var u=getUser();
 var c=findContributor(id);

 if(!u||!c)return;

 date=date||today();

 if(!c.payments)
  c.payments=[];

 if(c.payments.some(function(p){
  return p.date===date;
 })){
  alert("This contributor has already been marked paid for this day.");
  return;
 }

 var amount=Number(c.daily)||50;

 var firstPayment=
  c.payments.length===0;

 c.payments.push({
  id:Date.now().toString(),
  date:date,
  amount:amount
 });

 if(firstPayment)
  u.earnings=
   Number(u.earnings||0)+amount;

 saveAccounts();

 alert("Payment recorded: "+money(amount));

 renderPayments();
 renderContributors();
 renderPayouts();
 updateDashboard();

 if(selectedContributorId)
  openContributorProfile(selectedContributorId);
}

function choosePaymentContributor(){

 var u=getUser();

 if(!u||!(u.contributors||[]).length){
  alert("Add a contributor first.");
  return;
 }

 var text="Select contributor:\n\n";

 u.contributors.forEach(function(c,i){
  text+=(i+1)+". "+c.name+"\n";
 });

 var choice=prompt(
  text+"\nEnter the number:"
 );

 if(choice===null)return;

 var index=Number(choice)-1;

 if(index<0||index>=u.contributors.length){
  alert("Invalid contributor.");
  return;
 }

 recordPayment(
  u.contributors[index].id,
  today()
 );
}

/* PAYMENTS */

function renderPayments(){

 var u=getUser();
 var box=$("paymentsList");

 if(!box||!u)return;

 var html="";
 var todayKey=today();
 var monthKey=todayKey.slice(0,7);

 (u.contributors||[]).forEach(function(c){

  (c.payments||[]).slice().reverse()
   .forEach(function(p){

    var show=true;

    if(paymentFilter==="today")
     show=p.date===todayKey;

    if(paymentFilter==="month")
     show=String(p.date).slice(0,7)===monthKey;

    if(show){

     html+=
      '<div class="payment-row">'+
      "<div>"+
      "<strong>"+escapeHtml(c.name)+"</strong>"+
      "<small>"+escapeHtml(p.date||"")+"</small>"+
      "</div>"+
      "<strong>"+money(p.amount)+"</strong>"+
      "</div>";

    }

   });

 });

 box.innerHTML=
  html||"<p>No payments found.</p>";
}

function setPaymentFilter(filter){

 paymentFilter=filter;

 renderPayments();
}
function makePayout(){

 var u=getUser();

 if(!u||!(u.contributors||[]).length){
  alert("Add a contributor first.");
  return;
 }

 var text="SELECT CONTRIBUTOR\n\n";

 u.contributors.forEach(function(c,i){
  text+=(i+1)+". "+c.name+
   " — Available: "+money(getBalance(c))+"\n";
 });

 var choice=prompt(
  text+"\nEnter contributor number:"
 );

 if(choice===null)return;

 var index=Number(choice)-1;

 if(index<0||index>=u.contributors.length){
  alert("Invalid contributor.");
  return;
 }

 makeContributorPayout(
  u.contributors[index].id
 );
}

function makeContributorPayout(id){

 var u=getUser();
 var c=findContributor(id);

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
  alert(
   "Payout cannot be greater than the available balance."
  );
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

 var pending=0;
 var completed=0;

 (u.contributors||[]).forEach(function(c){
  pending+=getBalance(c);
 });

 (u.payouts||[]).forEach(function(p){
  completed+=Number(p.amount||0);
 });

 if($("payoutPendingTotal"))
  $("payoutPendingTotal").textContent=money(pending);

 if($("payoutCompletedTotal"))
  $("payoutCompletedTotal").textContent=money(completed);

 if(!(u.payouts||[]).length){
  box.innerHTML="<p>No payouts yet.</p>";
  return;
 }

 var html="";

 u.payouts.slice().reverse()
  .forEach(function(p){

   html+=
    '<div class="payout-row">'+
    "<div>"+
    "<strong>"+
    escapeHtml(p.contributorName)+
    "</strong>"+
    "<small>"+
    escapeHtml(p.date||"")+
    "</small>"+
    "</div>"+
    "<strong>"+money(p.amount)+"</strong>"+
    "</div>";

  });

 box.innerHTML=html;
}

/* CALENDAR */

function openCalendar(id){

 selectedContributorId=id;
 calendarDate=new Date();

 showScreen("calendarScreen");

 renderCalendar();
}

function backToContributorProfile(){

 if(selectedContributorId)
  openContributorProfile(selectedContributorId);
 else
  showScreen("contributorsScreen");
}

function previousMonth(){

 calendarDate.setMonth(
  calendarDate.getMonth()-1
 );

 renderCalendar();
}

function nextMonth(){

 calendarDate.setMonth(
  calendarDate.getMonth()+1
 );

 renderCalendar();
}

function formatCalendarDate(key){

 var p=key.split("-");

 var d=new Date(
  Number(p[0]),
  Number(p[1])-1,
  Number(p[2])
 );

 return d.toLocaleDateString(
  "en-US",
  {
   weekday:"long",
   month:"long",
   day:"numeric",
   year:"numeric"
  }
 );
}

function renderCalendar(){

 var c=findContributor(
  selectedContributorId
 );

 if(!c)return;

 var year=calendarDate.getFullYear();
 var month=calendarDate.getMonth();

 if($("calendarContributorName"))
  $("calendarContributorName").textContent=c.name;

 if($("calendarMonth"))
  $("calendarMonth").textContent=
   new Date(year,month,1)
   .toLocaleDateString(
    "en-US",
    {
     month:"long",
     year:"numeric"
    }
   );

 if($("calendarDailyAmount"))
  $("calendarDailyAmount").textContent=
   money(c.daily||50);

 var payments=c.payments||[];
 var total=0;

 payments.forEach(function(p){
  total+=Number(p.amount||0);
 });

 if($("calendarPaidDays"))
  $("calendarPaidDays").textContent=
   payments.length+" days";

 if($("calendarTotalAmount"))
  $("calendarTotalAmount").textContent=
   money(total);

 var box=$("calendarDays");

 if(!box)return;

 var firstDay=
  new Date(year,month,1).getDay();

 var daysInMonth=
  new Date(year,month+1,0).getDate();

 var todayKey=today();

 var html="";

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

  var classes=
   "calendar-day "+
   (paid?"paid":
    dateKey===todayKey?"today":"unpaid");

  html+=
   '<button class="'+classes+
   '" onclick="openPaymentForDate(\''+
   dateKey+'\')">'+
   "<span>"+day+"</span>"+
   (paid?"<small>✓</small>":"")+
   "</button>";
 }

 box.innerHTML=html;

 updateCalendarAction();
}

function updateCalendarAction(){

 var c=findContributor(
  selectedContributorId
 );

 var action=$("calendarAction");

 if(!c||!action)return;

 var paid=(c.payments||[]).some(function(p){
  return p.date===today();
 });

 if(paid){

  action.textContent=
   "Today's payment has been recorded.";

  action.disabled=true;

 }else{

  action.textContent=
   "Mark Today's Payment.";

  action.disabled=false;

  action.onclick=function(){
   openPaymentForDate(today());
  };

 }
}

function openPaymentForDate(key){

 var c=findContributor(
  selectedContributorId
 );

 if(!c)return;

 var alreadyPaid=
  (c.payments||[]).some(function(p){
   return p.date===key;
  });

 if(alreadyPaid){
  alert(
   "This day has already been marked as paid."
  );
  return;
 }

 calendarPaymentDate=key;

 if($("paymentModalTitle"))
  $("paymentModalTitle").textContent=
   "Mark Payment";

 if($("paymentModalText"))
  $("paymentModalText").textContent=
   "Record contribution for "+
   formatCalendarDate(key)+".";

 if($("paymentModalAmount"))
  $("paymentModalAmount").textContent=
   money(c.daily||50);

 if($("paymentModal"))
  $("paymentModal").style.display="flex";

 if($("confirmPaymentBtn"))
  $("confirmPaymentBtn").onclick=
   confirmCalendarPayment;
}

function confirmCalendarPayment(){

 var u=getUser();

 var c=findContributor(
  selectedContributorId
 );

 if(!u||!c||!calendarPaymentDate)
  return;

 var alreadyPaid=
  (c.payments||[]).some(function(p){
   return p.date===calendarPaymentDate;
  });

 if(alreadyPaid){

  closePaymentModal();

  alert(
   "This day has already been marked as paid."
  );

  return;
 }

 if(!c.payments)c.payments=[];

 var amount=Number(c.daily)||50;

 var firstPayment=
  c.payments.length===0;

 c.payments.push({
  id:Date.now().toString(),
  date:calendarPaymentDate,
  amount:amount
 });

 if(firstPayment)
  u.earnings=
   Number(u.earnings||0)+amount;

 saveAccounts();

 closePaymentModal();

 alert(
  "Payment recorded: "+money(amount)
 );

 renderCalendar();
 renderPayments();
 renderContributors();
 renderPayouts();
 updateDashboard();

 if(selectedContributorId)
  openContributorProfile(
   selectedContributorId
  );
}

function closePaymentModal(){

 if($("paymentModal"))
  $("paymentModal").style.display="none";

 calendarPaymentDate=null;
}

/* FINANCIALS */

function calculateFinancials(){

 var u=getUser();

 if(!u){
  return {
   today:0,
   month:0,
   received:0,
   earnings:0,
   payouts:0,
   outstanding:0
  };
 }

 var todayKey=today();
 var monthKey=todayKey.slice(0,7);

 var result={
  today:0,
  month:0,
  received:0,
  earnings:Number(u.earnings||0),
  payouts:0,
  outstanding:0
 };

 (u.contributors||[]).forEach(function(c){

  (c.payments||[]).forEach(function(p){

   var amount=Number(p.amount||0);

   result.received+=amount;

   if(p.date===todayKey)
    result.today+=amount;

   if(String(p.date).slice(0,7)===monthKey)
    result.month+=amount;

  });

  result.outstanding+=
   getBalance(c);
 });

 (u.payouts||[]).forEach(function(p){

  result.payouts+=
   Number(p.amount||0);

 });

 return result;
}

function renderRecentActivity(){

 var u=getUser();
 var box=$("recentActivity");

 if(!box||!u)return;

 var activity=[];

 (u.contributors||[]).forEach(function(c){

  (c.payments||[]).forEach(function(p){

   activity.push({
    type:"Payment",
    name:c.name,
    amount:p.amount,
    date:p.date
   });

  });

  (c.payouts||[]).forEach(function(p){

   activity.push({
    type:"Payout",
    name:c.name,
    amount:p.amount,
    date:p.date
   });

  });

 });

 activity.sort(function(a,b){
  return String(b.date)
   .localeCompare(String(a.date));
 });

 activity=activity.slice(0,8);

 if(!activity.length){
  box.innerHTML="<p>No recent activity.</p>";
  return;
 }

 var html="";

 activity.forEach(function(a){

  html+=
   '<div class="activity-row">'+
   "<div>"+
   "<strong>"+a.type+"</strong>"+
   "<small>"+
   escapeHtml(a.name)+
   " · "+
   escapeHtml(a.date||"")+
   "</small>"+
 
