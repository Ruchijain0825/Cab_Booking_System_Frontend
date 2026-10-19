import { useCallback, useEffect, useState } from "react";
import RideMap from "../Pages/RideMap.jsx";
import ChatPanel from "../Components/ChatPanel.jsx";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function UserDashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // API request helper
  const request = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("userAccessToken");

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Request failed");
    }

    return result;
  }, []);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const [driverData, activeData, historyData] =
        await Promise.all([
          request("/api/user/drivers/available"),
          request("/api/user/rides/active"),
          request("/api/user/rides/history"),
        ]);

      setDrivers(driverData.data || []);

      // Update the active ride whenever the API returns new status.
      const latestRide = activeData.data || null;

      setActiveRide((previousRide) => {
        if (previousRide?.id !== latestRide?.id) {
          setChatOpen(false);
        }

        return latestRide;
      });

      setHistory(historyData.data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load dashboard");
    }
  }, [request]);

  // Initial load and automatic refresh every 3 seconds
  useEffect(() => {
    loadDashboard();

    const intervalId = setInterval(() => {
      loadDashboard();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [loadDashboard]);

  // Find available cabs
  const findCabs = async () => {
    if (!pickup.trim() || !drop.trim()) {
      setError("Please enter pickup and drop locations.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await request(
        "/api/user/drivers/available"
      );

      setDrivers(result.data || []);
      setSelectedDriver(null);
    } catch (err) {
      setError(err.message || "Unable to find cabs");
    } finally {
      setLoading(false);
    }
  };

  // Book a ride
  const bookRide = async () => {
    if (!selectedDriver?.id) {
      setError("Please select a driver first.");
      return;
    }

    if (!pickup.trim() || !drop.trim()) {
      setError("Enter pickup and drop locations first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await request("/api/user/rides", {
        method: "POST",
        body: JSON.stringify({
          driverId: selectedDriver.id,
          pickupLocation: pickup.trim(),
          dropLocation: drop.trim(),
        }),
      });

      setSelectedDriver(null);
      setChatOpen(false);

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to book ride");
    } finally {
      setLoading(false);
    }
  };

  // Normalize ride status
  const rideStatus = String(
    activeRide?.status || ""
  ).trim().toLowerCase();

  // Chat becomes available after driver acceptance.
  const canChat = ["accepted", "ongoing"].includes(rideStatus);

  const completedRides = history.filter(
    (ride) =>
      String(ride.status || "").toUpperCase() === "COMPLETED"
  ).length;

  return (
    <div className="min-h-screen bg-[#101010] text-white md:flex">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-white/10 p-6 md:flex md:flex-col">
        <h1 className="mb-12 text-2xl font-extrabold">
          Cab<span className="text-yellow-400">Go</span>
        </h1>

        <p className="mb-4 text-xs tracking-widest text-gray-500">
          MENU
        </p>

        <nav className="space-y-3">
          {[
            ["⌂", "Home", "#home"],
            ["+", "Book a Ride", "#booking"],
            ["↗", "Active Ride", "#active-ride"],
            ["◷", "Ride History", "#history"],
          ].map(([icon, label, href]) => (
            <a
              key={label}
              href={href}
              className="flex gap-3 rounded-xl px-4 py-3 text-sm text-gray-300 transition hover:bg-yellow-400/10 hover:text-yellow-400"
            >
              <span>{icon}</span>
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 p-4">
          <p className="font-semibold">Need help?</p>
          <p className="mt-1 text-xs text-gray-400">
            We're here for you.
          </p>
        </div>
      </aside>

      {/* Main dashboard */}
      <main
        id="home"
        className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"
      >
        {/* Header */}
        <header className="mb-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-yellow-400">
              YOUR JOURNEY STARTS HERE
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Where to, today?
            </h2>
          </div>

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-yellow-400 font-bold text-black">
            U
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Welcome banner */}
        <section className="flex items-center justify-between overflow-hidden rounded-2xl border border-yellow-400/20 bg-gradient-to-r from-[#332b10] to-[#1c1c1a] p-6 sm:p-9">
          <div>
            <p className="text-xs font-bold tracking-widest text-yellow-400">
              RIDE WITH COMFORT
            </p>

            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              Your city, your ride.
            </h2>

            <p className="mt-3 text-sm text-gray-300">
              Safe, reliable rides whenever you need them.
            </p>
          </div>

          <div className="hidden text-6xl sm:block">🚕</div>
        </section>

        {/* Booking and map */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Booking form */}
          <section
            id="booking"
            className="rounded-2xl border border-white/10 bg-[#191919] p-5 sm:p-6"
          >
            <h3 className="text-lg font-bold">Book a ride</h3>

            <p className="mt-1 text-sm text-gray-400">
              Enter your journey details
            </p>

            <label className="mt-6 block text-xs font-bold tracking-widest text-gray-400">
              PICKUP LOCATION
            </label>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#101010] px-4">
              <span className="text-yellow-400">●</span>

              <input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Enter pickup location"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-gray-600"
              />
            </div>

            <label className="mt-5 block text-xs font-bold tracking-widest text-gray-400">
              DROP LOCATION
            </label>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#101010] px-4">
              <span>●</span>

              <input
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                placeholder="Where are you going?"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-gray-600"
              />
            </div>

            <button
              type="button"
              onClick={findCabs}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-yellow-400 px-4 py-4 text-sm font-extrabold text-black transition hover:bg-yellow-300 disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Find Available Cabs →"}
            </button>
          </section>

          {/* Map */}
          <section className="min-w-0 rounded-2xl border border-white/10 bg-[#191919] p-5 sm:p-6">
            <h3 className="mb-2 font-bold">Your route</h3>

            <p className="mb-4 text-sm text-gray-400">
              Explore your route on the map
            </p>

            <RideMap />
          </section>
        </div>

        {/* Summary cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["🚘", "Available drivers", drivers.length],
            ["🛣", "Completed rides", completedRides],
            ["◷", "Active ride", activeRide?.status || "None"],
          ].map(([icon, label, value]) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#191919] p-5"
            >
              <span className="text-2xl">{icon}</span>

              <div>
                <p className="text-xs text-gray-400">{label}</p>

                <p className="mt-2 break-words text-xl font-bold">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Available drivers */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#191919] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                Available drivers
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Choose a driver for your journey
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="text-sm text-yellow-400 hover:text-yellow-300"
            >
              Refresh ↻
            </button>
          </div>

          {drivers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
              <p className="text-3xl">🚕</p>

              <p className="mt-3 font-semibold">
                No drivers to show yet
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Online drivers will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-[#111] p-4"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-400/10 text-2xl">
                    🚘
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{driver.name}</p>

                    <p className="mt-1 text-xs text-gray-400">
                      {driver.vehicle_type} · {driver.vehicle_number}
                    </p>

                    <p className="mt-1 text-xs text-green-400">
                      ● Online
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDriver(driver)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                      selectedDriver?.id === driver.id
                        ? "border-yellow-400 bg-yellow-400 text-black"
                        : "border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
                    }`}
                  >
                    {selectedDriver?.id === driver.id
                      ? "Selected"
                      : "Select"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedDriver && (
            <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4">
              <p className="text-sm">
                Selected driver:{" "}
                <strong>{selectedDriver.name}</strong>
              </p>

              <button
                type="button"
                onClick={bookRide}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-yellow-400 p-3 font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
              >
                {loading ? "Booking..." : "Request a Ride →"}
              </button>
            </div>
          )}
        </section>

        {/* Active ride and chat */}
        <section
          id="active-ride"
          className="mt-6 rounded-2xl border border-white/10 bg-[#191919] p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Active ride</h3>

              <p className="mt-1 text-sm text-gray-400">
                Your current booking
              </p>
            </div>

            <span className="rounded-full bg-yellow-400/10 px-3 py-2 text-xs text-yellow-400">
              {activeRide?.status || "No active ride"}
            </span>
          </div>

          {activeRide ? (
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <p>
                From:{" "}
                {activeRide.pickup_address ??
                  activeRide.pickup_location ??
                  "Not available"}
              </p>

              <p>
                To:{" "}
                {activeRide.drop_address ??
                  activeRide.drop_location ??
                  "Not available"}
              </p>

              <p className="break-all text-xs text-gray-500">
                Ride ID: {activeRide.id}
              </p>

              {/* Chat button */}
              {canChat ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setChatOpen((open) => !open)
                    }
                    className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
                  >
                    💬{" "}
                    {chatOpen
                      ? "Hide Chat"
                      : "Chat with Driver"}
                  </button>

                  {chatOpen && (
                    <ChatPanel
                      rideId={activeRide.id}
                      role="USER"
                      onClose={() => setChatOpen(false)}
                    />
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  Chat will appear after the driver accepts your ride.
                  Current status: {activeRide.status || "unknown"}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-400">
              No active ride. Book one to get started.
            </p>
          )}
        </section>

        {/* Ride history */}
        <section
          id="history"
          className="mt-6 rounded-2xl border border-white/10 bg-[#191919] p-5 sm:p-6"
        >
          <h3 className="text-lg font-bold">Recent rides</h3>

          <p className="mt-1 text-sm text-gray-400">
            Your latest journeys
          </p>

          {history.length === 0 ? (
            <p className="mt-5 text-sm text-gray-400">
              No rides in your history yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-white/10">
              {history.slice(0, 5).map((ride) => (
                <div
                  key={ride.id}
                  className="flex flex-wrap items-center gap-3 py-4"
                >
                  <span className="text-xl">🚕</span>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">
                      {ride.pickup_address ??
                        ride.pickup_location ??
                        "Pickup unavailable"}
                    </p>

                    <p className="mt-1 break-words text-xs text-gray-400">
                      To:{" "}
                      {ride.drop_address ??
                        ride.drop_location ??
                        "Drop unavailable"}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/5 px-3 py-2 text-xs text-yellow-400">
                    {ride.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="py-8 text-center text-xs text-gray-600">
          © CabGo · Your ride, your way.
        </footer>
      </main>
    </div>
  );
}