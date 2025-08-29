import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { parseISO, format } from "date-fns";
import LoadingSpinner from "../LoadingSpinner";
import { UserContext } from "../../App";

import {
  RequestSent,
  ApprovedByAdmin,
  ApprovedByHod,
  RejectedByAdmin,
  RejectedByHod,
} from "../Steps";

const BookingsView = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { state } = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch booking by ID
  const getBookingById = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/bookingsView/${bookingId}`,
        { withCredentials: true }
      );
      setBookingData(response.data.booking);
    } catch (error) {
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  // Update booking status
  const updateBooking = async (bookingId, isApproved) => {
    if (isApproved.includes("Rejected") && rejectionReason.trim() === "") {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/bookingsEdit/${bookingId}`,
        {
          isApproved,
          rejectionReason: isApproved.includes("Approved")
            ? null
            : rejectionReason,
        },
        { withCredentials: true }
      );

      toast.success(`Request ${isApproved} successfully!`);
      closeModal();
      getBookingById();
    } catch (error) {
      toast.error("Failed to update booking.");
    }
  };

  // Modal controls
  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setRejectionReason("");
  };

  const handleEditClick = () => navigate(`/bookingsEdit/${bookingData._id}`);

  useEffect(() => {
    getBookingById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-indigo-700">
            Booking Details
          </h1>
          <p className="mt-2 text-gray-500">View all information clearly</p>
        </div>

        {/* Booking Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Event Coordinator" value={bookingData.eventManager} />
          <InfoField label="Event Name" value={bookingData.eventName} />
          <InfoField label="Description" value={bookingData.organizingClub} />
          <InfoField
            label="Event Date Type"
            value={
              bookingData.eventDateType === "multiple"
                ? "Multiple Days"
                : bookingData.eventDateType === "half"
                ? "Half Day"
                : "Full Day"
            }
          />

          {bookingData.eventDateType === "half" && (
            <>
              <InfoField
                label="Start Time"
                value={format(
                  parseISO(bookingData.startTime.slice(0, -1)),
                  "hh:mm aa"
                )}
              />
              <InfoField
                label="End Time"
                value={format(
                  parseISO(bookingData.endTime.slice(0, -1)),
                  "hh:mm aa"
                )}
              />
            </>
          )}

          {bookingData.eventDateType === "multiple" && (
            <>
              <InfoField
                label="Event Start Date"
                value={format(new Date(bookingData.eventStartDate), "dd MMM yyyy")}
              />
              <InfoField
                label="Event End Date"
                value={format(new Date(bookingData.eventEndDate), "dd MMM yyyy")}
              />
            </>
          )}

          {(bookingData.eventDateType === "full" ||
            bookingData.eventDateType === "half") && (
            <InfoField
              label="Event Date"
              value={format(new Date(bookingData.eventDate), "dd MMM yyyy")}
            />
          )}

          <InfoField label="Hall Name" value={bookingData.bookedHallName} />
          <InfoField label="Requested By" value={bookingData.userId?.name} />
          <InfoField
            label="Request Created At"
            value={format(parseISO(bookingData.createdAt), "dd MMM yyyy hh:mm aa")}
          />
        </div>

        {/* Rejection Reason */}
        {bookingData.rejectionReason && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="text-sm font-semibold text-red-700">
              Reason for Rejection
            </h3>
            <p className="mt-1 text-red-600">{bookingData.rejectionReason}</p>
          </div>
        )}

        {/* Status */}
        <div className="mt-8">
          {bookingData.isApproved === "Approved By Admin" && <ApprovedByAdmin />}
          {bookingData.isApproved === "Approved By HOD" && <ApprovedByHod />}
          {bookingData.isApproved === "Rejected By HOD" && <RejectedByHod />}
          {bookingData.isApproved === "Rejected By Admin" && <RejectedByAdmin />}
          {bookingData.isApproved === "Request Sent" && <RequestSent />}
        </div>

        {/* Action Buttons */}
        {(state.userType === "admin" || state.userType === "hod") && (
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <ActionButton label="Edit" color="yellow" onClick={handleEditClick} />
            <ActionButton
              label="Approve"
              color="green"
              onClick={() =>
                updateBooking(
                  bookingData._id,
                  state.userType === "admin"
                    ? "Approved By Admin"
                    : "Approved By HOD"
                )
              }
            />
            <ActionButton
              label="Reject"
              color="red"
              onClick={
                state.userType === "admin"
                  ? openModal
                  : () =>
                      updateBooking(
                        bookingData._id,
                        "Rejected By HOD"
                      )
              }
            />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Reason for Rejection
            </h2>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-400"
              rows="4"
              placeholder="Enter reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={() =>
                  updateBooking(bookingData._id, "Rejected By Admin")
                }
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

// Reusable small components
const InfoField = ({ label, value }) => (
  <div>
    <p className="text-sm font-semibold text-gray-600">{label}</p>
    <p className="mt-1 text-gray-800 border rounded-lg px-4 py-2 bg-gray-50">
      {value || "—"}
    </p>
  </div>
);

const ActionButton = ({ label, color, onClick }) => {
  const colors = {
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-lg font-semibold transition ${colors[color]}`}
    >
      {label}
    </button>
  );
};

export default BookingsView;
