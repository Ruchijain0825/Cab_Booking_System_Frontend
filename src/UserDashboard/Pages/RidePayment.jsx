
import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function RidePayment({ ride }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayNow = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = sessionStorage.getItem("userAccessToken");

      if (!token) {
        setMessage("Please log in to make payment.");
        return;
      }

      if (
        String(ride?.status || "").toLowerCase() !== "completed"
      ) {
        setMessage("Payment is available after ride completion.");
        return;
      }
      console.log("Ride object:", ride);
console.log("Ride ID:", ride?.id);

if (
  !ride?.id ||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(ride.id)
  )
) {
  setMessage("Invalid ride ID. Please refresh your ride history.");
  return;
}

      const response = await fetch(
        `${API_URL}/api/payments/rides/${ride.id}/checkout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to start payment.");
      }

      if (!result.checkoutUrl) {
        throw new Error("Stripe Checkout URL was not returned.");
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(error.message || "Payment could not be started.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handlePayNow}
        disabled={loading}
        className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
      >
        {loading ? "Opening Checkout..." : "Pay Now"}
      </button>

      {message && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}
