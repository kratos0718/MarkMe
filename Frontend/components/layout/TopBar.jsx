import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [wide, setWide] = useState(window.innerWidth > 640);

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    const resize = () => setWide(window.innerWidth > 640);
    window.addEventListener("resize", resize);
    return () => { clearInterval(tick); window.removeEventListener("resize", resize); };
  }, []);

  const isOnDashboard =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/faculty") ||
    location.pathname.startsWith("/admin");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const padZ = (n) => String(n).padStart(2, "0");
  const timeStr = `${padZ(time.getHours())}:${padZ(time.getMinutes())}:${padZ(time.getSeconds())}`;
  const dateStr = time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="topbar">
      {/* Logo */}
      <div className="topbar-logo" onClick={() => navigate("/")}>
        <div className="topbar-icon">⬡</div>
        <div>
          <div className="topbar-title">MarkMe</div>
          <div className="topbar-subtitle">Smart Attendance · Anti-Proxy</div>
        </div>
      </div>

      {/* Live clock — only on wider screens */}
      {wide && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "1rem", fontWeight: 700,
            color: "var(--gold-bright)",
            letterSpacing: "0.12em",
            textShadow: "0 0 10px var(--glow-gold)"
          }}>{timeStr}</div>
          <div style={{
            fontSize: "0.62rem", color: "var(--text-muted)",
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.1em", textTransform: "uppercase"
          }}>{dateStr}</div>
        </div>
      )}

      {/* Actions */}
      <div className="topbar-actions">
        {isOnDashboard ? (
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            ⏻ Logout
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/login")}   /* shows role picker */
          >
            ▶ Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
