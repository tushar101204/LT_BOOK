import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import LoadingSpinner from "../LoadingSpinner";

const Halls = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const getHallsData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/halls`, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      const data = response.data;
      setUserData(data.halls);
      setIsLoading(false);

      if (response.status !== 200) {
        throw new Error(response.error);
      }
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

  const handleviewClick = () => {
    navigate(`/calendar`);
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="mt-6 min-h-screen flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl text-center text-gray-800 font-black leading-7 md:leading-10 mb-8">
            Available <span className="text-indigo-700">Halls</span>
          </h1>

          {Array.isArray(userData) && userData.length > 0 ? (
            <div className="w-11/12 md:w-4/5 lg:w-4/5 overflow-x-auto shadow-lg rounded-lg">
              <table className="w-full bg-white border border-gray-200 rounded-lg shadow-md">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="py-4 px-6 text-left font-semibold">Hall Name</th>
                    <th className="py-4 px-6 text-left font-semibold">Location</th>
                    <th className="py-4 px-6 text-left font-semibold">Capacity</th>
                    <th className="py-4 px-6 text-left font-semibold">Amenities</th>
                    <th className="py-4 px-6 text-left font-semibold">Description</th>
                    <th className="py-4 px-6 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.map((hall, index) => (
                    <tr key={hall._id} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-indigo-50 transition duration-150`}>
                      <td className="py-4 px-6 text-gray-700">{hall.name}</td>
                      <td className="py-4 px-6 text-gray-700">{hall.location}</td>
                      <td className="py-4 px-6 text-gray-700">{hall.capacity}</td>
                      <td className="py-4 px-6 text-gray-700">{hall.amenities}</td>
                      <td className="py-4 px-6 text-gray-700">{hall.description}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          className="mr-2 rounded-full border border-indigo-500 bg-indigo-500 text-white px-4 py-2 font-semibold hover:bg-indigo-600 transition duration-150"
                          onClick={() => handleBookingClick(hall._id, hall.name)}
                        >
                          Book Now
                        </button>
                        <button
                          className="rounded-full border border-indigo-500 text-indigo-500 px-4 py-2 font-semibold hover:bg-indigo-500 hover:text-white transition duration-150"
                          onClick={handleviewClick}
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
            <h2 className="text-2xl font-bold text-zinc-700 text-center mt-10">
              No halls found.
            </h2>
          )}
        </div>
      )}
    </>
  );
};

export default Halls;
