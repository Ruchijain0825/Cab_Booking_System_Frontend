
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function PaymentSuccess() {
  const [status, setStatus] = useState("Verifying payment...");
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function verifyPayment() {
      const token = sessionStorage.getItem("userAccessToken");
      const rideId = searchParams.get("ride_id");
      const sessionId = searchParams.get("session_id");

      if (!token || !rideId || !sessionId) {
        setStatus("Missing login or payment session details.");
        setLoading(false);
        return;
      }

      try {
        // Retry status checks while the webhook is processing.
        for (let attempt = 0; attempt < 5; attempt++) {
          const response = await fetch(
            `${API_URL}/api/payments/rides/${encodeURIComponent(rideId)}/status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.message || "Could not verify payment."
            );
          }

          if (cancelled) return;

          if (result.payment?.status === "paid") {
            setStatus("Payment successful!");
            return;
          }

          if (attempt < 4) {
            setStatus("Payment is processing. Please wait...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (!cancelled) {
          setStatus(
            "Payment confirmation is still pending. Please check your ride status again shortly."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message || "Unable to verify payment.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const isPaid = status === "Payment successful!";

  return (
    <main className="grid min-h-screen place-items-center bg-[#101010] p-5 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#191919] p-8 text-center">
        <div className="text-5xl">
          {loading ? "⏳" : isPaid ? "✅" : "💳"}
        </div>

        <h1 className="mt-4 text-2xl font-bold">
          {loading ? "Please wait" : isPaid ? "Payment Confirmed" : "Payment Status"}
        </h1>

        <p className="mt-3 text-sm text-gray-300" role="status">
          {status}
        </p>

        <button
          type="button"
          onClick={() => navigate("/user-dashboard")}
          className="mt-6 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
        >
          Back to Dashboard
        </button>
      </section>
    </main>
  );
}
