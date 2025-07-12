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
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/getuser`, {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        
        if (response.data.faculties && response.data.faculties.length > 0) {
          setFaculties(response.data.faculties);
         
        } else {
          
        }
      } catch (error) {
        console.error("Error fetching faculties:", error);
        
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaculties();
  }, []);

  // Delete faculty
  const handleDeleteFaculty = async (facultyId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this faculty?");
    if (isConfirmed) {
      try {
        const response = await axios.delete(`${process.env.REACT_APP_SERVER_URL}/deleteuser/${facultyId}`, {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        if (response.data.success) {
          toast.success("Faculty deleted successfully!");
          setFaculties(faculties.filter((faculty) => faculty._id !== facultyId));
        } else {
          toast.info(response.data.message || "Faculty not found.");
        }
      } catch (error) {
        console.error("Error deleting faculty:", error.message);
        toast.error("Failed to delete faculty.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader bg-indigo-500 text-white p-3 rounded-full flex space-x-3 animate-pulse">
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
        </div>
      </div>
    );
  }

  

        
            return (
                <div className="min-h-screen p-6 bg-gray-100">
                  <ToastContainer position="bottom-left" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
              
                  <h1 className="text-4xl text-center font-extrabold mb-10 text-indigo-700">Users</h1>
              
                  {faculties.length > 0 ? (
                    <div className="overflow-x-auto flex justify-center"> {/* Centering the table */}
                      <table className="w-4/5 table-auto bg-white border border-gray-200 shadow-lg rounded-lg"> {/* Set width to 80% */}
                        <thead className="bg-indigo-100 text-black">
                          <tr>
                            <th className="py-3 px-6 text-left">Name</th>
                            <th className="py-3 px-6 text-left">Email</th>
                            <th className="py-3 px-6 text-left">Account Type</th>
                            <th className="py-3 px-6 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faculties.map((faculty) => (
                            <tr key={faculty._id} className="border-b hover:bg-gray-100">
                              <td className="py-3 px-6">{faculty.name}</td>
                              <td className="py-3 px-6">{faculty.email}</td>
                              <td className="py-3 px-6">
                                {faculty.userType ? faculty.userType.charAt(0).toUpperCase() + faculty.userType.slice(1) : "N/A"}
                              </td>
                              <td className="py-3 px-6">
                                <button
                                  onClick={() => handleDeleteFaculty(faculty._id)}
                                  className="text-red-600 hover:text-red-800 bg-transparent border-2 border-red-600 py-1 px-3 rounded-md"
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
                    <p className="text-center text-xl text-gray-700">No Faculties Found</p>
                  )}
                </div>
              );
          
      
};

export default User;
