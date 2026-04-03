import React, { useState } from "react";
import MarkMeLogo from "../../components/common/MarkMeLogo.jsx";
import { Link, useNavigate, useParams } from "react-router-dom";
import { register } from "../../services/authService.js";
import Spinner from "../../components/common/Spinner.jsx";
import { compressImage, fileToBase64 } from "../../utils/imageUtils.js";

const roleConfig = {
  student: { label: "Student", icon: "🎓" },
  faculty: { label: "Faculty", icon: "👨‍🏫" },
  admin:   { label: "Admin",   icon: "⚙️" }
};

const RegisterPage = () => {
  const { role = "student" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faceImages, setFaceImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const cfg = roleConfig[role] || roleConfig.student;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + faceImages.length > 3) {
      alert("Maximum 3 face images allowed.");
      return;
    }
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        const base64 = await fileToBase64(compressed);
        setFaceImages(prev => [...prev, base64]);
        setImagePreviews(prev => [...prev, base64]);
      } catch (err) {
        alert("Failed to process an image.");
      }
    }
  };

  const removeImage = (index) => {
    setFaceImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Full name is required.";
    if (!identifier.trim()) newErrors.identifier = "Email or roll number is required.";
    if (!password) newErrors.password = "Password is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      setApiError("");
      await register({ name, identifier, password, role, phone, faceImages });
      navigate(`/login/${role}`, { replace: true });
    } catch (err) {
      setApiError(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: "480px" }}>
      <div className="card auth-card">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(251,191,36,0.1)" }}>
          <div style={{ margin: "0 auto 0.75rem", display: "flex", justifyContent: "center" }}>
            <MarkMeLogo size={56} />
          </div>
          <div className="auth-title">{cfg.label} Registration</div>
          <div className="auth-subtitle">Create your MarkMe account</div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Full Name <span style={{ color: "#f97316" }}>*</span></label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abhinav Tarigoopula"
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email / Roll Number <span style={{ color: "#f97316" }}>*</span></label>
            <input
              className="input-field"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 2023000367 or you@gitam.edu"
            />
            {errors.identifier && <div className="error-text">{errors.identifier}</div>}
          </div>

          <div className="input-group">
            <label className="input-label">Password <span style={{ color: "#f97316" }}>*</span></label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password (min 6 chars)"
            />
            {errors.password && <div className="error-text">{errors.password}</div>}
          </div>

          {/* Face Upload */}
          <div className="input-group">
            <label className="input-label">Face Photos for Attendance</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="input-field"
            />
            <span className="helper-text">Upload 1–3 clear front-facing photos. Used for AI verification.</span>

            {imagePreviews.length > 0 && (
              <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {imagePreviews.map((src, index) => (
                  <div key={index} style={{ position: "relative" }}>
                    <img
                      src={src}
                      alt={`Face ${index + 1}`}
                      style={{
                        width: "70px", height: "70px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "2px solid var(--holo-border)"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: "absolute", top: -6, right: -6,
                        background: "rgba(239,68,68,0.9)",
                        color: "white", border: "none",
                        borderRadius: "50%",
                        width: "18px", height: "18px",
                        fontSize: "11px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700
                      }}
                    >×</button>

                    {/* Photo number badge */}
                    <div style={{
                      position: "absolute", bottom: "2px", left: "2px",
                      background: "rgba(251,191,36,0.85)",
                      color: "var(--black-pure)",
                      fontSize: "0.55rem", fontWeight: 700,
                      padding: "1px 4px",
                      borderRadius: "2px",
                      fontFamily: "'Orbitron', monospace"
                    }}>#{index + 1}</div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 3 - imagePreviews.length }).map((_, i) => (
                  <div key={`empty-${i}`} style={{
                    width: "70px", height: "70px",
                    border: "2px dashed rgba(251,191,36,0.15)",
                    borderRadius: "4px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-dim)",
                    fontSize: "0.65rem",
                    fontFamily: "'Rajdhani', sans-serif"
                  }}>EMPTY</div>
                ))}
              </div>
            )}
          </div>

          {apiError && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "4px",
              padding: "0.6rem 0.75rem",
              marginBottom: "0.75rem"
            }}>
              <div className="error-text" style={{ margin: 0 }}>⚠ {apiError}</div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: "0.5rem", fontSize: "0.9rem", padding: "0.75rem" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Spinner /><span style={{ marginLeft: 8 }}>Creating Account…</span></>
            ) : (
              `▶ Register as ${cfg.label}`
            )}
          </button>
        </form>

        <div style={{
          marginTop: "1rem",
          textAlign: "center",
          paddingTop: "0.75rem",
          borderTop: "1px solid rgba(251,191,36,0.08)"
        }}>
          <span className="helper-text">
            Already registered?{" "}
            <Link className="link" to={`/login/${role}`}>Sign in here</Link>
          </span>
        </div>
      </div>

      <div style={{
        textAlign: "center", marginTop: "1rem",
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "0.68rem", letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--text-dim)"
      }}>
        Abhinav Tarigoopula · GITAM University
      </div>
    </div>
  );
};

export default RegisterPage;
