import React, { useEffect, useState } from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdLocationPin,
  MdGroup,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  parseISO,
  startOfToday,
  isWithinInterval,
} from "date-fns";
import axios from "axios";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const CalendarView = () => {
  let today = startOfToday();
  const [selectedDay, setSelectedDay] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"));
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
  const [hallNames, setHallNames] = useState([]);
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_SERVER_URL}/events`,
          { headers: { Accept: "application/json" } }
        );
        setEvents(res.data.bookings);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/halls`);
        setHallNames(res.data.halls);
      } catch (err) {
        console.error("Error fetching halls:", err);
      }
    };
    fetchHalls();
  }, []);

  const handleHallSelection = (hallName) => {
    setSelectedHalls((prev) =>
      prev.includes(hallName)
        ? prev.filter((hall) => hall !== hallName)
        : [...prev, hallName]
    );
  };

  const isHallSelected = (hallName) => selectedHalls.includes(hallName);

  const filteredEvents =
    selectedHalls.length > 0
      ? events.filter((e) => selectedHalls.includes(e.bookedHallName))
      : events;

  const days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  const previousMonth = () =>
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: -1 }), "MMM-yyyy"));
  const nextMonth = () =>
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: 1 }), "MMM-yyyy"));

  const selectedDayMeetings = filteredEvents.filter((booking) => {
    const eventStartDate = parseISO(booking.eventStartDate);
    const eventEndDate = parseISO(booking.eventEndDate);
    const eventDate = parseISO(booking.eventDate);
    const type = booking.eventDateType;

    if (type === "full" || type === "half") {
      return isSameDay(eventDate, selectedDay);
    } else if (type === "multiple") {
      return (
        isWithinInterval(selectedDay, { start: eventStartDate, end: eventEndDate }) ||
        isSameDay(eventStartDate, selectedDay)
      );
    }
    return false;
  });

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100">
      <div className="flex-grow container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="bg-white shadow rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Filters
            </h2>
            <h3 className="text-base font-bold text-indigo-600 mb-3">By Hall</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedHalls([])}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  selectedHalls.length === 0
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {hallNames.map((hall) => (
                <button
                  key={hall.id}
                  onClick={() => handleHallSelection(hall.name)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    isHallSelected(hall.name)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {hall.name}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white shadow rounded-2xl p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                {format(firstDayCurrentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                >
                  <MdChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                >
                  <MdChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center text-gray-500 font-semibold mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => (
                <div key={day.toString()} className="text-center">
                  <button
                    onClick={() => setSelectedDay(day)}
                    className={classNames(
                      "w-full h-9 rounded-full flex items-center justify-center transition",
                      isEqual(day, selectedDay) &&
                        "bg-indigo-600 text-white font-semibold",
                      !isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "text-red-500 font-bold",
                      !isEqual(day, selectedDay) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-gray-800",
                      !isEqual(day, selectedDay) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-gray-400",
                      !isEqual(day, selectedDay) && "hover:bg-gray-200"
                    )}
                  >
                    <time dateTime={format(day, "yyyy-MM-dd")}>
                      {format(day, "d")}
                    </time>
                  </button>

                  {/* Dots */}
                  <div className="flex justify-center mt-1 space-x-1">
                    {filteredEvents.map((booking) => {
                      const date = parseISO(booking.eventDate);
                      if (
                        booking.eventDateType === "full" &&
                        isSameDay(date, day)
                      ) {
                        return (
                          <span
                            key={booking._id + "-full"}
                            className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                          />
                        );
                      }
                      if (
                        booking.eventDateType === "half" &&
                        isSameDay(date, day)
                      ) {
                        return (
                          <span
                            key={booking._id + "-half"}
                            className="w-1.5 h-1.5 bg-green-600 rounded-full"
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          <div className="bg-white shadow rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Schedule for{" "}
              <time dateTime={format(selectedDay, "yyyy-MM-dd")}>
                {format(selectedDay, "MMM dd, yyyy")}
              </time>
            </h2>
            <div className="h-80 overflow-y-auto">
              {selectedDayMeetings.length > 0 ? (
                selectedDayMeetings.map((ev) => (
                  <Meeting key={ev._id} events={ev} />
                ))
              ) : (
                <p className="text-gray-500 text-sm">No events for today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Meeting({ events }) {
  const navigate = useNavigate();
  return (
    <li className="bg-gray-50 rounded-xl p-4 mb-3 shadow hover:shadow-md transition">
      <h3 className="text-lg font-bold text-gray-800">{events.eventName}</h3>
      <p className="text-sm text-gray-600 flex items-center mt-1">
        <MdLocationPin className="mr-1" /> {events.bookedHallName}
      </p>
      <p className="text-sm text-gray-600 flex items-center mt-1">
        <MdGroup className="mr-1" /> {events.eventManager}
      </p>
      <button
        onClick={() => navigate(`/bookingsView/${events._id}`)}
        className="mt-3 px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
      >
        View Details
      </button>
    </li>
  );
}
