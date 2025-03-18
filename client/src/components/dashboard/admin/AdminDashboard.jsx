import PropTypes from "prop-types";
import { Toaster } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faUsers,
  faCalendarCheck,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "../recycled/LogoutButton";
import VolunteersManager from "./VolunteersManager";
import ReservationsManager from "./ReservationsManager";
import UsersManager from "./UsersManager";
import OtherVillageRequestsManager from "./OtherVillageRequestsManager";
import useAdminData from "./useAdminData";

const AdminDashboard = ({ handleLogout }) => {
  const {
    volunteers,
    loading,
    error,
    allReservations,
    reservationsLoading,
    reservationsError,
    allUsers,
    setAllUsers,
    usersLoading,
    usersError,
    otherVillageRequests,
    otherVillageLoading,
    otherVillageError,
    fetchVolunteerDetails, // Added this from useAdminData
  } = useAdminData();

  if (loading || reservationsLoading || usersLoading || otherVillageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <ClipLoader color="#3b82f6" size={50} />
      </div>
    );
  }

  if (error || reservationsError || usersError || otherVillageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-4xl mb-4" />
          {error && <p className="text-red-600 dark:text-red-400 mb-2">Erreur: {error}</p>}
          {reservationsError && <p className="text-red-600 dark:text-red-400 mb-2">Erreur Réservations: {reservationsError}</p>}
          {usersError && <p className="text-red-600 dark:text-red-400 mb-2">Erreur Utilisateurs: {usersError}</p>}
          {otherVillageError && <p className="text-red-600 dark:text-red-400">Erreur Autres Villages: {otherVillageError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Toaster />
      <header className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <FontAwesomeIcon icon={faUserShield} className="mr-2 text-blue-500" />
            Tableau de Bord Administrateur
          </h1>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: "Total Bénévoles", count: volunteers.length, icon: faUsers, color: "blue-500" },
            { title: "Réservations Totales", count: allReservations.length, icon: faCalendarCheck, color: "green-500" },
            { title: "Total Utilisateurs", count: allUsers.length, icon: faUsers, color: "yellow-500" },
          ].map((stat) => (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-between transform hover:scale-105 transition-transform"
            >
              <div>
                <h3 className="text-gray-600 dark:text-gray-300 font-medium">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
              </div>
              <FontAwesomeIcon icon={stat.icon} className={`text-${stat.color} text-3xl`} />
            </div>
          ))}
        </div>

        <VolunteersManager setAllUsers={setAllUsers} fetchVolunteerDetails={fetchVolunteerDetails} />
        <ReservationsManager allReservations={allReservations} />
        <UsersManager allUsers={allUsers} setAllUsers={setAllUsers} />
        <OtherVillageRequestsManager otherVillageRequests={otherVillageRequests} />
      </main>
    </div>
  );
};

AdminDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default AdminDashboard;