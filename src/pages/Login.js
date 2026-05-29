import { useState } from "react";
import api from "../services/api";
// import { getFCMToken } from "../firebase"; ❌ temporarily remove

function Login() {
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ✅ CLEAN DATA (VERY IMPORTANT)
      const cleanData = {
        phone: formData.phone.trim(),
        password: formData.password,
      };

      // ✅ API CALL
      const res = await api.post("/api/auth/login", cleanData);

      // ✅ STORE TOKEN
      localStorage.setItem("token", res.data.token);

      // ✅ STORE USER
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login successful");

      // ✅ REDIRECT
      window.location.href = "/contacts";

    } catch (error) {
      console.log(
        "LOGIN ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="phone"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
        />

        <br /><br />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;