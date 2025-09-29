import { useState, useEffect } from "react";

const useLandingPageImages = () => {
  const [memberImages, setMemberImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/member-images?limit=30`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
        }
        const data = await res.json();

        // normalize to an array of “records”
        const records = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.rows)
          ? data.rows
          : [];

        // normalize each record to a URL string
        const urls = records
          .map((rec) => (typeof rec === "string" ? rec : rec?.url))
          .filter((u) => typeof u === "string" && u.length > 0)
          .map((u) =>
            u.startsWith("http")
              ? u
              : `${API_BASE_URL}/${u.replace(/^\/?/, "")}`
          );

        // 👇 Final hard guard
        setMemberImages(Array.isArray(urls) ? urls : []);
      } catch (e) {
        console.error("Landing images fetch error:", e);
        setError(e?.message || "Unknown error");
        setMemberImages([]); // ensure array on failure
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE_URL]);

  return { memberImages, loading, error };
};

export default useLandingPageImages;