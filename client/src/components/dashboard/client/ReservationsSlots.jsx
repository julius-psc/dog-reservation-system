import { useState } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

moment.locale("fr");

const ReservationSlots = ({
  allAvailableSlots,
  currentWeekStart,
  setCurrentWeekStart,
  isCurrentWeekDisplayed,
  setIsCurrentWeekDisplayed,
  selectedDate,
  setSelectedDate,
  reservations,
  personalReservations,
  handleReservation,
  reservationLoading,
}) => {
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null);

  const daysOfWeek = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const goToPreviousWeek = () => {
    if (!isCurrentWeekDisplayed) {
      const newWeekStart = moment(currentWeekStart)
        .subtract(1, "week")
        .startOf("isoWeek");
      setCurrentWeekStart(newWeekStart);
      setIsCurrentWeekDisplayed(newWeekStart.isSame(moment(), "week"));
    }
  };

  const goToNextWeek = () => {
    const newWeekStart = moment(currentWeekStart)
      .add(1, "week")
      .startOf("isoWeek");
    setCurrentWeekStart(newWeekStart);
    setIsCurrentWeekDisplayed(newWeekStart.isSame(moment(), "week"));
  };

  const isSlotReserved = (currentDate, slot, dayIndex) => {
    const slotDate = moment(currentWeekStart)
      .add(dayIndex, "days")
      .format("YYYY-MM-DD");
    const slotStart = moment(`${slotDate} ${slot.time}`, "YYYY-MM-DD HH:mm");
    const slotEnd = slotStart.clone().add(1, "hour");

    return (
      reservations.some((reservation) => {
        const reservationStart = moment(
          `${reservation.reservation_date} ${reservation.start_time}`,
          "YYYY-MM-DD HH:mm"
        );
        const reservationEnd = moment(
          `${reservation.reservation_date} ${reservation.end_time}`,
          "YYYY-MM-DD HH:mm"
        );
        return (
          reservation.reservation_date === slotDate &&
          slotStart.isBefore(reservationEnd) &&
          slotEnd.isAfter(reservationStart) &&
          (reservation.status === "pending" || reservation.status === "accepted")
        );
      }) ||
      personalReservations.some((reservation) => {
        const reservationStart = moment(
          `${reservation.reservation_date} ${reservation.start_time}`,
          "YYYY-MM-DD HH:mm"
        );
        const reservationEnd = moment(
          `${reservation.reservation_date} ${reservation.end_time}`,
          "YYYY-MM-DD HH:mm"
        );
        return (
          reservation.reservation_date === slotDate &&
          slotStart.isBefore(reservationEnd) &&
          slotEnd.isAfter(reservationStart) &&
          (reservation.status === "pending" || reservation.status === "accepted")
        );
      })
    );
  };

  const showConfirmation = (volunteerId, startTime, dayIndex) => {
    const reservationDate = moment(currentWeekStart).add(dayIndex, "days");
    setConfirmationDetails({
      volunteerId,
      startTime,
      dayIndex,
      date: reservationDate.format("DD/MM/YYYY"),
    });
    setIsConfirmationVisible(true);
  };

  const handleConfirmReservation = () => {
    if (confirmationDetails) {
      handleReservation(
        confirmationDetails.volunteerId,
        confirmationDetails.startTime,
        confirmationDetails.dayIndex
      );
      setIsConfirmationVisible(false);
      setConfirmationDetails(null);
    }
  };

  const handleCancelConfirmation = () => {
    setIsConfirmationVisible(false);
    setConfirmationDetails(null);
  };

  return (
    <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
        Créneaux disponibles
      </h3>
      <div className="mb-4 flex justify-center space-x-3">
        <button
          onClick={goToPreviousWeek}
          className="bg-primary-pink hover:bg-pink-500 text-white cursor-pointer dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          disabled={isCurrentWeekDisplayed}
        >
          Semaine précédente
        </button>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          className="mt-1 py-2 px-3 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 text-center"
          minDate={moment().add(2, "days").toDate()}
          placeholderText="Choisir une date"
        />
        <button
          onClick={goToNextWeek}
          className="bg-primary-pink hover:bg-pink-500 cursor-pointer text-white dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
        >
          Semaine prochaine
        </button>
      </div>
      <div className="flex flex-col">
        {daysOfWeek.map((dayName, dayIndex) => {
          const currentDate = moment(currentWeekStart).add(dayIndex, "days");
          const isBeforeToday = currentDate.isBefore(moment(), "day");

          if (isBeforeToday) return null;

          const isPastDay = currentDate.isBefore(
            moment().subtract(2, "days"),
            "day"
          );

          return (
            <div key={dayIndex} className="mb-5">
              <h4 className="text-lg font-semibold mb-2 dark:text-white">
                {dayName} ({currentDate.format("DD/MM")})
              </h4>
              {allAvailableSlots[dayIndex] && allAvailableSlots[dayIndex].length > 0 ? (
                <div className="flex flex-wrap">
                  {allAvailableSlots[dayIndex].map((slot) => {
                    const isReserved = isSlotReserved(currentDate, slot, dayIndex);
                    const isPastSlot =
                      isPastDay ||
                      moment(
                        `${currentDate.format("YYYY-MM-DD")} ${slot.time}`,
                        "YYYY-MM-DD HH:mm"
                      ).isBefore(moment());

                    return (
                      <button
                        key={`${dayIndex}-${slot.time}`}
                        className={`inline-block rounded-md border px-3 py-2 mr-2 mb-2 text-xs sm:text-sm
                          ${
                            isReserved || isPastSlot
                              ? "opacity-50 cursor-not-allowed bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                              : "border-blue-500 bg-white hover:bg-blue-100 dark:border-blue-400 dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-500"
                          }`}
                        onClick={() => {
                          if (!isPastSlot && !isReserved && !reservationLoading) {
                            showConfirmation(slot.volunteerIds[0], slot.time, dayIndex);
                          } else if (isReserved) {
                            toast.error("Ce créneau est déjà réservé.");
                          }
                        }}
                        disabled={isReserved || isPastSlot || reservationLoading}
                      >
                        {slot.time} {isReserved ? "(Réservé)" : ""}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Pas de disponibilités le {dayName}.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {isConfirmationVisible && confirmationDetails && (
        <div className="fixed inset-0 bg-primary-pink bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="mr-2 text-yellow-500"
              />
              Confirmer la Réservation?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Êtes-vous certain de vouloir réserver le créneau à{" "}
              <span className="font-semibold">{confirmationDetails.startTime}</span>{" "}
              le{" "}
              <span className="font-semibold">{confirmationDetails.date}</span> ?
            </p>
            <p className="bg-yellow-100 border-l-4 border-yellow-500 text-sm text-yellow-700 p-4 rounded-md">
              Pensez à apporter un sac à déjection ou une toutounette pour votre bénévole à votre prochaine rencontre !
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelConfirmation}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReservation}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
              >
                Je confirme
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

ReservationSlots.propTypes = {
  allAvailableSlots: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        time: PropTypes.string.isRequired,
        volunteerIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        isReserved: PropTypes.bool,
      })
    )
  ).isRequired,
  currentWeekStart: PropTypes.instanceOf(moment).isRequired,
  setCurrentWeekStart: PropTypes.func.isRequired,
  isCurrentWeekDisplayed: PropTypes.bool.isRequired,
  setIsCurrentWeekDisplayed: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  setSelectedDate: PropTypes.func.isRequired,
  reservations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      reservation_date: PropTypes.string.isRequired,
      start_time: PropTypes.string.isRequired,
      end_time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  personalReservations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      reservation_date: PropTypes.string.isRequired,
      start_time: PropTypes.string.isRequired,
      end_time: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  handleReservation: PropTypes.func.isRequired,
  reservationLoading: PropTypes.bool.isRequired,
};

export default ReservationSlots;