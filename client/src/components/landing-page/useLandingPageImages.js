import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const useLandingPageImages = () => {
  const [memberImages, setMemberImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = Cookies.get("token");
        const res = await fetch(`${API_BASE_URL}/member-images?limit=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch member images (${res.status})`);
        const data = await res.json();

        const items = Array.isArray(data?.items) ? data.items : [];

        const fullUrls = items.map((img) => {
          const u = img.url || "";
          return u.startsWith("http")
            ? u
            : `${API_BASE_URL}/${u.replace(/^\/?/, "")}`;
        });

        setMemberImages(fullUrls);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [API_BASE_URL]);

  return { memberImages, loading, error };
};

export default useLandingPageImages;