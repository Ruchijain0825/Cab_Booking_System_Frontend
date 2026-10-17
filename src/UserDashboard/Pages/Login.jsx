
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CarFront,
  MapPin,
  ShieldCheck,
  Clock,
  Mail,
  Lock,
  User,
  ArrowRight,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { loginUser, registerUser } from "../Apis/User.api";

export default function UserLogin() {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // LOGIN API
  const loginMutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      if (!data.success || !data.accesstoken) {
        toast.error(data.message || "Unable to login");
        return;
      }

      sessionStorage.setItem(
        "userAccessToken",
        data.accesstoken
      );

      toast.success(data.message || "Login successful!");

      navigate("/user-dashboard");
    },

    onError: (error) => {
      console.error("Login error:", error.response?.data || error);

      toast.error(
        error.response?.data?.message || "Unable to login"
      );
    },
  });

  // SIGNUP API
  const signupMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.message || "Unable to create account");
        return;
      }

      toast.success(
        data.message || "Account created successfully!"
      );

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      setIsSignup(false);
    },

    onError: (error) => {
      console.error("Signup error:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          "Unable to create account"
      );
    },
  });

  const isLoading =
    loginMutation.isPending || signupMutation.isPending;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isLoading) return;

    if (isSignup) {
      signupMutation.mutate({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
    } else {
      loginMutation.mutate({
        email: formData.email.trim(),
        password: formData.password,
      });
    }
  };

  const switchMode = (signup) => {
    setIsSignup(signup);

    setFormData({
      name: "",
      email: "",
      password: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white lg:grid lg:grid-cols-2">
      {/* LEFT PANEL */}
      <section className="relative flex min-h-[420px] flex-col justify-between overflow-hidden border-b border-white/10 bg-[#101010] p-7 sm:p-12 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="absolute -left-32 top-32 h-80 w-80 rounded-full bg-yellow-400/10 blur-[100px]" />

        <Link to="/user/login" className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <CarFront size={29} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">CabGo</h2>
            <p className="text-xs tracking-[0.25em] text-gray-400">
              YOUR RIDE. YOUR WAY.
            </p>
          </div>
        </Link>

        <div className="relative my-14 max-w-xl lg:my-0">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Your city, your journey
          </span>

          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            Every journey
            <br />
            starts with
            <br />
            <span className="text-yellow-400">CabGo.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-gray-400 sm:text-lg">
            Book your ride in seconds. Get where you need to go
            with comfort, convenience and confidence.
          </p>

          <div className="mt-10 space-y-5">
            <Feature
              icon={<Clock size={21} />}
              title="Quick Booking"
              description="Book your next ride in just a few clicks."
            />

            <Feature
              icon={<MapPin size={21} />}
              title="Live Ride Tracking"
              description="Stay updated throughout your journey."
            />

            <Feature
              icon={<ShieldCheck size={21} />}
              title="Safe & Reliable"
              description="Enjoy a more confident ride experience."
            />
          </div>
        </div>

        <p className="relative hidden text-sm text-gray-500 lg:block">
          © 2026 CabGo. Ride smarter, travel better.
        </p>
      </section>

      {/* RIGHT PANEL */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              {isSignup ? "Get started" : "Welcome back"}
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isSignup
                ? "Create your account"
                : "Let's get you moving."}
            </h2>

            <p className="mt-3 text-gray-400">
              {isSignup
                ? "Sign up to book your first ride."
                : "Login to book and manage your rides."}
            </p>
          </div>

          {/* LOGIN / SIGNUP SWITCH */}
          <div className="mb-7 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`rounded-lg py-3 text-sm font-semibold transition ${
                !isSignup
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`rounded-lg py-3 text-sm font-semibold transition ${
                isSignup
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <InputField
                icon={<User size={19} />}
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                minLength={2}
              />
            )}

            <InputField
              icon={<Mail size={19} />}
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <InputField
              icon={<Lock size={19} />}
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
            />

            {!isSignup && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    toast("Password reset is not configured yet.")
                  }
                  className="text-sm text-yellow-400 hover:text-yellow-300"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Login to CabGo"}

              {!isLoading && <ArrowRight size={19} />}
            </button>
          </form>

          {/* GOOGLE PLACEHOLDER */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-gray-500">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={() =>
              toast("Google sign-in requires OAuth setup.")
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 py-3.5 font-medium text-gray-200 transition hover:bg-white/[0.05]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-7 text-center text-sm text-gray-500">
            {isSignup
              ? "Already have an account?"
              : "New to CabGo?"}{" "}

            <button
              type="button"
              onClick={() => switchMode(!isSignup)}
              className="font-semibold text-yellow-400 hover:text-yellow-300"
            >
              {isSignup ? "Login" : "Create an account"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs leading-5 text-gray-600">
            By continuing, you agree to CabGo's Terms of Service
            and Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  );
}

function InputField({
  icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm text-gray-300"
      >
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          {icon}
        </span>

        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-12 pr-4 outline-none transition placeholder:text-gray-600 focus:border-yellow-400"
        />
      </div>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3l5.8-5.8A19.5 19.5 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}
