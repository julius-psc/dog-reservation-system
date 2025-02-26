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
  faExclamationTriangle,
  faUsers,
  faCalendarCheck,
  faUserShield,
  faClock,
  faCheck,
  faBan,
  faMapMarkerAlt,
  faFlagCheckered,
} from "@fortawesome/free-solid-svg-icons";

import LogoutButton from "./recycled/LogoutButton";

const AdminDashboard = ({ handleLogout }) => {
  const [volunteers, setVolunteers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allReservations, setAllReservations] = useState(null);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  const [allUsers, setAllUsers] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [otherVillageRequests, setOtherVillageRequests] = useState(null);
  const [otherVillageLoading, setOtherVillageLoading] = useState(true);
  const [otherVillageError, setOtherVillageError] = useState(null);

  const [expandedVolunteerId, setExpandedVolunteerId] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null); // New state for expanding user rows
  const [volunteerFilter, setVolunteerFilter] = useState("");
  const [volunteerVillageFilter, setVolunteerVillageFilter] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");
  const [userVillageFilter, setUserVillageFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // New state for role filter

  const isProduction = import.meta.env.MODE === "production";
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchVolunteers = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setError("Aucun token trouvé. Veuillez vous connecter.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/admins/volunteers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 403) {
            Cookies.remove("token");
            Cookies.remove("userId");
            setError("Session expirée. Veuillez vous reconnecter.");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Échec de la récupération des bénévoles");
        }
        const data = await response.json();
        setVolunteers(data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des bénévoles:", err);
        setError(err.message || "Une erreur inattendue s'est produite.");
      } finally {
        setLoading(false);
      }
    };

    const fetchAllReservations = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setReservationsError("Aucun token trouvé. Veuillez vous connecter.");
        setReservationsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Échec de la récupération des réservations");
        }
        const data = await response.json();
        setAllReservations(data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des réservations:", err);
        setReservationsError(err.message || "Une erreur inattendue s'est produite.");
      } finally {
        setReservationsLoading(false);
      }
    };

    const fetchAllUsers = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setUsersError("Aucun token trouvé. Veuillez vous connecter.");
        setUsersLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/all-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Échec de la récupération des utilisateurs");
        }
        const data = await response.json();
        setAllUsers(data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des utilisateurs:", err);
        setUsersError(err.message || "Une erreur inattendue s'est produite.");
      } finally {
        setUsersLoading(false);
      }
    };

    const fetchOtherVillageRequests = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setOtherVillageError("Aucun token trouvé. Veuillez vous connecter.");
        setOtherVillageLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/other-village-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Échec de la récupération des demandes d'autres communes");
        }
        const data = await response.json();
        setOtherVillageRequests(data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des demandes d'autres communes:", err);
        setOtherVillageError(err.message || "Une erreur inattendue s'est produite.");
      } finally {
        setOtherVillageLoading(false);
      }
    };

    fetchVolunteers();
    fetchAllReservations();
    fetchAllUsers();
    fetchOtherVillageRequests();
  }, [API_BASE_URL]);

  if (loading || usersLoading || reservationsLoading || otherVillageLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <ClipLoader color={"#3b82f6"} loading={true} size={50} />
      </div>
    );
  }

  if (error || usersError || reservationsError || otherVillageError) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center dark:bg-gray-800">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
          {error && <p className="text-red-600 dark:text-red-400 mb-2">Erreur: {error}</p>}
          {usersError && <p className="text-red-600 dark:text-red-400 mb-2">Erreur utilisateurs: {usersError}</p>}
          {reservationsError && <p className="text-red-600 dark:text-red-400 mb-2">Erreur réservations: {reservationsError}</p>}
          {otherVillageError && <p className="text-red-600 dark:text-red-400">Erreur demandes d&#39;autres communes: {otherVillageError}</p>}
        </div>
      </div>
    );
  }

  const handleVolunteerRowClick = (volunteerId) => {
    setExpandedVolunteerId(expandedVolunteerId === volunteerId ? null : volunteerId);
  };

  const handleUserRowClick = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec du changement de statut du bénévole");
      }

      const updatedVolunteer = await response.json();
      setVolunteers((prevVolunteers) =>
        prevVolunteers.map((vol) =>
          vol.id === volunteerId ? updatedVolunteer.volunteer : vol
        )
      );
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === volunteerId ? { ...user, volunteer_status: newStatus } : user
        )
      );
      toast.success(`Statut du bénévole mis à jour en ${newStatus}.`);

      if (newStatus === "approved") {
        const volunteer = volunteers.find((vol) => vol.id === volunteerId);
        if (volunteer) {
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
      }
    } catch (error) {
      console.error("Erreur lors du changement de statut du bénévole:", error);
      toast.error(`Échec du changement de statut du bénévole: ${error.message}`);
    }
  };

  const filteredVolunteers = volunteers
    ? volunteers.filter((volunteer) => {
        const usernameMatch = volunteer.username
          ? volunteer.username.toLowerCase().includes(volunteerFilter.toLowerCase())
          : false;
        const villageMatch = volunteer.village
          ? volunteer.village.toLowerCase().includes(volunteerVillageFilter.toLowerCase())
          : false;
        return usernameMatch && villageMatch;
      })
    : [];

  const filteredReservations = allReservations
    ? allReservations.filter((reservation) => {
        if (reservationStatusFilter === "all") return true;
        return reservation.status
          ? reservation.status.toLowerCase() === reservationStatusFilter.toLowerCase()
          : false;
      })
    : [];

  const filteredUsers = allUsers
    ? allUsers.filter((user) => {
        const usernameMatch = user.username
          ? user.username.toLowerCase().includes(userFilter.toLowerCase())
          : false;
        const villageMatch = user.village
          ? user.village.toLowerCase().includes(userVillageFilter.toLowerCase())
          : false;
        const roleMatch = userRoleFilter === "all" || user.role === userRoleFilter;
        return usernameMatch && villageMatch && roleMatch;
      })
    : [];

  const daysOfWeekLabels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              <FontAwesomeIcon icon={faUserShield} className="mr-2" />
              Tableau de Bord Administrateur
            </h1>
          </div>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="text-gray-700 dark:text-gray-300 font-semibold">Total Bénévoles</h3>
              <p className="text-3xl text-gray-900 dark:text-white font-bold mt-2">{volunteers?.length}</p>
            </div>
            <div className="text-blue-500">
              <FontAwesomeIcon icon={faUsers} size="2x" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="text-gray-700 dark:text-gray-300 font-semibold">Réservations Totales</h3>
              <p className="text-3xl text-gray-900 dark:text-white font-bold mt-2">{allReservations?.length}</p>
            </div>
            <div className="text-green-500">
              <FontAwesomeIcon icon={faCalendarCheck} size="2x" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="text-gray-700 dark:text-gray-300 font-semibold">Total Utilisateurs</h3>
              <p className="text-3xl text-gray-900 dark:text-white font-bold mt-2">{allUsers?.length}</p>
            </div>
            <div className="text-yellow-500">
              <FontAwesomeIcon icon={faUsers} size="2x" />
            </div>
          </div>
        </div>

        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faUsers} className="mr-2" /> Liste des Bénévoles
            </h2>
            <div className="mb-4 flex space-x-2">
              <input
                type="text"
                placeholder="Filtrer par nom d'utilisateur"
                className="w-full md:w-1/2 px-4 py-2 rounded-md border dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-300"
                value={volunteerFilter}
                onChange={(e) => setVolunteerFilter(e.target.value)}
              />
              <input
                type="text"
                placeholder="Filtrer par commune de résidence"
                className="w-full md:w-1/2 px-4 py-2 rounded-md border dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-300"
                value={volunteerVillageFilter}
                onChange={(e) => setVolunteerVillageFilter(e.target.value)}
              />
            </div>

            {filteredVolunteers.length === 0 && volunteers?.length > 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucun bénévole ne correspond au filtre.
              </p>
            ) : volunteers?.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Aucun bénévole trouvé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse w-full">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Village</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Disponibilités</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredVolunteers.map((volunteer) => {
                      const groupedAvailabilities = (volunteer.availabilities || []).reduce(
                        (acc, availability) => {
                          const dayOfWeek = availability.day_of_week;
                          if (!acc[dayOfWeek]) {
                            acc[dayOfWeek] = [];
                          }
                          acc[dayOfWeek].push({
                            startTime: availability.start_time,
                            endTime: availability.end_time,
                          });
                          return acc;
                        },
                        {}
                      );

                      return (
                        <React.Fragment key={volunteer.id}>
                          <tr
                            className="hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                            onClick={() => handleVolunteerRowClick(volunteer.id)}
                          >
                            <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{volunteer.username}</td>
                            <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{volunteer.email}</td>
                            <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{volunteer.village}</td>
                            <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 font-semibold">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                                  volunteer.volunteer_status === "approved"
                                    ? "bg-green-200 text-green-800"
                                    : volunteer.volunteer_status === "rejected"
                                    ? "bg-red-200 text-red-800"
                                    : "bg-yellow-200 text-yellow-800"
                                }`}
                              >
                                {volunteer.volunteer_status === "pending" && (
                                  <FontAwesomeIcon icon={faClock} className="mr-1" />
                                )}
                                {volunteer.volunteer_status === "approved" && (
                                  <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                )}
                                {volunteer.volunteer_status === "rejected" && (
                                  <FontAwesomeIcon icon={faBan} className="mr-1" />
                                )}
                                {volunteer.volunteer_status}
                              </span>
                            </td>
                            <td className="border px-4 py-2 text-center dark:border-gray-700 dark:text-gray-300">
                              {(volunteer.availabilities || []).length > 0 ? (
                                <span className="text-green-500">
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                </span>
                              ) : (
                                <span className="text-red-500">
                                  <FontAwesomeIcon icon={faTimesCircle} />
                                </span>
                              )}
                            </td>
                            <td className="border px-4 py-2 text-center dark:border-gray-700 dark:text-gray-300">
                              {volunteer.volunteer_status === "pending" && (
                                <>
                                  <button
                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2 focus:outline-none focus:shadow-outline text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVolunteerStatusChange(volunteer.id, "approved");
                                    }}
                                  >
                                    Approuver
                                  </button>
                                  <button
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVolunteerStatusChange(volunteer.id, "rejected");
                                    }}
                                  >
                                    Rejeter
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                          {expandedVolunteerId === volunteer.id && (
                            <tr>
                              <td colSpan="6" className="p-4 bg-gray-50 dark:bg-gray-700">
                                <p className="dark:text-gray-300">
                                  <span className="font-semibold dark:text-gray-100">Email:</span>
                                  {volunteer.email}
                                </p>
                                <p className="dark:text-gray-300">
                                  <span className="font-semibold dark:text-gray-100">Village:</span>
                                  {volunteer.village}
                                </p>
                                <p className="dark:text-gray-300">
                                  <span className="font-semibold dark:text-gray-100">Statut:</span>
                                  <select
                                    value={volunteer.volunteer_status}
                                    onChange={(e) =>
                                      handleVolunteerStatusChange(volunteer.id, e.target.value)
                                    }
                                    className="mt-1 px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 block text-xs"
                                  >
                                    <option value="pending">En attente</option>
                                    <option value="approved">Approuvé</option>
                                    <option value="rejected">Rejeté</option>
                                  </select>
                                </p>
                                <div className="dark:text-gray-300">
                                  <span className="font-semibold dark:text-gray-100">
                                    Disponibilités:
                                  </span>
                                  {(volunteer.availabilities || []).length === 0 ? (
                                    " Aucune disponibilité définie"
                                  ) : (
                                    <ul>
                                      {daysOfWeekLabels.map((dayLabel, index) => {
                                        const dayOfWeek = index + 1;
                                        const dayAvailabilities = groupedAvailabilities[dayOfWeek] || [];
                                        if (dayAvailabilities.length > 0) {
                                          return (
                                            <li key={dayOfWeek} className="dark:text-gray-300">
                                              {dayLabel}:{" "}
                                              {dayAvailabilities.map((av, index, array) => (
                                                <span key={index}>
                                                  {av.startTime} - {av.endTime}
                                                  {index < array.length - 1 && (
                                                    <span className="mx-1">/</span>
                                                  )}
                                                </span>
                                              ))}
                                            </li>
                                          );
                                        } else {
                                          return null;
                                        }
                                      })}
                                    </ul>
                                  )}
                                </div>
                                <p className="dark:text-gray-300">
                                  <span className="font-semibold dark:text-gray-100">
                                    Charte bénévole:
                                  </span>
                                  {volunteer.charter_file_path ? (
                                    <a
                                      href={
                                        isProduction
                                          ? volunteer.charter_file_path
                                          : `${API_BASE_URL}${volunteer.charter_file_path}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline dark:text-blue-500"
                                    >
                                      Voir / Télécharger
                                    </a>
                                  ) : (
                                    "Aucune charte bénévole téléversée"
                                  )}
                                </p>
                                <p className="dark:text-gray-300">
                                  <span className="font-semibold dark:text-gray-100">
                                    Responsabilité civile:
                                  </span>
                                  {volunteer.insurance_file_path ? (
                                    <a
                                      href={
                                        isProduction
                                          ? volunteer.insurance_file_path
                                          : `${API_BASE_URL}${volunteer.insurance_file_path}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline dark:text-blue-500"
                                    >
                                      Voir / Télécharger
                                    </a>
                                  ) : (
                                    "Aucun fichier de responsabilité civile téléversé"
                                  )}
                                </p>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" /> Liste des Réservations
            </h2>
            <div className="mb-4">
              <select
                value={reservationStatusFilter}
                onChange={(e) => setReservationStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-md border dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-300"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">Accepté</option>
                <option value="rejected">Rejeté</option>
                <option value="completed">Terminé</option>
              </select>
            </div>

            {reservationsLoading ? (
              <div className="dark:text-gray-300">Chargement des réservations...</div>
            ) : reservationsError ? (
              <div className="text-red-500 dark:text-red-400">Erreur: {reservationsError}</div>
            ) : filteredReservations.length === 0 && allReservations?.length > 0 ? (
              <p className="text-gray-500 text-center dark:text-gray-400">
                Aucune réservation ne correspond au filtre.
              </p>
            ) : allReservations && allReservations.length === 0 ? (
              <p className="text-gray-500 text-center dark:text-gray-400">Aucune réservation trouvée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Village</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bénévole</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Chien</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Heure de Début</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Heure de Fin</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredReservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-100 dark:hover:bg-gray-900">
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{reservation.client_village}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{reservation.volunteer_name}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{reservation.client_name}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{reservation.dog_name}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">
                          {moment(reservation.reservation_date).format("DD/MM/YYYY")}
                        </td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{reservation.start_time}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{reservation.end_time}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 font-semibold">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                              reservation.status === "accepted"
                                ? "bg-green-200 text-green-800"
                                : reservation.status === "rejected"
                                ? "bg-red-200 text-red-800"
                                : reservation.status === "completed"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {reservation.status === "pending" && (
                              <FontAwesomeIcon icon={faClock} className="mr-1" />
                            )}
                            {reservation.status === "accepted" && (
                              <FontAwesomeIcon icon={faCheck} className="mr-1" />
                            )}
                            {reservation.status === "rejected" && (
                              <FontAwesomeIcon icon={faBan} className="mr-1" />
                            )}
                            {reservation.status === "completed" && (
                              <FontAwesomeIcon icon={faFlagCheckered} className="mr-1" />
                            )}
                            {reservation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faUsers} className="mr-2" /> Liste des Utilisateurs
            </h2>
            <div className="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                placeholder="Filtrer par nom d'utilisateur"
                className="w-full sm:w-1/3 px-4 py-2 rounded-md border dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-300"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
              <input
                type="text"
                placeholder="Filtrer par commune de résidence"
                className="w-full sm:w-1/3 px-4 py-2 rounded-md border dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-300"
                value={userVillageFilter}
                onChange={(e) => setUserVillageFilter(e.target.value)}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full sm:w-1/3 px-4 py-2 rounded-md border dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-300"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="volunteer">Bénévole</option>
              </select>
            </div>

            {usersLoading ? (
              <div className="dark:text-gray-300">Chargement des utilisateurs...</div>
            ) : usersError ? (
              <div className="text-red-500 dark:text-red-400">Erreur: {usersError}</div>
            ) : filteredUsers.length === 0 && allUsers?.length > 0 ? (
              <p className="text-gray-500 text-center dark:text-gray-400">
                Aucun utilisateur ne correspond au filtre.
              </p>
            ) : allUsers && allUsers.length === 0 ? (
              <p className="text-gray-500 text-center dark:text-gray-400">Aucun utilisateur trouvé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Rôle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Village</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <React.Fragment key={user.id}>
                        <tr
                          className="hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                          onClick={() => handleUserRowClick(user.id)}
                        >
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{user.username}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{user.email}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{user.role}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{user.village}</td>
                        </tr>
                        {expandedUserId === user.id && (
                          <tr>
                            <td colSpan="4" className="p-4 bg-gray-50 dark:bg-gray-700">
                              <p className="dark:text-gray-300">
                                <span className="font-semibold dark:text-gray-100">Email:</span> {user.email}
                              </p>
                              <p className="dark:text-gray-300">
                                <span className="font-semibold dark:text-gray-100">Rôle:</span> {user.role}
                              </p>
                              <p className="dark:text-gray-300">
                                <span className="font-semibold dark:text-gray-100">Village:</span> {user.village}
                              </p>
                              {user.role === "client" && (
                                <p className="dark:text-gray-300">
                                  <span className="font-semibold dark:text-gray-100">Charte du propriétaire:</span>{" "}
                                  {user.client_charter_file_path ? (
                                    <a
                                      href={
                                        isProduction
                                          ? user.client_charter_file_path
                                          : `${API_BASE_URL}${user.client_charter_file_path}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline dark:text-blue-500"
                                    >
                                      Voir / Télécharger
                                    </a>
                                  ) : (
                                    "Aucune charte téléversée"
                                  )}
                                </p>
                              )}
                              {user.role === "volunteer" && (
                                <>
                                  <p className="dark:text-gray-300">
                                    <span className="font-semibold dark:text-gray-100">Statut:</span>{" "}
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                                        user.volunteer_status === "approved"
                                          ? "bg-green-200 text-green-800"
                                          : user.volunteer_status === "rejected"
                                          ? "bg-red-200 text-red-800"
                                          : "bg-yellow-200 text-yellow-800"
                                      }`}
                                    >
                                      {user.volunteer_status === "pending" && (
                                        <FontAwesomeIcon icon={faClock} className="mr-1" />
                                      )}
                                      {user.volunteer_status === "approved" && (
                                        <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                      )}
                                      {user.volunteer_status === "rejected" && (
                                        <FontAwesomeIcon icon={faBan} className="mr-1" />
                                      )}
                                      {user.volunteer_status}
                                    </span>
                                  </p>
                                  <p className="dark:text-gray-300">
                                    <span className="font-semibold dark:text-gray-100">Charte bénévole:</span>{" "}
                                    {user.charter_file_path ? (
                                      <a
                                        href={
                                          isProduction
                                            ? user.charter_file_path
                                            : `${API_BASE_URL}${user.charter_file_path}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline dark:text-blue-500"
                                      >
                                        Voir / Télécharger
                                      </a>
                                    ) : (
                                      "Aucune charte téléversée"
                                    )}
                                  </p>
                                  <p className="dark:text-gray-300">
                                    <span className="font-semibold dark:text-gray-100">Responsabilité civile:</span>{" "}
                                    {user.insurance_file_path ? (
                                      <a
                                        href={
                                          isProduction
                                            ? user.insurance_file_path
                                            : `${API_BASE_URL}${user.insurance_file_path}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline dark:text-blue-500"
                                      >
                                        Voir / Télécharger
                                      </a>
                                    ) : (
                                      "Aucun fichier téléversé"
                                    )}
                                  </p>
                                </>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" /> Demandes d’Autres Communes
            </h2>

            {otherVillageLoading ? (
              <div className="dark:text-gray-300">Chargement des demandes...</div>
            ) : otherVillageError ? (
              <div className="text-red-500 dark:text-red-400">Erreur: {otherVillageError}</div>
            ) : otherVillageRequests && otherVillageRequests.length === 0 ? (
              <p className="text-gray-500 text-center dark:text-gray-400">Aucune demande trouvée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Commune Souhaitée</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date de Demande</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {otherVillageRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-100 dark:hover:bg-gray-900">
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{request.name}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{request.email}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{request.phone_number}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">{request.desired_village}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300">
                          {moment(request.request_date).format("DD/MM/YYYY HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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