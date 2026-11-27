
const dateInput = document.getElementById("date");
const form = document.getElementById("appointmentForm");
const appointmentList = document.getElementById("appointmentList");

// Set minimum booking date
const today = new Date();
const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

dateInput.min = localToday;

// Select doctor
function selectDoctor(doctorName) {
    document.getElementById("doctor").value = doctorName;

    document.getElementById("booking").scrollIntoView({
        behavior: "smooth"
    });
}

// Display appointments from database
async function displayAppointments() {
    try {
        const response = await fetch("/api/appointments");

        if (!response.ok) {
            throw new Error("Unable to load appointments");
        }

        const appointments = await response.json();

        appointmentList.innerHTML = "";

        if (appointments.length === 0) {
            appointmentList.textContent =
                "No appointments booked yet.";
            return;
        }

        appointments.forEach(function(appointment) {

            const card = document.createElement("div");
            card.className = "appointment-card";

            const details = document.createElement("p");

            details.textContent =
                "Patient: " + appointment.patientName +
                " | Doctor: " + appointment.doctor +
                " | Date: " + appointment.date +
                " | Time: " + appointment.time;

            const cancelButton = document.createElement("button");

            cancelButton.textContent = "Cancel Appointment";
            cancelButton.className = "cancel-btn";

            cancelButton.addEventListener("click", function() {
                cancelAppointment(appointment.id);
            });

            card.appendChild(details);
            card.appendChild(cancelButton);

            appointmentList.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        appointmentList.textContent =
            "Unable to load appointments. Please refresh.";
    }
}

// Book appointment
form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const appointment = {
        patientName: document.getElementById("patientName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        doctor: document.getElementById("doctor").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        reason: document.getElementById("reason").value.trim()
    };

    if (appointment.date < localToday) {
        alert("Please select today or a future date.");
        return;
    }

    try {

        const response = await fetch("/api/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(appointment)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Booking failed");
        }

        alert("Appointment booked successfully!");

        form.reset();

        await displayAppointments();

    } catch (error) {
        alert(error.message);
    }

});

// Cancel appointment
async function cancelAppointment(id) {

    const confirmed = confirm(
        "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            "/api/appointments/" + encodeURIComponent(id),
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        alert("Appointment cancelled successfully!");

        await displayAppointments();

    } catch (error) {
        alert(error.message);
    }
}

// Load appointments when website opens
displayAppointments();
