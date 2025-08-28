import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { toast } from "react-toastify";

const HallsAdmin = () => {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [userData, setUserData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);

  // Fetch user info
  const getUserData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/about`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setUserData(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.warn("Unauthorized! Please login.");
        navigate("/login");
      }
    }
  };

  // Fetch halls
  const getHallsData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/halls`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setHalls(res.data.halls || []);
    } catch (err) {
      toast.error("Failed to load halls");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
    getHallsData();
  }, []);

  // Actions
  const handleBookingClick = (hallId, hallName) => {
    navigate(`/bookingForm/${hallId}/${hallName}`);
  };

  const handleEditClick = (hallId, hallName) => {
    navigate(`/halls/${hallId}/${hallName}`);
  };

  const handleDeleteClick = async () => {
    if (!selectedHall) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_SERVER_URL}/halls/${selectedHall._id}`,
        { withCredentials: true }
      );
      toast.success("Hall deleted successfully!");
      setShowModal(false);
      setSelectedHall(null);
      getHallsData();
    } catch {
      toast.error("Failed to delete hall");
    }
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="mt-8 min-h-screen flex flex-col items-center">
          {/* Header */}
          <div className="w-11/12 md:w-4/5 flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">
              Manage <span className="text-indigo-600">Halls</span>
            </h1>
            <Link to="/hallForm">
              <button className="rounded-xl bg-green-500 text-white px-5 py-2 font-medium hover:bg-green-600 shadow-md transition">
                + Create Hall
              </button>
            </Link>
          </div>

          {/* Table */}
          {halls.length > 0 ? (
            <div className="w-11/12 md:w-4/5 overflow-x-auto shadow-xl rounded-xl">
              <table className="w-full bg-white border border-gray-200 rounded-xl">
                <thead>
                  <tr className="bg-indigo-600 text-white text-sm md:text-base">
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
                        {/* Book */}
                        <button
                          className="rounded-lg bg-indigo-500 text-white px-3 py-2 hover:bg-indigo-600 shadow transition"
                          onClick={() => handleBookingClick(hall._id, hall.name)}
                        >
                          Book
                        </button>

                        {/* Edit & Delete (Admins Only) */}
                        {(userData.email === process.env.REACT_APP_MASTER_ADMIN_EMAIL ||
                          userData.email === hall.hallCreater) && (
                          <>
                            <button
                              className="rounded-lg bg-green-500 text-white px-3 py-2 hover:bg-green-600 shadow transition"
                              onClick={() => handleEditClick(hall._id, hall.name)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-lg bg-red-500 text-white px-3 py-2 hover:bg-red-600 shadow transition"
                              onClick={() => {
                                setSelectedHall(hall);
                                setShowModal(true);
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <h2 className="text-xl md:text-2xl font-semibold text-gray-600 mt-12">
              No halls found.
            </h2>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showModal && selectedHall && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Delete "{selectedHall.name}"?
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to delete this hall? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                onClick={handleDeleteClick}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HallsAdmin;
