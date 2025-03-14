import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

moment.locale("fr");

const OtherVillageRequestsManager = ({ otherVillageRequests }) => {
  return (
    <section>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center mb-6">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-primary-pink" />
          Demandes d’Autres Communes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr className="border-b border-gray-200 dark:border-gray-600">
                {["Nom", "Email", "Téléphone", "Commune Souhaitée", "Date"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {otherVillageRequests.map((request) => (
                <tr key={request.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{request.name}</td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{request.email}</td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{request.phone_number}</td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{request.desired_village}</td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">{moment(request.request_date).format("DD/MM/YYYY HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

OtherVillageRequestsManager.propTypes = {
  otherVillageRequests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone_number: PropTypes.string.isRequired,
      desired_village: PropTypes.string.isRequired,
      request_date: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default OtherVillageRequestsManager;