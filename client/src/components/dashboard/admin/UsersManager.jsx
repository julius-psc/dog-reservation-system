import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

const UsersManager = ({ allUsers, setAllUsers }) => {
  const [userFilter, setUserFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchFilteredUsers = async () => {
      try {
        const token = Cookies.get("token");
        const headers = { Authorization: `Bearer ${token}` };

        const params = new URLSearchParams();
        if (userFilter) params.append("search", userFilter);
        if (userRoleFilter !== "all") params.append("role", userRoleFilter);
        if (!userFilter && userRoleFilter === "all") {
          params.append("limit", 10); // Only limit when no filters
        }

        const res = await fetch(
          `${API_BASE_URL}/admin/all-users?${params.toString()}`,
          {
            headers,
          }
        );
        if (!res.ok) throw new Error("Échec du chargement des utilisateurs");
        const data = await res.json();
        setAllUsers(data);
      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchFilteredUsers();
  }, [userFilter, userRoleFilter, API_BASE_URL, setAllUsers]);

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
      setAllUsers((prev) => prev.filter((user) => user.id !== userId));
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
              placeholder="Rechercher des utilisateurs..."
              className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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




