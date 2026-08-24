import { useCallback, useEffect, useRef, useState } from "react";

const WEBGAZER_SRC = "https://webgazer.cs.brown.edu/webgazer.js";

let scriptPromise = null;
function loadWebgazer() {
  if (window.webgazer) return Promise.resolve(window.webgazer);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WEBGAZER_SRC;
    script.async = true;
    script.onload = () => resolve(window.webgazer);
    script.onerror = () => reject(new Error("Failed to load WebGazer"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Experimental, opt-in, webcam-based gaze estimation. This is NOT
// clinical-grade eye tracking — it's a browser heuristic (WebGazer.js)
// useful for a rough "what are they looking at" signal. Fails closed:
// any load/permission error just leaves gaze as null and reports status.
export function useEyeTracking(enabled) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [gaze, setGaze] = useState(null);
  const gazerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (gazerRef.current) {
        try {
          gazerRef.current.end();
        } catch {
          /* noop */
        }
        gazerRef.current = null;
      }
      setStatus("idle");
      setGaze(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    loadWebgazer()
      .then((webgazer) => {
        if (cancelled) return;
        webgazer
          .setRegression("ridge")
          .setGazeListener((data) => {
            if (!data || cancelled) return;
            setGaze({ x: data.x, y: data.y });
          })
          .saveDataAcrossSessions(false)
          .begin()
          .then(() => {
            if (cancelled) return;
            webgazer.showVideoPreview(false).showPredictionPoints(false);
            gazerRef.current = webgazer;
            setStatus("ready");
          });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // True unmount (app teardown), independent of the `enabled` toggle above —
  // that effect only tears down webgazer when the pref flips to false, not
  // when this hook's owner unmounts. Without this, a hard app unmount would
  // leave the camera stream running forever.
  useEffect(() => {
    return () => {
      try {
        gazerRef.current?.end();
      } catch {
        /* noop */
      }
    };
  }, []);

  const calibrate = useCallback((points) => {
    const gz = gazerRef.current;
    if (!gz) return;
    points.forEach(({ x, y }) => gz.recordScreenPosition(x, y, "click"));
  }, []);

  return { status, gaze, calibrate };
}
