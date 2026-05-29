import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Contacts from "./pages/Contacts";

function App() {

  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={
            token ? <Contacts /> : <Navigate to="/login" />
          }
        />

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* REGISTER */}
        <Route path="/register" element={<Register />} />

        {/* ✅ ADD THIS (VERY IMPORTANT) */}
        <Route
          path="/contacts"
          element={
            token ? <Contacts /> : <Navigate to="/login" />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;