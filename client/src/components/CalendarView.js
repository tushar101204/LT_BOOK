import React, { useEffect, useState } from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdLocationPin,
  MdToday,
  MdSchedule,
  MdGroup,
  MdDateRange,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
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
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/events`, {
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        });
        setEvents(response.data.bookings);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchHallNames = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/halls`);
        setHallNames(response.data.halls);
      } catch (error) {
        console.error("Error fetching hall names:", error);
      }
    };
    fetchHallNames();
  }, []);

  const handleHallSelection = (hallName) => {
    setSelectedHalls((prev) =>
      prev.includes(hallName) ? prev.filter((hall) => hall !== hallName) : [...prev, hallName]
    );
  };

  const isHallSelected = (hallName) => selectedHalls.includes(hallName);

  const filteredEvents = selectedHalls.length > 0
    ? events.filter((event) => selectedHalls.includes(event.bookedHallName))
    : events;

  const days = eachDayOfInterval({ start: firstDayCurrentMonth, end: endOfMonth(firstDayCurrentMonth) });

  const previousMonth = () => {
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: -1 }), "MMM-yyyy"));
  };

  const nextMonth = () => {
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: 1 }), "MMM-yyyy"));
  };

  const selectedDayMeetings = filteredEvents.filter((booking) => {
    const eventStartDate = parseISO(booking.eventStartDate);
    const eventEndDate = parseISO(booking.eventEndDate);
    const eventDate = parseISO(booking.eventDate);
    const eventDateType = booking.eventDateType;

    if (eventDateType === "full" || eventDateType === "half") {
      return isSameDay(eventDate, selectedDay);
    } else if (eventDateType === "multiple") {
      return isWithinInterval(selectedDay, { start: eventStartDate, end: eventEndDate }) || isSameDay(eventStartDate, selectedDay);
    }

    return false;
  });

  return (
    <div className="my-12 mx-auto max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filter Section */}
        <div className="md:col-span-1 p-4 bg-white shadow-lg rounded-lg">
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">Filters</h1>
          <h2 className="text-lg font-bold text-indigo-700 mb-3">By Hall Name</h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={`py-1 px-3 rounded-full mb-2 ${selectedHalls.length === 0 ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800"}`}
              onClick={() => setSelectedHalls([])}
            >
              All
            </button>
            {hallNames.map((hall) => (
              <button
                key={hall.id}
                className={`py-1 px-3 rounded-full mb-2 ${isHallSelected(hall.name) ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800"}`}
                onClick={() => handleHallSelection(hall.name)}
              >
                {hall.name}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="col-span-2 p-4 bg-white shadow-lg rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {format(firstDayCurrentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex space-x-2">
              <button onClick={previousMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <MdChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button onClick={nextMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <MdChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-gray-600 mb-2 font-semibold">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => (
              <div key={day.toString()} className="text-center">
                <button
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={classNames(
                    "w-full h-8 rounded-full flex items-center justify-center",
                    isEqual(day, selectedDay) && "bg-indigo-600 text-white",
                    !isEqual(day, selectedDay) && isToday(day) && "text-red-500",
                    !isEqual(day, selectedDay) && isSameMonth(day, firstDayCurrentMonth) && "text-gray-900",
                    !isEqual(day, selectedDay) && !isSameMonth(day, firstDayCurrentMonth) && "text-gray-400",
                    !isEqual(day, selectedDay) && "hover:bg-gray-200"
                  )}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>{format(day, "d")}</time>
                </button>
                <div className="flex justify-center mt-1 space-x-1">
                  {filteredEvents.map((booking) => {
                    const eventDate = parseISO(booking.eventDate);
                    const eventDateType = booking.eventDateType;

                    if (eventDateType === "full" && isSameDay(eventDate, day)) {
                      return <span key={booking.id} className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>;
                    } else if (eventDateType === "half" && isSameDay(eventDate, day)) {
                      return <span key={booking.id} className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>;
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events Section */}
        <div className="md:col-span-1 p-4 bg-white shadow-lg rounded-lg">
          <h2 className="font-semibold text-gray-900 mb-2">Schedule for <time dateTime={format(selectedDay, "yyyy-MM-dd")}>{format(selectedDay, "MMM dd, yyyy")}</time></h2>
          <div className="h-80 overflow-y-auto">
            {selectedDayMeetings.length > 0 ? (
              selectedDayMeetings.map((events) => (
                <Meeting events={events} key={events._id} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No events for today.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Meeting({ events }) {
  const navigate = useNavigate();

  const handleViewClick = (bookingId) => {
    navigate(`/bookingsView/${bookingId}`);
  };

  return (
    <li className="flex items-start bg-white shadow-md rounded-lg p-4 mb-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{events.eventName}</h2>
        <div className="text-sm text-gray-700 flex items-center mt-1">
          <MdLocationPin className="mr-1" /> {events.bookedHallName}
        </div>
        <div className="text-sm text-gray-700 flex items-center mt-1">
          <MdGroup className="mr-1" /> {events.eventManager} {/* Display Event Manager here */}
        </div>
        <button
          onClick={() => handleViewClick(events._id)}
          className="mt-4 px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 transition duration-200"
        >
          View Details
        </button>
      </div>
    </li>
  );
}

let colStartClasses = ["", "col-start-2", "col-start-3", "col-start-4", "col-start-5", "col-start-6", "col-start-7"];
