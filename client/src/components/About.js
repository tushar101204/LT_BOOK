import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";
import { CheckCircle } from "lucide-react"; // ✅ Icon for verified

const AboutUpdateForm = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    facultyType: "",
    institution: "",
    department: "",
    adminFor: "",
    _id: "",
    emailVerified: false,
    createdAt: "",
    lastLogin: "",
  });
  const [originalData, setOriginalData] = useState({ ...userData });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const emailVerified = userData.emailVerified;

  const VerifyButton = () => {
    if (emailVerified) {
      return (
        <div className="flex items-center ml-6">
          <CheckCircle className="text-green-600 w-6 h-6" /> {/* ✅ verified icon */}
        </div>
      );
    } else {
      return (
        <button
          type="submit"
          onClick={sendEmailVerificationLink}
          className="text-white bg-indigo-600 shadow focus:shadow-outline ml-6 focus:outline-none border-0 py-2 px-5 font-bold hover:bg-indigo-800 rounded-lg text-sm transition"
        >
          Verify Email
        </button>
      );
    }
  };

  const sendEmailVerificationLink = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/emailVerificationLink`,
        { email: userData.email },
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data) {
        setIsLoading(false);
        toast.success("Email Sent To Admin Successfully");
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response && error.response.status === 401) {
        toast.error("Please login first to verify your email.");
        navigate("/login");
      } else {
        toast.error("Something went wrong. Try again later.");
      }
    }
  };

  const handleInputs = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const callAboutPage = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/about`,
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      setUserData(data);
      setOriginalData(data);
      setIsLoading(false);
      if (response.status !== 200) throw new Error(response.error);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.warn("Unauthorized Access! Please Login!", {
          toastId: "Unauthorized",
        });
        navigate("/login");
      }
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    const { name, facultyType, phone } = userData;
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/updateProfile`,
        { name, facultyType, phone },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.status === 200) {
        toast.success("Profile updated successfully!", {
          toastId: "ProfileUpdated",
        });
        setIsEditing(false);
        setOriginalData(userData);
      }
    } catch (error) {
      if (error.response && error.response.status === 422) {
        toast.error(error.response.data.error);
      }
    }
  };

  useEffect(() => {
    callAboutPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelEditing = () => {
    setUserData(originalData);
    setIsEditing(false);
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
          <div className="w-full max-w-xl rounded-3xl p-10 shadow-xl bg-white border border-gray-100">
            <form onSubmit={updateProfile}>
              <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleInputs}
                      className="text-3xl font-bold text-gray-800 border-b-2 border-gray-300 focus:outline-none px-2 py-1 w-2/3"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-gray-800 capitalize">
                      {userData.name}
                    </h2>
                  )}
                  <button
                    onClick={() =>
                      isEditing ? cancelEditing() : setIsEditing(true)
                    }
                    type="button"
                    className="text-sm font-semibold text-gray-700 py-2 px-4 bg-yellow-200 rounded-lg hover:bg-yellow-300 transition"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>

                {/* Email + Verification */}
                <div className="flex items-center justify-between bg-blue-50 rounded-xl p-5">
                  <div>
                    <p className="font-bold text-gray-600">Email</p>
                    <p className="text-lg font-semibold text-gray-800 break-all">
                      {userData.email}
                    </p>
                  </div>
                  <VerifyButton />
                </div>

                {/* Phone */}
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="font-bold text-gray-600 mb-1">Phone</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={userData.phone}
                      onChange={handleInputs}
                      className="text-lg font-semibold text-gray-800 border-b-2 border-gray-300 focus:outline-none px-2 py-1 w-full"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-800">
                      {userData.phone}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="font-bold text-gray-600 mb-1">Role</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {userData.userType === "hod"
                      ? `Head of Department`
                      : userData.userType === "faculty"
                      ? `Faculty (${userData.facultyType})`
                      : userData.userType === "admin"
                      ? "Admin"
                      : "User"}
                  </p>
                </div>

                {/* Save button */}
                {isEditing && (
                  <div className="mt-6 text-center">
                    <button
                      type="submit"
                      className="text-white bg-blue-600 shadow-lg focus:outline-none py-2 px-6 font-bold hover:bg-blue-800 rounded-xl text-base transition"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AboutUpdateForm;
