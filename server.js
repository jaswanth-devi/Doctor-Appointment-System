
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connect database
const db = new Database("database.db");

// Create appointments table
db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        doctor TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor, date, time)
    )
`);

// Home API
app.get("/api", (req, res) => {
    res.json({
        message: "CarePoint Appointment API is running"
    });
});

// Get all appointments
app.get("/api/appointments", (req, res) => {
    const appointments = db.prepare(
        "SELECT * FROM appointments ORDER BY date, time"
    ).all();

    res.json(appointments);
});

// Book appointment
app.post("/api/appointments", (req, res) => {

    const {
        patientName,
        email,
        phone,
        doctor,
        date,
        time,
        reason
    } = req.body;

    if (
        !patientName || !email || !phone ||
        !doctor || !date || !time
    ) {
        return res.status(400).json({
            message: "Please provide all required details"
        });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({
            message: "Enter a valid 10-digit phone number"
        });
    }

    try {

        const insert = db.prepare(`
            INSERT INTO appointments
            (patientName, email, phone, doctor, date, time, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insert.run(
            patientName.trim(),
            email.trim(),
            phone,
            doctor,
            date,
            time,
            reason || ""
        );

        res.status(201).json({
            message: "Appointment booked successfully",
            id: result.lastInsertRowid
        });

    } catch (error) {

        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({
                message: "This doctor already has an appointment at that time"
            });
        }

        console.error(error);

        res.status(500).json({
            message: "Unable to book appointment"
        });
    }
});

// Cancel appointment
app.delete("/api/appointments/:id", (req, res) => {

    const result = db.prepare(
        "DELETE FROM appointments WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Appointment not found"
        });
    }

    res.json({
        message: "Appointment cancelled successfully"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`CarePoint server running at http://localhost:${PORT}`);
});
