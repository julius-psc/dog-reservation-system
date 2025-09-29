import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const useAdminData = () => {
  // --- États pour les données ---
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [allReservations, setAllReservations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [otherVillageRequests, setOtherVillageRequests] = useState([]);

  // --- États pour les images (gérés ici maintenant) ---
  const [memberImages, setMemberImages] = useState([]);
  const [memberImagesTotal, setMemberImagesTotal] = useState(0);
  const [memberImagesNextOffset, setMemberImagesNextOffset] = useState(null);

  // --- États de chargement et d'erreur unifiés ---
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const token = Cookies.get("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchAllData = async () => {
      setIsDashboardLoading(true);
      setError(null);

      try {
        // Toutes les requêtes sont lancées en parallèle
        const requests = [
          fetch(`${API_BASE_URL}/admins/volunteers/minimal`, { headers }),
          fetch(`${API_BASE_URL}/admin/volunteers/count`, { headers }),
          fetch(`${API_BASE_URL}/admin/reservations`, { headers }),
          fetch(`${API_BASE_URL}/admin/all-users`, { headers }),
          fetch(`${API_BASE_URL}/admin/users/count`, { headers }),
          fetch(`${API_BASE_URL}/admin/other-village-requests`, { headers }),
          // On ajoute la requête pour la première page des images
          fetch(`${API_BASE_URL}/admin/member-images?limit=24&offset=0`, {
            headers,
          }),
        ];

        const responses = await Promise.all(requests);

        // On vérifie que toutes les requêtes ont réussi
        for (const res of responses) {
          if (!res.ok) {
            throw new Error(
              `Échec de la récupération des données : ${res.status} ${res.statusText}`
            );
          }
        }

        // On extrait le JSON de toutes les réponses
        const [
          volunteersData,
          volunteerCountData,
          reservationsData,
          usersData,
          usersCountData,
          otherVillageData,
          memberImagesData, // On récupère les données des images
        ] = await Promise.all(responses.map((res) => res.json()));

        // On met à jour tous les états en une seule fois
        setVolunteers(volunteersData);
        setVolunteerCount(volunteerCountData.count);
        setAllReservations(reservationsData);
        setAllUsers(usersData);
        setUsersCount(usersCountData.count);
        setOtherVillageRequests(otherVillageData);

        // On met à jour les états pour les images
        setMemberImages(memberImagesData.items || []);
        setMemberImagesTotal(memberImagesData.total || 0);
        setMemberImagesNextOffset(memberImagesData.nextOffset);
      } catch (err) {
        console.error("Erreur lors de la récupération des données admin:", err);
        setError(err.message);
      } finally {
        // Le chargement est terminé, qu'il ait réussi ou non
        setIsDashboardLoading(false);
      }
    };

    fetchAllData();
  }, [API_BASE_URL]);

  const fetchVolunteerDetails = async (volunteerId) => {
    const token = Cookies.get("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/volunteers/${volunteerId}`, {
      headers,
    });
    if (!res.ok)
      throw new Error("Échec de la récupération des détails du bénévole");
    return await res.json();
  };

  return {
    // Données
    volunteers,
    volunteerCount,
    allReservations,
    allUsers,
    setAllUsers,
    usersCount,
    otherVillageRequests,
    setOtherVillageRequests,

    // Données et setters pour les images
    memberImages,
    setMemberImages,
    memberImagesTotal,
    setMemberImagesTotal,
    memberImagesNextOffset,
    setMemberImagesNextOffset,

    // États globaux
    isDashboardLoading,
    error,

    // Fonctions
    fetchVolunteerDetails,
  };
};

export default useAdminData;