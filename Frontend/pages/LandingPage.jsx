import React from "react";
import { useNavigate } from "react-router-dom";
import MarkMeLogo from "../components/common/MarkMeLogo.jsx";

/* Feature card */
const FeatureCard = ({ icon, title, desc }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "1.1rem 1.15rem",
      boxShadow: "var(--shadow-sm)",
    }}
  >
    <div
      style={{
        width: "38px", height: "38px",
        borderRadius: "9px",
        background: "var(--accent-soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.15rem", marginBottom: "0.65rem",
      }}
    >{icon}</div>
    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
      {title}
    </div>
    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
      {desc}
    </div>
  </div>
);

/* Step row */
const Step = ({ num, text }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.5rem 0" }}>
    <div
      style={{
        width: "24px", height: "24px",
        borderRadius: "999px",
        background: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", fontWeight: 700,
        color: "#fff", flexShrink: 0,
      }}
    >{num}</div>
    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5, paddingTop: "0.15rem" }}>
      {text}
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: "🙂", title: "Face recognition", desc: "Verifies the student's identity from their registered photos before marking." },
    { icon: "📍", title: "GPS geo-fence", desc: "Attendance only counts inside the classroom radius — no remote marking." },
    { icon: "🔑", title: "Session keys", desc: "Faculty share a 6-digit key per lecture that expires automatically." },
    { icon: "🛡️", title: "Anti-proxy", desc: "Face + location + key together make buddy-punching impractical." },
  ];

  const steps = [
    "Student opens the app on their own device.",
    "The app verifies their face against registered photos.",
    "GPS confirms they are inside the classroom.",
    "They enter the 6-digit key shared by faculty.",
    "Attendance is recorded — faculty sees it live.",
  ];

  return (
    <section className="landing-hero">
      {/* LEFT — hero content */}
      <div>
        <div className="pill" style={{ marginBottom: "1.25rem" }}>
          <span className="badge-dot" />
          Anti-proxy attendance
        </div>

        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 1rem",
            color: "var(--text-primary)",
          }}
        >
          Attendance that<br />can’t be faked
        </h1>

        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            maxWidth: "34rem",
            lineHeight: 1.6,
            marginBottom: "1.75rem",
          }}
        >
          MarkMe combines face recognition, GPS geo-fencing and rotating session keys
          so students mark attendance from their own device — without proxies or buddy punching.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <button className="btn btn-primary" onClick={() => navigate("/login")} style={{ padding: "0.7rem 1.5rem" }}>
            Try the demo
          </button>
        </div>

        <div className="badge-row" style={{ marginBottom: "2rem" }}>
          <span className="chip">Face verified</span>
          <span className="chip">GPS checked</span>
          <span className="chip">6-digit session keys</span>
        </div>

        {/* Features grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.85rem" }}>
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>

      {/* RIGHT — how it works */}
      <div>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <MarkMeLogo size={40} />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>How it works</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>5 steps to secure attendance</div>
            </div>
          </div>

          <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: "0.75rem" }}>
            {steps.map((s, i) => (
              <Step key={i} num={i + 1} text={s} />
            ))}
          </div>

          <p className="helper-text mt-md" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.9rem" }}>
            Face matching runs in the browser — biometric data stays on the student's device.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
