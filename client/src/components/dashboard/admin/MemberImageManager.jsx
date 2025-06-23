import { useState } from "react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const MemberImageManager = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      console.error(err);
      toast.error("Échec du téléchargement de l'image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Télécharger une photo de membre
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
    </div>
  );
};

export default MemberImageManager;