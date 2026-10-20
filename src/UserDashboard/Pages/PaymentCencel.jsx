
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rideId = searchParams.get("ride_id");

  return (
    <main className="grid min-h-screen place-items-center bg-[#101010] p-5 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#191919] p-8 text-center">
        <div className="text-5xl">↩️</div>

        <h1 className="mt-4 text-2xl font-bold">
          Payment Cancelled
        </h1>

        <p className="mt-3 text-sm text-gray-300">
          Your payment was not confirmed. You can return to your
          dashboard and try again.
        </p>

        <button
          type="button"
          onClick={() => navigate("/user-dashboard")}
          className="mt-6 w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
        >
          Back to Dashboard
        </button>

        {rideId && (
          <p className="mt-4 break-all text-xs text-gray-500">
            Ride ID: {rideId}
          </p>
        )}
      </section>
    </main>
  );
}
