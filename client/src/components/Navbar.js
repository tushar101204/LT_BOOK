import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import logo from '../assets/lnmiit_logo.png'


const Navbar = () => {
  const { state } = useContext(UserContext)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  const renderRoleLinks = () => {
    if (state.userType === "admin") {
      return (
        <div className="flex items-center gap-6">
          
          <Link onClick={closeMenu} to="/user" className="hover:text-gray-900">Users</Link>
        </div>
      )
    }
    if (state.userType === "faculty") {
      return (
        <Link onClick={closeMenu} to="/bookings" className="hover:text-gray-900">Bookings</Link>
      )
    }
    // return (
    //   <Link onClick={closeMenu} to="/halls" className="hover:text-gray-900">Halls</Link>
    // )
  }

  const AuthButton = () => {
    if (state.user) {
      return (
        <Link to="/logout">
          <button className="inline-flex items-center rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
            Logout
          </button>
        </Link>
      )
    }
    return (
      <Link to="/login">
        <button className="inline-flex items-center rounded-md border border-indigo-600 text-indigo-700 px-4 py-2 text-sm font-semibold hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
          Sign In / Sign Up
        </button>
      </Link>
    )
  }


  return (<>
    <nav className="w-full sticky top-0 z-50 backdrop-blur bg-white/80 border-b shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to={"/"} className="flex items-center gap-3" aria-label="Home">
            <img className=" w-24 md:w-36" src={logo} alt="LNMIIT logo" />
          </Link>

          <div className="hidden md:flex md:items-center md:gap-8">
            <Link to="/" className="text-gray-700 hover:text-gray-900">Home</Link>
            <Link to="/events" className="text-gray-700 hover:text-gray-900">Events</Link>
            <Link to="/calendar" className="text-gray-700 hover:text-gray-900">Calendar</Link>
            <Link onClick={closeMenu} to="/halls" className="hover:text-gray-900">Halls</Link>
            {renderRoleLinks()}
            <Link to="/profile" className="text-gray-700 hover:text-gray-900">Profile</Link>
          </div>

          <div className="hidden md:block">
            <AuthButton />
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              aria-controls="nav-menu"
              aria-expanded={isMenuOpen}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded-md"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#1f2937" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#1f2937" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z"></path>
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="18" x2="20" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div id="nav-menu" className="md:hidden border-t bg-white/95 backdrop-blur">
          <div className="px-6 py-4 space-y-4">
            <Link onClick={closeMenu} to="/" className="block text-gray-700 hover:text-gray-900">Home</Link>
            <Link onClick={closeMenu} to="/events" className="block text-gray-700 hover:text-gray-900">Events</Link>
            <Link onClick={closeMenu} to="/calendar" className="block text-gray-700 hover:text-gray-900">Calendar</Link>
            <div className="border-t pt-4">
              {renderRoleLinks()}
            </div>
            <Link onClick={closeMenu} to="/profile" className="block text-gray-700 hover:text-gray-900">Profile</Link>
            <div className="pt-2">
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  </>)
  
};

export default Navbar;
