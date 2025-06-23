import { useState, useEffect } from "react";

const useLandingPageImages = () => {
  const [memberImages, setMemberImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/member-images`);
        if (!res.ok) throw new Error("Failed to fetch member images");
        const data = await res.json();

        // Map the relative URL from DB to full URL
        const fullUrls = data.map((img) => {
          // If img.url already includes full URL, return it as is, else prepend API_BASE_URL
          if (img.url.startsWith("http")) return img.url;
          return `${API_BASE_URL}/${img.url.replace(/^\/?/, "")}`; // removes leading slash if any
        });

        setMemberImages(fullUrls);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [API_BASE_URL]);

  return { memberImages, loading, error };
};

export default useLandingPageImages;
