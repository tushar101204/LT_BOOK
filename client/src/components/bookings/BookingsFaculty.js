import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

const BookingFaculty = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("all");

  // ✅ For cancel modal
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ✅ Fetch bookings for faculty
  const getBookingData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/bookingsFaculty`,
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      setBookingData(response.data.bookings || response.data.booking || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBookingData();
  }, []);

  // ✅ Cancel booking
  const deleteBooking = async () => {
    if (!selectedBooking) return;

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_SERVER_URL}/bookings/${selectedBooking._id}`
      );

      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
      });

      getBookingData(); // Refresh list
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking. Please try again.");
    } finally {
      setShowModal(false);
      setSelectedBooking(null);
    }
  };

  // ✅ Filters
  const handleFilter = (value) => setFilterValue(value);

  const filteredBookings = bookingData.filter((booking) => {
    if (filterValue === "Request Sent")
      return booking.isApproved === "Request Sent";
    if (filterValue === "Approved By Admin")
      return booking.isApproved === "Approved By Admin";
    if (filterValue === "Rejected By Admin")
      return booking.isApproved === "Rejected By Admin";
    return true;
  });

  const handleViewClick = (bookingId) => {
    navigate(`/bookingsView/${bookingId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-gray-50">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
        Your <span className="text-indigo-600">Bookings</span>
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {["all", "Approved By Admin", "Rejected By Admin"].map((status) => (
          <button
            key={status}
            onClick={() => handleFilter(status)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition shadow-sm ${
              filterValue === status
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      {/* Table / Loader */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-11/12 md:w-4/5 overflow-x-auto shadow-lg rounded-lg">
          <table className="w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="px-6 py-4 text-left">Event Name</th>
                <th className="px-6 py-4 text-left">Hall</th>
                <th className="px-6 py-4 text-left">Club</th>
                <th className="px-6 py-4 text-left">Event Date</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking, index) => (
                  <tr
                    key={booking._id}
                    className={`${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-indigo-50 transition`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {booking.eventName}
                    </td>
                    <td className="px-6 py-4">{booking.bookedHallName}</td>
                    <td className="px-6 py-4">{booking.organizingClub}</td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      {booking.isApproved === "Approved By Admin" && (
                        <span className="px-3 py-1 rounded-full text-green-700 bg-green-100 text-sm font-semibold">
                          {booking.isApproved}
                        </span>
                      )}
                      {["Rejected By Admin", "Rejected By HOD"].includes(
                        booking.isApproved
                      ) && (
                        <span className="px-3 py-1 rounded-full text-red-700 bg-red-100 text-sm font-semibold">
                          {booking.isApproved}
                        </span>
                      )}
                      {booking.isApproved === "Request Sent" && (
                        <span className="px-3 py-1 rounded-full text-orange-700 bg-orange-100 text-sm font-semibold">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button
                        onClick={() => handleViewClick(booking._id)}
                        className="rounded-lg bg-indigo-500 text-white px-4 py-2 text-sm hover:bg-indigo-600 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowModal(true);
                        }}
                        className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm hover:bg-red-600 transition"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-6 text-center text-gray-500 font-medium"
                  >
                    No Booking Requests Found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Cancel "{selectedBooking.eventName}"?
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                onClick={() => setShowModal(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                onClick={deleteBooking}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFaculty;
