import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const useAdminData = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allReservations, setAllReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [otherVillageRequests, setOtherVillageRequests] = useState([]);
  const [otherVillageLoading, setOtherVillageLoading] = useState(true);
  const [otherVillageError, setOtherVillageError] = useState(null);

  const [memberImages, setMemberImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const token = Cookies.get("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchData = async (url, setter, setLoading, setError) => {
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Échec de la récupération depuis ${url}`);
        const data = await res.json();
        setter(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData(
      `${API_BASE_URL}/admins/volunteers/minimal`,
      setVolunteers,
      setLoading,
      setError
    );
    fetchData(
      `${API_BASE_URL}/admin/reservations`,
      setAllReservations,
      setReservationsLoading,
      setReservationsError
    );
    fetchData(
      `${API_BASE_URL}/admin/all-users`,
      setAllUsers,
      setUsersLoading,
      setUsersError
    );
    fetchData(
      `${API_BASE_URL}/admin/other-village-requests`,
      setOtherVillageRequests,
      setOtherVillageLoading,
      setOtherVillageError
    );
    fetchData(
      `${API_BASE_URL}/member-images`,
      setMemberImages,
      setImagesLoading,
      setImagesError
    );
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
    volunteers,
    loading,
    error,
    allReservations,
    reservationsLoading,
    reservationsError,
    allUsers,
    setAllUsers,
    usersLoading,
    usersError,
    otherVillageRequests,
    otherVillageLoading,
    otherVillageError,
    memberImages, // now contains objects with { id, url }
    imagesLoading,
    imagesError,
    fetchVolunteerDetails,
  };
};

export default useAdminData;
