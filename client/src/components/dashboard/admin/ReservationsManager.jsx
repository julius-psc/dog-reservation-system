import { useState } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCheck,
  faClock,
  faBan,
  faFlagCheckered,
} from "@fortawesome/free-solid-svg-icons";

moment.locale("fr");

const ReservationsManager = ({ allReservations }) => {
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");

  const getStatusDetails = (reservation) => {
    // Handle invalid reservation input
    if (!reservation || !reservation.reservation_date || !reservation.end_time) {
      console.warn('Invalid reservation data:', reservation);
      return {
        status: "unknown",
        color: "bg-gray-200 text-gray-800",
        icon: null,
        name: "Inconnu",
      };
    }

    const now = moment();
    const endDateTime = moment(
      `${reservation.reservation_date} ${reservation.end_time}`,
      "YYYY-MM-DD HH:mm"
    );
    let status = reservation.status || "pending"; // Default to "pending" if undefined

    // Auto-update status based on current time
    if (endDateTime.isBefore(now)) {
      if (status === "accepted") {
        status = "completed";
      } else if (status === "pending") {
        status = "cancelled";
      }
    }

    const statusConfig = {
      accepted: {
        color: "bg-green-200 text-green-800",
        icon: faCheck,
        name: "Accepté",
      },
      pending: {
        color: "bg-yellow-200 text-yellow-800",
        icon: faClock,
        name: "En attente",
      },
      rejected: {
        color: "bg-red-200 text-red-800",
        icon: faBan,
        name: "Rejeté",
      },
      cancelled: {
        color: "bg-red-200 text-red-800",
        icon: faBan,
        name: "Annulé",
      },
      completed: {
        color: "bg-blue-200 text-blue-800",
        icon: faFlagCheckered,
        name: "Terminé",
      },
    };

    return (
      statusConfig[status] || {
        status: "unknown",
        color: "bg-gray-200 text-gray-800",
        icon: null,
        name: status,
      }
    );
  };

  const filteredReservations = allReservations.filter((r) => {
    const { status } = getStatusDetails(r);
    return (
      reservationStatusFilter === "all" ||
      (status && status.toLowerCase() === reservationStatusFilter.toLowerCase())
    );
  });

  return (
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
            <option value="cancelled">Annulé</option>
            <option value="completed">Terminé</option>
          </select>
        </div>
        {filteredReservations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Aucune réservation correspondant au filtre sélectionné.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  {[
                    "Village",
                    "Bénévole",
                    "Client",
                    "Chien",
                    "Date",
                    "Heure Début",
                    "Heure Fin",
                    "Statut",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => {
                  const { color, icon, name } = getStatusDetails(reservation);

                  return (
                    <tr
                      key={reservation.id}
                      className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                        {reservation.client_village || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                        {reservation.volunteer_name || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                        {reservation.client_name || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                        {reservation.dog_name || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                        {reservation.reservation_date
                          ? moment(reservation.reservation_date).format("DD/MM/YYYY")
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                        {reservation.start_time || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                        {reservation.end_time || "N/A"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}
                        >
                          {icon && (
                            <FontAwesomeIcon icon={icon} className="mr-1" />
                          )}
                          {name}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

ReservationsManager.propTypes = {
  allReservations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      client_village: PropTypes.string,
      volunteer_name: PropTypes.string,
      client_name: PropTypes.string,
      dog_name: PropTypes.string,
      reservation_date: PropTypes.string,
      start_time: PropTypes.string,
      end_time: PropTypes.string,
      status: PropTypes.oneOf([
        "accepted",
        "pending",
        "rejected",
        "cancelled",
        "completed",
      ]),
    })
  ).isRequired,
};

ReservationsManager.defaultProps = {
  allReservations: [],
};

export default ReservationsManager;