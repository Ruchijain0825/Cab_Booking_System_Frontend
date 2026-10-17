
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CarFront, Mail, Lock, Eye, EyeOff, ArrowRight, UserRound, Phone, CreditCard, ShieldCheck } from "lucide-react";
import { registerDriver, loginDriver } from "../Apis/Driver.api.js";

export default function DriverLogin() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "", 
    email: "", 
    phone_number: "",
    password: "",
    confirmPassword: "", 
    licence_number: "", 
    vehicle_number: "",
    vehicle_type: "Sedan",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const mutation = useMutation({
    mutationFn: () => isLogin
      ? loginDriver({
          email: form.email,
          password: form.password,
          licence_number: form.licence_number,
        })
      : registerDriver({
          name: form.name,
          email: form.email,
          phone_number: form.phone_number,
          password: form.password,
          licence_number: form.licence_number,
          vehicle_number: form.vehicle_number,
          vehicle_type: form.vehicle_type,
        }),
    onSuccess: (data) => {
      if (isLogin) {
        const token = data.accesstoken || data.token;
        if (!token) 
        return toast.error("Access token not found");
        sessionStorage.setItem("driverAccessToken", token);
        navigate("/driver-dashboard");
        toast.success("Driver login successful!");
      } else {
        toast.success("Driver account created! Please login.");
        setIsLogin(true);
        setForm({ ...form, password: "", confirmPassword: "" });
      }
    },
    onError: (error) => toast.error(error.response?.data?.message || "Something went wrong"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLogin && form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    if (!form.licence_number.trim()) {
      return toast.error("Driving licence number is required");
    }

    mutation.mutate();
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/[0.06] py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";
  const labelClass = "mb-2 mt-4 block text-sm font-semibold text-gray-200";

  return (
    <main className="min-h-screen bg-[#08090b] text-white md:grid md:grid-cols-[1.05fr_1fr]">
      
      <section className="relative flex min-h-[650px] flex-col overflow-hidden bg-gradient-to-br from-[#08090b] via-[#171717] to-[#3a2108] px-7 py-8 sm:px-12 lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_65%,rgba(245,158,11,0.2),transparent_55%)]" />

        <div className="relative z-10 flex items-center gap-2 text-3xl font-extrabold">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-black">
            <CarFront size={28} />
          </span>
          Cab<span className="text-amber-400">Go</span>
          <span className="ml-2 rounded-full border border-amber-400/30 px-3 py-1 text-xs font-semibold text-amber-400">
            DRIVER
          </span>
        </div>

        <div className="relative z-10 my-auto py-12">
          <p className="text-xs font-bold tracking-[0.25em] text-amber-400">
            DRIVE YOUR FUTURE
          </p>
          <h1 className="mt-5 max-w-xl text-5xl font-extrabold leading-tight sm:text-6xl">
            Your Car.<br />
            Your Journey.<br />
            <span className="text-amber-400">Your Earnings.</span>
          </h1>
          <p className="mt-5 max-w-md leading-7 text-gray-300">
            Join CabGo as a driver, connect with riders and take control of your journey.
          </p>

          <div className="mt-9 space-y-5">
            {[
              { Icon: CarFront, title: "Flexible Rides", text: "Accept trips when you're available." },
              { Icon: CreditCard, title: "Track Your Earnings", text: "Keep track of your completed rides." },
              { Icon: ShieldCheck, title: "Trusted Platform", text: "Ride with verified rider accounts." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-amber-400">
                  <Icon size={24} />
                </div>
                <div>
                  <h2 className="font-bold">{title}</h2>
                  <p className="mt-1 text-sm text-gray-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    
      <section className="flex items-center justify-center bg-[#0d0e10] px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-gradient-to-br from-[#191a1c] to-[#0b0c0d] p-6 shadow-2xl shadow-black/40 sm:p-10">
          <div className="mb-7 grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button type="button" onClick={() => setIsLogin(true)}
              className={`rounded-full py-3 font-bold transition ${isLogin ? "bg-amber-400 text-black" : "text-gray-400 hover:text-white"}`}>
              Login
            </button>
            <button type="button" onClick={() => setIsLogin(false)}
              className={`rounded-full py-3 font-bold transition ${!isLogin ? "bg-amber-400 text-black" : "text-gray-400 hover:text-white"}`}>
              Sign Up
            </button>
          </div>

          <h2 className="text-center text-3xl font-extrabold">
            {isLogin ? "Welcome Back, Driver!" : "Join CabGo"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {isLogin ? "Login to manage your rides" : "Register your driver account"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            {!isLogin && (
              <>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <input className={inputClass} name="name" placeholder="Enter full name" value={form.name} onChange={handleChange} required />
                  <UserRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <input className={inputClass} name="phone_number" type="tel" placeholder="Enter phone number" value={form.phone_number} onChange={handleChange} required />
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <label className={labelClass}>Vehicle Number</label>
                <div className="relative">
                  <input className={inputClass} name="vehicle_number" placeholder="e.g. MP09AB1234" value={form.vehicle_number} onChange={handleChange} required />
                  <CarFront size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <label className={labelClass}>Vehicle Type</label>
                <select className="w-full rounded-xl border border-white/10 bg-[#202124] px-4 py-3.5 text-sm text-white outline-none focus:border-amber-400" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                   <option value="Bike">AUTO</option>
                  <option value="Bike">BIKE</option>
                  <option value="Sedan">SEDAN</option>
                  <option value="SUV">SUV</option>
                </select>
              </>
            )}

            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <input className={inputClass} name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required />
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <label className={labelClass}>Driving Licence Number</label>
            <div className="relative">
              <input className={inputClass} name="licence_number" placeholder="Enter licence number" value={form.licence_number} onChange={handleChange} required />
              <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <label className={labelClass}>Password</label>
            <div className="relative">
              <input className={inputClass} name="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={form.password} onChange={handleChange} minLength={8} required />
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isLogin && (
              <>
                <label className={labelClass}>Confirm Password</label>
                <input className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-amber-400" name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} required />
              </>
            )}

            <button type="submit" disabled={mutation.isPending}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-amber-400 px-4 py-4 font-bold text-black transition hover:bg-amber-300 disabled:opacity-60">
              {mutation.isPending ? "Please wait..." : isLogin ? "Login as Driver" : "Create Driver Account"}
              {!mutation.isPending && <ArrowRight size={20} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">
            {isLogin ? "New to CabGo?" : "Already registered?"}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 font-bold text-amber-400 hover:text-amber-300">
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
