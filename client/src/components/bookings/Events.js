import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { format } from "date-fns";

const Events = () => {
  const [eventData, setEventData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchQuery, setSearchQuery] = useState("");

  const getEventData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/events`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data.bookings;
      setEventData(data);
      setSortedData(data); // Set default unsorted data
      setIsLoading(false);

      if (response.status !== 200) {
        throw new Error(response.status);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const sortData = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = null;
      setSortedData(eventData); // Reset to original order
      setSortConfig({ key: null, direction: null });
      return;
    }
    setSortConfig({ key, direction });

    const sortedArray = [...eventData].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Specifically handle eventDate sorting
      if (key === "eventDate") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);

        if (!isNaN(aDate) && !isNaN(bDate)) {
          return direction === "ascending" ? aDate - bDate : bDate - aDate;
        }
        return 0; // Fallback for invalid dates
      }

      // Default string comparison for other columns
      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setSortedData(sortedArray);
  };

  const getSortingIcon = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === "ascending") {
        return "⬆"; // Up arrow
      }
      if (sortConfig.direction === "descending") {
        return "⬇"; // Down arrow
      }
    }
    return "⬍"; // Default icon
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();

    if (query === "") {
      setSortedData(eventData); // Reset to original data when search is cleared
    } else {
      const filteredData = eventData.filter((event) =>
        Object.values(event)
          .join(" ")
          .toLowerCase()
          .includes(lowerCaseQuery)
      );
      setSortedData(filteredData);
    }
  };

  useEffect(() => {
    getEventData();
  }, []);

  return (
    <div className="mt-6 min-h-screen">
      <h1 className="text-xl sm:text-3xl md:text-4xl text-center font-black leading-7 text-gray-800">
        Booking<span className="text-indigo-700"> History</span>
      </h1>

      {/* Search Bar */}
      <div className="mt-4 flex justify-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search events..."
          className="w-full max-w-md p-2 border border-gray-300 rounded-lg shadow-sm"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : sortedData.length ? (
        <div className="mt-8 mx-auto max-w-5xl">
          {/* Header Row */}
          <div className="flex justify-between items-center bg-indigo-100 p-4 rounded-lg mb-2 font-bold text-gray-700">
            <div
              className="w-1/5 cursor-pointer flex items-center"
              onClick={() => sortData("eventName")}
            >
              Event Name <span className="ml-2">{getSortingIcon("eventName")}</span>
            </div>
            <div
              className="w-1/5 cursor-pointer flex items-center"
              onClick={() => sortData("bookedHallName")}
            >
              Venue <span className="ml-2">{getSortingIcon("bookedHallName")}</span>
            </div>
            <div
              className="w-1/5 cursor-pointer flex items-center"
              onClick={() => sortData("organizingClub")}
            >
              Organizing Club <span className="ml-2">{getSortingIcon("organizingClub")}</span>
            </div>
            <div
              className="w-1/5 cursor-pointer flex items-center"
              onClick={() => sortData("eventDate")}
            >
              Event Date <span className="ml-2">{getSortingIcon("eventDate")}</span>
            </div>
            <div
              className="w-1/5 cursor-pointer flex items-center"
              onClick={() => sortData("eventManager")}
            >
              Coordinator Name <span className="ml-2">{getSortingIcon("eventManager")}</span>
            </div>
          </div>
          {/* Event Rows */}
          {sortedData.map((event) => (
            <div
              key={event._id}
              className="flex justify-between items-center bg-white p-4 shadow-md rounded-lg mb-4"
            >
              <div className="w-1/5 text-lg font-bold text-navy-500">{event.eventName}</div>
              <div className="w-1/5 text-sm text-gray-600">{event.bookedHallName}</div>
              <div className="w-1/5 text-sm text-gray-600">{event.organizingClub}</div>
              <div className="w-1/5 text-sm text-gray-600">
                {format(new Date(event.eventDate), "dd-MM-yyyy")}
              </div>
              <div className="w-1/5 text-sm text-gray-600">{event.eventManager}</div>
            </div>
          ))}
        </div>
      ) : (
        <h2 className="text-2xl font-bold text-zinc-700 text-center mt-10">
          No Upcoming Events.
        </h2>
      )}
    </div>
  );
};

export default Events;
