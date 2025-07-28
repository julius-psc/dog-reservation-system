import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

const UsersManager = ({ allUsers, setAllUsers }) => {
  const [userFilter, setUserFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [reservationCounts, setReservationCounts] = useState({});
  const [totalUsers, setTotalUsers] = useState(0);

  const pageSize = 10;
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const buildParams = () => {
      const params = new URLSearchParams();
      if (userFilter) params.append("search", userFilter);
      if (villageFilter) params.append("village", villageFilter);
      if (userRoleFilter !== "all") params.append("role", userRoleFilter);
      params.append("limit", pageSize);
      params.append("offset", (currentPage - 1) * pageSize);
      return params.toString();
    };

    const fetchData = async () => {
      try {
        const token = Cookies.get("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch users
        const userRes = await fetch(
          `${API_BASE_URL}/admin/all-users?${buildParams()}`,
          { headers }
        );
        if (!userRes.ok)
          throw new Error("Échec du chargement des utilisateurs");
        const usersData = await userRes.json();
        setAllUsers(usersData);

        // Fetch user count
        const countRes = await fetch(
          `${API_BASE_URL}/admin/users/count?${buildParams()}`,
          { headers }
        );
        if (!countRes.ok)
          throw new Error("Échec du chargement du nombre d'utilisateurs");
        const { count } = await countRes.json();
        setTotalUsers(count);

        // Fetch reservation count
        const countMapRes = await fetch(
          `${API_BASE_URL}/admin/volunteer/reservations-count`,
          { headers }
        );
        if (!countMapRes.ok)
          throw new Error("Échec du chargement du nombre de réservations");
        const countMap = await countMapRes.json();
        setReservationCounts(countMap);
      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchData();
  }, [
    userFilter,
    villageFilter,
    userRoleFilter,
    currentPage,
    API_BASE_URL,
    setAllUsers,
  ]);

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handleDeleteUser = async (userId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?"))
      return;
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new Error("Échec de la suppression de l'utilisateur");
      setCurrentPage(1); // reset page to reload
      toast.success("Utilisateur supprimé avec succès");
    } catch (error) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <FontAwesomeIcon icon={faUsers} className="mr-2 text-yellow-500" />
            Liste des Utilisateurs
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
            <input
              type="text"
              placeholder="Commune"
              className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={villageFilter}
              onChange={(e) => {
                setVillageFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les Rôles</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="volunteer">Bénévole</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr className="border-b border-gray-200 dark:border-gray-600">
                {[
                  "Nom",
                  "Email",
                  "Rôle",
                  "Village",
                  "Pas de Risque",
                  "Incapable de Promener",
                  "Permission Photo",
                  "Réservations Complétées",
                  "Actions",
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
              {allUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                    {user.username}
                  </td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                    {user.role}
                  </td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                    {user.village}
                  </td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                    {user.no_risk_confirmed ? "Oui" : "Non"}
                  </td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                    {user.unable_to_walk_confirmed ? "Oui" : "Non"}
                  </td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-200">
                    {user.photo_permission ? "Oui" : "Non"}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-800 dark:text-gray-200">
                    {user.role === "volunteer"
                      ? reservationCounts[user.id] ?? 0
                      : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} sur {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </section>
  );
};

UsersManager.propTypes = {
  allUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      village: PropTypes.string,
      no_risk_confirmed: PropTypes.bool,
      unable_to_walk_confirmed: PropTypes.bool,
      photo_permission: PropTypes.bool,
    })
  ).isRequired,
  setAllUsers: PropTypes.func.isRequired,
};

export default UsersManager;