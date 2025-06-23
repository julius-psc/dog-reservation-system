import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const MemberImageManager = () => {
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchImages = async () => {
    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_BASE}/member-images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Échec du chargement des images");
      const data = await res.json();
      setImages(data); // keep full objects
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Impossible de charger les images des membres.");
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Veuillez sélectionner un fichier.");
    setLoading(true);
    const token = Cookies.get("token");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_BASE}/admin/member-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Échec du téléchargement");
      toast.success("Image téléchargée !");
      setFile(null);
      fetchImages();
    } catch (err) {
      console.error(err);
      toast.error("Échec du téléchargement de l'image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette image ?")) return;
    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_BASE}/admin/member-images/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Échec de la suppression");
      toast.success("Image supprimée.");
      fetchImages();
    } catch (err) {
      console.error(err);
      toast.error("Échec de la suppression.");
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Gérer les photos des membres
      </h2>
      <div className="flex items-center mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mr-4"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Téléchargement..." : "Télécharger"}
        </button>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative">
            <img
              src={img.url}
              alt={`Membre ${img.id}`}
              className="w-full h-24 object-cover rounded"
            />
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberImageManager;
