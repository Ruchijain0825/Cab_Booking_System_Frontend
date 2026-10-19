import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("driverAccessToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const getPayload = (response) => response?.data?.data ?? response?.data ?? {};

const getErrorMessage = (error) => {
  if (error.response?.status === 401) return "Session expired. Please log in again.";
  if (error.response?.status === 403) return "You do not have permission to access this data.";
  if (error.response?.status === 404) return "API route not found. Check the backend route.";
  return error.response?.data?.message || error.message || "Could not load dashboard data.";
};

const navItems = [
  ["Dashboard", "⌂"],
  ["Ride Requests", "♧"],
  ["My Trips", "▣"],
  ["Earnings", "▰"],
  ["My Profile", "◉"],
  ["Vehicle Details", "▱"],
  ["Documents", "▤"],
  ["Settings", "⚙"],
];

function StatCard({ icon, title, value, subtitle, tone }) {
  const colors = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    yellow: "bg-amber-400",
    purple: "bg-violet-500",
  };

  return (
    <article className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl text-white ${colors[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-0.5 truncate text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-emerald-600">{subtitle}</p>}
      </div>
    </article>
  );
}

export default function DriverDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [online, setOnline] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [earnings, setEarnings] = useState({});
  const [dailyEarnings, setDailyEarnings] = useState([]);
  const [rides, setRides] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyRide, setBusyRide] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const endpoints = [
      ["availability", () => api.get("/api/driver/availability")],
      ["earnings", () => api.get("/api/dashboard/earnings")],
      ["daily earnings", () => api.get("/api/dashboard/daily-earnings")],
      ["ride requests", () => api.get("/api/rides/requests")],
      ["ride history", () => api.get("/api/rides/history?limit=5&offset=0")],
    ];

    const results = await Promise.allSettled(
      endpoints.map(([, request]) => request())
    );
    const failures = [];

    results.forEach((result, index) => {
      const [key] = endpoints[index];

      if (result.status === "rejected") {
        failures.push({ key, error: result.reason });
        console.error(
          `CabGo ${key} API failed:`,
          result.reason.response?.data || result.reason.message
        );
        return;
      }

      const data = getPayload(result.value);

      if (key === "availability") {
        const value = data?.is_online ?? data?.isOnline;
        if (typeof value === "boolean") setOnline(value);
      } else if (key === "earnings") {
        setEarnings(data || {});
      } else if (key === "daily earnings") {
        setDailyEarnings(Array.isArray(data) ? data : []);
      } else if (key === "ride requests") {
        setRides(Array.isArray(data) ? data : []);
      } else if (key === "ride history") {
        setHistory(Array.isArray(data) ? data : []);
      }
    });

    if (failures.length) {
      setError(`${failures[0].key}: ${getErrorMessage(failures[0].error)}`);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const toggleAvailability = async () => {
    setAvailabilityLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await api.patch("/api/driver/availability", {
        isOnline: !online,
      });
      const data = getPayload(response);
      const value = data?.is_online ?? data?.isOnline;

      if (typeof value !== "boolean") {
        throw new Error("Availability API did not return is_online/isOnline.");
      }

      setOnline(value);
      setNotice(value ? "You are now online." : "You are now offline.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleRide = async (rideId, action) => {
    setBusyRide(rideId);
    setError("");
    setNotice("");

    try {
      await api.patch(`/api/rides/${rideId}/${action}`);
      setNotice(action === "accept" ? "Ride accepted successfully." : "Ride declined.");
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyRide(null);
    }
  };

  const completedRides = Number(earnings.completed_rides || 0);
  const totalEarnings = Number(earnings.total_earnings || 0);
  const todayEarnings = Number(earnings.today_earnings || 0);
  const todayRides = Number(earnings.today_rides || 0);
  const averageFare = Number(earnings.average_fare || 0);
  const maxDaily = Math.max(
    1,
    ...dailyEarnings.map((item) => Number(item.daily_earnings || 0))
  );

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 font-semibold text-slate-700">
        Loading CabGo dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[260px] shrink-0 flex-col bg-[#17212e] px-3 py-6 text-white lg:flex">
          <div className="px-5 text-[29px] font-extrabold tracking-tight">
            Cab<span className="text-amber-400">Go</span> <span className="text-xl">🚘</span>
          </div>

          <div className="mt-8 px-5">
            <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-slate-500 bg-slate-200 text-4xl text-slate-700">
              👤
            </div>
            <p className="mt-3 text-lg font-bold">Driver</p>
            <p className="mt-1 text-sm text-slate-300">
              ★ {earnings.rating ?? "—"} <span className="text-slate-400">({completedRides} rides)</span>
            </p>
          </div>

          <nav className="mt-7 space-y-2">
            {navItems.map(([label, icon]) => (
              <button
                key={label}
                onClick={() => setActivePage(label)}
                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] transition ${
                  activePage === label
                    ? "bg-blue-600/60 font-semibold text-white"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <span className="w-7 text-center text-xl">{icon}</span>
                {label}
                {label === "Ride Requests" && rides.length > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold">
                    {rides.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <button
            onClick={() => {
              sessionStorage.removeItem("driverAccessToken");
              window.location.href = "/";
            }}
            className="mt-auto flex items-center gap-4 px-5 py-4 font-semibold text-red-400 hover:text-red-300"
          >
            <span className="text-xl">⇥</span> Logout
          </button>
        </aside>

        {/* Main dashboard */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 xl:px-7">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Good Morning, Driver!
              </h1>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                {online
                  ? "Ready to hit the road? You're online and can receive ride requests."
                  : "Ready for your next ride? Go online to receive ride requests."}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <span className={`flex items-center gap-2 text-sm font-semibold ${online ? "text-emerald-700" : "text-slate-500"}`}>
                <span className={`h-3 w-3 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`} />
                {online ? "Online" : "Offline"}
              </span>
              <button
                aria-label="Toggle online status"
                onClick={toggleAvailability}
                disabled={availabilityLoading}
                className={`relative h-9 w-[62px] rounded-full p-1 transition disabled:opacity-50 ${online ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`block h-7 w-7 rounded-full bg-white shadow transition-transform ${online ? "translate-x-6" : "translate-x-0"}`} />
              </button>
              <button onClick={loadDashboard} title="Refresh dashboard" className="relative rounded-full p-2 text-2xl hover:bg-white">
                ♧
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
              </button>
            </div>
          </header>

          {error && (
            <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <span>{error}</span>
              <button onClick={loadDashboard} className="font-bold underline">Retry</button>
            </div>
          )}
          {notice && (
            <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {notice}
            </div>
          )}

          <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard icon="🚘" title="Completed Rides" value={completedRides} subtitle="Lifetime completed rides" tone="green" />
            <StatCard icon="▣" title="Total Earnings" value={money(totalEarnings)} subtitle="Completed-ride fares" tone="blue" />
            <StatCard icon="★" title="Average Fare" value={money(averageFare)} subtitle="Per completed ride" tone="yellow" />
            <StatCard icon="♧" title="Pending Requests" value={rides.length} subtitle={online ? "Ready for new rides" : "Go online to receive rides"} tone="purple" />
          </section>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.55fr_0.95fr]">
            {/* Map / request panel */}
            <section className="overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-sm sm:p-3">
              <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 pt-1">
                <h2 className="text-lg font-bold"><span className="mr-2 text-blue-700">📍</span>Live Map</h2>
                <button onClick={toggleAvailability} disabled={availabilityLoading} className={`rounded-full border px-4 py-2 text-sm font-semibold ${online ? "border-red-100 text-red-500 hover:bg-red-50" : "border-emerald-100 text-emerald-700 hover:bg-emerald-50"}`}>
                  {online ? "⏻ Go Offline" : "● Go Online"}
                </button>
              </div>

              <div className="relative min-h-[350px] overflow-hidden rounded-xl bg-[#e6eee9] sm:min-h-[480px]">
                <div
                  className="absolute inset-0 opacity-80"
                  style={{
                    backgroundImage:
                      "linear-gradient(35deg, transparent 46%, #ffffff 47%, #ffffff 49%, transparent 50%),linear-gradient(120deg, transparent 43%, #cbd9d3 44%, #cbd9d3 46%, transparent 47%),linear-gradient(90deg, transparent 48%, #ffffff 49%, #ffffff 50%, transparent 51%),linear-gradient(0deg, transparent 48%, #ffffff 49%, #ffffff 50%, transparent 51%)",
                    backgroundSize: "110px 100px,145px 135px,78px 90px,95px 75px",
                  }}
                />
                <div className="absolute -right-10 top-0 h-full w-16 rotate-12 bg-sky-200/70" />
                <div className="absolute left-[56%] top-[18%] h-[54%] w-1.5 rotate-[38deg] rounded-full bg-blue-500 shadow-sm" />
                <div className="absolute left-[57%] top-[17%] grid h-8 w-8 place-items-center rounded-full bg-red-500 text-white shadow-lg">●</div>
                <div className="absolute left-[55%] top-[65%] grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">●</div>
                <span className="absolute bottom-[15%] right-[17%] text-xs font-semibold text-slate-600">City Map</span>
                <span className="absolute left-[49%] top-[47%] text-2xl drop-shadow">🚘</span>

                <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-lg bg-white shadow-md">
                  <button className="px-3 py-1 text-xl font-bold hover:bg-slate-100" aria-label="Zoom in">+</button>
                  <button className="border-t px-3 py-1 text-xl font-bold hover:bg-slate-100" aria-label="Zoom out">−</button>
                  <button onClick={loadDashboard} className="border-t px-3 py-2 text-lg hover:bg-slate-100" title="Refresh map data">◎</button>
                </div>

                {rides.length > 0 ? (
                  <div className="absolute left-3 top-3 w-[min(360px,calc(100%-24px))] rounded-xl border border-white bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:left-4 sm:top-4">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <h3 className="font-bold">🔔 New Ride Request</h3>
                      <span className="text-xs text-slate-500">{rides.length} available</span>
                    </div>
                    <div className="mt-3 flex gap-3">
                      <span className="text-emerald-600">●</span>
                      <div><p className="text-xs text-slate-500">Pickup</p><p className="text-sm font-medium">{rides[0].pickup_address || "Pickup location"}</p></div>
                    </div>
                    <div className="mt-3 flex gap-3">
                      <span className="text-red-500">●</span>
                      <div><p className="text-xs text-slate-500">Drop</p><p className="text-sm font-medium">{rides[0].drop_address || "Drop location"}</p></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <p className="text-xl font-extrabold">{money(rides[0].fare_amount)}</p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">Fare</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => handleRide(rides[0].id, "decline")} disabled={!online || busyRide === rides[0].id} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-500 disabled:opacity-50">Decline</button>
                      <button onClick={() => handleRide(rides[0].id, "accept")} disabled={!online || busyRide === rides[0].id} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busyRide === rides[0].id ? "Processing..." : "Accept"}</button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute left-3 top-3 max-w-xs rounded-xl bg-white/95 p-4 shadow-md sm:left-4 sm:top-4">
                    <p className="font-bold">{online ? "You're ready for a ride" : "You're currently offline"}</p>
                    <p className="mt-1 text-sm text-slate-500">{online ? "New requests will appear here when available." : "Go online to become available for requests."}</p>
                  </div>
                )}
              </div>
              <p className="px-2 pt-2 text-xs text-slate-400">Map preview only. Connect a map provider for live map tiles and driver location.</p>
            </section>

            {/* Earnings and trip history */}
            <div className="flex min-w-0 flex-col gap-5">
              <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">Today's Earnings</h2>
                  <button onClick={() => setActivePage("Earnings")} className="text-sm font-semibold text-blue-600">View Details →</button>
                </div>
                <div className="mt-3 flex items-center gap-3">
  <p className="text-3xl font-extrabold">
    {money(todayEarnings)}
  </p>

  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
    Today
  </span>
</div>

<p className="mt-1 text-xs text-slate-400">
  {todayRides} completed rides today
</p>

{dailyEarnings.length ? (
                  <div className="mt-5 flex h-32 items-end gap-2 border-b border-slate-100 pb-2">
                    {[...dailyEarnings].slice(-7).map((item, index) => {
                      const amount = Number(item.daily_earnings || 0);
                      const height = Math.max(5, (amount / maxDaily) * 100);
                      const day = item.earning_date
                        ? new Date(item.earning_date).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })
                        : `D${index + 1}`;
                      return (
                        <div key={`${day}-${index}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                          <div title={`${day}: ${money(amount)}`} className="w-full max-w-10 rounded-t bg-emerald-500/80" style={{ height: `${height}%` }} />
                          <span className="text-[10px] text-slate-500">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-5 rounded-lg bg-slate-50 p-5 text-sm text-slate-500">Daily earnings will appear here when available.</p>
                )}
              </section>

              <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">Recent Trips</h2>
                  <button onClick={() => setActivePage("My Trips")} className="text-sm font-semibold text-blue-600">View All →</button>
                </div>
                {history.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500">No completed or cancelled trips found.</p>
                ) : history.slice(0, 4).map((trip) => (
                  <article key={trip.id} className="flex items-start justify-between gap-3 border-t border-slate-100 py-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl text-slate-600">◷</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{trip.pickup_address || "Pickup"} → {trip.drop_address || "Drop"}</p>
                        <p className="mt-1 text-xs text-slate-500">{trip.created_at ? new Date(trip.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Trip date unavailable"}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ${trip.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{trip.status}</span>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{money(trip.fare_amount)}</p>
                  </article>
                ))}
              </section>
            </div>
          </div>

          {/* Bottom panels */}
          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.1fr]">
            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold">🚘 Vehicle Status</h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-20 w-28 place-items-center rounded-xl bg-slate-50 text-5xl">🚙</div>
                <div className="flex-1">
                  <p className="font-bold">{earnings.vehicle_name || "Vehicle details unavailable"}</p>
                  <p className="mt-1 text-sm text-slate-500">{earnings.vehicle_number || "Add vehicle registration in profile"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{online ? "Active" : "Offline"}</span>
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold">♧ Quick Actions</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["▤", "Update Documents", "Documents"],
                  ["🚘", "Vehicle Service", "Vehicle Details"],
                  ["ⓘ", "Help & Support", "Settings"],
                ].map(([icon, label, page]) => (
                  <button key={label} onClick={() => setActivePage(page)} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-xl text-blue-700">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {activePage !== "Dashboard" && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <div className="flex items-center justify-between gap-3">
                <p><strong>{activePage}</strong> selected. Connect this section to its dedicated page or route.</p>
                <button onClick={() => setActivePage("Dashboard")} className="font-semibold underline">Back to Dashboard</button>
              </div>
            </div>
          )}

          <footer className="py-5 text-center text-xs text-slate-400">CabGo Driver Dashboard</footer>
        </main>
      </div>
    </div>
  );
}


