import PropTypes from "prop-types";
import CreatableSelect from "react-select/creatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

const VillagesCoveredManager = ({
  villagesCovered,
  setVillagesCovered,
  volunteerVillage,
  canUpdateVillages,
  handleSubmitVillages,
  handleRemoveVillage,
  villageOptionsFormatted,
  hasVillagesCoveredBeenSet,
}) => {
  const fullyCapitalizeString = (str) => str.toUpperCase();

  const handleVillageChange = (newValue) => {
    if (newValue) {
      const villageToAdd = fullyCapitalizeString(newValue.value);
      if (!villagesCovered.includes(villageToAdd)) {
        setVillagesCovered([...villagesCovered, villageToAdd]);
      } else {
        toast(`"${villageToAdd}" EST DÉJÀ AJOUTÉ.`, { icon: "⚠️" });
      }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-primary-blue" />
        Communes de promenade
      </h4>
      {hasVillagesCoveredBeenSet && !canUpdateVillages() ? (
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Communes définies :
          </p>
          <ul className="space-y-2">
            {villagesCovered.map((village) => (
              <li
                key={village}
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-800 dark:text-gray-200"
              >
                {village} {village === volunteerVillage && "(Défaut)"}
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">
            Modification impossible pour le moment.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-medium">
            Modification possible tous les 30 jours, sans réservations en cours
          </p>
          <CreatableSelect
            isClearable
            options={villageOptionsFormatted}
            onChange={handleVillageChange}
            placeholder="Choisir ou ajouter une commune..."
            className="mb-4"
            classNamePrefix="react-select"
            formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
            noOptionsMessage={() => "Tapez pour ajouter une nouvelle commune"}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "#fff",
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#72B5F4" },
              }),
              menu: (base) => ({ ...base, backgroundColor: "#fff" }),
              option: (base, { isFocused }) => ({
                ...base,
                backgroundColor: isFocused ? "#72B5F4" : "#fff",
                color: isFocused ? "#fff" : "#374151",
                "&:active": { backgroundColor: "#72B5F4" },
              }),
            }}
          />
          {villagesCovered.length > 0 && (
            <div>
              <ul className="space-y-3">
                {villagesCovered.map((village) => (
                  <li
                    key={village}
                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
                  >
                    <span className="text-gray-800 dark:text-gray-200">
                      {village} {village === volunteerVillage && "(Défaut)"}
                    </span>
                    <button
                      onClick={() => handleRemoveVillage(village)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-lg text-sm transition-all duration-300 disabled:opacity-50"
                      disabled={village === volunteerVillage}
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSubmitVillages}
                className="mt-6 bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-semibold transition-all duration-300"
              >
                Soumettre
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

VillagesCoveredManager.propTypes = {
  villagesCovered: PropTypes.arrayOf(PropTypes.string).isRequired,
  setVillagesCovered: PropTypes.func.isRequired,
  volunteerVillage: PropTypes.string,
  canUpdateVillages: PropTypes.func.isRequired,
  handleSubmitVillages: PropTypes.func.isRequired,
  handleRemoveVillage: PropTypes.func.isRequired,
  villageOptionsFormatted: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  hasVillagesCoveredBeenSet: PropTypes.bool.isRequired,
};

export default VillagesCoveredManager;