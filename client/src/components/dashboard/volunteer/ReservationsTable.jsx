import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faClock,
  faBan,
  faFlagCheckered,
} from "@fortawesome/free-solid-svg-icons";

moment.locale("fr");

const ReservationsTable = ({ reservations, handleReservationAction }) => {
  const frenchStatusMap = {
    pending: "En attente",
    accepted: "Accepté",
    rejected: "Refusée",
    cancelled: "Annulée",
    completed: "Terminé",
  };

  const getStatusDetails = (reservation) => {
    const now = moment();
    const endDateTime = moment(
      `${reservation.reservation_date} ${reservation.end_time}`,
      "YYYY-MM-DD HH:mm"
    );
    let status = reservation.status;

    // Auto-update status based on current time
    if (endDateTime.isBefore(now)) {
      if (status === "accepted") {
        status = "completed";
      } else if (status === "pending") {
        status = "cancelled"; // Pending reservations past end time are cancelled
      }
    }

    let statusColor = "";
    let statusIcon = null;
    const statusText = frenchStatusMap[status] || status;

    switch (status) {
      case "accepted":
        statusColor = "bg-green-100 text-green-800";
        statusIcon = <FontAwesomeIcon icon={faCheck} className="mr-1" />;
        break;
      case "pending":
        statusColor = "bg-yellow-100 text-yellow-800";
        statusIcon = <FontAwesomeIcon icon={faClock} className="mr-1" />;
        break;
      case "rejected":
      case "cancelled":
        statusColor = "bg-red-100 text-red-800";
        statusIcon = <FontAwesomeIcon icon={faBan} className="mr-1" />;
        break;
      case "completed":
        statusColor = "bg-primary-blue text-white";
        statusIcon = <FontAwesomeIcon icon={faFlagCheckered} className="mr-1" />;
        break;
      default:
        statusColor = "";
        statusIcon = null;
    }

    return { status, statusColor, statusIcon, statusText };
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
      <h3 className="text-2xl font-bold text-primary-blue dark:text-primary-blue mb-6 flex items-center">
        Réservations
      </h3>
      {reservations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Aucune réservation à afficher
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                {["Client", "Chien", "Date", "Début", "Fin", "Statut", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reservations.map((reservation) => {
                const { status, statusColor, statusIcon, statusText } =
                  getStatusDetails(reservation);

                return (
                  <tr
                    key={reservation.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">
                      {reservation.client_name}
                    </td>
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">
                      {reservation.dog_name}
                    </td>
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">
                      {moment(reservation.reservation_date).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">
                      {reservation.start_time}
                    </td>
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">
                      {reservation.end_time}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}
                      >
                        {statusIcon}
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {status === "pending" ? (
                        <div className="flex space-x-4 justify-center">
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                            onClick={() =>
                              handleReservationAction(reservation.id, "accepted")
                            }
                          >
                            Accepter
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                            onClick={() =>
                              handleReservationAction(reservation.id, "rejected")
                            }
                          >
                            Refuser
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

ReservationsTable.propTypes = {
  reservations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      client_name: PropTypes.string.isRequired,
      dog_name: PropTypes.string.isRequired,
      reservation_date: PropTypes.string.isRequired,
      start_time: PropTypes.string.isRequired,
      end_time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  handleReservationAction: PropTypes.func.isRequired,
};

export default ReservationsTable;