import { useState, useEffect } from "react";
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const ReservationsManager = () => {
  const [allReservations, setAllReservations] = useState([]);
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState(moment().add(7, "days").format("YYYY-MM-DD"));

  const getStatusDetails = (reservation) => {
    if (!reservation || !reservation.reservation_date || !reservation.end_time) {
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
    let status = reservation.status || "pending";

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

    return {
      status,
      ...statusConfig[status] || {
        color: "bg-gray-200 text-gray-800",
        icon: null,
        name: status,
      },
    };
  };

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        const res = await fetch(
          `${API_BASE_URL}/admin/reservations?from=${fromDate}&to=${toDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Erreur lors du chargement des réservations");
        const data = await res.json();
        setAllReservations(data);
      } catch (err) {
        console.error(err);
        setAllReservations([]);
      }
    };

    fetchReservations();
  }, [fromDate, toDate]);

  const filteredReservations = allReservations.filter((r) => {
    const { status } = getStatusDetails(r);
    return (
      reservationStatusFilter === "all" ||
      status.toLowerCase() === reservationStatusFilter.toLowerCase()
    );
  });

  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCalendarCheck}
              className="text-green-500 text-xl"
            />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Liste des Réservations
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <select
              value={reservationStatusFilter}
              onChange={(e) => setReservationStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tous les Statuts</option>
              <option value="pending">En attente</option>
              <option value="accepted">Accepté</option>
              <option value="rejected">Rejeté</option>
              <option value="cancelled">Annulé</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
        </div>

        {filteredReservations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Aucune réservation correspondant aux filtres sélectionnés.
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

ReservationsManager.propTypes = {};

export default ReservationsManager;