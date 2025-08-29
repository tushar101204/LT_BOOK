import React, { useState, useRef } from "react";
import BookingsAdmin from "../bookings/BookingsAdmin";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminDashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const toastId = useRef(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      if (!toast.isActive(toastId.current)) {
        toastId.current = toast.error("⚠️ Please select a file first!");
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/upload`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.message === "Bookings added successfully") {
        if (!toast.isActive(toastId.current)) {
          toastId.current = toast.success("✅ File uploaded successfully!");
        }
      } else {
        if (!toast.isActive(toastId.current)) {
          toastId.current = toast.error("❌ File upload failed. Try again.");
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      if (!toast.isActive(toastId.current)) {
        toastId.current = toast.error("⚠️ An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center mt-8 px-4">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
        Admin <span className="text-indigo-600">Dashboard</span>
      </h1>

      {/* Bookings Section */}
      <div className="w-full md:w-5/6 mb-10">
        <BookingsAdmin />
      </div>

      {/* File Upload Section */}
      <div className="w-full md:w-4/6 bg-white shadow-xl rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
          Upload <span className="text-indigo-600">Bookings File</span>
        </h2>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* File Input */}
          <input
            type="file"
            onChange={handleFileChange}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Upload Button */}
          <button
            onClick={handleFileUpload}
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg font-medium transition duration-200 shadow-md ${
              loading
                ? "bg-indigo-400 text-white cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {loading ? "Uploading..." : "Upload File"}
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-5 flex items-center text-indigo-600 font-medium">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
            Uploading, please wait...
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <ToastContainer position="bottom-left" />
    </div>
  );
};

export default AdminDashboard;
