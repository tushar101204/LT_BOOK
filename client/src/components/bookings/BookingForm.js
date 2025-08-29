import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../LoadingSpinner";
import axios from "axios";
import { parseISO } from "date-fns";
import notVerified from "../../assets/notVerified.jpg";

const BookingForm = () => {
  const navigate = useNavigate();
  const [availableLTs, setAvailableLTs] = useState([]);
  const [authStatus, setAuthStatus] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const targetSectionRef = useRef(null);

  const { hallId, hallName } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    userId: "",
    eventManager: "",
    department: "",
    institution: "",
    eventName: "",
    eventDateType: "half",
    eventDate: "",
    eventStartDate: "",
    eventEndDate: "",
    startTime: "",
    endTime: "",
    email: "",
    userType: "",
    bookedHallId: hallId,
    bookedHallName: hallName,
    organizingClub: "",
    phoneNumber: "",
    altNumber: "",
    isApproved: "",
  });

  const scrollToSection = () => {
    targetSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const userContact = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/getdata`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (data.emailVerified) {
        setEmailVerified(true);
      }

      setBookingData({
        ...bookingData,
        userId: data._id,
        eventManager: data.name,
        email: data.email,
        department: data.department,
        institution: data.institution,
        userType: data.userType,
      });

      setIsLoading(false);

      if (response.status !== 200) {
        throw new Error(response.error);
      }
    } catch (error) {
      navigate("/login");
    }
  };

  useEffect(() => {
    userContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputs = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
  };

  const bookingForm2 = async (e, hallId, hallName) => {
    e.preventDefault();
    setIsLoading(true);
    let {
      eventManager,
      userId,
      department,
      institution,
      eventName,
      eventDateType,
      eventDate,
      eventStartDate,
      eventEndDate,
      startTime,
      endTime,
      email,
      userType,
      bookedHallId,
      bookedHallName,
      organizingClub,
      phoneNumber,
      altNumber,
      isApproved,
    } = bookingData;
    bookedHallId = hallId;
    bookedHallName = hallName;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/bookings`,
        {
          userId,
          department,
          institution,
          eventManager,
          eventName,
          eventDate,
          eventDateType,
          eventStartDate,
          eventEndDate,
          startTime: parseISO(`2000-01-01T${startTime}:00.000Z`),
          endTime: parseISO(`2000-01-01T${endTime}:00.000Z`),
          // startTime: new Date(`2000-01-01T${startTime}:00`).toISOString(),
          // endTime: new Date(`2000-01-01T${endTime}:00`).toISOString(),
          email,
          userType,
          bookedHallId,
          bookedHallName,
          organizingClub,
          phoneNumber,
          altNumber,
          isApproved,
        },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      if (data.message === "Booking created successfully") {
        toast.success("Booking created successfully!");
        navigate("/bookings");
      } else {
        toast.error("Request not sent!");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const bookingForm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { eventDate, startTime, endTime } = bookingData;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/showlt`,
        {
          eventDate,
          startTime: parseISO(`2000-01-01T${startTime}:00.000Z`),
          endTime: parseISO(`2000-01-01T${endTime}:00.000Z`),
          // startTime: new Date(`2000-01-01T${startTime}:00`).toISOString(),
          // endTime: new Date(`2000-01-01T${endTime}:00`).toISOString(),
        },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      if (data.message === "Lt fetched successfully") {
        toast.success("Lt fetched successfully!");
        setAvailableLTs(data.availableHalls);

        window.scrollTo({ top: window.innerHeight / 2, behavior: "smooth" });
      } else {
        toast.error("Request not sent!");
      }
    } catch (error) {
      handleError(error);
    } finally {
      scrollToSection();
      setIsLoading(false);
    }
  };

  const handleError = (error) => {
    if (error.response) {
      if (error.response.status === 422) {
        const data = error.response.data;
        if (data && data.error) {
          setAuthStatus(data.error);
          toast.error(data.error);
        }
      } else if (error.response.status === 403) {
        toast.error("Unauthorized request!");
      } else {
        toast.error("An error occurred while creating the booking.");
      }
    } else {
      toast.error("An error occurred while creating the booking.");
    }
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : !emailVerified ? (
        <div className="flex flex-col lg:flex-row items-center justify-center py-20 px-6 md:px-16 lg:px-28 gap-12">
          <div className="w-full lg:w-1/3">
            <img alt="not verified" className="hidden lg:block" src={notVerified} />
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Looks like you haven’t verified your email!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Please verify your email before booking a hall.
            </p>
            <Link to="/profile">
              <button className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition">
                Verify Email
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8 my-10">
          <div className="text-center mb-10">
            <p className="text-sm text-gray-500 uppercase tracking-wide">
              Book Hall
            </p>
            <h3 className="text-3xl font-bold text-gray-800">
              Book Your <span className="text-indigo-600">Hall</span> Now
            </h3>
          </div>

          {/* FORM */}
          <form method="POST" className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Event Coordinator Name
                </label>
                <input
                  type="text"
                  value={bookingData.eventManager}
                  name="eventManager"
                  onChange={handleInputs}
                  placeholder="Enter coordinator name"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Event Name
                </label>
                <input
                  type="text"
                  value={bookingData.eventName}
                  name="eventName"
                  onChange={handleInputs}
                  placeholder="Enter event name"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={bookingData.organizingClub}
                  name="organizingClub"
                  onChange={handleInputs}
                  placeholder="Enter description"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring focus:ring-indigo-200"
                />
              </div>

              {(bookingData.eventDateType === "full" ||
                bookingData.eventDateType === "half") && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.eventDate}
                    name="eventDate"
                    onChange={handleInputs}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring focus:ring-indigo-200"
                  />
                </div>
              )}
            </div>

            {/* Time Row */}
            {bookingData.eventDateType === "half" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={bookingData.startTime}
                    name="startTime"
                    onChange={handleInputs}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={bookingData.endTime}
                    name="endTime"
                    onChange={handleInputs}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring focus:ring-indigo-200"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {authStatus && (
              <p className="text-sm font-semibold text-red-600">{authStatus}</p>
            )}

            {/* Search Button */}
            <div className="flex justify-end">
              <button
                onClick={bookingForm}
                type="submit"
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Available LTs */}
      {availableLTs.length > 0 && (
        <div className="mt-10 flex flex-col items-center">
          <h3
            ref={targetSectionRef}
            className="text-2xl font-bold text-gray-800 mb-6"
          >
            Available Lecture Theatres
          </h3>
          <div className="overflow-x-auto w-full max-w-4xl mx-auto">
            <table className="min-w-full bg-white shadow-md rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-indigo-600 text-white text-left">
                  <th className="py-4 px-6 font-semibold text-center">Lecture Theatre</th>
                  <th className="py-4 px-6 font-semibold text-center">Capacity</th>
                  <th className="py-4 px-6 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {availableLTs.map((lt, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-indigo-600 font-semibold text-center">
                      {lt.name}
                    </td>
                    <td className="py-4 px-6 text-gray-700 text-center">
                      {lt.capacity}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={(e) => bookingForm2(e, lt._id, lt.name)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                      >
                        Book Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingForm;
