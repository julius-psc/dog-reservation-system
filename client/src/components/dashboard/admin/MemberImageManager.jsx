import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const PAGE_SIZE = 24; // tweak as you like

const MemberImageManager = () => {
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [images, setImages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [deletingIds, setDeletingIds] = useState(new Set());

  const [nextOffset, setNextOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const token = Cookies.get("token") || "";

  const fetchImages = useCallback(
    async (opts = { reset: false }) => {
      const reset = opts.reset ?? false;
      const limit = PAGE_SIZE;
      const offset = reset ? 0 : nextOffset ?? 0;

      if (reset) {
        setImages([]);
        setNextOffset(0);
        setTotal(0);
      }

      setLoadingList(true);
      try {
        // ⬇️ use the admin endpoint that returns { items, total, nextOffset }
        const url = new URL(`${API_BASE}/admin/member-images`);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String(offset));

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();

        const newItems = Array.isArray(data?.items) ? data.items : [];
        setImages((prev) => (reset ? newItems : [...prev, ...newItems]));
        setTotal(Number.isFinite(data?.total) ? data.total : 0);
        setNextOffset(
          typeof data?.nextOffset === "number" ? data.nextOffset : null
        );
        setInitialLoaded(true);
      } catch (err) {
        console.error("Error fetching member images:", err);
        toast.error("Impossible de récupérer les images.");
      } finally {
        setLoadingList(false);
      }
    },
    [token, nextOffset]
  );

  useEffect(() => {
    // initial load
    fetchImages({ reset: true });
  }, [fetchImages]);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Veuillez sélectionner un fichier.");
    setLoadingUpload(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/admin/member-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur backend AWS:", errorText);
        throw new Error("Échec du téléchargement");
      }

      const created = await res.json();
      toast.success("Image téléchargée !");
      setFile(null);

      // Prepend to current list, keep counts in sync
      setImages((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
    } catch (err) {
      console.error(err);
      toast.error("Échec du téléchargement de l'image.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const previous = images;
    setDeletingIds((s) => new Set([...s, id]));
    setImages((prev) => prev.filter((img) => img.id !== id));
    setTotal((t) => Math.max(0, t - 1));

    try {
      const res = await fetch(`${API_BASE}/admin/member-images/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Delete failed");
      }
      toast.success("Image supprimée.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Échec de la suppression.");
      // revert
      setImages(previous);
      setTotal((t) => t + 1);
    } finally {
      setDeletingIds((s) => {
        const copy = new Set(s);
        copy.delete(id);
        return copy;
      });
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiée !");
    } catch {
      toast.error("Impossible de copier l’URL.");
    }
  };

  const canLoadMore = nextOffset !== null && nextOffset < total;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Images des membres (site principal)
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {total} au total
          </span>
          <button
            onClick={() => fetchImages({ reset: true })}
            disabled={loadingList}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {loadingList && !initialLoaded ? "Chargement..." : "Rafraîchir"}
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={loadingUpload || !file}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loadingUpload ? "Téléchargement..." : "Télécharger"}
        </button>
        {file && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {file.name}
          </span>
        )}
      </div>

      {/* Grid */}
      <div>
        {loadingList && !initialLoaded ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chargement des images…
          </p>
        ) : images.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune image pour l’instant.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {images.map((img) => {
                const isDeleting = deletingIds.has(img.id);
                return (
                  <li
                    key={img.id}
                    className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
                  >
                    <div className="aspect-square bg-gray-50 dark:bg-gray-800 relative">
                      <img
                        src={img.url}
                        alt={`member-${img.id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {isDeleting && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm">
                          Suppression…
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => copyUrl(img.url)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Copier l’URL
                      </button>
                      <div className="flex items-center gap-2">
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Ouvrir
                        </a>
                        <button
                          onClick={() => handleDelete(img.id)}
                          disabled={isDeleting}
                          className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Voir plus */}
            <div className="mt-6 flex justify-center">
              {canLoadMore ? (
                <button
                  onClick={() => fetchImages({ reset: false })}
                  disabled={loadingList}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {loadingList ? "Chargement…" : "Voir plus"}
                </button>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tout est affiché.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemberImageManager;