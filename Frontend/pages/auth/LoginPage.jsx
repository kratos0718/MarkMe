import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/authService.js";
import Spinner from "../../components/common/Spinner.jsx";
import MarkMeLogo from "../../components/common/MarkMeLogo.jsx";

const ROLES = {
  student: {
    label: "Student",
    icon: "🎓",
    badge: "STUDENT PORTAL",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.4)",
    border: "rgba(251,191,36,0.35)",
    bg: "rgba(251,191,36,0.05)",
    headerBg: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))",
    placeholder: "Roll No (e.g. 2023000367) or email",
    hint: "Roll number or university email",
    demoEmail: "demo.student@gitam.edu",
  },
  faculty: {
    label: "Faculty",
    icon: "👨‍🏫",
    badge: "FACULTY PORTAL",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.4)",
    border: "rgba(96,165,250,0.35)",
    bg: "rgba(96,165,250,0.05)",
    headerBg: "linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.04))",
    placeholder: "Faculty email address",
    hint: "Institutional email address",
    demoEmail: "demo.faculty@gitam.edu",
  },
  admin: {
    label: "Admin",
    icon: "⚙️",
    badge: "ADMIN PANEL",
    color: "#f97316",
    glow: "rgba(249,115,22,0.4)",
    border: "rgba(249,115,22,0.35)",
    bg: "rgba(249,115,22,0.05)",
    headerBg: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.04))",
    placeholder: "Admin email address",
    hint: "Authorised administrators only",
    demoEmail: "demo.admin@gitam.edu",
  },
};

const DEMO_PASS = "Demo@1234";

/* ── Single role login panel ── */
const LoginPanel = ({ roleKey, cfg, navigate }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true);
      setApiError("");
      const base = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      // Seed demo accounts first (idempotent — safe to call every time)
      const seedRes = await fetch(`${base}/auth/seed-demo`);
      if (!seedRes.ok) {
        const msg = await seedRes.text();
        throw new Error(`Seed failed (${seedRes.status}): ${msg}`);
      }
      const userData = await login({ identifier: cfg.demoEmail, password: DEMO_PASS, role: roleKey });
      const dest = userData.role === "student" ? "/student" : userData.role === "faculty" ? "/faculty" : "/admin";
      navigate(dest, { replace: true });
    } catch (err) {
      setApiError(err?.message || "Demo login failed");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!identifier.trim()) errs.identifier = "Required";
    if (!password) errs.password = "Required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setLoading(true);
      setApiError("");
      const userData = await login({ identifier, password, role: roleKey });
      const dest =
        userData.role === "student" ? "/student" :
        userData.role === "faculty" ? "/faculty" : "/admin";
      navigate(dest, { replace: true });
    } catch (err) {
      setApiError(err?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: "1 1 280px",
      minWidth: "260px",
      maxWidth: "360px",
      border: `1px solid ${cfg.border}`,
      borderRadius: "12px",
      overflow: "hidden",
      background: "var(--black-card)",
      boxShadow: `0 0 0 0 ${cfg.glow}`,
      transition: "box-shadow 0.3s ease, transform 0.3s ease",
      display: "flex",
      flexDirection: "column",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 28px ${cfg.glow}`;
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Panel header */}
      <div style={{
        background: cfg.headerBg,
        borderBottom: `1px solid ${cfg.border}`,
        padding: "1.25rem 1.4rem",
        display: "flex",
        alignItems: "center",
        gap: "0.9rem",
      }}>
        <div style={{
          width: "50px", height: "50px",
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.4rem", flexShrink: 0,
          boxShadow: `0 0 14px ${cfg.glow}`,
        }}>{cfg.icon}</div>
        <div>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.18em", color: cfg.color,
            textTransform: "uppercase", marginBottom: "0.2rem",
          }}>{cfg.badge}</div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.78rem", color: "var(--text-muted)",
          }}>{cfg.hint}</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ padding: "1.25rem 1.4rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>

        {/* Identifier */}
        <div>
          <label style={{
            display: "block",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.75rem", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: cfg.color, marginBottom: "0.35rem",
          }}>
            {roleKey === "student" ? "Roll No / Email" : "Email Address"}
          </label>
          <input
            className="input-field"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder={cfg.placeholder}
            autoComplete="username"
            style={{
              borderColor: identifier ? cfg.border : undefined,
              fontSize: "0.88rem",
            }}
          />
          {errors.identifier && (
            <div className="error-text" style={{ fontSize: "0.7rem", marginTop: "0.2rem" }}>{errors.identifier}</div>
          )}
        </div>

        {/* Password */}
        <div>
          <label style={{
            display: "block",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.75rem", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: cfg.color, marginBottom: "0.35rem",
          }}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ paddingRight: "42px", fontSize: "0.88rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: "absolute", right: "10px", top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: "pointer", color: "var(--text-muted)",
                fontSize: "1rem", padding: 0, lineHeight: 1,
              }}
            >{showPw ? "👁️" : "🙈"}</button>
          </div>
          {errors.password && (
            <div className="error-text" style={{ fontSize: "0.7rem", marginTop: "0.2rem" }}>{errors.password}</div>
          )}
        </div>

        {/* API error */}
        {apiError && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "4px", padding: "0.55rem 0.75rem",
            display: "flex", alignItems: "flex-start", gap: "0.4rem",
          }}>
            <span style={{ fontSize: "0.8rem" }}>⚠</span>
            <div className="error-text" style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.4 }}>{apiError}</div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "auto",
            background: loading
              ? "rgba(100,100,100,0.3)"
              : `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})`,
            color: "#000",
            border: `1px solid ${loading ? "transparent" : cfg.color}`,
            borderRadius: "6px",
            padding: "0.8rem",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.88rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: loading ? "none" : `0 0 14px ${cfg.glow}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            transition: "all 0.2s",
            width: "100%",
          }}
        >
          {loading
            ? <><Spinner /><span>Signing in…</span></>
            : `▶  Sign In as ${cfg.label}`
          }
        </button>

        {/* Footer links */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: "0.65rem",
          borderTop: `1px solid ${cfg.border.replace("0.35", "0.1")}`,
          fontSize: "0.72rem",
        }}>
          <span style={{ color: "var(--text-muted)", fontFamily: "'Rajdhani', sans-serif" }}>
            No account?{" "}
            <Link to={`/register/${roleKey}`} style={{ color: cfg.color, textDecoration: "none" }}>
              Register
            </Link>
          </span>
          <Link
            to="/forgot-password"
            style={{ color: cfg.color, fontFamily: "'Rajdhani', sans-serif", textDecoration: "none", opacity: 0.8 }}
          >
            Forgot?
          </Link>
        </div>

        {/* Demo login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={demoLoading}
          style={{
            width: "100%",
            background: "transparent",
            border: `1px dashed ${cfg.border}`,
            borderRadius: "6px",
            padding: "0.6rem",
            cursor: demoLoading ? "not-allowed" : "pointer",
            color: cfg.color,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            opacity: demoLoading ? 0.6 : 0.8,
            transition: "opacity 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = demoLoading ? "0.6" : "0.8"}
        >
          {demoLoading ? "⏳ Signing in…" : `⚡ Try Demo ${cfg.label}`}
        </button>
      </form>
    </div>
  );
};

/* ── Main Login Page ── */
const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem", animation: "fadeInUp 0.5s ease both" }}>
        <div style={{ margin: "0 auto 0.9rem", display: "flex", justifyContent: "center" }}>
          <MarkMeLogo size={64} />
        </div>

        <div style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "0.58rem", letterSpacing: "0.28em",
          color: "var(--text-muted)", textTransform: "uppercase",
          marginBottom: "0.4rem",
        }}>MARKME · SMART ATTENDANCE</div>

        <div style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "1.2rem", fontWeight: 800, letterSpacing: "0.06em",
          background: "linear-gradient(135deg, var(--gold-bright), var(--gold-mid), var(--gold-bright))",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", animation: "shimmer 3s linear infinite",
          marginBottom: "0.5rem",
        }}>ATTENDANCE SYSTEM</div>

        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.9rem", color: "var(--text-muted)",
          margin: 0,
        }}>Choose your portal and sign in</p>
      </div>

      {/* 3 panels side by side */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1.25rem",
        justifyContent: "center",
        width: "100%",
        maxWidth: "1140px",
        animation: "fadeInUp 0.5s ease 0.1s both",
      }}>
        {Object.entries(ROLES).map(([roleKey, cfg]) => (
          <LoginPanel key={roleKey} roleKey={roleKey} cfg={cfg} navigate={navigate} />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", marginTop: "2rem",
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "0.65rem", letterSpacing: "0.15em",
        textTransform: "uppercase", color: "var(--text-dim)",
        animation: "fadeInUp 0.5s ease 0.2s both",
      }}>
        Abhinav Tarigoopula · GITAM University
      </div>
    </div>
  );
};

export default LoginPage;
