import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* Holographic 3D canvas — animated grid floor + floating particles */
const HoloCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let frame = 0;

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    /* Particles */
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2
    }));

    /* Grid lines */
    const drawGrid = () => {
      const cols = 12, rows = 8;
      const cw = W / cols, ch = H / rows;

      ctx.strokeStyle = "rgba(251,191,36,0.07)";
      ctx.lineWidth = 0.5;

      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cw, 0);
        ctx.lineTo(c * cw, H);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * ch);
        ctx.lineTo(W, r * ch);
        ctx.stroke();
      }

      /* Diagonal accent lines */
      ctx.strokeStyle = "rgba(251,191,36,0.03)";
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W, H); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W, 0); ctx.lineTo(0, H); ctx.stroke();
    };

    /* Scan line */
    const drawScan = () => {
      const scanY = (frame % (H + 60)) - 30;
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, "rgba(251,191,36,0.12)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 20, W, 40);
    };

    /* Corner HUD brackets */
    const drawHUD = () => {
      const sz = 30;
      ctx.strokeStyle = "rgba(251,191,36,0.35)";
      ctx.lineWidth = 1.5;
      const corners = [[0,0,1,1], [W,0,-1,1], [0,H,1,-1], [W,H,-1,-1]];
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * sz, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * sz);
        ctx.stroke();
      });
    };

    /* Hexagon at center */
    const drawHex = () => {
      const cx = W * 0.5, cy = H * 0.5;
      const pulse = Math.sin(frame * 0.02) * 4;
      const r = 80 + pulse;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(251,191,36,${0.15 + Math.sin(frame * 0.02) * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      /* Inner hex */
      const r2 = 50 + pulse * 0.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r2 * Math.cos(angle);
        const y = cy + r2 * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(251,191,36,${0.08 + Math.sin(frame * 0.02) * 0.03})`;
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      drawGrid();
      drawScan();

      /* Particles */
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${p.alpha})`;
        ctx.fill();
      });

      /* Connect nearby particles */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(251,191,36,${0.08 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      drawHex();
      drawHUD();

      frame++;
      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.8,
        pointerEvents: "none"
      }}
    />
  );
};

/* Feature card component */
const FeatureCard = ({ icon, title, desc, delay }) => (
  <div style={{
    background: "var(--black-card)",
    border: "1px solid var(--holo-border)",
    borderRadius: "6px",
    padding: "1rem 1.1rem",
    position: "relative",
    overflow: "hidden",
    animation: `fadeInUp 0.5s ease ${delay}s both`,
    transition: "border-color 0.2s, box-shadow 0.2s",
  }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = "var(--gold-mid)";
      e.currentTarget.style.boxShadow = "0 0 20px rgba(251,191,36,0.1)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = "var(--holo-border)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div style={{
      fontSize: "1.4rem",
      marginBottom: "0.5rem",
      filter: "drop-shadow(0 0 6px rgba(251,191,36,0.4))"
    }}>{icon}</div>
    <div style={{
      fontFamily: "'Orbitron', monospace",
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      color: "var(--gold-bright)",
      marginBottom: "0.35rem",
      textTransform: "uppercase"
    }}>{title}</div>
    <div style={{
      fontSize: "0.78rem",
      color: "var(--text-muted)",
      fontFamily: "'Rajdhani', sans-serif",
      lineHeight: 1.5
    }}>{desc}</div>
  </div>
);

/* Step component */
const Step = ({ num, text }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.6rem 0" }}>
    <div style={{
      width: "26px", height: "26px",
      borderRadius: "4px",
      background: "linear-gradient(135deg, var(--gold-deep), var(--gold-mid))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Orbitron', monospace",
      fontSize: "0.7rem", fontWeight: 700,
      color: "var(--black-pure)",
      flexShrink: 0,
      boxShadow: "0 0 8px var(--glow-gold)"
    }}>{num}</div>
    <div style={{
      fontSize: "0.85rem",
      color: "var(--text-secondary)",
      fontFamily: "'Rajdhani', sans-serif",
      lineHeight: 1.5,
      paddingTop: "0.2rem"
    }}>{text}</div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: "👁️", title: "Face Recognition", desc: "AI-powered identity verification with liveness detection to block photo spoofing.", delay: 0.1 },
    { icon: "📍", title: "GPS Geo-fence", desc: "100m classroom radius enforcement — no remote or buddy marking allowed.", delay: 0.2 },
    { icon: "🔑", title: "Session Keys", desc: "Unique 6-digit rotating codes per lecture that expire automatically.", delay: 0.3 },
    { icon: "🛡️", title: "Anti-Proxy", desc: "Triple-layer security: face + location + key prevents all proxy attempts.", delay: 0.4 },
  ];

  const steps = [
    "Student logs in from their own device.",
    "AI runs face recognition with liveness checks.",
    "GPS verifies the student is inside the classroom geo-fence.",
    "Faculty shares a unique 6-digit session key for that lecture.",
    "Student enters the key — attendance is recorded securely.",
  ];

  return (
    <section className="landing-hero">
      {/* LEFT — Hero content */}
      <div style={{ animation: "fadeInUp 0.6s ease both" }}>
        <div className="pill" style={{ marginBottom: "1.5rem" }}>
          <span className="badge-dot" />
          MarkMe · Abhinav Tarigoopula
        </div>

        <h1 style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "clamp(1.8rem, 4vw, 3rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          margin: "0 0 1rem 0",
          letterSpacing: "0.04em",
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #fbbf24 80%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "shimmer 4s linear infinite"
        }}>
          MARK<br />ME
        </h1>

        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "1rem",
          color: "var(--text-secondary)",
          maxWidth: "34rem",
          lineHeight: 1.7,
          marginBottom: "1.5rem"
        }}>
          Next-generation attendance powered by{" "}
          <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>face recognition</span>,{" "}
          <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>liveness detection</span>,{" "}
          <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>GPS geo-fencing</span>, and{" "}
          <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>session-based keys</span>.
          Zero proxies. Zero buddy punching.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
            style={{ fontSize: "0.9rem", padding: "0.75rem 1.8rem" }}
          >
            ▶ Sign In
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/register/student")}
            style={{ fontSize: "0.85rem" }}
          >
            Register
          </button>
        </div>

        {/* Security chips */}
        <div className="badge-row">
          <span className="chip chip-gold">✓ Real-time Face Match</span>
          <span className="chip chip-gold">✓ GPS Verified</span>
          <span className="chip chip-gold">✓ 6-Digit Session Keys</span>
          <span className="chip">GITAM University · MarkMe</span>
        </div>

        {/* Features grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.75rem",
          marginTop: "2rem"
        }}>
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>

      {/* RIGHT — Holographic panel */}
      <div style={{ animation: "fadeInUp 0.7s ease 0.2s both" }}>
        {/* 3D Canvas card */}
        <div style={{
          position: "relative",
          background: "var(--black-card)",
          border: "1px solid var(--holo-border)",
          borderRadius: "10px",
          overflow: "hidden",
          height: "280px",
          marginBottom: "1rem",
          boxShadow: "0 0 40px rgba(251,191,36,0.06)"
        }}>
          <HoloCanvas />
          {/* Center text overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none"
          }}>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "2.5rem",
              fontWeight: 900,
              color: "var(--gold-bright)",
              textShadow: "0 0 20px var(--glow-gold), 0 0 50px rgba(251,191,36,0.2)",
              letterSpacing: "0.1em",
              animation: "flicker 10s ease-in-out infinite"
            }}>⬡</div>
            <div style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.25em",
              color: "var(--gold-mid)",
              textTransform: "uppercase",
              marginTop: "0.5rem"
            }}>SYSTEM ACTIVE</div>
          </div>

          {/* HUD corner labels */}
          <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", fontFamily: "'Orbitron', monospace", fontSize: "0.55rem", color: "var(--gold-deep)", letterSpacing: "0.1em" }}>SYS_VER 2.0</div>
          <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", fontFamily: "'Orbitron', monospace", fontSize: "0.55rem", color: "var(--gold-deep)", letterSpacing: "0.1em" }}>MARKME_v2</div>
          <div style={{ position: "absolute", bottom: "0.75rem", left: "0.75rem", fontFamily: "'Orbitron', monospace", fontSize: "0.55rem", color: "var(--gold-deep)", letterSpacing: "0.1em" }}>DEV: A.TARIGOOPULA</div>
          <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", fontFamily: "'Orbitron', monospace", fontSize: "0.55rem", color: "var(--gold-deep)", letterSpacing: "0.1em" }}>STATUS: LIVE</div>
        </div>

        {/* How it works card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">How It Works</div>
              <div className="card-subtitle">5-step secure attendance flow</div>
            </div>
            <span className="chip chip-gold">Secure</span>
          </div>

          <div style={{ borderLeft: "2px solid rgba(251,191,36,0.15)", paddingLeft: "0.5rem" }}>
            {steps.map((s, i) => (
              <Step key={i} num={i + 1} text={s} />
            ))}
          </div>

          <p className="helper-text mt-md" style={{ borderTop: "1px solid rgba(251,191,36,0.08)", paddingTop: "0.75rem" }}>
            All face detection models run client-side for privacy.
            Your biometric data never leaves your device.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
