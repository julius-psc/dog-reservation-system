import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

const AvailabilityDisplay = ({
  groupedAvailabilities,
  daysOfWeekLabels,
  canUpdateAvailability,
  setShowAvailabilityForm,
}) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <FontAwesomeIcon icon={faClock} className="mr-2 text-primary-blue" />
      Horaires
    </h4>
    {Object.keys(groupedAvailabilities).length === 0 ? (
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Aucune disponibilité définie
        </p>
        <button
          className="bg-primary-blue hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold transition-all duration-300"
          onClick={() => setShowAvailabilityForm(true)}
        >
          Définir disponibilités
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {daysOfWeekLabels.map((label, index) => {
          const dayNumber = index + 1;
          return groupedAvailabilities[dayNumber] ? (
            <div
              key={dayNumber}
              className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"
            >
              <h5 className="text-md font-semibold text-gray-800 dark:text-white mb-2">
                {label}
              </h5>
              <div className="flex flex-wrap gap-2">
                {groupedAvailabilities[dayNumber].map((slot, i) => (
                  <span
                    key={i}
                    className="bg-primary-blue text-white py-1 px-3 rounded-full text-sm font-medium"
                  >
                    {slot.startTime} - {slot.endTime}
                  </span>
                ))}
              </div>
            </div>
          ) : null;
        })}
        {canUpdateAvailability() && (
          <button
            className="mt-4 bg-primary-blue hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold transition-all duration-300"
            onClick={() => setShowAvailabilityForm(true)}
          >
            Modifier disponibilités
          </button>
        )}
      </div>
    )}
  </div>
);

AvailabilityDisplay.propTypes = {
  groupedAvailabilities: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        startTime: PropTypes.string.isRequired,
        endTime: PropTypes.string.isRequired,
      })
    )
  ).isRequired,
  daysOfWeekLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  canUpdateAvailability: PropTypes.func.isRequired,
  setShowAvailabilityForm: PropTypes.func.isRequired,
};

export default AvailabilityDisplay;