import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

const BookingFaculty = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState([]); // ✅ should be array
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("all");

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

      // Check what your backend actually returns
      // console.log(response.data);

      // ✅ Adjust according to your backend
      setBookingData(response.data.bookings || response.data.booking || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      console.log("Failed to load bookings:", error.response);
      toast.error("Failed to load bookings.");
      setIsLoading(false); // ✅ important
    }
  };

  useEffect(() => {
    getBookingData();
  }, []);

  const deleteBooking = async (bookingId) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_SERVER_URL}/bookings/${bookingId}`
      );

      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
      });

      getBookingData(); // ✅ refresh list after delete
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking. Please try again.");
    }
  };

  const handleFilter = (value) => setFilterValue(value);

  const filteredBookings = bookingData.filter((booking) => {
    if (filterValue === "Request Sent") return booking.isApproved === "Request Sent";
    if (filterValue === "Approved By HOD") return booking.isApproved === "Approved By HOD";
    if (filterValue === "Approved By Admin") return booking.isApproved === "Approved By Admin";
    if (filterValue === "Rejected By Admin") return booking.isApproved === "Rejected By Admin";
    if (filterValue === "Rejected By HOD") return booking.isApproved === "Rejected By HOD";
    return true;
  });

  const handleViewClick = (bookingId) => {
    navigate(`/bookingsView/${bookingId}`);
  };

  return (
    <div className="mt-6 min-h-screen">
      <h1 className="text-3xl text-center text-gray-800 font-black leading-7">
        Your <span className="text-indigo-700">Bookings</span>
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap my-8 justify-center">
        <button
          className={`rounded-full px-4 py-2 mx-2 ${
            filterValue === "all" ? "bg-indigo-100 text-indigo-800" : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => handleFilter("all")}
        >
          All
        </button>
        <button
          className={`rounded-full px-4 py-2 mx-2 ${
            filterValue === "Approved By Admin" ? "bg-indigo-100 text-indigo-800" : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => handleFilter("Approved By Admin")}
        >
          Approved By Admin
        </button>
        <button
          className={`rounded-full px-4 py-2 mx-2 ${
            filterValue === "Rejected By Admin" ? "bg-indigo-100 text-indigo-800" : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
          onClick={() => handleFilter("Rejected By Admin")}
        >
          Rejected By Admin
        </button>
      </div>

      {/* Loading / Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="container w-full px-4 mx-auto sm:px-8">
          <div className="overflow-x-auto shadow-xl rounded-lg">
            <table className="min-w-full leading-normal text-center">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="px-4 py-3">Event Name</th>
                  <th className="px-4 py-3">Hall Name</th>
                  <th className="px-4 py-3">Organizing Club</th>
                  <th className="px-4 py-3">Event Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id} className="border-b">
                      <td className="px-5 py-5">{booking.eventName}</td>
                      <td className="px-5 py-5">{booking.bookedHallName}</td>
                      <td className="px-5 py-5">{booking.organizingClub}</td>
                      <td className="px-5 py-5">
                        {booking.eventDateType === "multiple" ? (
                          <>
                            {format(new Date(booking.eventStartDate), "EEEE dd-MM-yyyy")}
                            <br />To<br />
                            {format(new Date(booking.eventEndDate), "EEEE dd-MM-yyyy")}
                          </>
                        ) : (
                          format(new Date(booking.eventDate), "EEEE dd-MM-yyyy")
                        )}
                      </td>
                      <td className="px-5 py-5 font-bold">
                        {booking.isApproved === "Approved By Admin" && (
                          <span className="text-green-600">{booking.isApproved}</span>
                        )}
                        {booking.isApproved === "Approved By HOD" && (
                          <span className="text-blue-600">Forwarded To Admin</span>
                        )}
                        {booking.isApproved === "Rejected By Admin" && (
                          <span className="text-red-600">{booking.isApproved}</span>
                        )}
                        {booking.isApproved === "Rejected By HOD" && (
                          <span className="text-red-600">{booking.isApproved}</span>
                        )}
                        {booking.isApproved === "Request Sent" && (
                          <span className="text-orange-600">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        <button
                          onClick={() => handleViewClick(booking._id)}
                          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteBooking(booking._id)}
                          className="ml-3 px-4 py-2 bg-red-200 rounded hover:bg-red-300"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-5 text-center" colSpan="6">
                      No Bookings Requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFaculty;
