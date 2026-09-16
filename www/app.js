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
