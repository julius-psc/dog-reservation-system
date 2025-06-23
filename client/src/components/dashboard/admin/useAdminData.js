import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const useAdminData = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [volunteerCountLoading, setVolunteerCountLoading] = useState(true);
  const [volunteerCountError, setVolunteerCountError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allReservations, setAllReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [otherVillageRequests, setOtherVillageRequests] = useState([]);
  const [otherVillageLoading, setOtherVillageLoading] = useState(true);
  const [otherVillageError, setOtherVillageError] = useState(null);

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

    // Fetch paginated volunteers (minimal)
    fetchData(
      `${API_BASE_URL}/admins/volunteers/minimal`,
      setVolunteers,
      setLoading,
      setError
    );

    // Fetch volunteer count separately
    const fetchVolunteerCount = async () => {
      setVolunteerCountLoading(true);
      setVolunteerCountError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/volunteers/count`, {
          headers,
        });
        if (!res.ok) throw new Error("Failed to fetch volunteer count");
        const data = await res.json();
        setVolunteerCount(data.count);
      } catch (err) {
        setVolunteerCountError(err.message);
      } finally {
        setVolunteerCountLoading(false);
      }
    };
    fetchVolunteerCount();

    // Fetch reservations
    fetchData(
      `${API_BASE_URL}/admin/reservations`,
      setAllReservations,
      setReservationsLoading,
      setReservationsError
    );

    // Fetch users (paginated list)
    fetchData(
      `${API_BASE_URL}/admin/all-users`,
      setAllUsers,
      setUsersLoading,
      setUsersError
    );

    // Fetch users count separately
    const fetchUsersCount = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/users/count`, {
          headers,
        });
        if (!res.ok) throw new Error("Failed to fetch users count");
        const data = await res.json();
        setUsersCount(data.count);
      } catch (err) {
        setUsersError(err.message);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsersCount();

    // Fetch other village requests
    fetchData(
      `${API_BASE_URL}/admin/other-village-requests`,
      setOtherVillageRequests,
      setOtherVillageLoading,
      setOtherVillageError
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
    volunteerCount,
    volunteerCountLoading,
    volunteerCountError,
    loading,
    error,
    allReservations,
    reservationsLoading,
    reservationsError,
    allUsers,
    usersCount,
    setAllUsers,
    usersLoading,
    usersError,
    otherVillageRequests,
    setOtherVillageRequests,
    otherVillageLoading,
    otherVillageError,
    fetchVolunteerDetails,
  };
};

export default useAdminData;
