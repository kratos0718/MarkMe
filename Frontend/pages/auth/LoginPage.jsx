import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/authService.js";
import Spinner from "../../components/common/Spinner.jsx";
import MarkMeLogo from "../../components/common/MarkMeLogo.jsx";

const ROLES = {
  student: {
    label: "Student",
    icon: "🎓",
    color: "#4f46e5",
    desc: "Mark attendance with face + GPS + session key.",
    hint: "Auto-verify, then use session key 123456.",
    demoEmail: "demo.student@gitam.edu",
  },
  faculty: {
    label: "Faculty",
    icon: "👩‍🏫",
    color: "#0ea5e9",
    desc: "Start a session and watch attendance come in live.",
    hint: "Allow location access when your browser asks.",
    demoEmail: "demo.faculty@gitam.edu",
  },
  admin: {
    label: "Admin",
    icon: "⚙️",
    color: "#f97316",
    desc: "Manage students, faculty, classrooms and reports.",
    hint: "Full read/write access to demo data.",
    demoEmail: "demo.admin@gitam.edu",
  },
};

const DEMO_PASS = "Demo@1234";

/* ── Single demo-access card ── */
const DemoCard = ({ roleKey, cfg, navigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnter = async () => {
    try {
      setLoading(true);
      setError("");
      const base = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      // Seed demo accounts first (idempotent — safe to call every time)
      const seedRes = await fetch(`${base}/auth/seed-demo`);
      if (!seedRes.ok) {
        const msg = await seedRes.text();
        throw new Error(`Could not prepare demo (${seedRes.status}): ${msg}`);
      }
      const userData = await login({ identifier: cfg.demoEmail, password: DEMO_PASS, role: roleKey });
      const dest =
        userData.role === "student" ? "/student" :
        userData.role === "faculty" ? "/faculty" : "/admin";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err?.message || "Could not enter demo. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: "1 1 260px",
        minWidth: "240px",
        maxWidth: "340px",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        background: "#fff",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1.5rem 1.4rem 1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
        <div
          style={{
            width: "44px", height: "44px",
            borderRadius: "10px",
            background: `${cfg.color}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.35rem", marginBottom: "0.9rem",
          }}
        >{cfg.icon}</div>

        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
          {cfg.desc}
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "0.5rem 0.65rem",
              marginBottom: "0.75rem",
            }}
          >
            <div className="error-text" style={{ margin: 0, fontSize: "0.78rem", lineHeight: 1.4 }}>{error}</div>
          </div>
        )}

        <button
          type="button"
          onClick={handleEnter}
          disabled={loading}
          style={{
            marginTop: "auto",
            background: loading ? "#cbd5e1" : cfg.color,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem",
            fontFamily: "inherit",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            transition: "opacity 0.15s",
            width: "100%",
          }}
        >
          {loading ? (<><Spinner /><span>Opening…</span></>) : `Enter as ${cfg.label}`}
        </button>

        {cfg.hint && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.6rem", lineHeight: 1.4, textAlign: "center" }}>
            {cfg.hint}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Login Page (demo access) ── */
const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ margin: "0 auto 1rem", display: "flex", justifyContent: "center" }}>
          <MarkMeLogo size={56} />
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
          Try MarkMe
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0, maxWidth: "30rem" }}>
          Pick a role to explore the demo — no account or setup needed.
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", margin: "0.5rem auto 0", maxWidth: "30rem" }}>
          The first click may take a few seconds while the server wakes up.
        </p>
      </div>

      {/* Role cards */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.25rem",
          justifyContent: "center",
          width: "100%",
          maxWidth: "1080px",
        }}
      >
        {Object.entries(ROLES).map(([roleKey, cfg]) => (
          <DemoCard key={roleKey} roleKey={roleKey} cfg={cfg} navigate={navigate} />
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
        MarkMe · Smart Attendance
      </div>
    </div>
  );
};

export default LoginPage;
