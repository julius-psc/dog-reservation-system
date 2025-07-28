import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faCheckCircle,
  faTimesCircle,
  faHome,
  faFileDownload,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

const VolunteersManager = ({ setAllUsers, fetchVolunteerDetails }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [expandedVolunteerId, setExpandedVolunteerId] = useState(null);
  const [volunteerFilter, setVolunteerFilter] = useState("");
  const [editingPersonalId, setEditingPersonalId] = useState(null);
  const [newPersonalId, setNewPersonalId] = useState("");
  const [volunteerDetails, setVolunteerDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [availabilityEditingId, setAvailabilityEditingId] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const isProduction = import.meta.env.MODE === "production";

  const daysOfWeekLabels = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  const fetchVolunteers = useCallback(async () => {
    setSearchLoading(true);
    try {
      const token = Cookies.get("token");
      // If there's a search filter, fetch all statuses; otherwise, fetch only pending
      const url = volunteerFilter.trim()
        ? `${API_BASE_URL}/admins/volunteers/minimal?search=${encodeURIComponent(
            volunteerFilter
          )}`
        : `${API_BASE_URL}/admins/volunteers/minimal?status=pending`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new Error("Échec de la récupération des bénévoles");
      const data = await response.json();
      setVolunteers(data);
    } catch (error) {
      toast.error(`Échec de la recherche: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [volunteerFilter, API_BASE_URL]);

  // Fetch pending volunteers on mount and debounce search
  useEffect(() => {
    fetchVolunteers(); // Fetch pending volunteers initially or on filter change
    const delayDebounceFn = setTimeout(() => {
      if (volunteerFilter.trim()) {
        fetchVolunteers(); // Fetch all volunteers matching search
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [volunteerFilter, fetchVolunteers]);

  const handleVolunteerRowClick = async (volunteerId) => {
    if (expandedVolunteerId === volunteerId) {
      setExpandedVolunteerId(null);
      return;
    }

    setExpandedVolunteerId(volunteerId);
    if (!volunteerDetails[volunteerId]) {
      setDetailsLoading(true);
      try {
        const details = await fetchVolunteerDetails(volunteerId);
        setVolunteerDetails((prev) => ({ ...prev, [volunteerId]: details }));
      } catch (error) {
        toast.error(`Échec du chargement des détails: ${error.message}`);
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const handleVolunteerStatusChange = async (volunteerId, newStatus) => {
    try {
      const token = Cookies.get("token");

      // Find the volunteer in the local state
      const volunteer = volunteers
        .filter(Boolean)
        .find((vol) => vol?.id === volunteerId);

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

      if (!response.ok)
        throw new Error("Échec de la mise à jour du statut du bénévole");

      const updatedVolunteer = await response.json();

      setVolunteers((prev) =>
        prev.map((vol) =>
          vol?.id === volunteerId ? updatedVolunteer.volunteer : vol
        )
      );
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id === volunteerId
            ? { ...user, volunteer_status: newStatus }
            : user
        )
      );
      setVolunteerDetails((prev) => ({
        ...prev,
        [volunteerId]: { ...prev[volunteerId], volunteer_status: newStatus },
      }));

      toast.success(`Statut du bénévole mis à jour à ${newStatus}`);

      if (newStatus === "approved" || newStatus === "rejected") {
        setVolunteers((prev) => prev.filter((vol) => vol?.id !== volunteerId));
        if (expandedVolunteerId === volunteerId) setExpandedVolunteerId(null);
      }

      if (newStatus === "approved") {
        // Use the username from the response or volunteer details as fallback
        const username =
          updatedVolunteer.volunteer?.username ||
          volunteer?.username ||
          volunteerDetails[volunteerId]?.username ||
          "Unknown";

        await fetch(`${API_BASE_URL}/send-approval-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: updatedVolunteer.volunteer.email,
            username: username,
          }),
        });
      }
    } catch (error) {
      toast.error(`Échec de la mise à jour du statut: ${error.message}`);
    }
  };

  const handleSetPersonalId = async (volunteerId) => {
    if (!newPersonalId.trim()) {
      toast.error("Le numéro promeneur ne peut pas être vide.");
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
        throw new Error(
          errorData.error || "Échec de la définition du numéro promeneur"
        );
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
      setVolunteerDetails((prev) => ({
        ...prev,
        [volunteerId]: { ...prev[volunteerId], personal_id: newPersonalId },
      }));
      toast.success("Numéro promeneur mis à jour avec succès");
      setEditingPersonalId(null);
      setNewPersonalId("");
    } catch (error) {
      toast.error(`Erreur du numéro promeneur: ${error.message}`);
    }
  };

  const saveAvailabilities = async (volunteerId, newAvailabilities) => {
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${API_BASE_URL}/admin/volunteers/${volunteerId}/availabilities`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newAvailabilities),
        }
      );

      if (!res.ok)
        throw new Error("Erreur lors de la mise à jour des disponibilités");

      toast.success("Disponibilités mises à jour");
      setShowAvailabilityForm(false);
      setAvailabilityEditingId(null);

      const freshDetails = await fetchVolunteerDetails(volunteerId);
      setVolunteerDetails((prev) => ({ ...prev, [volunteerId]: freshDetails }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <FontAwesomeIcon icon={faUsers} className="mr-2 text-blue-500" />
            Gestion des Bénévoles
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
          {searchLoading ? (
            <p className="text-gray-800 dark:text-gray-200">
              Recherche en cours...
            </p>
          ) : volunteers.length === 0 ? (
            <p className="text-gray-800 dark:text-gray-200">
              {volunteerFilter.trim()
                ? "Aucun bénévole trouvé."
                : "Aucun bénévole en attente. Recherchez pour voir tous les bénévoles."}
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  {["Nom", "Statut", "Numéro Promeneur", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {volunteers.map((volunteer) => {
                  // Add safety check for volunteer
                  if (!volunteer) return null;

                  const details = volunteerDetails[volunteer.id] || {};
                  const groupedAvailabilities = (
                    details.availabilities || []
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
                        className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          expandedVolunteerId &&
                          expandedVolunteerId !== volunteer.id
                            ? "opacity-50"
                            : ""
                        }`}
                        onClick={() => handleVolunteerRowClick(volunteer.id)}
                      >
                        <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                          {volunteer.username}
                        </td>
                        <td className="px-4 py-4">
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
                        <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
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
                                  if (value.length <= 5)
                                    setNewPersonalId(value);
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
                        <td className="px-4 py-4">
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
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <td
                            colSpan="4"
                            className="px-4 py-4 bg-gray-50 dark:bg-gray-700"
                          >
                            {detailsLoading ? (
                              <p className="text-gray-800 dark:text-gray-200">
                                Chargement des détails...
                              </p>
                            ) : !volunteerDetails[volunteer.id] ? (
                              <p className="text-gray-800 dark:text-gray-200">
                                Échec du chargement des détails.
                              </p>
                            ) : (
                              <div className="text-gray-800 dark:text-gray-200 space-y-2">
                                <p>
                                  <span className="font-semibold">Email:</span>{" "}
                                  {details.email}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Abonnement:
                                  </span>{" "}
                                  <FontAwesomeIcon
                                    icon={
                                      details.subscription_paid
                                        ? faCheckCircle
                                        : faTimesCircle
                                    }
                                    className={
                                      details.subscription_paid
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }
                                  />
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Téléphone:
                                  </span>{" "}
                                  {details.phone_number || "Non spécifié"}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Commune:
                                  </span>{" "}
                                  {details.village}
                                </p>
                                <p>
                                  <FontAwesomeIcon
                                    icon={faHome}
                                    className="mr-1"
                                  />{" "}
                                  <span className="font-semibold">
                                    Adresse:
                                  </span>{" "}
                                  {details.address || "Non spécifiée"}
                                </p>
                                <div>
                                  <span className="font-semibold">
                                    Communes de promenade:
                                  </span>
                                  <ul className="list-disc pl-4">
                                    {details.villages_covered?.map(
                                      (village, idx) => (
                                        <li key={idx}>{village}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                                <div>
                                  {showAvailabilityForm &&
                                  availabilityEditingId === volunteer.id ? (
                                    <AvailabilityEditor
                                      initialAvailabilities={
                                        groupedAvailabilities
                                      }
                                      onSave={(data) =>
                                        saveAvailabilities(volunteer.id, data)
                                      }
                                      onCancel={() => {
                                        setShowAvailabilityForm(false);
                                        setAvailabilityEditingId(null);
                                      }}
                                      daysOfWeekLabels={daysOfWeekLabels}
                                    />
                                  ) : (
                                    <>
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold">
                                          Disponibilités:
                                        </span>
                                        <button
                                          onClick={() => {
                                            setShowAvailabilityForm(true);
                                            setAvailabilityEditingId(
                                              volunteer.id
                                            );
                                          }}
                                          className="ml-4 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                                        >
                                          Modifier
                                        </button>
                                      </div>
                                      {(details.availabilities || []).length ===
                                      0 ? (
                                        <p className="mt-2 text-gray-500">
                                          Aucune disponibilité définie
                                        </p>
                                      ) : (
                                        <ul className="list-disc pl-4 mt-2">
                                          {daysOfWeekLabels.map(
                                            (dayLabel, index) => {
                                              const dayOfWeek = index + 1;
                                              const slots =
                                                groupedAvailabilities[
                                                  dayOfWeek
                                                ] || [];
                                              return slots.length > 0 ? (
                                                <li key={dayOfWeek}>
                                                  {dayLabel}:{" "}
                                                  {slots.map((slot, idx) => (
                                                    <span key={idx}>
                                                      {slot.startTime} -{" "}
                                                      {slot.endTime}
                                                      {idx < slots.length - 1 &&
                                                        ", "}
                                                    </span>
                                                  ))}
                                                </li>
                                              ) : null;
                                            }
                                          )}
                                        </ul>
                                      )}
                                    </>
                                  )}
                                </div>

                                <p>
                                  <span className="font-semibold">
                                    Responsabilité Civile:
                                  </span>{" "}
                                  {details.insurance_file_path ? (
                                    <a
                                      href={
                                        isProduction
                                          ? details.insurance_file_path
                                          : `${API_BASE_URL}${details.insurance_file_path}`
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
                                  <FontAwesomeIcon
                                    icon={faListCheck}
                                    className="mr-1"
                                  />
                                  <span className="font-semibold">
                                    Majeur(e):
                                  </span>{" "}
                                  {details.is_adult === true
                                    ? "Oui"
                                    : details.is_adult === false
                                    ? "Non"
                                    : "Non spécifié"}
                                </p>
                                <div>
                                  <FontAwesomeIcon
                                    icon={faListCheck}
                                    className="mr-1"
                                  />
                                  <span className="font-semibold">
                                    Engagements:
                                  </span>
                                  {details.commitments ? (
                                    <ul className="list-disc pl-4">
                                      <li>
                                        Honorer les promenades:{" "}
                                        {details.commitments.honorWalks
                                          ? "Oui"
                                          : "Non"}
                                      </li>
                                      <li>
                                        Tenir en laisse:{" "}
                                        {details.commitments.keepLeash
                                          ? "Oui"
                                          : "Non"}
                                      </li>
                                      <li>
                                        Signaler les comportements:{" "}
                                        {details.commitments.reportBehavior
                                          ? "Oui"
                                          : "Non"}
                                      </li>
                                    </ul>
                                  ) : (
                                    <span className="ml-2 text-gray-500">
                                      Aucun engagement spécifié
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

VolunteersManager.propTypes = {
  setAllUsers: PropTypes.func.isRequired,
  fetchVolunteerDetails: PropTypes.func.isRequired,
};

const AvailabilityEditor = ({
  initialAvailabilities,
  onSave,
  onCancel,
  daysOfWeekLabels,
}) => {
  const [entries, setEntries] = useState(() => {
    const flat = [];
    for (const [day, slots] of Object.entries(initialAvailabilities || {})) {
      for (const slot of slots) {
        flat.push({
          dayOfWeek: parseInt(day),
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    }
    return flat.length
      ? flat
      : [{ dayOfWeek: 1, startTime: "08:00", endTime: "10:00" }];
  });

  const updateEntry = (index, key, value) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [key]: value } : e))
    );
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: "08:00", endTime: "10:00" },
    ]);
  };

  const removeEntry = (index) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(entries);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4"
    >
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Modifier les disponibilités
      </h4>
      {entries.map((entry, idx) => (
        <div key={idx} className="flex flex-wrap items-center gap-3">
          <select
            value={entry.dayOfWeek}
            onChange={(e) =>
              updateEntry(idx, "dayOfWeek", parseInt(e.target.value))
            }
            className="rounded-md p-2 border dark:bg-gray-700 dark:text-white"
          >
            {daysOfWeekLabels.map((label, i) => (
              <option key={i + 1} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={entry.startTime}
            onChange={(e) => updateEntry(idx, "startTime", e.target.value)}
            className="rounded-md p-2 border dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-600 dark:text-gray-300">à</span>
          <input
            type="time"
            value={entry.endTime}
            onChange={(e) => updateEntry(idx, "endTime", e.target.value)}
            className="rounded-md p-2 border dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={() => removeEntry(idx)}
            className="text-red-500 hover:text-red-700"
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={addEntry}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Ajouter un créneau
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Sauvegarder
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

AvailabilityEditor.propTypes = {
  initialAvailabilities: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  daysOfWeekLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default VolunteersManager;