// ------------------ 🌟 Element References ------------------
const countdown = document.getElementById("countdown");
setInterval(() => {

  // next slot countdown

}, 1000);

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const calendar = document.getElementById("calendar");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const slotsContainer = document.getElementById("slotsContainer");
const dateContent = document.getElementById("dateContent");


let storedResults = {};
let selectedDayDiv = null; // Track clicked day

// ------------------ ⏰ Time Helpers ------------------
function getTodayIST() {
  return new Date();
}

// ------------------ 🧭 Floating Date Bar ------------------
setInterval(() => {
  const now = getTodayIST();
  dateContent.textContent = `📅 ${now.toDateString()} | ⏰ ${now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })}`;
}, 1000);

// ------------------ 🗓️ Calendar Rendering ------------------
let currentDate = getTodayIST();
renderCalendar(currentDate);


const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

months.forEach((m, i) => {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = m;
  monthSelect.appendChild(option);
});

for (let y = 2000; y <= 2035; y++) {
  const option = document.createElement("option");
  option.value = y;
  option.textContent = y;
  yearSelect.appendChild(option);
}

monthSelect.value = currentDate.getMonth();
yearSelect.value = currentDate.getFullYear();

monthSelect.addEventListener("change", () => {
  currentDate.setMonth(parseInt(monthSelect.value));
  renderCalendar(currentDate);
});

yearSelect.addEventListener("change", () => {
  currentDate.setFullYear(parseInt(yearSelect.value));
  renderCalendar(currentDate);
});


document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
 
  monthSelect.value = month;
  yearSelect.value = year;
  calendar.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Week headers
  weekdays.forEach(day => {
    const div = document.createElement("div");
    div.textContent = day;
    div.classList.add("header-day");
    calendar.appendChild(div);
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement("div");
    calendar.appendChild(emptyDiv);
  }

  const today = getTodayIST();

  // Calendar day cells
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement("div");
    const dateObj = new Date(year, month, i);
    dayDiv.textContent = i;

    // Mark today's date
    if (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    ) {
      dayDiv.classList.add("today");
    }

    // Handle date click
    dayDiv.addEventListener("click", () => {
      generateSlots(dateObj);

      // Remove previous selection highlight

      if (selectedDayDiv) selectedDayDiv.classList.remove("selected-day");
      dayDiv.classList.add("selected-day");
      selectedDayDiv = dayDiv;
    });

    calendar.appendChild(dayDiv);
  }
}

// ------------------ 🕓 Slot Generation ------------------
function formatKey(dateObj, slotDate) {
  const date =
    `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

  const time = slotDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).toLowerCase();

  return `${date}_${time}`;
}

function generateSlots(dateObj) {
  selectedDateTitle.textContent = `🎯 Slots for ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
  slotsContainer.innerHTML = "";

  const start = new Date(dateObj);
  start.setHours(8, 0, 0, 0);

  const end = new Date(dateObj);
  end.setHours(22, 0, 0, 0);

  const now = getTodayIST();
  let slotNum = 1;

  while (start < end) {
    const slot = document.createElement("div");
    slot.classList.add("slot");

    const timeStr = start.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toLowerCase();

    const key = formatKey(dateObj, start);


    console.log("KEY =", key);
    console.log("RESULT =", storedResults[key]);

    const slotLeft = document.createElement("div");
    slotLeft.classList.add("slot-left");
    slotLeft.innerHTML = `
    <div class="slot-label">Slot ${slotNum}</div>
    <div class="slot-time">${timeStr}</div>
  `;

    const slotRight = document.createElement("div");
    slotRight.classList.add("slot-result");

    const slotTime = new Date(start);
    const isPastSlot = slotTime.getTime() < now.getTime();

    if (isPastSlot) {
      slotRight.textContent = storedResults[key] || "00";
      slotRight.style.background = "#c8facc";
    } else {
      slotRight.textContent = "Waiting Result";
      slotRight.style.background = "#fff3cd";
    }

    slot.appendChild(slotLeft);
    slot.appendChild(slotRight);
    slotsContainer.appendChild(slot);

    start.setMinutes(start.getMinutes() + 20);
    slotNum++;
  }
}



// ------------------ 🚀 Auto Load & Refresh ------------------
const today = getTodayIST();



async function loadResults() {
  try {
    const response = await fetch("/api/results");
    storedResults = await response.json();

    console.log("ALL RESULTS =", storedResults);
  } catch (err) {
    console.error("Error loading results", err);
  }
}
loadResults().then(() => {

  generateSlots(today);

  renderCalendar(today);

});
// Refresh every minute to show new slot results
setInterval(() => {
  const current = getTodayIST();
  const title = selectedDateTitle.textContent;
  if (title.includes(`${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`)) {
    generateSlots(current);
  }
}, 60000);








setInterval(async () => {

  await loadResults();

  const current = getTodayIST();

  if (
    selectedDateTitle.textContent.includes(
      `${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`
    )
  ) {
    generateSlots(current);
  }

}, 5000);


function formatKey(dateObj, slotDate) {
  const date =
    `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

  const time = slotDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).toLowerCase();

  return `${date}_${time}`;
}