import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import PropTypes from "prop-types";
import "moment/locale/fr";
moment.locale("fr");
import { ClipLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faUsers,
  faCalendarCheck,
  faUserShield,
  faMapMarkerAlt,
  faFileDownload,
  faCheck,
  faClock,
  faBan,
  faFlagCheckered,
  faUser, // Added for is_adult icon
  faListCheck, // Added for commitments icon
} from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "./recycled/LogoutButton";

const AdminDashboard = ({ handleLogout }) => {
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
  const [editingPersonalId, setEditingPersonalId] = useState(null);
  const [newPersonalId, setNewPersonalId] = useState("");
  const [expandedVolunteerId, setExpandedVolunteerId] = useState(null);
  const [volunteerFilter, setVolunteerFilter] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const isProduction = import.meta.env.MODE === "production";

  useEffect(() => {
    const fetchVolunteers = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/admins/volunteers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch volunteers");
        const data = await response.json();
        setVolunteers(data || []);
      } catch (err) {
        setError(err.message);
        setVolunteers([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllReservations = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setReservationsError("No token found. Please log in.");
        setReservationsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch reservations");
        const data = await response.json();
        setAllReservations(data || []);
      } catch (err) {
        setReservationsError(err.message);
      } finally {
        setReservationsLoading(false);
      }
    };

    const fetchAllUsers = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setUsersError("No token found. Please log in.");
        setUsersLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/all-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setAllUsers(data || []);
      } catch (err) {
        setUsersError(err.message);
      } finally {
        setUsersLoading(false);
      }
    };

    const fetchOtherVillageRequests = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setOtherVillageError("No token found. Please log in.");
        setOtherVillageLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/other-village-requests`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok)
          throw new Error("Failed to fetch other village requests");
        const data = await response.json();
        setOtherVillageRequests(data || []);
      } catch (err) {
        setOtherVillageError(err.message);
      } finally {
        setOtherVillageLoading(false);
      }
    };

    fetchVolunteers();
    fetchAllReservations();
    fetchAllUsers();
    fetchOtherVillageRequests();
  }, [API_BASE_URL]);

  if (loading || reservationsLoading || usersLoading || otherVillageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <ClipLoader color="#3b82f6" size={50} />
      </div>
    );
  }

  if (error || reservationsError || usersError || otherVillageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <FontAwesomeIcon
            icon={faTimesCircle}
            className="text-red-500 text-4xl mb-4"
          />
          {error && (
            <p className="text-red-600 dark:text-red-400 mb-2">
              Error: {error}
            </p>
          )}
          {reservationsError && (
            <p className="text-red-600 dark:text-red-400 mb-2">
              Reservations Error: {reservationsError}
            </p>
          )}
          {usersError && (
            <p className="text-red-600 dark:text-red-400 mb-2">
              Users Error: {usersError}
            </p>
          )}
          {otherVillageError && (
            <p className="text-red-600 dark:text-red-400">
              Other Village Error: {otherVillageError}
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleVolunteerRowClick = (volunteerId) => {
    setExpandedVolunteerId(
      expandedVolunteerId === volunteerId ? null : volunteerId
    );
  };

  const handleVolunteerStatusChange = async (volunteerId, newStatus) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${API_BASE_URL}/admin/volunteers/${volunteerId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error("Failed to update volunteer status");
      const updatedVolunteer = await response.json();
      setVolunteers((prev) =>
        prev.map((vol) =>
          vol.id === volunteerId ? updatedVolunteer.volunteer : vol
        )
      );
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id === volunteerId
            ? { ...user, volunteer_status: newStatus }
            : user
        )
      );
      toast.success(`Statut du bénévole mis à jour à ${newStatus}`);
      if (newStatus === "approved") {
        const volunteer = volunteers.find((vol) => vol.id === volunteerId);
        await fetch(`${API_BASE_URL}/send-approval-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: volunteer.email,
            username: volunteer.username,
          }),
        });
      }
    } catch (error) {
      toast.error(`Échec de la mise à jour du statut: ${error.message}`);
    }
  };

  const handleSetPersonalId = async (volunteerId) => {
    if (!newPersonalId.trim()) {
      toast.error("Ne peut pas être vide.");
      return;
    }

    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${API_BASE_URL}/admin/volunteers/${volunteerId}/personal-id`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ personal_id: newPersonalId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set personal ID");
      }

      const updatedVolunteer = await response.json();
      setVolunteers((prev) =>
        prev.map((vol) =>
          vol.id === volunteerId ? updatedVolunteer.volunteer : vol
        )
      );
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id === volunteerId
            ? { ...user, personal_id: newPersonalId }
            : user
        )
      );
      toast.success("ID mis à jour avec succès");
      setEditingPersonalId(null);
      setNewPersonalId("");
    } catch (error) {
      toast.error(`Erreur d'ID: ${error.message}`);
    }
  };

  const filteredVolunteers = volunteers.filter((v) =>
    v.username.toLowerCase().includes(volunteerFilter.toLowerCase())
  );

  const isReservationCompleted = (reservation) => {
    const endDateTime = moment(
      `${reservation.reservation_date} ${reservation.end_time}`,
      "YYYY-MM-DD HH:mm"
    );
    return endDateTime.isBefore(moment());
  };

  const filteredReservations = allReservations.filter((r) => {
    const effectiveStatus = isReservationCompleted(r) ? "completed" : r.status;
    return reservationStatusFilter === "all"
      ? true
      : effectiveStatus.toLowerCase() === reservationStatusFilter.toLowerCase();
  });

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(userFilter.toLowerCase()) &&
      (userRoleFilter === "all" || u.role === userRoleFilter)
  );

  const daysOfWeekLabels = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <FontAwesomeIcon
              icon={faUserShield}
              className="mr-2 text-blue-500"
            />
            Tableau de Bord Administrateur
          </h1>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-between transform hover:scale-105 transition-transform">
            <div>
              <h3 className="text-gray-600 dark:text-gray-300 font-medium">
                Total Bénévoles
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {volunteers.length}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faUsers}
              className="text-blue-500 text-3xl"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-between transform hover:scale-105 transition-transform">
            <div>
              <h3 className="text-gray-600 dark:text-gray-300 font-medium">
                Réservations Totales
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {allReservations.length}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faCalendarCheck}
              className="text-green-500 text-3xl"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-between transform hover:scale-105 transition-transform">
            <div>
              <h3 className="text-gray-600 dark:text-gray-300 font-medium">
                Total Utilisateurs
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {allUsers.length}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faUsers}
              className="text-yellow-500 text-3xl"
            />
          </div>
        </div>

        {/* Volunteers Section */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="mr-2 text-blue-500"
                />
                Liste des Bénévoles
              </h2>
              <input
                type="text"
                placeholder="Rechercher des bénévoles..."
                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={volunteerFilter}
                onChange={(e) => setVolunteerFilter(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Abonnement
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Communes de promenade
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Numéro Promeneur
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVolunteers.map((volunteer) => {
                    const groupedAvailabilities = (
                      volunteer.availabilities || []
                    ).reduce((acc, availability) => {
                      const dayOfWeek = availability.day_of_week;
                      if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
                      acc[dayOfWeek].push({
                        startTime: availability.start_time,
                        endTime: availability.end_time,
                      });
                      return acc;
                    }, {});

                    return (
                      <React.Fragment key={volunteer.id}>
                        <tr
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => handleVolunteerRowClick(volunteer.id)}
                        >
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                            {volunteer.username}
                          </td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                            {volunteer.email}
                          </td>
                          <td className="px-4 py-3">
                            <FontAwesomeIcon
                              icon={
                                volunteer.subscription_paid
                                  ? faCheckCircle
                                  : faTimesCircle
                              }
                              className={
                                volunteer.subscription_paid
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <ul className="list-disc pl-4 text-gray-800 dark:text-gray-200">
                              {volunteer.villages_covered?.map(
                                (village, idx) => (
                                  <li key={idx}>{village}</li>
                                )
                              )}
                            </ul>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                volunteer.volunteer_status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : volunteer.volunteer_status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {volunteer.volunteer_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                            {editingPersonalId === volunteer.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={newPersonalId}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /\D/g,
                                      ""
                                    );
                                    if (value.length <= 5) {
                                      setNewPersonalId(value);
                                    }
                                  }}
                                  className="px-2 py-1 border rounded-lg dark:bg-gray-700 dark:text-white"
                                  placeholder="Numéro promeneur"
                                  maxLength={5}
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetPersonalId(volunteer.id);
                                  }}
                                  className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                  Sauvegarder
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPersonalId(null);
                                    setNewPersonalId("");
                                  }}
                                  className="px-2 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : volunteer.personal_id ? (
                              volunteer.personal_id
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPersonalId(volunteer.id);
                                  setNewPersonalId("");
                                }}
                                className="px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              >
                                Définir NP
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {volunteer.volunteer_status === "pending" && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVolunteerStatusChange(
                                      volunteer.id,
                                      "approved"
                                    );
                                  }}
                                  className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  Approuver
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVolunteerStatusChange(
                                      volunteer.id,
                                      "rejected"
                                    );
                                  }}
                                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Rejeter
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {expandedVolunteerId === volunteer.id && (
                          <tr>
                            <td
                              colSpan="7"
                              className="px-4 py-4 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="text-gray-800 dark:text-gray-200 space-y-2">
                                <p>
                                  <span className="font-semibold">Email:</span>{" "}
                                  {volunteer.email}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Village:
                                  </span>{" "}
                                  {volunteer.village}
                                </p>
                                <p>
                                  <span className="font-semibold">Statut:</span>{" "}
                                  {volunteer.volunteer_status}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Numéro promeneur:
                                  </span>{" "}
                                  {volunteer.personal_id || "Non défini"}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Disponibilités:
                                  </span>
                                </p>
                                {(volunteer.availabilities || []).length ===
                                0 ? (
                                  <p>Aucune disponibilité définie</p>
                                ) : (
                                  <ul className="list-disc pl-4">
                                    {daysOfWeekLabels.map((dayLabel, index) => {
                                      const dayOfWeek = index + 1;
                                      const dayAvailabilities =
                                        groupedAvailabilities[dayOfWeek] || [];
                                      return dayAvailabilities.length > 0 ? (
                                        <li key={dayOfWeek}>
                                          {dayLabel}:{" "}
                                          {dayAvailabilities.map((av, idx) => (
                                            <span key={idx}>
                                              {av.startTime} - {av.endTime}
                                              {idx <
                                                dayAvailabilities.length - 1 &&
                                                ", "}
                                            </span>
                                          ))}
                                        </li>
                                      ) : null;
                                    })}
                                  </ul>
                                )}
                                <p>
                                  <span className="font-semibold">
                                    Assurance:
                                  </span>{" "}
                                  {volunteer.insurance_file_path ? (
                                    <a
                                      href={
                                        isProduction
                                          ? volunteer.insurance_file_path
                                          : `${API_BASE_URL}${volunteer.insurance_file_path}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline dark:text-blue-500 ml-2 flex items-center"
                                    >
                                      <FontAwesomeIcon
                                        icon={faFileDownload}
                                        className="mr-1"
                                      />
                                      Voir / Télécharger
                                    </a>
                                  ) : (
                                    <span className="ml-2 text-gray-500">
                                      Aucune assurance téléversée
                                    </span>
                                  )}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    <FontAwesomeIcon
                                      icon={faUser}
                                      className="mr-1"
                                    />
                                    Majeur(e):
                                  </span>{" "}
                                  {volunteer.is_adult === true
                                    ? "Oui"
                                    : volunteer.is_adult === false
                                    ? "Non"
                                    : "Non spécifié"}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    <FontAwesomeIcon
                                      icon={faListCheck}
                                      className="mr-1"
                                    />
                                    Engagements:
                                  </span>
                                  {volunteer.commitments ? (
                                    <ul className="list-disc pl-4">
                                      <li>
                                        Honorer les promenades:{" "}
                                        {volunteer.commitments.honorWalks
                                          ? "Oui"
                                          : "Non"}
                                      </li>
                                      <li>
                                        Tenir en laisse:{" "}
                                        {volunteer.commitments.keepLeash
                                          ? "Oui"
                                          : "Non"}
                                      </li>
                                      <li>
                                        Signaler les comportements:{" "}
                                        {volunteer.commitments.reportBehavior
                                          ? "Oui"
                                          : "Non"}
                                      </li>
                                    </ul>
                                  ) : (
                                    <span className="ml-2 text-gray-500">
                                      Aucun engagement spécifié
                                    </span>
                                  )}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reservations Section */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <FontAwesomeIcon
                  icon={faCalendarCheck}
                  className="mr-2 text-green-500"
                />
                Liste des Réservations
              </h2>
              <select
                value={reservationStatusFilter}
                onChange={(e) => setReservationStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les Statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">Accepté</option>
                <option value="rejected">Rejeté</option>
                <option value="completed">Complété</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Village
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Bénévole
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Chien
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Heure Début
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Heure Fin
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReservations.map((reservation) => {
                    const isCompleted = isReservationCompleted(reservation);
                    const effectiveStatus = isCompleted ? "completed" : reservation.status;

                    let statusColor = "";
                    let statusName = "";
                    let statusIcon = null;

                    switch (effectiveStatus) {
                      case "accepted":
                        statusColor = "bg-green-200 text-green-800";
                        statusIcon = <FontAwesomeIcon icon={faCheck} className="mr-1" />;
                        statusName = "Accepté";
                        break;
                      case "pending":
                        statusColor = "bg-yellow-200 text-yellow-800";
                        statusIcon = <FontAwesomeIcon icon={faClock} className="mr-1" />;
                        statusName = "En attente";
                        break;
                      case "rejected":
                      case "cancelled":
                        statusColor = "bg-red-200 text-red-800";
                        statusIcon = <FontAwesomeIcon icon={faBan} className="mr-1" />;
                        statusName = "Rejeté";
                        break;
                      case "completed":
                        statusColor = "bg-blue-200 text-blue-800";
                        statusIcon = <FontAwesomeIcon icon={faFlagCheckered} className="mr-1" />;
                        statusName = "Complété";
                        break;
                      default:
                        statusColor = "bg-gray-200 text-gray-800";
                        statusIcon = null;
                        statusName = effectiveStatus;
                    }

                    return (
                      <tr
                        key={reservation.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {reservation.client_village}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {reservation.volunteer_name}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {reservation.client_name}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {reservation.dog_name}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {moment(reservation.reservation_date).format(
                            "DD/MM/YYYY"
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {reservation.start_time}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {reservation.end_time}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                          >
                            {statusIcon}
                            {statusName}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Users Section */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="mr-2 text-yellow-500"
                />
                Liste des Utilisateurs
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Rechercher des utilisateurs..."
                  className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les Rôles</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                  <option value="volunteer">Bénévole</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Rôle
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Village
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {user.role}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {user.village}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Other Village Requests Section */}
        <section>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center mb-6">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="mr-2 text-primary-pink"
              />
              Demandes d’Autres Communes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Téléphone
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Commune Souhaitée
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {otherVillageRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {request.name}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {request.email}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {request.phone_number}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {request.desired_village}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {moment(request.request_date).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

AdminDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default AdminDashboard;