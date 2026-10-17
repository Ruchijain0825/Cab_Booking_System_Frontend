
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});

export const registerDriver = async (data) => {
  console.log("API Base URL:", api.defaults.baseURL);
  console.log(
    "Register endpoint:",
    `${api.defaults.baseURL}/api/driver/register`
  );
  const response = await api.post("/api/driver/register", data);
 
  return response.data;
};

export const loginDriver = async (data) => {

  const response = await api.post("/api/driver/login", data);
  return response.data;
 
};

export default api;
