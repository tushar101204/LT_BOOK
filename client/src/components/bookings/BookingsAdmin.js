import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { toast } from "react-toastify";
import { format } from "date-fns";

const BookingsAdmin = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("Request Sent");
  const [emailVerified, setEmailVerified] = useState(false);
  const [userData, setUserData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");

  const openModal = (bookingId) => {
    setShowModal(true);
    setSelectedBookingId(bookingId);
  };
  const closeModal = () => {
    setShowModal(false);
    setRejectionReason("");
    setSelectedBookingId("");
  };

  const userContact = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/getdata`,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      setUserData(data);
      if (data.userType === "admin") setEmailVerified(true);
      setIsLoading(false);
    } catch (error) {}
  };

  useEffect(() => {
    userContact();
  }, []);

  const getBookingData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/bookingsAdmin`,
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const sortedBookingData = response.data.bookings.sort(
        (a, b) => new Date(a.eventDate) - new Date(b.eventDate)
      );

      setBookingData(sortedBookingData);
      setIsLoading(false);

      if (response.status !== 200) throw new Error(response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.warn("Unauthorized Access! Please Login!", {
          toastId: "Unauthorized",
        });
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    getBookingData();
  }, []);

  const updateBooking = async (bookingId, isApproved) => {
    if (isApproved === "Rejected By Admin" && rejectionReason.trim() === "") {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/bookingsEdit/${bookingId}`,
        {
          isApproved,
          rejectionReason:
            isApproved === "Approved By Admin" ? null : rejectionReason,
        },
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      closeModal();
      getBookingData();
      toast.success(`Request ${isApproved} Successfully!`);
      if (response.status !== 200) throw new Error(response.error);
    } catch (error) {}
  };

  const handleFilter = (value) => setFilterValue(value);

  const filteredBookings = Object.values(bookingData).filter((b) => {
    if (filterValue === "Request Sent") return b.isApproved === "Request Sent";
    if (filterValue === "Approved By HOD")
      return b.isApproved === "Approved By HOD";
    if (filterValue === "Approved By Admin")
      return b.isApproved === "Approved By Admin";
    if (filterValue === "Rejected By Admin")
      return b.isApproved === "Rejected By Admin";
    if (filterValue === "My Requests") return b.email === userData.email;
    return b;
  });

  const handleEditClick = (id) => navigate(`/bookingsEdit/${id}`);
  const handleViewClick = (id) => navigate(`/bookingsView/${id}`);

  return (
    <div className="mt-8  flex flex-col items-center">
      {/* Header */}
      <div className="w-11/12 md:w-4/5 flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">
          Manage <span className="text-indigo-600">Bookings</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="w-11/12 md:w-4/5 flex flex-wrap gap-3 mb-8">
        {[
          "all",
          process.env.REACT_APP_HOD_FEATURE === "true"
            ? "Approved By HOD"
            : "Request Sent",
          "Approved By Admin",
          "Rejected By Admin",
          "My Requests",
        ].map((status) => (
          <button
            key={status}
            onClick={() => handleFilter(status)}
            className={`px-5 py-2 rounded-full text-sm font-medium shadow transition ${
              filterValue === status
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status === "Request Sent" || status === "Approved By HOD"
              ? "Pending"
              : status === "all"
              ? "All"
              : status}
          </button>
        ))}
      </div>

      {/* Loader / Email Verification / Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !emailVerified ? (
        <div className="flex flex-col items-center text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Email Not Verified
          </h2>
          <p className="text-gray-600 mb-6">
            Please verify your email before booking.
          </p>
          <Link to="/profile">
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition">
              Verify Email
            </button>
          </Link>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="w-11/12 md:w-4/5 overflow-x-auto shadow-xl rounded-xl">
          <table className="w-full bg-white border border-gray-200 rounded-xl">
            <thead>
              <tr className="bg-indigo-600 text-white text-sm md:text-base">
                <th className="py-4 px-6 text-left">Event Name</th>
                <th className="py-4 px-6 text-left">Hall</th>
                <th className="py-4 px-6 text-left">Event Date</th>
                <th className="py-4 px-6 text-left">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking, index) => (
                <tr
                  key={booking._id}
                  className={`${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-indigo-50 transition`}
                >
                  <td className="py-4 px-6 font-medium text-gray-700">
                    {booking.eventName}
                  </td>
                  <td className="py-4 px-6">{booking.bookedHallName}</td>
                  <td className="py-4 px-6">
                    {booking.eventDateType === "multiple" ? (
                      <>
                        {format(
                          new Date(booking.eventStartDate),
                          "EEE dd-MM-yyyy"
                        )}
                        <br />to<br />
                        {format(
                          new Date(booking.eventEndDate),
                          "EEE dd-MM-yyyy"
                        )}
                      </>
                    ) : (
                      format(new Date(booking.eventDate), "EEE dd-MM-yyyy")
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {booking.isApproved === "Approved By Admin" && (
                      <span className="px-3 py-1 rounded-full text-green-700 bg-green-100 text-sm font-semibold">
                        {booking.isApproved}
                      </span>
                    )}
                    {booking.isApproved === "Approved By HOD" && (
                      <span className="px-3 py-1 rounded-full text-blue-700 bg-blue-100 text-sm font-semibold">
                        {booking.isApproved}
                      </span>
                    )}
                    {booking.isApproved === "Request Sent" && (
                      <span className="px-3 py-1 rounded-full text-orange-700 bg-orange-100 text-sm font-semibold">
                        Pending
                      </span>
                    )}
                    {booking.isApproved === "Rejected By Admin" && (
                      <span className="px-3 py-1 rounded-full text-red-700 bg-red-100 text-sm font-semibold">
                        {booking.isApproved}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center space-x-2">
                    <button
                      onClick={() => handleViewClick(booking._id)}
                      className="rounded-lg bg-indigo-500 text-white px-3 py-2 hover:bg-indigo-600 shadow transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditClick(booking._id)}
                      className="rounded-lg bg-yellow-500 text-white px-3 py-2 hover:bg-yellow-600 shadow transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        updateBooking(booking._id, "Approved By Admin")
                      }
                      className="rounded-lg bg-green-500 text-white px-3 py-2 hover:bg-green-600 shadow transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openModal(booking._id)}
                      className="rounded-lg bg-red-500 text-white px-3 py-2 hover:bg-red-600 shadow transition"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <h2 className="text-xl md:text-2xl font-semibold text-gray-600 mt-12">
          No booking requests found.
        </h2>
      )}

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Reason for Rejection
            </h2>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mb-4 resize-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateBooking(selectedBookingId, "Rejected By Admin")
                }
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsAdmin;
