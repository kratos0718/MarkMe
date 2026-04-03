import React, { useState, useRef, useEffect } from "react";
import CameraPreview from "../components/attendance/CameraPreview.jsx";
import LocationStatus from "../components/attendance/LocationStatus.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Spinner from "../components/common/Spinner.jsx";
import { markAttendance, getAttendanceHistory } from "../services/studentService.js";
import { getCurrentUser } from "../services/authService.js";

/* Loading stage indicator */
const LoadingBar = ({ stage, message }) => {
  const pct = Math.round((stage / 4) * 100);
  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem",
          color: "var(--text-muted)", letterSpacing: "0.05em"
        }}>{message}</span>
        <span style={{
          fontFamily: "'Orbitron', monospace", fontSize: "0.65rem",
          color: "var(--gold-mid)"
        }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceError, setFaceError] = useState("");
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [sessionKey, setSessionKey] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceError, setAttendanceError] = useState("");
  const [isMarking, setIsMarking] = useState(false);
  const [location, setLocation] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [labeledFaceDescriptors, setLabeledFaceDescriptors] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Initializing…");

  const cameraRef = useRef(null);

  useEffect(() => {
    loadHistory();
    initializeApp();
    // eslint-disable-next-line
  }, []);

  const isDemoUser = (user) => user && user.email && user.email.startsWith("demo.");

  const initializeApp = async () => {
    try {
      setLoadingStage(2);
      setLoadingMessage("Fetching Profile…");
      const user = await getCurrentUser();

      if (!user) {
        setFaceError("Failed to load user profile.");
        setLoadingMessage("Failed: User load error.");
        return;
      }

      setCurrentUser(user);

      // Demo accounts skip all AI model loading
      if (isDemoUser(user)) {
        setLoadingStage(4);
        setLoadingMessage("Demo Mode Active");
        return;
      }

      setLoadingStage(1);
      setLoadingMessage("Loading AI Models…");
      await loadModels();

      if (user.faceImages && user.faceImages.length > 0) {
        setLoadingStage(3);
        setLoadingMessage("Processing Registered Photos…");
        await processRegisteredFaces(user.faceImages, user.name);
      } else {
        setFaceError("No registered face images. Please contact admin.");
        setLoadingMessage("Failed: No photos found.");
      }
    } catch (err) {
      setFaceError("Initialization failed. Please refresh.");
    }
  };

  const loadModels = async () => {
    const faceapi = window.faceapi;
    if (!faceapi) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
      script.async = true;
      return new Promise((resolve, reject) => {
        script.onload = async () => { await loadFaceApiModels(); resolve(); };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    } else {
      await loadFaceApiModels();
    }
  };

  const loadFaceApiModels = async () => {
    const faceapi = window.faceapi;
    const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    setModelsLoaded(true);
  };

  const processRegisteredFaces = async (faceImages, name) => {
    const faceapi = window.faceapi;
    const descriptors = [];
    let processedCount = 0;
    for (const imageSrc of faceImages) {
      setLoadingMessage(`Processing photo ${processedCount + 1} of ${faceImages.length}…`);
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = (e) => reject(new Error(`Failed to load image`));
        });
        const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 });
        let det = await faceapi.detectSingleFace(img, ssdOptions).withFaceLandmarks().withFaceDescriptor();
        if (!det) {
          const tinyOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.1 });
          det = await faceapi.detectSingleFace(img, tinyOptions).withFaceLandmarks().withFaceDescriptor();
        }
        if (det) descriptors.push(det.descriptor);
      } catch (e) { /* skip */ }
      processedCount++;
    }
    if (descriptors.length > 0) {
      setLabeledFaceDescriptors(new faceapi.LabeledFaceDescriptors(name, descriptors));
      setLoadingStage(4);
      setLoadingMessage("System Ready");
    } else {
      setFaceError("Could not detect faces in registered photos.");
      setLoadingMessage("Failed: No faces detected.");
    }
  };

  const loadHistory = async () => {
    const history = await getAttendanceHistory();
    setAttendanceHistory(history);
  };

  const handleVerifyFace = async () => {
    if (loadingStage < 4 || !labeledFaceDescriptors) {
      setFaceError("System not ready. Please wait.");
      return;
    }
    setIsVerifyingFace(true);
    setFaceError("");
    setFaceVerified(false);
    setAttendanceStatus(null);
    setLoadingMessage("Accessing Camera…");
    try {
      const file = await cameraRef.current?.getSnapshot();
      if (!file) throw new Error("Could not capture image from camera.");
      setCapturedImage(file);
      setLoadingMessage("Analyzing Face…");
      const faceapi = window.faceapi;
      const img = await faceapi.bufferToImage(file);
      let det = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      if (!det) {
        det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      }
      if (!det) throw new Error("No face detected. Ensure good lighting.");
      setLoadingMessage("Matching identity…");
      const matcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
      const match = matcher.findBestMatch(det.descriptor);
      if (match.label === currentUser.name) {
        setFaceVerified(true);
        setLoadingMessage("Identity Verified ✓");
      } else {
        setFaceError(`Verification failed. Not recognized as ${currentUser.name}. Try better lighting.`);
        setLoadingMessage("Verification Failed.");
      }
    } catch (err) {
      setFaceError(err?.message || "Face verification failed. Please retry.");
      setLoadingMessage("Error during verification.");
    } finally {
      setIsVerifyingFace(false);
      if (loadingStage === 4) {
        setTimeout(() => setLoadingMessage("System Ready"), 3000);
      }
    }
  };

  // Demo mode: instantly pass face + GPS without real camera/location
  const handleDemoVerify = () => {
    // Create a tiny blank blob as a placeholder image file
    const blob = new Blob(["demo"], { type: "image/jpeg" });
    const file = new File([blob], "demo.jpg", { type: "image/jpeg" });
    setCapturedImage(file);
    setFaceVerified(true);
    setLoadingMessage("Demo: Identity Auto-Verified ✓");
    // Use GITAM campus coordinates — matches the demo session's location
    setLocation({ latitude: 17.7339, longitude: 83.2318 });
  };

  const handleMarkAttendance = async () => {
    setAttendanceStatus(null);
    setAttendanceError("");
    if (!faceVerified || !capturedImage) {
      setAttendanceError("Please verify your face first.");
      return;
    }
    if (!sessionKey || sessionKey.length !== 6) {
      setAttendanceError("Enter the 6-digit session key from your faculty.");
      return;
    }
    if (!location || !location.latitude || !location.longitude) {
      setAttendanceError("GPS not verified. Please allow location access.");
      return;
    }
    setIsMarking(true);
    try {
      const result = await markAttendance({
        sessionKey,
        location: { lat: location?.latitude || 0, lng: location?.longitude || 0 },
        imageFile: capturedImage
      });
      if (result.ok) {
        setAttendanceStatus("SUCCESS");
        loadHistory();
      } else {
        if (result.reason === "GPS_OUTSIDE") {
          setAttendanceError("You are outside the classroom geo-fence. Move closer.");
        } else if (result.reason === "INVALID_KEY") {
          setAttendanceError("Invalid session key. Please check with faculty.");
        } else {
          setAttendanceError(result.reason || "Attendance failed. Please try again.");
        }
      }
    } catch (err) {
      setAttendanceError(err?.message || "Unable to mark attendance.");
    } finally {
      setIsMarking(false);
    }
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
          fontSize: "1.4rem",
          boxShadow: "0 0 14px var(--glow-gold)"
        }}>🎓</div>
        <div>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "1.1rem", fontWeight: 700,
            color: "var(--gold-bright)",
            letterSpacing: "0.06em"
          }}>
            {currentUser ? `Welcome, ${currentUser.name}` : "Student Portal"}
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.78rem", color: "var(--text-muted)",
            letterSpacing: "0.05em", textTransform: "uppercase"
          }}>MarkMe · Smart Attendance</div>
        </div>
        {currentUser && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
            <span className="chip chip-gold">Roll: {currentUser.rollNo || "N/A"}</span>
            <span className="chip">Branch: {currentUser.branch || "N/A"}</span>
          </div>
        )}
      </div>

      <section className="grid grid-2">
        {/* LEFT — Identity verification */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Identity Verification</div>
              <div className="card-subtitle">AI face recognition + liveness detection</div>
            </div>
            <StatusBadge
              status={faceVerified ? "success" : loadingStage < 4 ? "warning" : "neutral"}
              label={faceVerified ? "✓ Verified" : loadingStage < 4 ? "Loading…" : "Pending"}
            />
          </div>

          {/* Loading progress */}
          {loadingStage < 4 && (
            <LoadingBar stage={loadingStage} message={loadingMessage} />
          )}

          {/* Camera or verified state */}
          <div className="mt-md">
            {!faceVerified ? (
              <CameraPreview
                ref={cameraRef}
                onStreamReady={() => setFaceError("")}
                onError={(msg) => setFaceError(msg)}
              />
            ) : (
              <div style={{
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "6px",
                padding: "1.5rem",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.8rem", fontWeight: 600,
                  color: "#4ade80", letterSpacing: "0.08em",
                  marginBottom: "0.25rem"
                }}>IDENTITY CONFIRMED</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "'Rajdhani', sans-serif" }}>
                  Face snapshot captured. Camera disabled.
                </div>
                <button
                  className="btn btn-secondary mt-md btn-sm"
                  onClick={() => { setFaceVerified(false); setCapturedImage(null); }}
                >
                  ↩ Retake / Verify Again
                </button>
              </div>
            )}
          </div>

          {/* Status message */}
          {loadingStage === 4 && (
            <div style={{
              textAlign: "center", marginTop: "0.6rem",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.65rem", letterSpacing: "0.12em",
              color: faceVerified ? "#4ade80" : "var(--text-muted)",
              textTransform: "uppercase"
            }}>{loadingMessage}</div>
          )}

          {/* Demo mode banner */}
          {currentUser && isDemoUser(currentUser) && (
            <div style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px dashed rgba(251,191,36,0.4)",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              marginTop: "0.75rem",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
            }}>
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.65rem", color: "var(--gold-bright)", letterSpacing: "0.12em", marginBottom: "0.2rem" }}>
                  ⚡ DEMO MODE
                </div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Face &amp; GPS auto-bypassed · Session key: <strong style={{ color: "var(--gold-bright)" }}>123456</strong>
                </div>
              </div>
              {!faceVerified && (
                <button
                  className="btn btn-sm"
                  onClick={handleDemoVerify}
                  style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", color: "var(--gold-bright)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                >
                  ⚡ Auto-Verify
                </button>
              )}
            </div>
          )}

          <button
            className="btn btn-primary mt-md btn-block"
            onClick={handleVerifyFace}
            disabled={loadingStage < 4 || isVerifyingFace || faceVerified || (currentUser && isDemoUser(currentUser))}
          >
            {isVerifyingFace ? (
              <><Spinner /><span style={{ marginLeft: 8 }}>Verifying Identity…</span></>
            ) : faceVerified ? (
              "✓ Verified"
            ) : (
              "▶ Verify Face"
            )}
          </button>

          {faceError && (
            <div style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "4px",
              padding: "0.6rem",
              marginTop: "0.75rem"
            }}>
              <div className="error-text" style={{ margin: 0 }}>⚠ {faceError}</div>
            </div>
          )}

          <div className="mt-md">
            <LocationStatus onLocationObtained={setLocation} />
          </div>
        </div>

        {/* RIGHT — Mark Attendance + History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Mark attendance */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Mark Attendance</div>
                <div className="card-subtitle">Enter the session key from faculty</div>
              </div>
            </div>

            {/* Pre-conditions checklist */}
            <div style={{
              display: "flex", flexDirection: "column", gap: "0.4rem",
              marginBottom: "1rem", padding: "0.75rem",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(251,191,36,0.08)",
              borderRadius: "4px"
            }}>
              {[
                { label: "Face Verified", ok: faceVerified },
                { label: "GPS Active", ok: !!(location?.latitude) },
                { label: "Session Key Ready", ok: sessionKey.length === 6 }
              ].map(({ label, ok }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: ok ? "#4ade80" : "rgba(255,255,255,0.1)",
                    boxShadow: ok ? "0 0 6px #4ade80" : "none",
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.75rem",
                    color: ok ? "#4ade80" : "var(--text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase"
                  }}>{label}</span>
                </div>
              ))}
            </div>

            <div className="input-group">
              <label className="input-label">6-Digit Session Key</label>
              <input
                className="input-field"
                value={sessionKey}
                onChange={(e) => setSessionKey(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="e.g. 482193"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textAlign: "center",
                  color: sessionKey.length === 6 ? "var(--gold-bright)" : "var(--text-primary)"
                }}
                maxLength={6}
              />
              {currentUser && isDemoUser(currentUser)
                ? <span className="helper-text" style={{ color: "var(--gold-mid)" }}>⚡ Demo session key is <strong>123456</strong> — enter it above.</span>
                : <span className="helper-text">Session keys expire after the active time set by faculty.</span>
              }
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handleMarkAttendance}
              disabled={isMarking}
            >
              {isMarking ? (
                <><Spinner /><span style={{ marginLeft: 8 }}>Marking Attendance…</span></>
              ) : (
                "▶ Mark Attendance"
              )}
            </button>

            {attendanceStatus === "SUCCESS" && (
              <div style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: "4px",
                padding: "0.75rem",
                marginTop: "0.75rem",
                textAlign: "center"
              }}>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.75rem", fontWeight: 600,
                  color: "#4ade80", letterSpacing: "0.08em"
                }}>✓ ATTENDANCE RECORDED</div>
              </div>
            )}

            {attendanceError && (
              <div style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "4px",
                padding: "0.6rem",
                marginTop: "0.75rem"
              }}>
                <div className="error-text" style={{ margin: 0 }}>⚠ {attendanceError}</div>
              </div>
            )}
          </div>

          {/* Attendance history */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Attendance History</div>
              <span className="chip chip-gold">{attendanceHistory.length} Records</span>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((row, i) => (
                    <tr key={`${row.date}-${row.subject}-${i}`}>
                      <td style={{ fontFamily: "'Rajdhani', sans-serif" }}>{row.date}</td>
                      <td style={{ fontFamily: "'Rajdhani', sans-serif" }}>{row.subject}</td>
                      <td>
                        <span className={`chip ${row.status === "Present" ? "chip-success" : "chip-danger"}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendanceHistory.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "1.5rem" }}>
                        <span className="no-data">No attendance records found.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default StudentDashboard;
