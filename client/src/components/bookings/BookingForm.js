import React, { useEffect,useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../LoadingSpinner";
import axios from "axios";
import { parseISO } from "date-fns";
// import { DepartmentList, InstitutionList } from "../InstitutionDeptartmentList";
import { institutions, InstitutionList, DepartmentList } from "../Institutions"; // Update the path as needed

import notVerified from "../../assets/notVerified.jpg";

const BookingForm = () => {
  const navigate = useNavigate();
  const [availableLTs, setAvailableLTs] = useState([]);
  const [authStatus, setAuthStatus] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const targetSectionRef = useRef(null); 

  const { hallId, hallName } = useParams();
  //consolelog(hallId);
  const [isLoading, setIsLoading] = useState(true);
  // const { hallId, hallName } = props.location.state;
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
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/getdata`,
        {
          withCredentials: true, // include credentials in the request
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      //consolelog(data);

      let status;
      // if(data.userType === "admin"){
      //   status = "Approved By Admin"
      // }else if (data.userType === "hod"){
      //   status = "Approved By HOD"
      // }

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
        isApproved: status,
        // phoneNumber: data.phone,
      });

      setIsLoading(false);

      if (response.status !== 200) {
        throw new Error(response.error);
      }
    } catch (error) {
      // //consolelog(error);
      navigate("/login");
    }
  };

  useEffect(() => {
    userContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle change here

  const handleInputs = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setBookingData({ ...bookingData, [name]: value });
    console.log(bookingData);
  };

  //consolelog(bookingData);

  // send to backend
  const bookingForm2 = async (e, hallId, hallName) => {
    e.preventDefault();
    // setShowModal(false)
    setIsLoading(true);
    var {
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
          email,
          userType,
          bookedHallId,
          bookedHallName,
          organizingClub,
          phoneNumber,
          altNumber,
          isApproved,
        },
        {
          withCredentials: true, // To include credentials in the request
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      console.log("Printing Message", data.message);
      if (data.message === "Booking created successfully") {
        toast.success("Booking created successfully!");
        navigate("/bookings");
      } else {
        toast.error("Request not sent!");
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 422) {
          const data = error.response.data;
          // Handle validation errors
          // You can set specific error messages for different fields if needed
          if (data && data.error) {
            const errorMessage = data.error;
            setAuthStatus(errorMessage);
            toast.error(errorMessage);
          }
        } else if (error.response.status === 403) {
          toast.error("Unauthorized request!");
        } else {
          console.error(error);
          toast.error("An error occurred while creating the booking.");
        }
      } else {
        console.error(error);
        toast.error("An error occurred while creating the booking.");
      }
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
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      if (data.message === "Lt fetched successfully") {
        toast.success("Lt fetched successfully!");
        setAvailableLTs(data.availableHalls);

        // Scroll to 1/2 of the window height
        const halfScreenHeight = window.innerHeight / 2;
        window.scrollTo({
          top: halfScreenHeight,
          behavior: "smooth",
        });
      } else {
        toast.error("Request not sent!");
      }
    } catch (error) {
      handleError(error); // Error handling moved to a reusable function
    } finally {
      scrollToSection();
      setIsLoading(false);
    }
  };

  // Helper function to handle errors
  const handleError = (error) => {
    if (error.response) {
      if (error.response.status === 422) {
        const data = error.response.data;
        if (data && data.error) {
          const errorMessage = data.error;
          setAuthStatus(errorMessage);
          toast.error(errorMessage);
        }
      } else if (error.response.status === 403) {
        toast.error("Unauthorized request!");
      } else {
        console.error(error);
        toast.error("An error occurred while creating the booking.");
      }
    } else {
      console.error(error);
      toast.error("An error occurred while creating the booking.");
    }
  };

  const institutionName =
    InstitutionList[bookingData.institution] || bookingData.institution;
  const departmentName =
    DepartmentList[bookingData.department] || bookingData.department;

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : !emailVerified ? (
        <div className="flex items-center flex-col justify-center lg:flex-row py-28 px-6 md:px-24 md:py-20 lg:py-32 gap-16 lg:gap-28">
          <div className="w-full lg:w-1/3">
            {/* <img alt='error' className="hidden lg:block" src="https://i.ibb.co/v30JLYr/Group-192-2.png" />
          <img alt='error' className="hidden md:block lg:hidden" src="https://i.ibb.co/c1ggfn2/Group-193.png" /> */}
            <img alt="error" className="hidden lg:block" src={notVerified} />
          </div>
          <div className="w-full lg:w-1/2">
            <h1 className="py-4 text-3xl lg:text-4xl font-extrabold text-gray-800 ">
              Looks Like Yout Have Not Verified Your Email!
            </h1>
            <p className="py-4 text-xl text-gray-800">
              Please click on the below button and verify email before booking.
            </p>
            {/* <p className="py-2 text-base text-gray-800">Sorry about that! Please visit our hompage to get where you need to go.</p> */}
            <div>
              <Link to="/profile">
                <button className="w-full lg:w-auto my-4 rounded-md px-1 sm:px-16 py-5 bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-opacity-50">
                  Verify Email
                </button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="max-w-screen-md mx-auto p-5 my-10 bg-white shadow-2xl shadow-blue-200">
            <div className="text-center mb-16">
              <p className="mt-4 text-sm leading-7 text-gray-500 font-regular uppercase">
                Book Hall
              </p>
              <h3 className="text-3xl sm:text-4xl leading-normal font-extrabold tracking-tight text-gray-900">
                Book Your <span className="text-indigo-600">Hall </span>Now
              </h3>
            </div>

            <form method="POST" className="w-full">
              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 "
                    htmlFor="grid-event-manager"
                  >
                    Event Coordinator Name
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    id="grid-event-manager"
                    type="text"
                    value={bookingData.eventManager}
                    name="eventManager"
                    onChange={handleInputs}
                    placeholder="Event Coordinator Name"
                  />
                  {/* <p className="text-red-500 text-xs italic">Please fill out this field.</p> */}
                </div>

                <div className="w-full md:w-1/2 px-3">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-event-name"
                  >
                    Event Name
                  </label>
                  <input
                    value={bookingData.eventName}
                    name="eventName"
                    onChange={handleInputs}
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    id="grid-event-name"
                    type="text"
                    placeholder="Event Name"
                  />
                </div>
              </div>

              <div className="flex flex-wrap -mx-3 mb-6">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                    htmlFor="grid-organizing-club"
                  >
                    Description
                  </label>
                  <input
                    value={bookingData.organizingClub}
                    name="organizingClub"
                    onChange={handleInputs}
                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    id="grid-organizing-club"
                    type="text"
                    placeholder="Description"
                  />
                  {/* <p className="text-red-500 text-xs italic">Please fill out this field.</p> */}
                </div>

                {(bookingData.eventDateType === "full" ||
                  bookingData.eventDateType === "half") && (
                  <div className="w-full md:w-1/2 px-3">
                    <label
                      className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                      htmlFor="grid-event-date"
                    >
                      Event Date
                    </label>
                    <input
                      value={bookingData.eventDate}
                      name="eventDate"
                      onChange={handleInputs}
                      className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      id="grid-event-date"
                      type="date"
                      placeholder="Event Date"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                )}

                {/* <div className="w-full md:w-1/2 px-3">
                  <label
                    className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 "
                    htmlFor="grid-hall-name">
                    Hall Name
                  </label>
                  <input
                    className="appearance-none block w-full bg-gray-300 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    id="grid-hall-name"
                    type="text"
                    value={bookingData.bookedHallName}
                    name="bookedHallName"
                    onChange={handleInputs}
                    placeholder="Hall Name"
                    disabled
                  />
                </div> */}
              </div>

              {bookingData.eventDateType === "half" && (
                <div className="flex flex-wrap -mx-3 mb-6">
                  <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                    <label
                      className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 "
                      htmlFor="grid-start-time"
                    >
                      Start Time
                    </label>
                    <input
                      className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      id="grid-start-time"
                      type="time"
                      value={bookingData.startTime}
                      name="startTime"
                      onChange={handleInputs}
                      placeholder="Start Time"
                    />
                  </div>
                  <div className="w-full md:w-1/2 px-3">
                    <label
                      className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                      htmlFor="grid-end-time"
                    >
                      End Time
                    </label>
                    <input
                      value={bookingData.endTime}
                      name="endTime"
                      onChange={handleInputs}
                      className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      id="grid-end-time"
                      type="time"
                      placeholder="End Time"
                    />
                  </div>
                </div>
              )}

              <div className="my-4">
                <p className="text-s text-red-600	 font-bold">{authStatus}</p>
              </div>

              <div className="flex flex-wrap -mx-3 mb-6">
          
                <div className="flex justify-between w-full px-3">
                  <button
                    // onClick={handleConfirmModal}
                    onClick={bookingForm}
                    className="shadow bg-indigo-600 hover:bg-indigo-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-6 rounded"
                    type="submit"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>

          {availableLTs.length > 0 && (
            <div  className="mt-10 flex flex-col items-center">
              <h3 ref={targetSectionRef} className="text-2xl font-extrabold text-gray-800 mb-6">
                Available Lecture Theatres
              </h3>
              <div className="overflow-x-auto w-full max-w-4xl mx-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-indigo-600 text-white text-left">
                      <th className="py-4 px-6 font-semibold text-center">
                        Lecture Theatre
                      </th>
                      <th className="py-4 px-6 font-semibold text-center">
                        Capacity
                      </th>
                      <th className="py-4 px-6 font-semibold text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableLTs.map((lt, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-100 transition-colors"
                      >
                        <td className="py-4 px-6 text-indigo-600 font-semibold text-center">
                          {lt.name}
                        </td>
                        <td className="py-4 px-6 text-gray-700 text-center">
                          {lt.capacity}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={(e) => bookingForm2(e, lt._id, lt.name)} // Pass _id and name to bookingForm2
                            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition-colors duration-300"
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
        </div>
      )}
    </>
  );
};

export default BookingForm;
