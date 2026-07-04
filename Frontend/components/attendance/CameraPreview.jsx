import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Spinner from "../common/Spinner.jsx";


const CameraPreview = forwardRef(({ onStreamReady, onError }, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState("");

  useImperativeHandle(ref, () => ({
    getSnapshot: async () => {
      if (!videoRef.current) return null;

      const canvas = document.createElement("canvas");
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      const MAX_WIDTH = 800;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, width, height);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) resolve(null);
          const file = new File([blob], "attendance_snapshot.jpg", { type: "image/jpeg" });
          resolve(file);
        }, "image/jpeg", 0.8);
      });
    }
  }));

  useEffect(() => {
    let cancelled = false;

    const enableCamera = async () => {
      try {
        setIsInitializing(true);
        setCameraError("");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not supported in this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // The <video> element is always mounted, so the ref is available here.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (_) {
            /* autoplay can be interrupted — the feed still binds */
          }
        }

        if (onStreamReady) onStreamReady(stream);
      } catch (err) {
        const message = err?.message || "Unable to access camera. Please check permissions.";
        if (!cancelled) {
          setCameraError(message);
          if (onError) onError(message);
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    enableCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [onStreamReady, onError]);

  return (
    <div className="camera-preview">
      {/* Always mounted so the stream can bind immediately */}
      <video ref={videoRef} autoPlay muted playsInline />

      {isInitializing && !cameraError && (
        <div
          className="flex-gap-md"
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Spinner />
          <span>Requesting camera access…</span>
        </div>
      )}

      <div className="camera-overlay" />

      {cameraError && (
        <div
          style={{
            position: "absolute",
            bottom: "0.5rem",
            left: "0.75rem",
            right: "0.75rem",
            fontSize: "0.75rem",
            color: "#fecaca",
            background: "rgba(15,23,42,0.85)",
            padding: "0.4rem 0.55rem",
            borderRadius: "0.5rem"
          }}
        >
          {cameraError}
        </div>
      )}
    </div>
  );
});

export default CameraPreview;
