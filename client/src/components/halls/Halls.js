import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";

const Halls = () => {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getHallsData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/halls`,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      setHalls(response.data.halls || []);
      setIsLoading(false);
    } catch (error) {
      navigate("/login");
    }
  };

  useEffect(() => {
    getHallsData();
  }, []);

  const handleBookingClick = (hallId, hallName) => {
    navigate(`/bookingForm/${hallId}/${hallName}`);
  };

  const handleViewClick = () => {
    navigate(`/calendar`);
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="mt-6 min-h-screen flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
            Available <span className="text-indigo-600">Halls</span>
          </h1>

          {halls.length > 0 ? (
            <div className="w-11/12 md:w-4/5 overflow-x-auto shadow-lg rounded-lg">
              <table className="w-full bg-white border border-gray-200 rounded-lg shadow-md">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="py-4 px-6 text-left">Hall Name</th>
                    <th className="py-4 px-6 text-left">Location</th>
                    <th className="py-4 px-6 text-left">Capacity</th>
                    <th className="py-4 px-6 text-left">Amenities</th>
                    <th className="py-4 px-6 text-left">Description</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {halls.map((hall, index) => (
                    <tr
                      key={hall._id}
                      className={`${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-indigo-50 transition`}
                    >
                      <td className="py-4 px-6">{hall.name}</td>
                      <td className="py-4 px-6">{hall.location}</td>
                      <td className="py-4 px-6">{hall.capacity}</td>
                      <td className="py-4 px-6">{hall.amenities}</td>
                      <td className="py-4 px-6">{hall.description}</td>
                      <td className="py-4 px-6 text-center space-x-2">
                        <button
                          className="rounded-lg bg-indigo-500 text-white px-4 py-2 hover:bg-indigo-600"
                          onClick={() => handleBookingClick(hall._id, hall.name)}
                        >
                          Book Now
                        </button>
                        <button
                          className="rounded-lg border border-indigo-500 text-indigo-500 px-4 py-2 hover:bg-indigo-500 hover:text-white"
                          onClick={handleViewClick}
                        >
                          View Booking
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <h2 className="text-2xl font-semibold text-gray-600 mt-10">
              No halls found.
            </h2>
          )}
        </div>
      )}
    </>
  );
};

export default Halls;
