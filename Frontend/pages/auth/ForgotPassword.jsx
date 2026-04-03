import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import Spinner from "../../components/common/Spinner.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await API.post("/auth/forgotpassword", { email });
      setMessage("Reset link sent! Please check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div style={{ textAlign: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(251,191,36,0.1)" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg, var(--gold-deep), var(--gold-bright))",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem",
            margin: "0 auto 0.75rem",
            boxShadow: "0 0 20px var(--glow-gold)"
          }}>🔐</div>
          <div className="auth-title">Forgot Password</div>
          <div className="auth-subtitle">Enter your email to receive a reset link</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="your@gitam.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "4px", padding: "0.6rem", marginBottom: "0.75rem" }}>
              <div className="error-text" style={{ margin: 0 }}>⚠ {error}</div>
            </div>
          )}

          {message && (
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "4px", padding: "0.6rem", marginBottom: "0.75rem" }}>
              <div style={{ color: "#4ade80", fontSize: "0.82rem", fontFamily: "'Rajdhani', sans-serif" }}>✓ {message}</div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" style={{ fontSize: "0.9rem", padding: "0.75rem" }} disabled={loading}>
            {loading ? <><Spinner /><span style={{ marginLeft: 8 }}>Sending…</span></> : "▶ Send Reset Link"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center", paddingTop: "0.75rem", borderTop: "1px solid rgba(251,191,36,0.08)" }}>
          <Link to="/login/student" className="link">← Back to Login</Link>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "1rem", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)" }}>
        Abhinav Tarigoopula · GITAM University
      </div>
    </div>
  );
};

export default ForgotPassword;
