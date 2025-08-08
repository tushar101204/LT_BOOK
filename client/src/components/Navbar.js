import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { UserContext } from "../App"
import logo from "../assets/lnmiit.png"

const Navbar = () => {
  const { state } = useContext(UserContext)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeBtnRef = useRef(null)
  const overlayRef = useRef(null)

  // Focus close button on open, close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    if (menuOpen) {
      closeBtnRef.current?.focus()
      document.addEventListener("keydown", onKeyDown)
    }
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  // Click outside overlay to close
  useEffect(() => {
    function handleOverlayClick(e) {
      if (e.target === overlayRef.current) setMenuOpen(false)
    }
    if (menuOpen) {
      overlayRef.current?.addEventListener("click", handleOverlayClick)
    }
    return () => overlayRef.current?.removeEventListener("click", handleOverlayClick)
  }, [menuOpen])

  const roleItems = useMemo(() => {
    const userType = state?.userType
    if (userType === "admin") {
      return [
        { to: "/halls", label: "Halls" },
        { to: "/user", label: "Users" },
      ]
    }
    if (userType === "faculty") {
      return [{ to: "/bookings", label: "Bookings" }]
    }
    return [{ to: "/halls", label: "Halls" }]
  }, [state?.userType])

  const baseItems = useMemo(
    () => [
      { to: "/", label: "Home" },
      { to: "/events", label: "Events" },
      { to: "/calendar", label: "Calendar" },
      ...roleItems,
      { to: "/profile", label: "Profile" },
    ],
    [roleItems]
  )

  function NavItem({ to, label, onClick }) {
    const isActive = location.pathname === to
    const base =
      "px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
    const active =
      "text-gray-900 bg-gray-100"
    const inactive =
      "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`${base} ${isActive ? active : inactive}`}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </Link>
    )
  }

  function AuthButton() {
    if (state?.user) {
      return (
        <Link to="/logout">
          <button
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
            type="button"
          >
            Logout
          </button>
        </Link>
      )
    }
    return (
      <Link to="/login">
        <button
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
          type="button"
        >
          Sign In / Sign Up
        </button>
      </Link>
    )
  }

  return (
    <>
      <nav
        className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        role="navigation"
        aria-label="Main"
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3" aria-label="Home">
            <img className="w-24 md:w-36" src={logo || "/placeholder.svg"} alt="LNMIIT logo" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-2">
            {baseItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </div>

          {/* Right side - Auth */}
          <div className="hidden md:block">
            <AuthButton />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300 md:hidden"
            aria-label="Open main menu"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none">
              <path stroke="none" d="M0 0h24v24H0z" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile overlay + drawer */}
        {menuOpen && (
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            aria-hidden={!menuOpen}
          >
            <div
              id="mobile-menu"
              className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl focus:outline-none"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <img className="w-10" src={logo || "/placeholder.svg"} alt="LNMIIT logo" />
                  <span className="text-base font-semibold text-gray-900">Menu</span>
                </div>
                <button
                  ref={closeBtnRef}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
                  aria-label="Close menu"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none">
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="px-4 py-4">
                <ul className="flex flex-col gap-1">
                  {baseItems.map((item) => (
                    <li key={item.to}>
                      <NavItem
                        to={item.to}
                        label={item.label}
                        onClick={() => setMenuOpen(false)}
                      />
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t pt-4">
                  <AuthButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

export default Navbar