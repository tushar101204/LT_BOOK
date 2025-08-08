import React, { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

/**
 * Utility: Get initials for avatar fallback
 */
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * Simple confirmation dialog (accessible)
 */
function ConfirmDialog({ open, title, description, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b px-5 py-4">
          <h2 id="confirm-title" className="text-lg font-semibold">
            {title}
          </h2>
        </div>
        <div className="px-5 py-4">
          <p id="confirm-desc" className="text-sm text-gray-600">
            {description}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

const User = () => {
  const [faculties, setFaculties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [isDeletingId, setIsDeletingId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null) // holds faculty object when confirming
  const searchRef = useRef(null)

  // Fetch faculties (uses AbortController to avoid race conditions)
  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError("")
    ;(async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/getuser`, {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        })

        const list = Array.isArray(response?.data?.faculties) ? response.data.faculties : []
        setFaculties(list)
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Error fetching faculties:", err)
          setError("Failed to load users. Please try again.")
        }
      } finally {
        setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [])

  // Derived filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return faculties
    return faculties.filter((f) => {
      const name = (f?.name || "").toLowerCase()
      const email = (f?.email || "").toLowerCase()
      const role = (f?.userType || "").toLowerCase()
      return name.includes(q) || email.includes(q) || role.includes(q)
    })
  }, [faculties, query])

  // Delete faculty (with confirm dialog)
  const handleDeleteFaculty = async (facultyId) => {
    setIsDeletingId(facultyId)
    try {
      const response = await axios.delete(`${process.env.REACT_APP_SERVER_URL}/deleteuser/${facultyId}`, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      if (response?.data?.success) {
        setFaculties((prev) => prev.filter((f) => f._id !== facultyId))
        toast.success("User deleted successfully!")
      } else {
        toast.info(response?.data?.message || "User not found.")
      }
    } catch (error) {
      console.error("Error deleting user:", error?.message)
      toast.error("Failed to delete user.")
    } finally {
      setIsDeletingId(null)
      setConfirmTarget(null)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    setError("")
    const controller = new AbortController()
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/getuser`, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })
      const list = Array.isArray(response?.data?.faculties) ? response.data.faculties : []
      setFaculties(list)
      toast.success("Users refreshed")
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError("Failed to refresh users.")
        toast.error("Failed to refresh users.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // UI Helpers
  const RoleBadge = ({ role }) => {
    const r = (role || "N/A").toLowerCase()
    const base =
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize"
    const variants = {
      admin: "border-rose-200 text-rose-700 bg-rose-50",
      faculty: "border-amber-200 text-amber-800 bg-amber-50",
      student: "border-emerald-200 text-emerald-700 bg-emerald-50",
      default: "border-gray-200 text-gray-700 bg-gray-50",
    }
    const cls =
      r === "admin" ? variants.admin : r === "student" ? variants.student : r === "faculty" ? variants.faculty : variants.default
    return <span className={`${base} ${cls}`}>{role || "N/A"}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="bottom-left" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">Search, review, and remove users from your system.</p>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or role"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-label="Search users"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-gray-400" aria-hidden="true">
              {/* Magnifier icon (unicode) */}
              {'🔎'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setQuery("")
                searchRef.current?.focus()
              }}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              type="button"
            >
              Clear
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Status line */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm text-gray-600">
            <span>
              {isLoading ? "Loading users..." : `${filtered.length} of ${faculties.length} users`}
            </span>
            {error ? <span className="text-rose-600">{error}</span> : null}
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Account Type</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {/* Loading skeleton */}
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-200" />
                          <div className="h-4 w-36 rounded bg-gray-200" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-48 rounded bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="ml-auto h-9 w-16 rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))}

                {/* Error empty fallback */}
                {!isLoading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-3 rounded-md border border-dashed border-gray-300 p-6">
                          <div className="text-4xl">🙂</div>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-600">Try adjusting your search or check back later.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!isLoading &&
                  !error &&
                  filtered.map((faculty) => (
                    <tr key={faculty._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                            {getInitials(faculty?.name || faculty?.email || "")}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-gray-900">{faculty?.name || "—"}</div>
                            <div className="truncate text-xs text-gray-500">{faculty?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="text-sm text-gray-700">{faculty?.email}</span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <RoleBadge role={faculty?.userType} />
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setConfirmTarget(faculty)}
                            disabled={isDeletingId === faculty._id}
                            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium ${
                              isDeletingId === faculty._id
                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                : "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                            }`}
                            aria-label={`Delete ${faculty?.name || faculty?.email}`}
                          >
                            {isDeletingId === faculty._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete user?"
        description={
          confirmTarget
            ? `This action cannot be undone. This will permanently remove the user "${confirmTarget.name || confirmTarget.email}".`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && handleDeleteFaculty(confirmTarget._id)}
      />
    </div>
  )
}

export default User