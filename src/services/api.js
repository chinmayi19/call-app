import axios from "axios";

const api = axios.create({
  baseURL: "https://call-app-cbwo.onrender.com", // ✅ your backend IP
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;