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
import { ClipLoader } from "react-spinners";

moment.locale("fr");

const PersonalReservationsTable = ({
  personalReservations,
  personalReservationsLoading,
  personalReservationsError,
}) => {
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
    let statusName = "";

    switch (status) {
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
        statusName = status === "rejected" ? "Rejeté" : "Annulé";
        break;
      case "completed":
        statusColor = "bg-blue-200 text-blue-800";
        statusIcon = <FontAwesomeIcon icon={faFlagCheckered} className="mr-1" />;
        statusName = "Terminé";
        break;
      default:
        statusColor = "";
        statusIcon = null;
        statusName = status;
    }

    return { status, statusColor, statusIcon, statusName };
  };

  return (
    <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
        Mes réservations
      </h3>
      {personalReservationsLoading ? (
        <div className="flex justify-center">
          <ClipLoader color={"#3b82f6"} loading={true} size={30} />
        </div>
      ) : personalReservationsError ? (
        <p className="text-red-500 dark:text-red-400 text-sm">
          {personalReservationsError}
        </p>
      ) : personalReservations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Aucune réservation.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse w-full">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                {[
                  "Bénévole",
                  "Chien",
                  "Jour",
                  "Heure du début",
                  "Heure de fin",
                  "Statut",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {personalReservations.map((reservation) => {
                const {  statusColor, statusIcon, statusName } =
                  getStatusDetails(reservation);

                return (
                  <tr
                    key={reservation.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                      {reservation.volunteer_name}
                    </td>
                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                      {reservation.dog_name}
                    </td>
                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                      {moment(reservation.reservation_date, "YYYY-MM-DD").format(
                        "DD/MM/YYYY"
                      )}
                    </td>
                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                      {reservation.start_time}
                    </td>
                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                      {reservation.end_time}
                    </td>
                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm font-semibold text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${statusColor}`}
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
      )}
    </section>
  );
};

PersonalReservationsTable.propTypes = {
  personalReservations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      volunteer_name: PropTypes.string.isRequired,
      dog_name: PropTypes.string.isRequired,
      reservation_date: PropTypes.string.isRequired,
      start_time: PropTypes.string.isRequired,
      end_time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  personalReservationsLoading: PropTypes.bool.isRequired,
  personalReservationsError: PropTypes.string,
};

export default PersonalReservationsTable;