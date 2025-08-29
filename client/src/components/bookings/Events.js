import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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
      setSortedData(data);
      setIsLoading(false);
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
      setSortedData(eventData);
      setSortConfig({ key: null, direction: null });
      return;
    }
    setSortConfig({ key, direction });

    const sortedArray = [...eventData].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === "eventDate") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return direction === "ascending" ? aDate - bDate : bDate - aDate;
      }

      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setSortedData(sortedArray);
  };

  const getSortingIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={16} />;
    if (sortConfig.direction === "ascending") return <ArrowUp size={16} />;
    if (sortConfig.direction === "descending") return <ArrowDown size={16} />;
    return <ArrowUpDown size={16} />;
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();

    if (query === "") {
      setSortedData(eventData);
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
    <div className="min-h-screen px-4 py-6">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
        Booking <span className="text-indigo-600">History</span>
      </h1>


      {/* Search Bar */}
      <div className="mt-6 flex justify-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search events..."
          className="w-full max-w-md p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : sortedData.length ? (
        <div className="mt-8 max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 bg-indigo-600 text-white font-semibold text-sm md:text-base p-4">
            <button
              className="flex items-center gap-2"
              onClick={() => sortData("eventName")}
            >
              Event Name {getSortingIcon("eventName")}
            </button>
            <button
              className="flex items-center gap-2"
              onClick={() => sortData("bookedHallName")}
            >
              Venue {getSortingIcon("bookedHallName")}
            </button>
            <button
              className="flex items-center gap-2"
              onClick={() => sortData("organizingClub")}
            >
              Organizing Club {getSortingIcon("organizingClub")}
            </button>
            <button
              className="flex items-center gap-2"
              onClick={() => sortData("eventDate")}
            >
              Event Date {getSortingIcon("eventDate")}
            </button>
            <button
              className="flex items-center gap-2"
              onClick={() => sortData("eventManager")}
            >
              Coordinator {getSortingIcon("eventManager")}
            </button>
          </div>

          {/* Scrollable Rows */}
          <div className="max-h-[500px] overflow-y-auto">
            {sortedData.map((event) => (
              <div
                key={event._id}
                className="grid grid-cols-5 items-center p-4 border-b hover:bg-gray-50 text-sm md:text-base"
              >
                <div className="font-semibold text-gray-800">{event.eventName}</div>
                <div className="text-gray-600">{event.bookedHallName}</div>
                <div className="text-gray-600">{event.organizingClub}</div>
                <div className="text-gray-600">
                  {format(new Date(event.eventDate), "dd-MM-yyyy")}
                </div>
                <div className="text-gray-600">{event.eventManager}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <h2 className="text-xl font-semibold text-gray-500 text-center mt-10">
          No Upcoming Events.
        </h2>
      )}
    </div>
  );
};

export default Events;
