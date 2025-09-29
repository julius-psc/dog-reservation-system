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
import MemberImageManager from "./MemberImageManager";
import ReservationStats from "./ReservationStats";
import useAdminData from "./useAdminData";

const AdminDashboard = ({ handleLogout }) => {
  const {
    // Données principales
    volunteerCount,
    allReservations,
    allUsers,
    setAllUsers,
    usersCount,
    otherVillageRequests,
    setOtherVillageRequests,

    // Données et setters pour les images
    memberImages,
    setMemberImages,
    memberImagesTotal,
    setMemberImagesTotal,
    memberImagesNextOffset,
    setMemberImagesNextOffset,

    // États globaux
    isDashboardLoading,
    error,

    // Fonctions
    fetchVolunteerDetails,
  } = useAdminData();

  // Le chargement est maintenant géré par un seul état
  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <ClipLoader color="#3b82f6" size={50} />
      </div>
    );
  }

  // L'erreur est aussi gérée par un seul état
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <FontAwesomeIcon
            icon={faTimesCircle}
            className="text-red-500 text-4xl mb-4"
          />
          <p className="text-red-600 dark:text-red-400 mb-2">
            Erreur lors du chargement du tableau de bord:
          </p>
          <p className="text-sm text-gray-500">{error}</p>
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
            <FontAwesomeIcon
              icon={faUserShield}
              className="mr-2 text-blue-500"
            />
            Tableau de Bord Administrateur
          </h1>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Total Bénévoles",
              count: volunteerCount,
              icon: faUsers,
              color: "blue-500",
            },
            {
              title: "Réservations Totales",
              count: allReservations.length,
              icon: faCalendarCheck,
              color: "green-500",
            },
            {
              title: "Total Utilisateurs",
              count: usersCount,
              icon: faUsers,
              color: "yellow-500",
            },
          ].map((stat) => (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-between transform hover:scale-105 transition-transform"
            >
              <div>
                <h3 className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.count}
                </p>
              </div>
              <FontAwesomeIcon
                icon={stat.icon}
                className={`text-${stat.color} text-3xl`}
              />
            </div>
          ))}
        </div>
        <ReservationStats />

        <VolunteersManager
          setAllUsers={setAllUsers}
          fetchVolunteerDetails={fetchVolunteerDetails}
        />
        <ReservationsManager allReservations={allReservations} />
        <UsersManager allUsers={allUsers} setAllUsers={setAllUsers} />

        {/* On passe les données et les setters au composant enfant */}
        <MemberImageManager
          images={memberImages}
          setImages={setMemberImages}
          total={memberImagesTotal}
          setTotal={setMemberImagesTotal}
          nextOffset={memberImagesNextOffset}
          setNextOffset={setMemberImagesNextOffset}
        />

        <OtherVillageRequestsManager
          setOtherVillageRequests={setOtherVillageRequests}
          otherVillageRequests={otherVillageRequests}
        />
      </main>
    </div>
  );
};

AdminDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default AdminDashboard;