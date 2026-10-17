
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const registerUser = async (formData) => {
  const response = await api.post("/api/user/register", {
    name: formData.name,
    email: formData.email,
    password: formData.password,
  });

  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post("/api/user/login", {
    email,
    password,
  });

  return response.data;
};
