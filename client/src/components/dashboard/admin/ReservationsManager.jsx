import { useState } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck, faCheck, faClock, faBan, faFlagCheckered } from "@fortawesome/free-solid-svg-icons";

moment.locale("fr");

const ReservationsManager = ({ allReservations }) => {
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");

  const isReservationCompleted = (reservation) =>
    moment(`${reservation.reservation_date} ${reservation.end_time}`, "YYYY-MM-DD HH:mm").isBefore(moment());

  const filteredReservations = allReservations.filter((r) =>
    reservationStatusFilter === "all" || (isReservationCompleted(r) ? "completed" : r.status).toLowerCase() === reservationStatusFilter.toLowerCase()
  );

  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-green-500" />
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
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr className="border-b border-gray-200 dark:border-gray-600">
                {["Village", "Bénévole", "Client", "Chien", "Date", "Heure Début", "Heure Fin", "Statut"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => {
                const isCompleted = isReservationCompleted(reservation);
                const effectiveStatus = isCompleted ? "completed" : reservation.status;
                const statusConfig = {
                  accepted: { color: "bg-green-200 text-green-800", icon: faCheck, name: "Accepté" },
                  pending: { color: "bg-yellow-200 text-yellow-800", icon: faClock, name: "En attente" },
                  rejected: { color: "bg-red-200 text-red-800", icon: faBan, name: "Rejeté" },
                  cancelled: { color: "bg-red-200 text-red-800", icon: faBan, name: "Rejeté" },
                  completed: { color: "bg-blue-200 text-blue-800", icon: faFlagCheckered, name: "Complété" },
                };
                const { color, icon, name } = statusConfig[effectiveStatus] || { color: "bg-gray-200 text-gray-800", icon: null, name: effectiveStatus };

                return (
                  <tr key={reservation.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{reservation.client_village}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{reservation.volunteer_name}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{reservation.client_name}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{reservation.dog_name}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{moment(reservation.reservation_date).format("DD/MM/YYYY")}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{reservation.start_time}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{reservation.end_time}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                        {icon && <FontAwesomeIcon icon={icon} className="mr-1" />}
                        {name}
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
  );
};

ReservationsManager.propTypes = {
  allReservations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      client_village: PropTypes.string.isRequired,
      volunteer_name: PropTypes.string.isRequired,
      client_name: PropTypes.string.isRequired,
      dog_name: PropTypes.string.isRequired,
      reservation_date: PropTypes.string.isRequired,
      start_time: PropTypes.string.isRequired,
      end_time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default ReservationsManager;