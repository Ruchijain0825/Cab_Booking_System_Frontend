import { Navigate, Route, Routes } from "react-router-dom";
import UserLogin from "./UserDashboard/Pages/Login";
import DriverLogin from "./DriverDashboard/Pages/Login";
import DriverDashboard from "./DriverDashboard/Pages/DriverDashboard";
import UserDashboard from "./UserDashboard/Pages/UserDashboard"

<Route path="/user-dashboard" element={<UserDashboard />} />

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/user/login" replace />} />

      <Route path="/user/login" element={<UserLogin />} />
      <Route path="/user/signup" element={<UserLogin />} />

      <Route path="/driver/login" element={<DriverLogin />} />
      <Route path="/driver/signup" element={<DriverLogin />} />

       <Route
        path="/driver-dashboard"
        element={<DriverDashboard />}
      />
      <Route path="/user-dashboard" element={<UserDashboard />} />
   

      <Route path="*" element={<Navigate to="/user/login" replace />} />
    </Routes>
  );
}