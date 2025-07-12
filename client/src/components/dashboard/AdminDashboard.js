import React, { useState } from 'react';
import BookingsAdmin from '../bookings/BookingsAdmin';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for spinner

  // Unique ID for toast to prevent duplicates
  const toastId = React.useRef(null);

  // Function to handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  // Function to handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      if (!toast.isActive(toastId.current)) {
        toastId.current = toast.error("Please select a file first!");
      }
      return;
    }

    // Creating FormData and appending the file to it
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setLoading(true); // Show spinner
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/upload`, // API endpoint
        formData, // FormData object
        {
          withCredentials: true, // Include credentials if needed
          headers: {
            "Content-Type": "multipart/form-data", // Set the correct Content-Type
          },
        }
      );

      if (response.data.message === "Bookings added successfully") {
        if (!toast.isActive(toastId.current)) {
          toastId.current = toast.success("File uploaded successfully!");
        }
      } else {
        if (!toast.isActive(toastId.current)) {
          toastId.current = toast.error("File upload failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      if (!toast.isActive(toastId.current)) {
        toastId.current = toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false); // Hide spinner
    }
  };

  return (
    <div className='mt-6 min-h-screen'>
      <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl text-center text-gray-800 font-black leading-7 ml-3 md:leading-10">
        Admin <span className="text-indigo-700">Dashboard</span>
      </h1>

      <div className=''>
        <BookingsAdmin />
      </div>

      <div className="mt-4 flex flex-col items-center">
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="mb-2"
        />
        <button 
          onClick={handleFileUpload} 
          disabled={loading}
          className={`px-4 py-2 bg-indigo-600 text-white rounded ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-500'}`}
        >
          {loading ? "Uploading..." : "Upload File"}
        </button>

        {/* Spinner */}
        {loading && <div className="mt-2 spinner">Loading...</div>}
      </div>

      {/* Toast notification container positioned at bottom-left */}
      <ToastContainer position="bottom-left" />
    </div>
  );
}

export default AdminDashboard;
