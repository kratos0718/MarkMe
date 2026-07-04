import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MarkMeLogo from "../common/MarkMeLogo.jsx";

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isOnDashboard =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/faculty") ||
    location.pathname.startsWith("/admin");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="topbar">
      {/* Logo */}
      <div className="topbar-logo" onClick={() => navigate("/")}>
        <MarkMeLogo size={32} />
        <div>
          <div className="topbar-title">MarkMe</div>
          <div className="topbar-subtitle">Smart Attendance</div>
        </div>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {isOnDashboard ? (
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Log out
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/login")}>
            Try demo
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
