import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const Maintenance = () => {
  return (
    <div className="bg-yellow-500 dark:bg-yellow-700 text-white p-4 text-center shadow-md">
      <div className="flex items-center justify-center space-x-2">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl" />
        <p className="text-sm font-medium">
          Nos excuses ! Nous n’avons pas encore résolu les réservations asynchrones. 
          En attendant, veuillez cliquer sur les créneaux pour vérifier leur disponibilité.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;