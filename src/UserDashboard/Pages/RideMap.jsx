
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitRoute({ points }) {
  const map = useMap();

  if (points.length > 0) {
    map.fitBounds(points, { padding: [35, 35] });
  }

  return null;
}

export default function RideMap() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function showRoute() {
    if (!pickup.trim() || !destination.trim()) {
      setError("Please enter both pickup and destination.");
      return;
    }

    setError("");
    setRoute(null);
    setLoading(true);

    try {
      const geocode = async (place) => {
        const url =
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;

        // FIX: Fetch response before using it
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Location search failed. Try again.");
        }

        const results = await response.json();

        if (!results.length) {
          throw new Error(`Location not found: ${place}`);
        }

        return [
          Number(results[0].lat),
          Number(results[0].lon),
        ];
      };

      const start = await geocode(pickup);
      const end = await geocode(destination);

      const routeUrl =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start[1]},${start[0]};${end[1]},${end[0]}` +
        `?overview=full&geometries=geojson`;

      const routeResponse = await fetch(routeUrl);

      if (!routeResponse.ok) {
        throw new Error("Route service unavailable. Try again.");
      }

      const data = await routeResponse.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("Route not found between these locations.");
      }

      const result = data.routes[0];

      setRoute({
        points: result.geometry.coordinates.map(([lng, lat]) => [
          lat,
          lng,
        ]),
        distance: (result.distance / 1000).toFixed(1),
        duration: Math.round(result.duration / 60),
        start,
        end,
      });
    } catch (err) {
      setError(
        err.message || "Unable to load route. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl bg-[#191919] p-4 text-white">
      <h2 className="text-xl font-bold">CabGo Navigation</h2>

      <div className="grid gap-3">
        <input
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder="Pickup location, city, country"
          className="w-full rounded-lg border border-white/10 bg-[#101010] p-3 text-white outline-none"
        />

        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination, city, country"
          className="w-full rounded-lg border border-white/10 bg-[#101010] p-3 text-white outline-none"
        />
      </div>

      <button
        onClick={showRoute}
        disabled={loading}
        className="rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black hover:bg-yellow-300 disabled:opacity-50"
      >
        {loading ? "Finding route..." : "Show Route"}
      </button>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {route && (
        <div className="text-sm text-gray-300">
          <p>
            Distance: {route.distance} km · Approx. {route.duration} min
          </p>

          <a
            className="mt-2 inline-block font-semibold text-yellow-400 underline"
            href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${route.start[0]}%2C${route.start[1]}%3B${route.end[0]}%2C${route.end[1]}`}
            target="_blank"
            rel="noreferrer"
          >
            Open directions ↗
          </a>
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        style={{
          height: "350px",
          width: "100%",
          borderRadius: "12px",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {route && (
          <>
            <FitRoute points={route.points} />

            <Marker position={route.start} icon={defaultIcon}>
              <Popup>Pickup</Popup>
            </Marker>

            <Marker position={route.end} icon={defaultIcon}>
              <Popup>Destination</Popup>
            </Marker>

            <Polyline
              positions={route.points}
              pathOptions={{ color: "#eab308", weight: 5 }}
            />
          </>
        )}
      </MapContainer>

      <p className="text-xs text-gray-500">
        Map data © OpenStreetMap contributors. Routing by OSRM.
      </p>
    </div>
  );
}
