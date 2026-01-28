function loadData() {
  const expData = localStorage.getItem("expenses");
  const studyData = localStorage.getItem("studies");

  if (expData) expenses = JSON.parse(expData);
  if (studyData) studySessions = JSON.parse(studyData);
}

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function saveStudies() {
  localStorage.setItem("studies", JSON.stringify(studySessions));
}

function showSection(id){
  document.querySelectorAll(".section").forEach(sec=>{
    sec.classList.remove("active-section");
  });

  document.getElementById(id).classList.add("active-section");

  document.querySelectorAll(".menu button").forEach(btn=>{
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`.menu button[onclick*="${id}"]`);
  if(activeBtn) activeBtn.classList.add("active");
}

  // EXPENSE SYSTEM

let expenses=[];
let currentTab="daily";
let chart;
let firstChartLoad = true;
let chartInitialized = false;

const ctx=document.getElementById("expenseChart").getContext("2d");

function createChart(labels, data){
  if(chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: "#14b87a",
        hoverBackgroundColor: "#10a46a",
        borderRadius: 14,
        barThickness: 26
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animations: firstChartLoad
        ? {
            x: { duration: 0 },
            y: { duration: 0 }
          }
        : {
            x: { duration: 0 },
            y: {
              from: 0,
              duration: 900,
              easing: "easeOutQuart",
              delay: ctx => ctx.dataIndex * 80
            }
          },

      plugins: {
        legend: { display: false },

        tooltip: {
          backgroundColor: "rgba(17,17,17,0.95)",
          padding: 12,
          cornerRadius: 12,
          titleFont: { size: 14, weight: "600" },
          bodyFont: { size: 13 },
          displayColors: false
        }
      },

      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#374151",
            font: { size: 13, weight: "600" }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#e5e7eb",
            borderDash: [6, 6]
          },
          ticks: {
            color: "#6b7280",
            font: { size: 12 }
          }
        }
      }
    }
  });

  firstChartLoad = false;
}




createChart(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],[0,0,0,0,0,0,0]);

function switchTab(tab,el){
  currentTab=tab;
  document.querySelectorAll("#expenses .tab").forEach(b=>b.classList.remove("active-tab"));
  el.classList.add("active-tab");
  updateChart();
}

let expensesSelectedYear = null;
let studySelectedYear = null;

function applyStudyYear(){
  const raw = document.getElementById("studyYear").value.trim();
  if (raw === "") {
    studySelectedYear = null;
  } else {
    const v = Number(raw);
    if (!isNaN(v) && v >= 1900 && v <= 9999) {
      studySelectedYear = v;
    } else {
      studySelectedYear = null;
    }
  }

  updateStudyChart();
  renderStudyTable();
  updateStudyDashboard();
  updateRecentStudyUI();
}




function weekOfMonthFour(d){
  const day = d.getDate();
  const week = Math.ceil(day / 7);
  return Math.min(4, week);
}


const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function applyExpensesYear(){
  const raw = document.getElementById("expensesYear").value;
  const v = Number(raw);
  if(raw === "" || isNaN(v)) {
    expensesSelectedYear = null;
  } else if(v >= 1900 && v <= 9999) {
    expensesSelectedYear = v;
  } else {
    expensesSelectedYear = null;
  }
  updateChart();
  updateRecentExpensesUI();
  updateExpenseDashboard();
  updateBudgetUI();
  updateBudgetDashboard();
}


function updateChart(){
  let labels = [];
  let data = [];

  if(currentTab === "daily"){
    labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    data = [0,0,0,0,0,0,0];

    expenses.forEach(e=>{
      const d = new Date(e.date);
      if (isNaN(d)) return;
      if (expensesSelectedYear && d.getFullYear() !== Number(expensesSelectedYear)) return;
      const day = d.getDay();
      data[day] += Number(e.amount);
    });

    createChart(labels,data);
    updateExpenseDashboard();
    updateBudgetDashboard();
    updateBudgetUI();
    updateRecentExpensesUI();
    return;
  }

  if(currentTab === "weekly"){
    labels = ["Week 1","Week 2","Week 3","Week 4"];
    data = [0,0,0,0];

    expenses.forEach(e=>{
      const d = new Date(e.date);
      if (isNaN(d)) return;
      if (expensesSelectedYear && d.getFullYear() !== Number(expensesSelectedYear)) return;
      const w = weekOfMonthFour(d); // 1..4
      data[w-1] += Number(e.amount);
    });

    createChart(labels,data);
    updateExpenseDashboard();
    updateBudgetDashboard();
    updateBudgetUI();
    updateRecentExpensesUI();
    return;
  }

  if(currentTab === "monthly"){
    labels = MONTH_NAMES.slice();
    data = new Array(12).fill(0);

    expenses.forEach(e=>{
      const d = new Date(e.date);
      if (isNaN(d)) return;
      if (expensesSelectedYear && d.getFullYear() !== Number(expensesSelectedYear)) return;
      const m = d.getMonth();
      data[m] += Number(e.amount);
    });

    createChart(labels,data);
    updateExpenseDashboard();
    updateBudgetDashboard();
    updateBudgetUI();
    updateRecentExpensesUI();
    return;
  }

  if(currentTab === "yearly"){
    if (expensesSelectedYear) {
      const yr = Number(expensesSelectedYear);
      let total = 0;
      expenses.forEach(e=>{
        const d = new Date(e.date);
        if (isNaN(d)) return;
        if (d.getFullYear() === yr) total += Number(e.amount);
      });
      createChart([String(yr)], [total]);
      updateExpenseDashboard();
      updateBudgetDashboard();
      updateBudgetUI();
      updateRecentExpensesUI();
      return;
    }

    let yearsFound = expenses.map(e => {
      const d = new Date(e.date);
      return isNaN(d) ? null : d.getFullYear();
    }).filter(y => y !== null);

    if(yearsFound.length === 0){
      const topYear = (new Date().getFullYear());
      labels = [];
      data = [];
      for(let i = 4; i >= 0; i--){
        labels.push(String(topYear - i));
        data.push(0);
      }
      createChart(labels, data);
      updateExpenseDashboard();
      updateBudgetDashboard();
      updateBudgetUI();
      updateRecentExpensesUI();
      return;
    }

    const minYear = Math.min(...yearsFound);
    const maxYear = Math.max(...yearsFound);
    const years = [];
    const dataArr = [];
    for(let y = minYear; y <= maxYear; y++){
      years.push(String(y));
      dataArr.push(0);
    }

    expenses.forEach(e=>{
      const d = new Date(e.date);
      if (isNaN(d)) return;
      const y = d.getFullYear();
      const idx = years.indexOf(String(y));
      if(idx >= 0) dataArr[idx] += Number(e.amount);
    });

    createChart(years, dataArr);
    updateExpenseDashboard();
    updateBudgetDashboard();
    updateBudgetUI();
    updateRecentExpensesUI();
    return;
  }
}





function openModal(){ document.getElementById("modal").style.display="flex"; }
function closeModal(){ document.getElementById("modal").style.display="none"; }
function getCategorySpent(category) {
  return expenses
    .filter(e => e.category === category)
    .reduce((sum, e) => sum + Number(e.amount), 0);
}


let pendingExpense = null;

function addExpense(){
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;
  const note = document.getElementById("note").value;

  if(!amount || !date){
    alert("Enter amount and date");
    return;
  }

  const budgetLimit = budgets[category] || 0;
  const spentSoFar = getCategorySpent(category);

  // 🚨 ONLY if budget exceeded
  if(budgetLimit > 0 && spentSoFar + amount > budgetLimit){
    pendingExpense = { amount, category, date, note };

    showBudgetModal(`
      <strong>${category} Budget:</strong> ₹${budgetLimit}<br>
      <strong>Already Spent:</strong> ₹${spentSoFar}<br>
      <strong>Trying to Add:</strong> ₹${amount}<br><br>
      Do you want to add it anyway?
    `);

    return; // wait for user decision
  }

  // ✅ budget safe → add directly
  commitExpense({ amount, category, date, note });
}


function commitExpense(exp){
  expenses.push(exp);
  saveExpenses();

  renderTable();
  updateChart();
  updateBudgetUI();
  updateBudgetDashboard();
  updateExpenseDashboard();
  updateRecentExpensesUI();

  closeModal();

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  document.getElementById("date").value = "";

  const btn = document.getElementById("expenseSubmitBtn");
  btn.disabled = true;
  btn.style.background = "#9ca3af";
}



function renderTable(){
  const tbody=document.querySelector("tbody");
  tbody.innerHTML="";

  expenses.forEach((e,i)=>{
    tbody.innerHTML+=`
      <tr>
        <td>${e.date}</td>
        <td>${e.category}</td>
        <td>₹${e.amount}</td>
        <td>${e.note}</td>
        <td>
          <button onclick="deleteExpense(${i})">Delete</button>
        </td>
      </tr>
    `;
  });
}
function deleteExpense(i){
  expenses.splice(i, 1);
  saveExpenses(); 
  renderTable();
  updateChart();
}

//  DASHBOARD EXPENSE

function updateExpenseDashboard(){
  let total = expenses.reduce((sum,e)=> sum + e.amount, 0);
  document.getElementById("dash-total").innerText = "₹" + total;
}

  //  STUDY SYSTEM
let studySessions = [];
let studyChart;
let timerStart = null;
let studyTab = "daily";

const studyCtx = document.getElementById("studyChart").getContext("2d");

let firstStudyChartLoad = true;

function createStudyChart(labels, data) {
  if (studyChart) studyChart.destroy();

  studyChart = new Chart(studyCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Hours",
        data,
        backgroundColor: "#3b82f6",
        borderRadius: 14,
        barThickness: 26
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animations: firstStudyChartLoad
        ? {
            x: { duration: 0 },
            y: { duration: 0 }
          }
        : {
            x: { duration: 0 },
            y: {
              from: 0,
              duration: 900,
              easing: "easeOutQuart",
              delay: ctx => ctx.dataIndex * 80
            }
          },

      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(17,17,17,0.95)",
          padding: 12,
          cornerRadius: 12,
          titleFont: { size: 14, weight: "600" },
          bodyFont: { size: 13 },
          displayColors: false
        }
      },

      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#374151",
            font: { size: 13, weight: "600" }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#e5e7eb",
            borderDash: [6, 6]
          },
          ticks: {
            color: "#6b7280",
            font: { size: 12 }
          }
        }
      }
    }
  });

  firstStudyChartLoad = false;
}

createStudyChart(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], [0,0,0,0,0,0,0]);

function switchStudyTab(tab, el){
  studyTab = tab;
  document.querySelectorAll("#time-tracker .tab").forEach(b=>b.classList.remove("active-tab"));
  el.classList.add("active-tab");
  updateStudyChart();
}

function updateStudyChart(){
  let labels = [];
  let data = [];

  if(studyTab === "daily"){
    labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    data = [0,0,0,0,0,0,0];
    studySessions.forEach(s=>{
      const d = new Date(s.date);
      if (isNaN(d)) return;
      if (studySelectedYear && d.getFullYear() !== Number(studySelectedYear)) return;
      data[d.getDay()] += Number(s.hours);
    });
    createStudyChart(labels,data);
    updateStudyDashboard();
    return;
  }

  if(studyTab === "weekly"){
    labels = ["Week 1","Week 2","Week 3","Week 4"];
    data = [0,0,0,0];

    studySessions.forEach(s=>{
      const d = new Date(s.date);
      if (isNaN(d)) return;
      if (studySelectedYear && d.getFullYear() !== Number(studySelectedYear)) return;
      const w = weekOfMonthFour(d); // 1..4
      data[w-1] += Number(s.hours);
    });

    createStudyChart(labels,data);
    updateStudyDashboard();
    return;
  }

  if(studyTab === "monthly"){
    labels = MONTH_NAMES.slice();
    data = new Array(12).fill(0);

    studySessions.forEach(s=>{
      const d = new Date(s.date);
      if (isNaN(d)) return;
      if (studySelectedYear && d.getFullYear() !== Number(studySelectedYear)) return;
      const m = d.getMonth();
      data[m] += Number(s.hours);
    });

    createStudyChart(labels,data);
    updateStudyDashboard();
    return;
  }

  if(studyTab === "yearly"){
    if (studySelectedYear) {
      const yr = Number(studySelectedYear);
      let total = 0;
      studySessions.forEach(s=>{
        const d = new Date(s.date);
        if (isNaN(d)) return;
        if (d.getFullYear() === yr) total += Number(s.hours);
      });
      createStudyChart([String(yr)], [total]);
      updateStudyDashboard();
      return;
    }

    let yearsFound = studySessions.map(s => {
      const d = new Date(s.date);
      return isNaN(d) ? null : d.getFullYear();
    }).filter(y => y !== null);

    if(yearsFound.length === 0){
      const topYear = (new Date().getFullYear());
      const yrs = [];
      const dataArr = [];
      for(let i = 4; i >= 0; i--){
        yrs.push(String(topYear - i));
        dataArr.push(0);
      }
      createStudyChart(yrs, dataArr);
      updateStudyDashboard();
      return;
    }

    const minYear = Math.min(...yearsFound);
    const maxYear = Math.max(...yearsFound);

    const years = [];
    const dataArr = [];
    for(let y = minYear; y <= maxYear; y++){
      years.push(String(y));
      dataArr.push(0);
    }

    studySessions.forEach(s=>{
      const d = new Date(s.date);
      if(isNaN(d)) return;
      const y = d.getFullYear();
      const idx = years.indexOf(String(y));
      if(idx >= 0) dataArr[idx] += Number(s.hours);
    });

    createStudyChart(years, dataArr);
    updateStudyDashboard();
    return;
  }
}

//  TIMER MODAL

let activeTimerCourse = "";
let activeTimerNote = "";
let activeTimerInterval = null;
let activeStartTime = null;
let pausedElapsed = 0;      
let isPaused = false;

function openTimerModal(){
  const modal = document.getElementById("timerModal");
  const startBtn = document.getElementById("timerStartBtn");
  if(!modal) return console.warn("openTimerModal: timerModal not found");
  modal.style.display = "flex";
  checkTimerInput();
}

function closeTimerModal(){
  const modal = document.getElementById("timerModal");
  const course = document.getElementById("timerCourse");
  const note = document.getElementById("timerNote");
  const startBtn = document.getElementById("timerStartBtn");
  if(modal) modal.style.display = "none";
  if(course) course.value = "";
  if(note) note.value = "";
  if(startBtn){
    startBtn.disabled = true;
    startBtn.style.background = "#9ca3af";
    startBtn.style.cursor = "not-allowed";
  }
}

function checkTimerInput(){
  const courseEl = document.getElementById("timerCourse");
  const startBtn = document.getElementById("timerStartBtn");
  if(!startBtn) return console.warn("checkTimerInput: timerStartBtn not found");
  if(!courseEl) return console.warn("checkTimerInput: timerCourse input not found");

  const course = courseEl.value.trim();
  if(course.length > 0){
    startBtn.disabled = false;
    startBtn.style.background = "#111";
    startBtn.style.cursor = "pointer";
  } else {
    startBtn.disabled = true;
    startBtn.style.background = "#9ca3af";
    startBtn.style.cursor = "not-allowed";
  }
}

function confirmStartTimer(e){
  if(e && typeof e.preventDefault === "function") e.preventDefault();

  const courseEl = document.getElementById("timerCourse");
  const noteEl = document.getElementById("timerNote");
  if(courseEl) activeTimerCourse = courseEl.value.trim();
  if(noteEl) activeTimerNote = noteEl.value.trim();

  if(!activeTimerCourse){
    alert("Please enter course name to start the timer");
    return;
  }

  if(activeStartTime || isPaused){
    if(isPaused){
      togglePause(); // resume
      closeTimerModal();
      return;
    }
    console.warn("confirmStartTimer: timer already running");
    return;
  }

  activeStartTime = Date.now();
  pausedElapsed = 0;
  isPaused = false;
  startActiveTimerInterval();

  closeTimerModal();
  renderActiveSessionUI();
}

function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}


function startActiveTimerInterval(){
  stopActiveTimerInterval();
  renderActiveSessionUI();
  activeTimerInterval = setInterval(()=> {
    renderActiveSessionUI();
  }, 500);
}

function stopActiveTimerInterval(){
  if(activeTimerInterval){
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }
}

function renderActiveSessionUI(){
  const container = document.getElementById("active-session-container");
  if(!container) {
    return;
  }

  if(!activeStartTime && !isPaused){
    container.innerHTML = "";
    return;
  }

  const elapsedMs = pausedElapsed + (activeStartTime ? (Date.now() - activeStartTime) : 0);
  const seconds = Math.floor(elapsedMs / 1000);
  const hh = String(Math.floor(seconds / 3600)).padStart(2,'0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2,'0');
  const ss = String(seconds % 60).padStart(2,'0');

  container.innerHTML = `
    <div class="active-session" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:8px;background:#fff;">
      <div class="left">
        <h4 style="margin:0 0 4px 0;">Active Session: ${escapeHtml(activeTimerCourse)}</h4>
        <div class="time" style="font-weight:700;">${hh}:${mm}:${ss}</div>
      </div>

      <div class="controls" style="display:flex;gap:8px;">
        <button class="small-btn pause" id="pauseBtn" type="button">` + (isPaused ? "▶" : "⏸") + `</button>
        <button class="small-btn stop" id="stopBtn" type="button">⏹ Stop & Save</button>
      </div>
    </div>
  `;

  const pauseBtn = document.getElementById("pauseBtn");
  const stopBtn = document.getElementById("stopBtn");
  if(pauseBtn) pauseBtn.onclick = togglePause;
  if(stopBtn) stopBtn.onclick = stopAndSave;
}

function togglePause(){
  const pauseBtn = document.getElementById("pauseBtn");
  if(!isPaused){
    if(activeStartTime) pausedElapsed += (Date.now() - activeStartTime);
    activeStartTime = null;
    isPaused = true;
    stopActiveTimerInterval();
    if(pauseBtn){ pauseBtn.textContent = "▶"; pauseBtn.classList.remove("pause"); pauseBtn.classList.add("resume"); }
  } else {
    activeStartTime = Date.now();
    isPaused = false;
    startActiveTimerInterval();
    if(pauseBtn){ pauseBtn.textContent = "⏸"; pauseBtn.classList.remove("resume"); pauseBtn.classList.add("pause"); }
  }
}

function stopAndSave(){
  const elapsedMs = pausedElapsed + (activeStartTime ? (Date.now() - activeStartTime) : 0);
  const hoursRaw = elapsedMs / 3600000;        
  const hours = Number(hoursRaw.toFixed(3));    
  const dateStr = new Date().toISOString().split("T")[0];

  if (elapsedMs >= 1000) {
    studySessions.push({
      course: activeTimerCourse,
      hours,
      date: dateStr,
      note: activeTimerNote || "Timer session"
    });
    saveStudies();
  }

  activeTimerCourse = "";
  activeTimerNote = "";
  activeStartTime = null;
  pausedElapsed = 0;
  isPaused = false;
  stopActiveTimerInterval();

  renderActiveSessionUI();
  renderStudyTable();
  updateStudyChart();
  updateStudyDashboard();
  updateRecentStudyUI();
}

(function wireTimerControls(){
  function wireOpenStartButton(){
    const ids = ['openTimerBtn','startTimerBtn','timerOpenBtn','openTimerBtnTop'];
    for(const id of ids){
      const el = document.getElementById(id);
      if(el){ el.addEventListener('click', openTimerModal); return true; }
    }

    const buttons = Array.from(document.querySelectorAll('button'));
    for(const b of buttons){
      if(b.textContent && b.textContent.trim().toLowerCase().includes('start timer')){
        b.addEventListener('click', openTimerModal);
        return true;
      }
    }

    return false;
  }

  function wireModalInputs(){
    const courseInput = document.getElementById('timerCourse');
    const startBtn = document.getElementById('timerStartBtn');

    if(courseInput){
      courseInput.addEventListener('input', checkTimerInput);
    } else {
      console.warn('wireModalInputs: timerCourse input missing');
    }

    if(startBtn){
      startBtn.addEventListener('click', function(e){
        if(startBtn.disabled) return;
        confirmStartTimer(e);
      });
    } else {
      console.warn('wireModalInputs: timerStartBtn missing');
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      wireOpenStartButton();
      wireModalInputs();
      renderActiveSessionUI();
    });
  } else {
    wireOpenStartButton();
    wireModalInputs();
    renderActiveSessionUI();
  }
})();


  //  RECENT BOXES

function updateRecentExpensesUI(){
  const list = document.getElementById("recent-expenses-list");
  if(!list) return;

  const filtered = expenses.filter(e=>{
    if (!expensesSelectedYear) return true;
    const d = new Date(e.date);
    if (isNaN(d)) return false;
    return d.getFullYear() === Number(expensesSelectedYear);
  });

  if (filtered.length === 0){
    list.innerHTML = "<div style='color:#6b7280'>No expenses yet</div>";
    return;
  }

  const items = filtered.slice(-3).reverse().map(e => {
    const cat = (e.category || "").toString()
      .replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
    const amt = Number(e.amount) || 0;

    return `
      <li style="margin-bottom:6px; color:#374151; list-style:disc; margin-left:18px;">
        ₹${amt} - ${cat}
      </li>
    `;
  });

  list.innerHTML = `<ul style="padding-left:0; margin:0;">${items.join("")}</ul>`;
}




function updateRecentStudyUI(){
  const list = document.getElementById("recent-study-list");
  if(!list) return;

  const filtered = studySessions.filter(s=>{
    if (!studySelectedYear) return true;
    const d = new Date(s.date);
    if (isNaN(d)) return false;
    return d.getFullYear() === Number(studySelectedYear);
  });

  if (filtered.length === 0){
    list.innerHTML = "<div style='color:#6b7280'>No study sessions yet</div>";
    return;
  }

  const items = filtered.slice(-3).reverse().map(s => {
    const course = (s.course || "").toString()
      .replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
    const hours = Number(s.hours) || 0;

    return `
      <li style="margin-bottom:6px; color:#374151; list-style:disc; margin-left:18px;">
        ${course} - ${hours}h
      </li>
    `;
  });

  list.innerHTML = `<ul style="padding-left:0; margin:0;">${items.join("")}</ul>`;
}

function renderStudyTable(){
  const table = document.getElementById("studyTable");
  const noData = document.getElementById("noStudyData");
  if(!table || !noData) return;

  table.innerHTML = "";

  let filtered = studySessions;

  if (studySelectedYear) {
    filtered = studySessions.filter(s => {
      const d = new Date(s.date);
      return !isNaN(d) && d.getFullYear() === Number(studySelectedYear);
    });
  }

  if(filtered.length === 0){
    noData.style.display = "block";
    return;
  }

  noData.style.display = "none";

  filtered.forEach(s => {
    const realIndex = studySessions.indexOf(s);

    table.innerHTML += `
      <tr>
        <td>${s.date}</td>
        <td>${s.course}</td>
        <td>${s.hours}</td>
        <td>${s.note || ""}</td>
        <td>
          <button onclick="deleteStudy(${realIndex})">Delete</button>
        </td>
      </tr>
    `;
  });
}





let budgets = JSON.parse(localStorage.getItem("budgets")) || {
  Food:0,
  Transport:0,
  Books:0,
  Entertainment:0,
  Utilities:0,
  Other:0
};

let editingCategory=null;

function startEditBudget(cat){
  editingCategory=cat;
  updateBudgetUI();
}

function saveBudget(cat){
  const val = Number(document.getElementById("edit-" + cat).value);
  if(isNaN(val) || val < 0){
    alert("Invalid budget");
    return;
  }

  budgets[cat] = val;

  saveBudgets();         
  editingCategory = null;
  updateBudgetUI();
  updateBudgetDashboard();
}

function cancelEdit(){
  editingCategory=null;
  updateBudgetUI();
}

function updateBudgetDashboard(){
  let totalExpenses = expenses.reduce((sum,e)=> sum + e.amount,0);
  let totalBudget = Object.values(budgets).reduce((sum,b)=> sum + b,0);

  let remaining = totalBudget - totalExpenses;
let percent = 0;

if (totalBudget > 0) {
  percent = Math.round((remaining / totalBudget) * 100);
}

const percentEl = document.getElementById("dash-budget-percent");
percentEl.innerText =
  totalBudget === 0
    ? "No budget set"
    : remaining < 0
      ? "Over budget"
      : percent + "% remaining";

document.getElementById("dash-budget-used").innerText = "₹" + totalExpenses;
document.getElementById("dash-budget-total").innerText = "₹" + totalBudget;
document.getElementById("dash-budget-used").innerText="₹"+totalExpenses;
document.getElementById("dash-budget-total").innerText="₹"+totalBudget;
}
function confirmAddExpense(){
  if(!pendingExpense) return;
  commitExpense(pendingExpense);
  pendingExpense = null;
  closeBudgetModal();
}

function closeBudgetModal(){
  document.getElementById("budgetModal").style.display = "none";
  pendingExpense = null;
}

function showBudgetModal(html){
  const modal = document.getElementById("budgetModal");
  const text = document.getElementById("budgetModalText");

  if(!modal || !text){
    alert("Budget exceeded");
    return;
  }

  text.innerHTML = html;
  modal.style.display = "flex";
}


function closeBudgetModal(){
  document.getElementById("budgetModal").style.display = "none";
  pendingExpense = null;
}


function updateBudgetUI(){
  const grid=document.getElementById("budgetGrid");
  const totalBudgetEl=document.getElementById("total-budget");
  const totalSpentEl=document.getElementById("total-spent");
  const totalBar = document.getElementById("total-budget-bar");
  const note = document.getElementById("total-budget-note");

  const categories=["Food","Transport","Books","Entertainment","Utilities","Other"];
  grid.innerHTML="";

  let totalBudget=0;
  let totalSpent=expenses.reduce((s,e)=>s+e.amount,0);

  categories.forEach(cat=>{
    const limit=budgets[cat];
    const spent=expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
    totalBudget+=limit;

    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    const exceeded=spent>limit && limit>0;

    let limitHTML=`<strong>₹${limit.toFixed(2)}</strong>`;
    let actionHTML=`<button onclick="startEditBudget('${cat}')">Edit</button>`;

    if(editingCategory===cat){
      limitHTML=`
        <div class="budget-edit">
          <input type="number" id="edit-${cat}" value="${limit}">
          <button class="budget-save" onclick="saveBudget('${cat}')">Save</button>
          <button class="budget-cancel" onclick="cancelEdit()">Cancel</button>
        </div>`;
      actionHTML="";
    }

    grid.innerHTML+=`
      <div class="budget-box">
        <div class="budget-head">
          <h4>${cat}</h4>${actionHTML}
        </div>
        <p>Budget Limit</p>${limitHTML}
        <p>Spent</p>
        <div class="budget-progress ${exceeded?"black":""}">
          <div style="width:${percent}%"></div>
        </div>
        <p class="budget-text">${percent.toFixed(0)}% used · ${limit - spent < 0? `₹${(limit - spent).toFixed(2)} over`: `₹${(limit - spent).toFixed(2)} remaining`}</p>
      </div>`;
  });

  totalBudgetEl.innerText="₹"+totalBudget.toFixed(2);
  totalSpentEl.innerText="₹"+totalSpent.toFixed(2);

 let totalPercent = 0;

if (totalBudget > 0) {
  totalPercent = Math.round((totalSpent / totalBudget) * 100);
}

if (totalBar) {
  totalBar.style.width = Math.min(100, Math.abs(totalPercent)) + "%";
  totalBar.style.background =
    totalSpent > totalBudget
      ? "linear-gradient(90deg,#ef4444,#991b1b)"
      : "#111";
}

if (note) {
  note.innerText =
    totalBudget === 0
      ? "No budget set"
      : totalSpent > totalBudget
        ? "Over total budget"
        : totalPercent + "% of total budget used";
}

  if(totalBar) totalBar.style.width = totalPercent + "%";
  if(note) note.innerText = totalBudget>0 ? totalPercent + "% of total budget used" : "No budget set";
}

function openStudyModal(){ document.getElementById("studyModal").style.display="flex"; }
function closeStudyModal(){
  document.getElementById("studyModal").style.display="none";
  document.getElementById("studyCourse").value = "";
  document.getElementById("studyHours").value = "";
  document.getElementById("studyDate").value = "";
  document.getElementById("studyNote").value = "";
}

function addStudySession(){
  const course = document.getElementById("studyCourse").value.trim();
  const hours = Number(document.getElementById("studyHours").value);
  const date = document.getElementById("studyDate").value;
  const note = document.getElementById("studyNote").value;

  if(!course || !hours || !date){
    alert("Please fill all required fields!");
    return;
  }

  studySessions.push({ course, hours, date, note });
  saveStudies();  
  closeStudyModal();
  renderStudyTable();
  updateStudyChart();
  updateStudyDashboard();
  updateRecentStudyUI();
}


function updateStudyDashboard(){
  const total = studySessions.reduce((sum,s) => {
    if (studySelectedYear) {
      const d = new Date(s.date);
      if (isNaN(d)) return sum;
      if (d.getFullYear() !== Number(studySelectedYear)) return sum;
    }
    return sum + Number(s.hours);
  }, 0);

  const el = document.getElementById("dash-study");
  if(el) el.innerText = total + "h";
}



document.addEventListener("DOMContentLoaded", () => {

  
  renderExams();


  loadBudgets();
  renderNotes();
  loadData();              

  renderTable();           
  renderStudyTable();      

  updateChart();          
  updateStudyChart();

  updateExpenseDashboard();
  updateStudyDashboard();
  updateRecentExpensesUI();
  updateRecentStudyUI();
  renderActiveSessionUI();

  const expBtn = document.getElementById("expenseSubmitBtn");
  const studyBtn = document.getElementById("studySubmitBtn");

  if(expBtn){
    expBtn.disabled = true;
    expBtn.style.background = "#9ca3af";
  }

  if(studyBtn){
    studyBtn.disabled = true;
    studyBtn.style.background = "#9ca3af";
  }
});

function checkStudyInput() {
  const course = document.getElementById("studyCourse").value.trim();
  const hours = document.getElementById("studyHours").value;
  const date = document.getElementById("studyDate").value;
  const btn = document.getElementById("studySubmitBtn");

  if (course && hours && date) {
    btn.disabled = false;
    btn.style.background = "#111";
  } else {
    btn.disabled = true;
    btn.style.background = "#9ca3af";
  }
}

function checkExpenseInput() {
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;
  const btn = document.getElementById("expenseSubmitBtn");

  if (amount && date) {
    btn.disabled = false;
    btn.style.background = "#111";
  } else {
    btn.disabled = true;
    btn.style.background = "#9ca3af";
  }
}

  //  TO-DO SYSTEM

let todos = JSON.parse(localStorage.getItem("todos")) || [];
todos = todos.map(t => ({
  ...t,
  done: t.done === true
}));

saveTodos();

let todoFilter = "all";

function saveTodos(){
  localStorage.setItem("todos", JSON.stringify(todos));
}

function addTodo(){
  const task = document.getElementById("todoInput").value.trim();
  const date = document.getElementById("todoDate").value;
  const priority = document.getElementById("todoPriority").value;
  
  if(!task || !date){
    showTodoAlert();
    return;
  }


  todos.push({
    task,
    date,
    priority,
    done:false
  });

  saveTodos();
  renderTodos();

  document.getElementById("todoInput").value = "";
  document.getElementById("todoDate").value = "";
}



function filterTodo(type,btn){
  todoFilter = type;
  document.querySelectorAll("#todo .tab").forEach(b=>b.classList.remove("active-tab"));
  btn.classList.add("active-tab");
  renderTodos();
}

function renderTodos(){
  const list = document.getElementById("todoList");
  if(!list) return;

  list.innerHTML = "";

  let filtered = todos;

  if(todoFilter === "pending"){
    filtered = todos.filter(t => t.done === false);
  } 
  else if(todoFilter === "completed"){
    filtered = todos.filter(t => t.done === true);
  }

  if(filtered.length === 0){
    list.innerHTML = `<p style="color:#6b7280">No tasks yet</p>`;
    return;
  }

  filtered.forEach(t => {
    const realIndex = todos.indexOf(t);

    list.innerHTML += `
      <li class="todo-card ${t.done ? "done" : ""}">
        <div class="todo-left">
          <div class="todo-title">${t.task}</div>
          <div class="todo-meta">
            <span>📅 ${t.date}</span>
            <span class="todo-dot">•</span>
            <span class="todo-priority ${t.priority.toLowerCase()}">
              ${t.priority}
            </span>
          </div>
        </div>

        <div class="todo-actions">
          <button class="todo-icon-btn done" onclick="toggleTodo(${realIndex})">✓</button>
          <button class="todo-icon-btn edit" onclick="editTodo(${realIndex})">✎</button>
          <button class="todo-icon-btn delete" onclick="deleteTodo(${realIndex})">🗑</button>
        </div>
      </li>
    `;
  });
}




function toggleTodo(index){
  todos[index].done = !todos[index].done;
  saveTodos();
  renderTodos();
}

function deleteTodo(index){
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

let currentEditTodoIndex = null;

function openTodoEditModal(index){
  currentEditTodoIndex = index;

  document.getElementById("editTodoTask").value = todos[index].task;
  document.getElementById("editTodoDate").value = todos[index].date;
  document.getElementById("editTodoPriority").value = todos[index].priority;

  document.getElementById("todoEditModal").style.display = "flex";
}

function closeTodoEditModal(){
  document.getElementById("todoEditModal").style.display = "none";
}

document.getElementById("saveTodoEditBtn").onclick = function(){
  if(currentEditTodoIndex === null) return;

  todos[currentEditTodoIndex].task =
    document.getElementById("editTodoTask").value;

  todos[currentEditTodoIndex].date =
    document.getElementById("editTodoDate").value;

  todos[currentEditTodoIndex].priority =
    document.getElementById("editTodoPriority").value;

  saveTodos();
  renderTodos();
  closeTodoEditModal();
};


document.addEventListener("DOMContentLoaded", renderTodos);

  //  NOTES SYSTEM

let notes = JSON.parse(localStorage.getItem("notes")) || [];

function saveNotes(){
  localStorage.setItem("notes", JSON.stringify(notes));
}

function addNote(){
  const title = document.getElementById("noteTitle").value.trim();
  const text = document.getElementById("noteText").value.trim();
  const color = document.getElementById("noteColor").value;

  if(!title || !text){
    showNoteEmptyAlert();
    return;
  }

  notes.push({
    title,
    text,
    color,
    pinned: false,
    date: new Date().toLocaleString()
  });

  saveNotes();
  renderNotes();

  document.getElementById("noteTitle").value = "";
  document.getElementById("noteText").value = "";
}


function deleteNote(i){
  notes.splice(i, 1);
  saveNotes();
  renderNotes();
}

function togglePin(i){
  notes[i].pinned = !notes[i].pinned;
  saveNotes();
  renderNotes();
}

function editNote(i){
  const newTitle = prompt("Edit Title:", notes[i].title);
  const newText = prompt("Edit Note:", notes[i].text);

  if(newTitle !== null && newText !== null){
    notes[i].title = newTitle;
    notes[i].text = newText;
    saveNotes();
    renderNotes();
  }
}

function filterNotes() {
  const q = document.getElementById("notesSearch").value.trim().toLowerCase();
  renderNotes(q);
}

function renderNotes(filter = "") {
  const list = document.getElementById("notesList");
  list.innerHTML = "";

  if (!notes || notes.length === 0) {
    list.innerHTML = "<p style='color:#6b7280'>No notes yet.</p>";
    return;
  }

  const sorted = notes.map((n, idx) => ({ ...n, idx }))
                      .sort((a, b) => b.pinned - a.pinned);

  const filtered = sorted.filter(n =>
    n.title.toLowerCase().includes(filter) ||
    n.text.toLowerCase().includes(filter)
  );

  if (filtered.length === 0) {
    list.innerHTML = "<p style='color:#6b7280'>No notes match your search.</p>";
    return;
  }

  filtered.forEach(n => {
    list.innerHTML += `
      <div class="note-card ${n.pinned ? 'pinned' : ''}" style="background:${n.color}">
        <h3>${n.title}</h3>
        ${n.pinned ? `<span class="pin-badge">📌 Pinned</span>` : ""}
        <p class="note-date">📅 ${n.date}</p>
        <p>${n.text}</p>

        <div class="note-actions">
          <button class="pin-btn" onclick="togglePin(${n.idx})">
            ${n.pinned ? "Unpin" : "Pin"}
          </button>
          <button class="edit-btn" onclick="editNote(${n.idx})">Edit</button>
          <button class="delete-btn" onclick="deleteNote(${n.idx})">Delete</button>
        </div>
      </div>
    `;
  });
}


document.addEventListener("DOMContentLoaded", () => {
  notes = JSON.parse(localStorage.getItem("notes")) || [];
  renderNotes();
});

document.getElementById("notesSearchBtn").addEventListener("click", filterNotes);


//  HABIT TRACKER

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function saveHabits(){
  localStorage.setItem("habits", JSON.stringify(habits));
}

function addHabit(){
  const input = document.getElementById("habitInput");
  const name = input.value.trim();

  if(!name){
    showHabitEmptyAlert(); 
    return;
  }

  habits.push({
    name,
    streak: 0,
    lastDone: null
  });

  saveHabits();
  renderHabits();
  input.value = "";
}


function toggleHabit(index){
  const today = new Date().toISOString().split("T")[0];

  if(habits[index].lastDone === today){
  showHabitAlert("Already marked today 🔥");
  return;
}


  habits[index].streak += 1;
  habits[index].lastDone = today;

  saveHabits();
  renderHabits();
}

function deleteHabit(index){
  habits.splice(index,1);
  saveHabits();
  renderHabits();
}

function renderHabits(){
  const list = document.getElementById("habitList");
  list.innerHTML = "";

  if(habits.length === 0){
    list.innerHTML = "<p style='color:#6b7280'>No habits yet</p>";
    return;
  }

  habits.forEach((h,i)=>{
    list.innerHTML += `
      <li style="display:flex;justify-content:space-between;align-items:center;
      padding:12px;border-bottom:1px solid #e5e7eb;">
        
        <div>
          <strong>${h.name}</strong><br>
          <small style="color:#6b7280">🔥 Streak: ${h.streak} days</small>
        </div>

        <div>
          <button onclick="toggleHabit(${i})"
          style="background:#10b981;color:white;border:none;padding:6px 12px;border-radius:6px;">
            ✔ Done
          </button>

          <button onclick="deleteHabit(${i})"
          style="background:#ef4444;color:white;border:none;padding:6px 12px;border-radius:6px;">
            Delete
          </button>
        </div>

      </li>
    `;
  });
}

document.addEventListener("DOMContentLoaded", renderHabits);

// Budget Saves

function saveBudgets(){
  localStorage.setItem("budgets", JSON.stringify(budgets));
}

function loadBudgets(){
  const saved = localStorage.getItem("budgets");
  if(saved){
    budgets = JSON.parse(saved);
  }
}


//  POMODORO TIMER 

let pomodoroTime = 25 * 60;   
let breakTime = 5 * 60;      
let longBreakTime = 20 * 60; 
let timeLeft = pomodoroTime;

let pomodoroTimer = null;
let isWork = true;
let pomodoroCount = 0; 

function updatePomodoroUI(){
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("pomodoroTime").innerText = `${minutes}:${seconds}`;
  document.getElementById("pomodoroMode").innerText = isWork ? "Work Time" : 
    pomodoroCount % 4 === 0 ? "Long Break" : "Short Break";
}

function startPomodoro(){
  if(pomodoroTimer) return;

  pomodoroTimer = setInterval(() => {
    timeLeft--;

    if(timeLeft <= 0){
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;

      if(isWork){
        pomodoroCount++;  
      }

      if(!isWork && pomodoroCount % 4 === 0){
        isWork = true;
        timeLeft = pomodoroTime;
      } 
      else if(isWork){
        isWork = false;
        if(pomodoroCount % 4 === 0){
          timeLeft = longBreakTime; 
        } else {
          timeLeft = breakTime;     
        }
      } 
      else {
        isWork = true;
        timeLeft = pomodoroTime;
      }

      updatePomodoroUI();
      startPomodoro();
    }

    updatePomodoroUI();
  }, 1000);
}

function pausePomodoro(){
  clearInterval(pomodoroTimer);
  pomodoroTimer = null;
}

function resetPomodoro(){
  clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  isWork = true;
  pomodoroCount = 0;
  timeLeft = pomodoroTime;
  updatePomodoroUI();
}

document.addEventListener("DOMContentLoaded", updatePomodoroUI);

updatePomodoroUI();


/* EXAMS */

let exams = JSON.parse(localStorage.getItem('exams')) || [];

function computeDaysLeft(dateStr){
  if(!dateStr) return "-";
  const today = new Date();
  const examDate = new Date(dateStr + "T00:00:00");
  const diff = examDate - new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days < 0 ? 0 : days;
}

function escapeHtmlSimple(str){
  return String(str || "").replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

function renderExams(){
  const tbody = document.getElementById('examList');
  if(!tbody) return;
  tbody.innerHTML = "";

  if(exams.length === 0){
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:18px;">No exams added yet.</td></tr>`;
    return;
  }

  exams.forEach((ex, i) => {
    const daysLeft = computeDaysLeft(ex.date);
    const daysText = (ex.date && daysLeft !== "-") ? `${daysLeft} day${daysLeft===1?"":"s"}` : "-";

    tbody.innerHTML += `
      <tr>
        <td style="min-width:180px">${escapeHtmlSimple(ex.name)}</td>
        <td>${escapeHtmlSimple(ex.subject || "-")}</td>
        <td>${ex.date ? escapeHtmlSimple(ex.date) : "-"}</td>
        <td>
  <span class="days-badge ${daysLeft <= 3 ? 'urgent' : 'normal'}">${daysText}</span></td>

        <td class="small-actions">
        <div class="exam-actions">
        <button class="exam-done" onclick="markExamDone(${i})">✓ Done</button>
        <button class="exam-edit" onclick="openEditExam(${i})">Edit</button>
        <button class="exam-delete" onclick="promptDeleteExam(${i})">Delete</button>
        </div>
        </td>

      </tr>
    `;
  });
}

function openExamModal(){
  document.getElementById('examModal').style.display = 'flex';
  document.getElementById('examModalTitle').textContent = 'Add Exam';
  document.getElementById('examName').value = '';
  document.getElementById('examSubject').value = '';
  document.getElementById('examDate').value = '';
  document.getElementById('examModal').dataset.editIndex = '';
  document.getElementById("saveExamBtn").disabled = true;
  document.getElementById("saveExamBtn").classList.remove("enabled");

}

function closeExamModal(){
  document.getElementById('examModal').style.display = 'none';
}

function saveExam(){
  const name = document.getElementById('examName').value.trim();
  const subject = document.getElementById('examSubject').value.trim();
  const date = document.getElementById('examDate').value || "";

  const editIndex = document.getElementById('examModal').dataset.editIndex;
  if(editIndex !== "" && typeof editIndex !== 'undefined'){
    exams[editIndex] = { name, subject, date };
  } else {
    exams.push({ name, subject, date });
  }

  localStorage.setItem('exams', JSON.stringify(exams));
  closeExamModal();
  renderExams();
}

function openEditExam(i){
  const e = exams[i];
  if(!e) return;
  document.getElementById('examModal').dataset.editIndex = i;
  document.getElementById('examModalTitle').textContent = 'Edit Exam';
  document.getElementById('examName').value = e.name || '';
  document.getElementById('examSubject').value = e.subject || '';
  document.getElementById('examDate').value = e.date || '';
  document.getElementById('examModal').style.display = 'flex';
}

function checkExamInput() {
  const name = document.getElementById("examName").value.trim();
  const subject = document.getElementById("examSubject").value.trim();
  const date = document.getElementById("examDate").value;

  const saveBtn = document.getElementById("saveExamBtn");

  if (name && subject && date) {
    saveBtn.disabled = false;
    saveBtn.classList.add("enabled");
  } else {
    saveBtn.disabled = true;
    saveBtn.classList.remove("enabled");
  }
}

function markExamDone(index){
  exams.splice(index, 1);
  localStorage.setItem("exams", JSON.stringify(exams));
  renderExams();
}


//  Exam  
let examToDeleteIndex = null;

function promptDeleteExam(i){
  examToDeleteIndex = i;
  const modal = document.getElementById("deleteSubjectModal");
  if(modal) modal.style.display = "flex";
}

function confirmDeleteExam(){
  if (typeof examToDeleteIndex === 'number' && examToDeleteIndex !== null) {
    exams.splice(examToDeleteIndex, 1);
    localStorage.setItem('exams', JSON.stringify(exams));
    examToDeleteIndex = null;
    const modal = document.getElementById("deleteSubjectModal");
    if(modal) modal.style.display = "none";
    renderExams();
  }
}

function closeDeleteExamModal(){
  examToDeleteIndex = null;
  const modal = document.getElementById("deleteSubjectModal");
  if(modal) modal.style.display = "none";
}

window.addEventListener("load", () => {
  document.querySelectorAll(".modal").forEach(m => {
    m.style.display = "none";
  });
});

let editNoteIndex = null;

//  OPEN EDIT MODAL
function editNote(index){
  const note = notes[index];

  editNoteIndex = index;

  document.getElementById("editNoteTitle").value = note.title;
  document.getElementById("editNoteText").value = note.text;
  document.getElementById("editNoteColor").value = note.color;

  document.getElementById("editNoteModal").style.display = "flex";
}

function closeEditNoteModal(){
  editNoteIndex = null;
  document.getElementById("editNoteModal").style.display = "none";
}

function confirmEditNote(){
  if(editNoteIndex === null) return;

  notes[editNoteIndex].title = editNoteTitle.value;
  notes[editNoteIndex].text = editNoteText.value;
  notes[editNoteIndex].color = editNoteColor.value;

  localStorage.setItem("notes", JSON.stringify(notes));

  closeEditNoteModal();
  renderNotes(); 
}

// GAMES
function openGame(name){
  document.getElementById('gamesHub').style.display = 'none';

  document.querySelectorAll('#games .game-screen').forEach(el => el.style.display = 'none');
  const el = document.getElementById('game-' + name);
  if(el) el.style.display = 'block';

  if(name === 'quiz') {
    document.getElementById('quizStartScreen').style.display = 'block';
    document.getElementById('quizGameScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'none';
  } else if(name === 'math') {
    document.getElementById('mathScore').textContent = '0';
    document.getElementById('mathAnswer').value = '';
    document.getElementById('mathQuestion').textContent = '';
  } else if(name === 'memory') {
    document.getElementById('memoryBoard').innerHTML = '';
    document.getElementById('memoryScore').textContent = '0';
  } else if(name === 'word') {
    document.getElementById('wordDisplay').textContent = '';
    document.getElementById('wordAttempts').textContent = '6';
  }
}

let quizPool = [];
let gameQuizQuestions = [];
let quizUnusedPool = [];
let gameQuizIndex = 0;
let gameQuizScore = 0;
let selectedSubject = "All";


const quizQuestions = Array.isArray(window.quizQuestions)
  ? window.quizQuestions.map(q => ({
      ...q,
      subject: q.subject.trim()
    }))
  : [];


function startGameQuiz(){
  resetQuizState();

  const total = Number(document.getElementById('quizCountSelect').value) || 10;

  if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
    alert("Quiz data not loaded");
    return;
  }

  let pool = quizQuestions.filter(q =>
    selectedSubject === "All" || q.subject === selectedSubject
  );

  if (pool.length === 0) {
    alert(`No questions available for ${selectedSubject}`);
    return;
  }

  pool = shuffleArray([...pool]);
  gameQuizQuestions = pool.slice(0, total);

  gameQuizIndex = 0;
  gameQuizScore = 0;

  document.getElementById('totalQuiz').textContent = gameQuizQuestions.length;
  document.getElementById('quizStartScreen').style.display = 'none';
  document.getElementById('quizGameScreen').style.display = 'block';
  document.getElementById('quizResultScreen').style.display = 'none';

  showGameQuizQuestion();
}


document.addEventListener("DOMContentLoaded", () => {
  selectedSubject = "All";
});




function selectSubject(subject, btn){
  selectedSubject = subject;
  gameQuizIndex = 0;
  gameQuizScore = 0;
  gameQuizQuestions = [];

  document.getElementById('quizGameScreen').style.display = 'none';
  document.getElementById('quizResultScreen').style.display = 'none';
  document.getElementById('quizStartScreen').style.display = 'block';

  document.querySelectorAll(".subject-btn").forEach(b => {
    b.classList.remove("active");
  });
  btn.classList.add("active");
}



function shuffleArray(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resetQuizState(){
  currentQuestionIndex = 0;
  score = 0;
  quizQuestionsFiltered = [];

  quizGameScreen.style.display = "none";
  quizResultScreen.style.display = "none";
  quizStartScreen.style.display = "block";
}



function showGameQuizQuestion() {
  const q = gameQuizQuestions[gameQuizIndex];

  document.getElementById("quizQuestion").textContent = q.question;
  document.getElementById("quizCount").textContent = gameQuizIndex + 1;

  const container = document.getElementById("quizOptions");
  container.innerHTML = "";

  const options = shuffleArray([...q.options]);

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    btn.onclick = () => {
      if (opt === q.answer) gameQuizScore++;

      gameQuizIndex++;

      if (gameQuizIndex < gameQuizQuestions.length) {
        showGameQuizQuestion();
      } else {
        showGameQuizResult();
      }
    };

    container.appendChild(btn);
  });
}



function showGameQuizResult(){
  document.getElementById('quizGameScreen').style.display = 'none';
  document.getElementById('quizResultScreen').style.display = 'block';
  document.getElementById('quizScore').textContent = `${gameQuizScore} / ${gameQuizQuestions.length}`;
}




/* ---------- MATH SPEED ---------- */

let mathTimerInterval = null;
let mathTimeLeft = 30;
let mathCurrentAnswer = 0;
let mathScore = 0;
let mathHighScore = Number(localStorage.getItem("mathHighScore") || 0);
const mathHighScoreEl = document.getElementById && document.getElementById("mathHighScore");
if (mathHighScoreEl) mathHighScoreEl.textContent = mathHighScore;

function startMathGame(){
  clearInterval(mathTimerInterval);
  mathTimeLeft = 30;
  mathScore = 0;
  const timerEl = document.getElementById("mathTimer");
  const scoreEl = document.getElementById("mathScore");
  if(timerEl) timerEl.textContent = mathTimeLeft;
  if(scoreEl) scoreEl.textContent = mathScore;

  document.getElementById && (document.getElementById("mathAnswer").value = "");

  generateMathQuestion();

  mathTimerInterval = setInterval(() => {
    mathTimeLeft--;
    if(timerEl) timerEl.textContent = mathTimeLeft;
    if(mathTimeLeft <= 0){
      clearInterval(mathTimerInterval);
      endMathGame(); 
    }
  }, 1000);

  const input = document.getElementById("mathAnswer");
  if (input) input.focus();


}




function generateMathQuestion(){
  const difficultyEl = document.getElementById("mathDifficulty");
  const difficulty = difficultyEl ? difficultyEl.value : "medium";

  let a, b, ops;

  if(difficulty === "easy"){
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    ops = ['+','-'];
  }
  else if(difficulty === "medium"){
    a = Math.floor(Math.random() * 30) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    ops = ['+','-','*'];
  }
  else { 
    a = Math.floor(Math.random() * 100) + 1;
    b = Math.floor(Math.random() * 50) + 1;
    ops = ['+','-','*'];
  }

  const op = ops[Math.floor(Math.random() * ops.length)];
  let answer = 0;
  if(op === '+') answer = a + b;
  if(op === '-') answer = a - b;
  if(op === '*') answer = a * b;

  mathCurrentAnswer = answer;
  const qEl = document.getElementById("mathQuestion");
  if(qEl) qEl.textContent = `${a} ${op} ${b}`;
}

function submitMathAnswer(){
  const val = Number(document.getElementById("mathAnswer").value);
  if(isNaN(val)) return;

  if(val === mathCurrentAnswer){
    mathScore++;
    const scoreEl = document.getElementById("mathScore");
    if(scoreEl) scoreEl.textContent = mathScore;
  }

  document.getElementById("mathAnswer").value = "";
  generateMathQuestion();
}


function endMathGame(){

  if(mathTimerInterval) { clearInterval(mathTimerInterval); mathTimerInterval = null; }

  const finalScoreEl = document.getElementById("mathFinalScore");
  if(finalScoreEl) finalScoreEl.textContent = mathScore;

  let newHigh = false;
  if(mathScore > mathHighScore){
    mathHighScore = mathScore;
    localStorage.setItem("mathHighScore", mathHighScore);
    newHigh = true;

    const highEl = document.getElementById("mathHighScore");
    if(highEl) highEl.textContent = mathHighScore;
  }

  const highText = document.getElementById("mathHighScoreText");
  if(highText){
    if(newHigh) highText.innerHTML = "🎉 NEW HIGH SCORE: " + mathHighScore;
    else highText.textContent = "🏆 High Score: " + mathHighScore;
  }

  const modal = document.getElementById("mathEndModal");
  if(modal) modal.style.display = "flex";
}

function resetMathGameFully(){

  if (mathTimerInterval) {
    clearInterval(mathTimerInterval);
    mathTimerInterval = null;
  }

  mathTimeLeft = 30;
  mathScore = 0;
  mathCurrentAnswer = 0;

  const timerEl = document.getElementById("mathTimer");
  const scoreEl = document.getElementById("mathScore");
  const questionEl = document.getElementById("mathQuestion");
  const inputEl = document.getElementById("mathAnswer");

  if (timerEl) timerEl.textContent = "30";
  if (scoreEl) scoreEl.textContent = "0";
  if (questionEl) questionEl.textContent = "";
  if (inputEl) inputEl.value = "";
}

function closeMathEndModal(){
  const modal = document.getElementById("mathEndModal");
  if (modal) modal.style.display = "none";

  resetMathGameFully();

  document.getElementById("game-math").style.display = "block";

  const input = document.getElementById("mathAnswer");
  if (input) input.focus();
}




function restartMathFromModal(){
  closeMathEndModal();
  resetMathGameFully();
  startMathGame();

  const input = document.getElementById("mathAnswer");
  if(input) input.focus();
}


function finishMathEarly(){
  endMathGame();
}


document.addEventListener("keydown", function(e){
  if (
    document.getElementById("game-math")?.style.display === "block" &&
    e.key === "Enter"
  ) {
    e.preventDefault();
    submitMathAnswer();
  
    const input = document.getElementById("mathAnswer");
    if (input) input.focus();
  }
  if (
  document.getElementById("game-math")?.style.display === "block" &&
  e.key === "Escape"
) {
  e.preventDefault();
  closeGame();
}

});




/* ----- MEMORY CARD GAME ------ */

let memoryCards = [];
let memoryFlipped = [];
let memoryScore = 0;
let matchedPairs = 0;

function startMemoryGame(){
  const symbols = ['🍎','🍌','🍇','🍓','🍊','🍍','🥝','🍑'];

  memoryCards = symbols.concat(symbols).sort(() => Math.random() - 0.5);
  memoryFlipped = [];
  memoryScore = 0;
  matchedPairs = 0;

  document.getElementById("memoryScore").textContent = memoryScore;

  const board = document.getElementById("memoryBoard");
  board.innerHTML = "";

  memoryCards.forEach((symbol) => {
    const card = document.createElement("button");
    card.className = "game-card";
    card.style.fontSize = "22px";
    card.style.padding = "18px";
    card.textContent = "❓";

    card.onclick = () => flipMemoryCard(card, symbol);
    board.appendChild(card);
  });
}

function flipMemoryCard(card, symbol){
  if(card.textContent !== "❓") return;
  if(memoryFlipped.length === 2) return;

  card.textContent = symbol;
  memoryFlipped.push(card);

  if(memoryFlipped.length === 2){
    const [first, second] = memoryFlipped;

    if(first.textContent === second.textContent){
      memoryScore++;
      matchedPairs++;
      document.getElementById("memoryScore").textContent = memoryScore;
      memoryFlipped = [];
      if(matchedPairs === 8){
        setTimeout(() => {
          document.getElementById("memoryFinalScore").textContent = memoryScore;
          document.getElementById("memoryWinModal").style.display = "flex";
        }, 500);
      }
    } 
    else {
      setTimeout(() => {
        first.textContent = "❓";
        second.textContent = "❓";
        memoryFlipped = [];
      }, 700);
    }
  }
}

function closeMemoryWinModal(){
  document.getElementById("memoryWinModal").style.display = "none";
}

function restartMemoryFromWin(){
  closeMemoryWinModal();
  startMemoryGame();
}


/* WORD GUESS GAME */
let wgList = Array.isArray(wordList) ? wordList : [];
let wgWord = "";
let wgDisplay = [];
let wgAttempts = 6;
let wgUsed = [];
let wgHighScore = parseInt(localStorage.getItem("wgHighScore") || "0", 10) || 0;
let wgPopupType = "info";


function wgStart() {
  if (!Array.isArray(wgList) || wgList.length === 0) {
    console.warn("Word list empty or missing.");
    document.getElementById("wg-word").textContent = "";
    document.getElementById("wg-attempts").textContent = "0";
    document.getElementById("wg-used").textContent = "";
    return;
  }

  const randomIndex = Math.floor(Math.random() * wgList.length);
  wgWord = wgList[randomIndex].toUpperCase().replace(/[^A-Z]/g,"");
  wgDisplay = Array.from({length: wgWord.length}).map(_ => "_");
  wgAttempts = 6;
  wgUsed = [];

  const wordEl = document.getElementById("wg-word");
  if (wordEl) wordEl.textContent = wgDisplay.join(" ");
  const attemptsEl = document.getElementById("wg-attempts");
  if (attemptsEl) attemptsEl.textContent = wgAttempts;
  const usedEl = document.getElementById("wg-used");
  if (usedEl) usedEl.textContent = "";
  const input = document.getElementById("wg-input");
  if (input) input.focus();
  
  
}

function wgGuess() {
   if (wgAttempts <= 0 || !wgDisplay.includes("_")) {
    return;
  }

  const input = document.getElementById("wg-input");
  if (!input) return;
  let letter = input.value.toUpperCase().trim();
  input.value = "";

  if (!/^[A-Z]$/.test(letter)) {
    showWgPopup("⚠ Enter only ONE letter (A–Z).", "warn");
    return;
  }

  if (wgUsed.includes(letter) || wgDisplay.includes(letter)) {
    showWgPopup(`⚠ Letter '${letter}' already used.`, "warn");
    return;
  }

  let correct = false;
  for (let i = 0; i < wgWord.length; i++) {
    if (wgWord[i] === letter) {
      wgDisplay[i] = letter;
      correct = true;
    }
  }

  if (!correct) {
    wgAttempts--;
    wgUsed.push(letter);
  }

  const wordEl = document.getElementById("wg-word");
  if (wordEl) wordEl.textContent = wgDisplay.join(" ");
  const attemptsEl = document.getElementById("wg-attempts");
  if (attemptsEl) attemptsEl.textContent = wgAttempts;
  const usedEl = document.getElementById("wg-used");
  if (usedEl) usedEl.textContent = wgUsed.join(", ");


  if (!wgDisplay.includes("_")) {
    const score = wgAttempts;
    if (score > wgHighScore) {
      wgHighScore = score;
      localStorage.setItem("wgHighScore", String(wgHighScore));
      const hsEl = document.getElementById("wg-highscore");
      if (hsEl) hsEl.textContent = wgHighScore;
    }
    showWgPopup("🎉 YOU WON! WORD: " + wgWord, "win");
    return;
  }

  if (wgAttempts <= 0) {
    showWgPopup("❌ GAME OVER! WORD WAS: " + wgWord, "lose");
    return;
  }
}

function showWgPopup(message, type) {
  wgPopupType = type;

  const input = document.getElementById("wg-input");
  if (input) input.blur();


  const popup = document.getElementById("wgPopup");
  if (!popup) {
    alert(message);
    return;
  }

  document.getElementById("wgPopupText").textContent = message;

  const retry = document.getElementById("wgRetryBtn");
  const playAgain = document.getElementById("wgPlayAgainBtn");
  const ok = document.getElementById("wgOkBtn");

  retry.style.display = "none";
  playAgain.style.display = "none";
  ok.style.display = "none";

  if (type === "lose") retry.style.display = "inline-block";
  else if (type === "win") playAgain.style.display = "inline-block";
  else ok.style.display = "inline-block";

  popup.style.display = "flex";
}

function wgPlayAgain(){
  const popup = document.getElementById("wgPopup");
  if (popup) popup.style.display = "none";

  resetWordGuessFully();
  wgStart();

  wgPopupType = "info";
}



function closeWgPopup(){
  const popup = document.getElementById("wgPopup");
  if (popup) popup.style.display = "none";

  if (wgPopupType === "win" || wgPopupType === "lose") {
    resetWordGuessFully();
  }

  wgPopupType = "info";

  document.getElementById("game-word").style.display = "block";

  document.getElementById("wg-input")?.focus();
}



function closeGame(){

  resetMathGameFully();
  resetWordGuessFully();

  document.querySelectorAll('#games .game-screen')
    .forEach(el => el.style.display = 'none');

  document.getElementById('gamesHub').style.display = 'grid';
}


document.addEventListener("DOMContentLoaded", () => {
  const hsEl = document.getElementById("wg-highscore");
  if (hsEl) hsEl.textContent = wgHighScore;
});

function resetWordGuessFully(){

  wgWord = "";
  wgDisplay = [];
  wgAttempts = 6;
  wgUsed = [];

  const wordEl = document.getElementById("wg-word");
  const attemptsEl = document.getElementById("wg-attempts");
  const usedEl = document.getElementById("wg-used");
  const inputEl = document.getElementById("wg-input");
  const popup = document.getElementById("wgPopup");

  if (wordEl) wordEl.textContent = "";
  if (attemptsEl) attemptsEl.textContent = "6";
  if (usedEl) usedEl.textContent = "";
  if (inputEl) inputEl.value = "";
  if (popup) popup.style.display = "none";
}

document.addEventListener("keydown", function(e){
  const popup = document.getElementById("wgPopup");
  const game = document.getElementById("game-word");

  if (popup?.style.display === "flex" && e.key === "Escape") {
    e.preventDefault();
    closeWgPopup();
    return;
  }

  if (game?.style.display === "block" && e.key === "Enter") {
    e.preventDefault();
    wgGuess();
    document.getElementById("wg-input")?.focus();
  }

  if (game?.style.display === "block" && e.key === "Escape") {
    e.preventDefault();
    closeGame();
  }
});




// TO-DO-LIST EDIT MODAL

let editingTodoIndex = null;

function editTodo(i){
  if (typeof i !== 'number' || !todos[i]) return;
  editingTodoIndex = i;

  const item = todos[i];
  document.getElementById("editTodoTask").value = item.task || "";
  document.getElementById("editTodoDate").value = item.date || "";
  document.getElementById("editTodoPriority").value = item.priority || "Low";

  const modal = document.getElementById("todoEditModal");
  if (modal) modal.style.display = "flex";
}

function closeTodoEditModal(){
  editingTodoIndex = null;
  const modal = document.getElementById("todoEditModal");
  if(modal) modal.style.display = "none";
}

document.getElementById("saveTodoEditBtn").addEventListener("click", function(){
  if (editingTodoIndex === null) return closeTodoEditModal();

  const newTask = document.getElementById("editTodoTask").value.trim();
  const newDate = document.getElementById("editTodoDate").value;
  const newPriority = document.getElementById("editTodoPriority").value;

  if (!newTask || !newDate) {
  showTodoAlert();
  return;
}



  todos[editingTodoIndex].task = newTask;
  todos[editingTodoIndex].date = newDate;
  todos[editingTodoIndex].priority = newPriority;

  saveTodos();
  renderTodos();
  closeTodoEditModal();
});

function closeTodoAlert(){
  document.getElementById("todoAlert").style.display = "none";
  document.getElementById("editTodoTask")?.focus();
}


window.addEventListener("click", function(e){
  const modal = document.getElementById("todoEditModal");
  if (!modal) return;
  if (e.target === modal) closeTodoEditModal();
});


function showTodoAlert(){
  document.getElementById("todoAlert").style.display = "flex";
}

function closeTodoAlert(){
  document.getElementById("todoAlert").style.display = "none";
}

function showHabitAlert(message){
  const alertBox = document.getElementById("habitAlert");
  const msg = document.getElementById("habitAlertMsg");

  if(msg) msg.textContent = message;
  if(alertBox) alertBox.style.display = "flex";
}

function closeHabitAlert(){
  const alertBox = document.getElementById("habitAlert");
  if(alertBox) alertBox.style.display = "none";
}

function showHabitEmptyAlert(){
  document.getElementById("habitEmptyAlert").style.display = "flex";
}

function closeHabitEmptyAlert(){
  document.getElementById("habitEmptyAlert").style.display = "none";
}

function showNoteEmptyAlert(){
  document.getElementById("noteEmptyAlert").style.display = "flex";
}

function closeNoteEmptyAlert(){
  document.getElementById("noteEmptyAlert").style.display = "none";
}
