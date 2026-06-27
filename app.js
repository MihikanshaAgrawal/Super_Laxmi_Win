const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// ======================
// ADMIN SAVE / UPDATE RESULT
// ======================
app.post("/api/save-result", (req, res) => {
  const { key, number } = req.body;

  const [datePart, timePart] = key.split("_");

  // convert "06:40 pm" -> 24 hr
  let [time, ampm] = timePart.split(" ");
  let [hour, minute] = time.split(":");

  hour = parseInt(hour);
  minute = parseInt(minute);

  if (ampm === "pm" && hour !== 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  const [year, month, day] = datePart.split("-");

  const slotDateTime = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour,
    minute,
    0
  );

  // ❌ Past slot => no edit
  if (slotTime.getTime() <= now.getTime() && !results[key]) {
    return res.json({
      success: false,
      message: "Slot already passed"
    });
  }

  db.get(
    "SELECT * FROM results WHERE slot_key = ?",
    [key],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false
        });
      }

      if (row) {
        db.run(
          "UPDATE results SET number = ? WHERE slot_key = ?",
          [number, key],
          function (err) {
            if (err) {
              return res.status(500).json({
                success: false
              });
            }

            res.json({
              success: true,
              message: "Result updated"
            });
          }
        );
      } else {
        db.run(
          "INSERT INTO results(slot_key, number) VALUES (?, ?)",
          [key, number],
          function (err) {
            if (err) {
              return res.status(500).json({
                success: false
              });
            }

            res.json({
              success: true,
              message: "Result saved"
            });
          }
        );
      }
    }
  );
});

// ======================
// GET ALL RESULTS
// ======================
app.get("/api/results", (req, res) => {
  db.all("SELECT * FROM results", [], (err, rows) => {
    if (err) {
      return res.status(500).json({});
    }

    const results = {};
    const now = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata"
      })
    );

    console.log("SERVER TIME:", now);

    // DB ke saved results load karo
    rows.forEach((r) => {
      results[r.slot_key] = r.number;
    });

    // Aaj ke saare past slots ke random numbers generate karo
    for (let hour = 8; hour < 22; hour++) {
      for (let min of [0, 20, 40]) {
        const slotTime = new Date(now);
        slotTime.setHours(hour, min, 0, 0);

        const key =
          `${slotTime.getFullYear()}-${String(
            slotTime.getMonth() + 1
          ).padStart(2, "0")}-${String(
            slotTime.getDate()
          ).padStart(2, "0")}_` +
          slotTime
            .toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .toLowerCase();

        // Agar slot past hai aur result nahi hai
        if (slotTime.getTime() <= now.getTime() && !results[key]) {
          const random = String(
            Math.floor(Math.random() * 100)
          ).padStart(2, "0");

          results[key] = random;

          db.run(
            "INSERT OR REPLACE INTO results(slot_key, number, is_locked) VALUES (?, ?, 1)",
            [key, random]
          );
        }
      }
    }

    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});