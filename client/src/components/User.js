import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const User = () => {
  const [faculties, setFaculties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch faculties
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_URL}/getuser`,
          {
            withCredentials: true,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.faculties) {
          setFaculties(response.data.faculties);
        }
      } catch (error) {
        console.error("Error fetching faculties:", error);
        toast.error("Failed to load users.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaculties();
  }, []);

  // Delete faculty
  const handleDeleteFaculty = async (facultyId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_SERVER_URL}/deleteuser/${facultyId}`,
        {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("User deleted successfully!");
        setFaculties((prev) => prev.filter((f) => f._id !== facultyId));
      } else {
        toast.info(response.data.message || "User not found.");
      }
    } catch (error) {
      console.error("Error deleting user:", error.message);
      toast.error("Failed to delete user.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <ToastContainer position="bottom-left" autoClose={3000} />

      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">
        Users
      </h1>

      {faculties.length > 0 ? (
        <div className="overflow-x-auto flex justify-center">
          <table className="w-4/5 bg-white border border-gray-200 shadow-md rounded-lg">
            <thead className="bg-indigo-600 text-white text-sm md:text-base">
              <tr>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Account Type</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map((faculty, index) => (
                <tr
                  key={faculty._id}
                  className={`border-b hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-6">{faculty.name}</td>
                  <td className="py-3 px-6">{faculty.email}</td>
                  <td className="py-3 px-6">
                    {faculty.userType
                      ? faculty.userType.charAt(0).toUpperCase() +
                        faculty.userType.slice(1)
                      : "N/A"}
                  </td>
                  <td className="py-3 px-6">
                    <button
                      onClick={() => handleDeleteFaculty(faculty._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-lg text-gray-600 mt-10">
          No Users Found
        </p>
      )}
    </div>
  );
};

export default User;
