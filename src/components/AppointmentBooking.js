import React, { useState, useEffect } from "react";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
import axios from "axios";

const localizer = momentLocalizer(moment);

const durationOptions = [30, 60, 120];

// Function to fetch available slots from the APIs
const fetchAvailableSlots = async (duration, quantity) => {
  try {
    // Fetch data from the APIs
    const businessHoursResponse = await axios.get(
      "http://api.internship.appointy.com:8000/v1/business-hours"
    );
    const blockingHoursResponse = await axios.get(
      "http://api.internship.appointy.com:8000/v1/block-hours"
    );
    const appointmentsResponse = await axios.get(
      "http://api.internship.appointy.com:8000/v1/appointments"
    );

    // Extract data from the API responses
    const businessHours = businessHoursResponse.data;
    const blockingHours = blockingHoursResponse.data;
    const appointments = appointmentsResponse.data;

    // Get available slots
    const slots = getAvailableSlots(
      duration,
      quantity,
      businessHours,
      blockingHours,
      appointments
    );

    return slots;
  } catch (error) {
    console.log("Error fetching data:", error);
    return [];
  }
};

// Function to calculate available slots based on fetched data
const getAvailableSlots = (duration, quantity, businessHours, blockingHours, appointments) => {
  const slots = businessHours.flatMap((businessHour) => {
    const startTime = moment(`2023-08-05T${businessHour.start_time}`, "YYYY-MM-DD hh:mm a");
    const endTime = moment(`2023-08-05T${businessHour.end_time}`, "YYYY-MM-DD hh:mm a");
    const availableSlots = [];

    while (startTime + duration * 60 * 1000 <= endTime) {
      const slot = {
        start_time: startTime.format("hh:mm a"),
        end_time: startTime.add(duration, "minutes").format("hh:mm a"),
      };

      const isBlocked = blockingHours.some(
        (blockingHour) =>
          startTime.isBetween(
            moment(`2023-08-05T${blockingHour.start_time}`, "YYYY-MM-DD hh:mm a"),
            moment(`2023-08-05T${blockingHour.end_time}`, "YYYY-MM-DD hh:mm a")
          )
      );

      const isOverlapping = appointments.some(
        (appointment) =>
          startTime.isBetween(
            moment(`2023-08-05T${appointment.start_time}`, "YYYY-MM-DD hh:mm a"),
            moment(`2023-08-05T${appointment.end_time}`, "YYYY-MM-DD hh:mm a")
          ) ||
          startTime.add(duration, "minutes").isBetween(
            moment(`2023-08-05T${appointment.start_time}`, "YYYY-MM-DD hh:mm a"),
            moment(`2023-08-05T${appointment.end_time}`, "YYYY-MM-DD hh:mm a")
          )
      );

      if (!isBlocked && !isOverlapping && businessHour.quantity >= quantity) {
        availableSlots.push(slot);
      }

      startTime.add(30, "minutes");
    }

    return availableSlots;
  });

  return slots;
};

const AppointmentBooking = () => {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedQuantity, setSelectedQuantity] = useState(2);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    // Fetch available slots when duration or quantity changes
    const fetchData = async () => {
      const slots = await fetchAvailableSlots(selectedDuration, selectedQuantity);
      setAvailableSlots(slots);
    };
    fetchData();
  }, [selectedDuration, selectedQuantity]);

  return (
    <div>
      <h1>Appointment Booking</h1>
      <div>
        <label htmlFor="duration">Select Duration:</label>
        <select
          id="duration"
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
        >
          {durationOptions.map((duration) => (
            <option key={duration} value={duration}>
              {duration} min
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="quantity">Select Quantity:</label>
        <input
          type="number"
          id="quantity"
          value={selectedQuantity}
          onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
        />
      </div>
      <h2>Available Slots</h2>
      <ul>
        {availableSlots.map((slot, index) => (
          <li key={index}>
            {slot.start_time} - {slot.end_time}
          </li>
        ))}
      </ul>
      <Calendar
        localizer={localizer}
        events={availableSlots.map((slot) => ({
          title: `Available`,
          start: new Date(`2023-08-05T${slot.start_time}`),
          end: new Date(`2023-08-05T${slot.end_time}`),
        }))}
        defaultView="day"
        defaultDate={new Date("2023-08-05")}
        style={{ height: "400px" }}
      />
    </div>
  );
};

export default AppointmentBooking;
