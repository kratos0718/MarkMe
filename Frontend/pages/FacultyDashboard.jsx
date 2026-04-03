import React, { useState } from "react";
import Spinner from "../components/common/Spinner.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import {
  createSession,
  endSession,
  fetchLiveAttendance,
  downloadAttendance
} from "../services/facultyService.js";

/* Live attendance pulse dot */
const PulseDot = () => (
  <span style={{ position: "relative", display: "inline-block", width: "10px", height: "10px" }}>
    <span style={{
      position: "absolute", inset: 0,
      borderRadius: "50%",
      background: "#4ade80",
      animation: "goldPulse 1.5s ease-in-out infinite",
      opacity: 0.4
    }} />
    <span style={{
      position: "absolute", inset: "2px",
      borderRadius: "50%",
      background: "#4ade80",
      boxShadow: "0 0 6px #4ade80"
    }} />
  </span>
);

/* Session key display */
const SessionKeyDisplay = ({ sessionKey }) => (
  <div style={{
    background: "rgba(0,0,0,0.6)",
    border: "1px solid var(--holo-border)",
    borderRadius: "8px",
    padding: "1.25rem",
    textAlign: "center",
    position: "relative",
    overflow: "hidden"
  }}>
    <div className="holo-scan" />
    <div style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: "0.68rem", letterSpacing: "0.2em",
      color: "var(--text-muted)", textTransform: "uppercase",
      marginBottom: "0.5rem"
    }}>SESSION KEY — SHARE WITH STUDENTS</div>
    <div style={{
      fontFamily: "'Orbitron', monospace",
      fontSize: "2.8rem", fontWeight: 900,
      letterSpacing: "0.3em",
      background: "linear-gradient(135deg, var(--gold-bright), var(--gold-mid), var(--gold-bright))",
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      animation: "shimmer 2s linear infinite",
      textShadow: "none",
      lineHeight: 1.1
    }}>{sessionKey}</div>
  </div>
);

const FacultyDashboard = () => {
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [activeMinutes, setActiveMinutes] = useState(5);
  const [currentSession, setCurrentSession] = useState(null);
  const [liveStudents, setLiveStudents] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setError("");
    if (!subject.trim() || !className.trim()) {
      setError("Subject name and class are required.");
      return;
    }
    setIsCreating(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsCreating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radius: 100
        };
        const session = await createSession({ subject, className, activeMinutes, location });
        setCurrentSession(session);
        const list = await fetchLiveAttendance(session.id);
        setLiveStudents(list);
      } catch (err) {
        setError(err?.message || "Unable to create session.");
      } finally {
        setIsCreating(false);
      }
    }, (err) => {
      setError("Location access required. Please enable GPS.");
      setIsCreating(false);
    }, { enableHighAccuracy: true });
  };

  React.useEffect(() => {
    let interval;
    if (currentSession && !isEnding) {
      interval = setInterval(() => {
        fetchLiveAttendance(currentSession.id).then(list => {
          if (list !== null) setLiveStudents(list);
        });
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [currentSession, isEnding]);

  const handleEndSession = async () => {
    if (!currentSession) return;
    setIsEnding(true);
    try {
      await endSession(currentSession.id);
      setCurrentSession(null);
      setLiveStudents([]);
    } catch (err) {
      setError(err?.message || "Unable to end session.");
    } finally {
      setIsEnding(false);
    }
  };

  const handleDownload = async (format) => {
    if (!currentSession) return;
    await downloadAttendance(currentSession.id, format);
  };

  return (
    <section>
      {/* Page header */}
      <div style={{
        marginBottom: "1.5rem",
        display: "flex", alignItems: "center", gap: "1rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(251,191,36,0.1)"
      }}>
        <div style={{
          width: "44px", height: "44px",
          background: "linear-gradient(135deg, var(--gold-deep), var(--gold-bright))",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.4rem", boxShadow: "0 0 14px var(--glow-gold)"
        }}>👨‍🏫</div>
        <div>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "1.1rem", fontWeight: 700,
            color: "var(--gold-bright)", letterSpacing: "0.06em"
          }}>Faculty Portal</div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.78rem", color: "var(--text-muted)",
            letterSpacing: "0.05em", textTransform: "uppercase"
          }}>MarkMe · Session Management</div>
        </div>
        {currentSession && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <PulseDot />
            <span className="chip chip-success" style={{ fontSize: "0.72rem" }}>Session Live</span>
          </div>
        )}
      </div>

      <section className="grid grid-2">
        {/* LEFT — Create Session */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Create Attendance Session</div>
              <div className="card-subtitle">Generate a unique 6-digit key for your class</div>
            </div>
            {currentSession ? (
              <StatusBadge status="success" label="Session Active" />
            ) : (
              <StatusBadge status="neutral" label="No Session" />
            )}
          </div>

          {/* Session key display */}
          {currentSession && (
            <div style={{ marginBottom: "1.25rem" }}>
              <SessionKeyDisplay sessionKey={currentSession.sessionKey} />
              <div style={{
                display: "flex", gap: "1rem", marginTop: "0.75rem",
                padding: "0.75rem",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(251,191,36,0.08)",
                borderRadius: "4px"
              }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>SUBJECT</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600 }}>{currentSession.subject}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>CLASS</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600 }}>{currentSession.className}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>EXPIRES</div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", color: "var(--gold-bright)", fontWeight: 600 }}>
                    {new Date(currentSession.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateSession} noValidate>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Subject Name</label>
                <input
                  className="input-field"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures"
                  disabled={!!currentSession}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Class</label>
                <input
                  className="input-field"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. CSE-3A"
                  disabled={!!currentSession}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Active Duration (minutes)</label>
              <input
                type="number"
                className="input-field"
                value={activeMinutes}
                min={5} max={180}
                onChange={(e) => setActiveMinutes(Number(e.target.value))}
                disabled={!!currentSession}
              />
              <span className="helper-text">Key automatically expires after this time.</span>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "4px", padding: "0.6rem",
                marginBottom: "0.75rem"
              }}>
                <div className="error-text" style={{ margin: 0 }}>⚠ {error}</div>
              </div>
            )}

            {!currentSession ? (
              <button type="submit" className="btn btn-primary btn-block" disabled={isCreating}>
                {isCreating ? (
                  <><Spinner /><span style={{ marginLeft: 8 }}>Fetching Location…</span></>
                ) : (
                  "▶ Generate Session Key"
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger btn-block"
                onClick={handleEndSession}
                disabled={isEnding}
              >
                {isEnding ? <><Spinner /><span style={{ marginLeft: 8 }}>Ending…</span></> : "⏹ End Session"}
              </button>
            )}
          </form>
        </div>

        {/* RIGHT — Live attendance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {currentSession && <><PulseDot style={{ marginRight: "0.5rem" }} /> </>}
                Live Session Status
              </div>
              <div className="card-subtitle">Real-time attendance as students mark in</div>
            </div>
            <div className="flex-gap-sm">
              {currentSession && (
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={isRefreshing}
                  onClick={async () => {
                    setIsRefreshing(true);
                    const list = await fetchLiveAttendance(currentSession.id);
                    if (list !== null) setLiveStudents(list);
                    setIsRefreshing(false);
                  }}
                >
                  {isRefreshing ? <><Spinner /> <span style={{ marginLeft: 4 }}>…</span></> : "↻ Refresh"}
                </button>
              )}
            </div>
          </div>

          {currentSession ? (
            <>
              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem", marginBottom: "1rem"
              }}>
                {[
                  { label: "Present", value: liveStudents?.length || 0, color: "#4ade80" },
                  { label: "Subject", value: currentSession.subject, color: "var(--gold-bright)" },
                  { label: "Class", value: currentSession.className, color: "var(--text-secondary)" }
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(251,191,36,0.08)",
                    borderRadius: "4px",
                    padding: "0.6rem",
                    textAlign: "center"
                  }}>
                    <div style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: typeof value === "number" ? "1.4rem" : "0.75rem",
                      fontWeight: 700, color,
                      lineHeight: 1.1
                    }}>{value}</div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.62rem", color: "var(--text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      marginTop: "0.2rem"
                    }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Download buttons */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload("pdf")}>
                  ↓ PDF Report
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload("excel")}>
                  ↓ Excel Export
                </button>
              </div>

              {/* Auto-refresh note */}
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.68rem", color: "var(--text-muted)",
                letterSpacing: "0.05em", marginBottom: "0.5rem",
                display: "flex", alignItems: "center", gap: "0.4rem"
              }}>
                <PulseDot /> Auto-refreshing every 10 seconds
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Roll No</th>
                      <th>Name</th>
                      <th>Marked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveStudents && liveStudents.map((s, i) => (
                      <tr key={s.rollNo}>
                        <td style={{ color: "var(--text-muted)", fontFamily: "'Orbitron', monospace", fontSize: "0.68rem" }}>{i + 1}</td>
                        <td style={{ fontFamily: "'Rajdhani', sans-serif" }}>{s.rollNo}</td>
                        <td style={{ fontFamily: "'Rajdhani', sans-serif" }}>{s.name}</td>
                        <td style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--text-muted)" }}>{s.markedAt}</td>
                      </tr>
                    ))}
                    {(!liveStudents || liveStudents.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
                          <span className="no-data">Waiting for students to mark attendance…</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.75rem", letterSpacing: "0.08em",
                color: "var(--text-muted)", marginBottom: "0.5rem"
              }}>NO ACTIVE SESSION</div>
              <p className="empty-state-subtitle">Create a session on the left to start receiving attendance entries.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
};

export default FacultyDashboard;
