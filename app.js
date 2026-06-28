const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

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

  const now = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata"
    })
  );

  if (slotDateTime.getTime() <= now.getTime()) {
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

    const juneStart = new Date(2026, 5, 1); // 1 June 2026
    

    for (
      let d = new Date(juneStart);
      d <= now;
      d.setDate(d.getDate() + 1)
    ) {
      for (let hour = 8; hour < 22; hour++) {
        for (let min of [0, 20, 40]) {

          const slotTime = new Date(d);
          slotTime.setHours(hour, min, 0, 0);

          const hours = slotTime.getHours();
          const minutes = String(slotTime.getMinutes()).padStart(2, "0");
          const h12 = hours % 12 || 12;
          const ampm = hours >= 12 ? "pm" : "am";

          const key =
            `${slotTime.getFullYear()}-${String(slotTime.getMonth() + 1).padStart(2, "0")}-${String(slotTime.getDate()).padStart(2, "0")}_${String(h12).padStart(2, "0")}:${minutes} ${ampm}`;

          if (!results[key]) {
            const random = String(
              Math.floor(Math.random() * 100)
            ).padStart(2, "0");

            results[key] = random;

            db.run(
              "INSERT OR IGNORE INTO results(slot_key, number, is_locked) VALUES (?, ?, 1)",
              [key, random]
            );
          }
        }
      }
    }

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