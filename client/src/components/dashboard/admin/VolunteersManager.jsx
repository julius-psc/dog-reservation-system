import React, { useState } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faCheckCircle,
  faTimesCircle,
  faUser,
  faHome,
  faFileDownload,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

const VolunteersManager = ({ volunteers, setVolunteers, setAllUsers }) => {
  const [expandedVolunteerId, setExpandedVolunteerId] = useState(null);
  const [volunteerFilter, setVolunteerFilter] = useState("");
  const [editingPersonalId, setEditingPersonalId] = useState(null);
  const [newPersonalId, setNewPersonalId] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
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

  const handleVolunteerRowClick = (volunteerId) => {
    setExpandedVolunteerId(expandedVolunteerId === volunteerId ? null : volunteerId);
  };

  const handleVolunteerStatusChange = async (volunteerId, newStatus) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${API_BASE_URL}/admin/volunteers/${volunteerId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Échec de la mise à jour du statut du bénévole");
      const updatedVolunteer = await response.json();
      setVolunteers((prev) =>
        prev.map((vol) => (vol.id === volunteerId ? updatedVolunteer.volunteer : vol))
      );
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id === volunteerId ? { ...user, volunteer_status: newStatus } : user
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
      toast.error("Le numéro promeneur ne peut pas être vide.");
      return;
    }
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${API_BASE_URL}/admin/volunteers/${volunteerId}/personal-id`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ personal_id: newPersonalId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la définition du numéro promeneur");
      }
      const updatedVolunteer = await response.json();
      setVolunteers((prev) =>
        prev.map((vol) => (vol.id === volunteerId ? updatedVolunteer.volunteer : vol))
      );
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id === volunteerId ? { ...user, personal_id: newPersonalId } : user
        )
      );
      toast.success("Numéro promeneur mis à jour avec succès");
      setEditingPersonalId(null);
      setNewPersonalId("");
    } catch (error) {
      toast.error(`Erreur du numéro promeneur: ${error.message}`);
    }
  };

  const filteredVolunteers = volunteers.filter((v) =>
    v.username.toLowerCase().includes(volunteerFilter.toLowerCase())
  );

  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <FontAwesomeIcon icon={faUsers} className="mr-2 text-blue-500" />
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
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr className="border-b border-gray-200 dark:border-gray-600">
                {["Photo", "Nom", "Email", "Abonnement", "Statut", "Numéro Promeneur", "Actions"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.map((volunteer) => {
                const groupedAvailabilities = (volunteer.availabilities || []).reduce((acc, availability) => {
                  const dayOfWeek = availability.day_of_week;
                  if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
                  acc[dayOfWeek].push({ startTime: availability.start_time, endTime: availability.end_time });
                  return acc;
                }, {});

                return (
                  <React.Fragment key={volunteer.id}>
                    <tr
                      className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                        expandedVolunteerId && expandedVolunteerId !== volunteer.id ? "opacity-50" : ""
                      }`}
                      onClick={() => handleVolunteerRowClick(volunteer.id)}
                    >
                      <td className="px-4 py-4">
                        {volunteer.profilePictureData ? (
                          <img
                            src={volunteer.profilePictureData}
                            alt={`${volunteer.username}'s profile`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{volunteer.username}</td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{volunteer.email}</td>
                      <td className="px-4 py-4">
                        <FontAwesomeIcon
                          icon={volunteer.subscription_paid ? faCheckCircle : faTimesCircle}
                          className={volunteer.subscription_paid ? "text-green-500" : "text-red-500"}
                        />
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
                                const value = e.target.value.replace(/\D/g, "");
                                if (value.length <= 5) setNewPersonalId(value);
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
                                handleVolunteerStatusChange(volunteer.id, "approved");
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Approuver
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVolunteerStatusChange(volunteer.id, "rejected");
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
                        <td colSpan="7" className="px-4 py-4 bg-gray-50 dark:bg-gray-700">
                          <div className="text-gray-800 dark:text-gray-200 space-y-2">
                            <div className="flex items-center">
                              {volunteer.profilePictureData ? (
                                <img
                                  src={volunteer.profilePictureData}
                                  alt={`${volunteer.username}'s profile`}
                                  className="w-16 h-16 rounded-full object-cover mr-4"
                                />
                              ) : (
                                <FontAwesomeIcon icon={faUser} className="w-16 h-16 text-gray-400 dark:text-gray-500 mr-4" />
                              )}
                              <div>
                                <p><span className="font-semibold">Email:</span> {volunteer.email}</p>
                                <p><span className="font-semibold">Téléphone:</span> {volunteer.phone_number || "Non spécifié"}</p> {/* Add phone_number here */}
                                <p><span className="font-semibold">Commune:</span> {volunteer.village}</p>
                              </div>
                            </div>
                            <p><span className="font-semibold">Statut:</span> {volunteer.volunteer_status}</p>
                            <p><span className="font-semibold">Numéro promeneur:</span> {volunteer.personal_id || "Non défini"}</p>
                            <p><FontAwesomeIcon icon={faHome} className="mr-1" /> <span className="font-semibold">Adresse:</span> {volunteer.address || "Non spécifiée"}</p>
                            <div>
                              <span className="font-semibold">Communes de promenade:</span>
                              <ul className="list-disc pl-4">
                                {volunteer.villages_covered?.map((village, idx) => (
                                  <li key={idx}>{village}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-semibold">Disponibilités:</span>
                              {(volunteer.availabilities || []).length === 0 ? (
                                <p>Aucune disponibilité définie</p>
                              ) : (
                                <ul className="list-disc pl-4">
                                  {daysOfWeekLabels.map((dayLabel, index) => {
                                    const dayOfWeek = index + 1;
                                    const dayAvailabilities = groupedAvailabilities[dayOfWeek] || [];
                                    return dayAvailabilities.length > 0 ? (
                                      <li key={dayOfWeek}>
                                        {dayLabel}:{" "}
                                        {dayAvailabilities.map((av, idx) => (
                                          <span key={idx}>
                                            {av.startTime} - {av.endTime}
                                            {idx < dayAvailabilities.length - 1 && ", "}
                                          </span>
                                        ))}
                                      </li>
                                    ) : null;
                                  })}
                                </ul>
                              )}
                            </div>
                            <p>
                              <span className="font-semibold">Responsabilité Civile:</span>{" "}
                              {volunteer.insurance_file_path ? (
                                <a
                                  href={isProduction ? volunteer.insurance_file_path : `${API_BASE_URL}${volunteer.insurance_file_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline dark:text-blue-500 ml-2 flex items-center"
                                >
                                  <FontAwesomeIcon icon={faFileDownload} className="mr-1" />
                                  Voir / Télécharger
                                </a>
                              ) : (
                                <span className="ml-2 text-gray-500">Aucune assurance téléversée</span>
                              )}
                            </p>
                            <p>
                              <FontAwesomeIcon icon={faUser} className="mr-1" />
                              <span className="font-semibold">Majeur(e):</span>{" "}
                              {volunteer.is_adult === true ? "Oui" : volunteer.is_adult === false ? "Non" : "Non spécifié"}
                            </p>
                            <div>
                              <FontAwesomeIcon icon={faListCheck} className="mr-1" />
                              <span className="font-semibold">Engagements:</span>
                              {volunteer.commitments ? (
                                <ul className="list-disc pl-4">
                                  <li>Honorer les promenades: {volunteer.commitments.honorWalks ? "Oui" : "Non"}</li>
                                  <li>Tenir en laisse: {volunteer.commitments.keepLeash ? "Oui" : "Non"}</li>
                                  <li>Signaler les comportements: {volunteer.commitments.reportBehavior ? "Oui" : "Non"}</li>
                                </ul>
                              ) : (
                                <span className="ml-2 text-gray-500">Aucun engagement spécifié</span>
                              )}
                            </div>
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
  );
};

VolunteersManager.propTypes = {
  volunteers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone_number: PropTypes.string, // Add phone_number to PropTypes
      subscription_paid: PropTypes.bool.isRequired,
      volunteer_status: PropTypes.string.isRequired,
      personal_id: PropTypes.string,
      profilePictureData: PropTypes.string,
      village: PropTypes.string,
      address: PropTypes.string,
      villages_covered: PropTypes.arrayOf(PropTypes.string),
      availabilities: PropTypes.arrayOf(
        PropTypes.shape({
          day_of_week: PropTypes.number.isRequired,
          start_time: PropTypes.string.isRequired,
          end_time: PropTypes.string.isRequired,
        })
      ),
      insurance_file_path: PropTypes.string,
      is_adult: PropTypes.bool,
      commitments: PropTypes.shape({
        honorWalks: PropTypes.bool,
        keepLeash: PropTypes.bool,
        reportBehavior: PropTypes.bool,
      }),
    })
  ).isRequired,
  setVolunteers: PropTypes.func.isRequired,
  setAllUsers: PropTypes.func.isRequired,
};

export default VolunteersManager;