const pass = prompt("Enter Admin Password");

if (pass === null) {
  window.location.href = "/";
}

if (pass.trim() !== "narayan@2026") {
  document.body.innerHTML = "<h2>❌ Access Denied</h2>";
  throw new Error("Access Denied");
}

// ==========================
// Populate 12-hour time slots
// ==========================
const timeSelect = document.getElementById("admin-time");

for (let hour = 8; hour < 22; hour++) {
  for (let min of [0, 20, 40]) {
    const d = new Date();
    d.setHours(hour, min, 0, 0);

    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toLowerCase();

    const option = document.createElement("option");
    option.value = time;
    option.textContent = time;

    timeSelect.appendChild(option);
  }
}

const adminDate = document.getElementById("admin-date");
const adminTime = document.getElementById("admin-time");
const adminNumber = document.getElementById("admin-number");
const saveBtn = document.getElementById("save-result");

// ==========================
// Create key
// ==========================
function formatKey(dateObj, timeStr) {
  return `${dateObj.getFullYear()}-${String(
    dateObj.getMonth() + 1
  ).padStart(2, "0")}-${String(
    dateObj.getDate()
  ).padStart(2, "0")}_${timeStr}`;
}

// ==========================
// Save Result
// ==========================
saveBtn.addEventListener("click", async () => {
  const dateVal = adminDate.value;
  const timeVal = adminTime.value;
  const num = adminNumber.value.padStart(2, "0");

  if (!dateVal || !timeVal || !adminNumber.value) {
    alert("Fill all fields");
    return;
  }

  const dateObj = new Date(dateVal);

  const key = formatKey(dateObj, timeVal);

  console.log("Saving Key:", key);

  try {
    const response = await fetch("/api/save-result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        key,
        number: num
      })
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ Result Saved Successfully");
      adminNumber.value = "";
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error saving result");
  }
});