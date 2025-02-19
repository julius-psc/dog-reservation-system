import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
moment.locale("fr");
import HolidayModeButton from "./recycled/HolidayButton";

import AvailabilityForm from "./forms/AvailabilityForm";
import LogoutButton from './recycled/LogoutButton';
import { ClipLoader } from 'react-spinners'; // For loading indicator
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faClock, faCalendarCheck, faCheck, faBan, faExclamationTriangle, faPaw } from '@fortawesome/free-solid-svg-icons';


const VolunteerDashboard = ({ handleLogout }) => {
    const [availabilities, setAvailabilities] = useState([]);
    const [loadingAvailabilities, setLoadingAvailabilities] = useState(true);
    const [errorAvailabilities, setErrorAvailabilities] = useState(null);
    const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [reservationsLoading, setReservationsLoading] = useState(true);
    const [reservationsError, setReservationsError] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [villagesCovered, setVillagesCovered] = useState([]);
    const [selectedVillage, setSelectedVillage] = useState('');
    const [hasVillagesCoveredBeenSet, setHasVillagesCoveredBeenSet] = useState(false);
    const [loadingVillages, setLoadingVillages] = useState(true); // Loading state for villages
    const [errorVillages, setErrorVillages] = useState(null); // Error state for villages


    const villageOptions = [
        "Anisy",
        "Mathieu",
        "Epron",
        "Cambes-en-Plaine",
        "Authie",
        "Saint-Contest",
        "Banville",
        "Biéville-Beuville",
        "Périers-sur-le-Dan",
        "Blainville-sur-Orne",
        "Caen",
        "Douvres-la-Délivrande",
        "Hérouville-Saint-Clair",
        "Ouistreham",
        "Vire",
    ];

    const frenchStatusMap = {
        "pending": "En attente",
        "accepted": "Accepté",
        "rejected": "Refusée",
        "cancelled": "Annulée"
    };


    // Fetch availabilities
    const fetchAvailabilities = useCallback(async () => {
        setLoadingAvailabilities(true);
        setErrorAvailabilities(null);
        const token = Cookies.get("token");
        if (!token) {
            setErrorAvailabilities("Authentication required");
            setLoadingAvailabilities(false);
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/availabilities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch availability data");
            }
            const data = await response.json();
            setAvailabilities(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Availability fetch error:", err);
            setErrorAvailabilities(err.message);
        } finally {
            setLoadingAvailabilities(false);
        }
    }, []);

    // Fetch reservations
    const fetchReservations = useCallback(async () => {
        setReservationsLoading(true);
        setReservationsError(null);
        const token = Cookies.get("token");
        if (!token) {
            setReservationsError("Authentication required");
            setReservationsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/reservations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch reservation data");
            }
            const data = await response.json();
            setReservations(data);
        } catch (err) {
            console.error("Reservation fetch error:", err);
            setReservationsError(err.message);
        } finally {
            setReservationsLoading(false);
        }
    }, []);

    // Fetch villages covered
    const fetchVillagesCovered = useCallback(async () => {
        setLoadingVillages(true);
        setErrorVillages(null);
        const token = Cookies.get('token');
        if (!token) {
            console.error('No token found');
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const fetchedVillages = data.villages_covered || [];
            setVillagesCovered(fetchedVillages);
            if (fetchedVillages.length > 0) {
                setHasVillagesCoveredBeenSet(true); // Mark as set if villages are fetched
            } else {
                setHasVillagesCoveredBeenSet(false); // Mark as not set if empty or not fetched yet
            }
        } catch (error) {
            console.error('Error fetching villages covered:', error);
            setErrorVillages(error.message);
            setActionMessage(`Failed to load villages covered: ${error.message}`);
            setActionType('error');
        } finally {
            setLoadingVillages(false);
        }
    }, []);


    useEffect(() => {
        fetchAvailabilities();
        fetchReservations();
        fetchVillagesCovered();
    }, [fetchAvailabilities, fetchReservations, fetchVillagesCovered]);

    useEffect(() => {
        if (actionMessage) {
            const timer = setTimeout(() => {
                setActionMessage(null);
                setActionType(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [actionMessage]);

    const handleAvailabilitySaved = () => {
        setShowAvailabilityForm(false);
        fetchAvailabilities();
    };

    const handleReservationAction = async (reservationId, status) => {
        const token = Cookies.get("token");
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reservations/${reservationId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${status} reservation`);
            }
            fetchReservations();
            setActionMessage(`Réservation ${status} avec succès!`); // French message
            setActionType('success');
        } catch (err) {
            console.error(`${status} reservation error:`, err);
            setActionMessage(`Erreur lors du traitement de la réservation: ${err.message}`); // French message
            setActionType('error');
        }
    };

    const groupedAvailabilities = availabilities.reduce((acc, availability) => {
        const day = availability.day_of_week;
        acc[day] = acc[day] || [];
        acc[day].push({
            startTime: availability.start_time,
            endTime: availability.end_time
        });
        return acc;
    }, {});

    const daysOfWeekLabels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];


    // Function to handle adding a village
    const handleAddVillage = async () => {
        if (!selectedVillage.trim()) return;
        if (villagesCovered.includes(selectedVillage)) {
            setActionMessage(`Le village "${selectedVillage}" est déjà dans votre liste.`); // French message
            setActionType('warning');
            return;
        }
        const newVillages = [...villagesCovered, selectedVillage.trim()];
        await updateVillages(newVillages);
        setSelectedVillage('');
    };

    // Function to handle removing a village
    const handleRemoveVillage = async (villageToRemove) => {
        const updatedVillages = villagesCovered.filter(village => village !== villageToRemove);
        await updateVillages(updatedVillages);
    };


    // Function to update villages on the server
    const updateVillages = async (updatedVillages) => {
        const token = Cookies.get('token');
        if (!token) {
            setActionMessage('Authentification requise pour mettre à jour les villages.'); // French message
            setActionType('error');
            return;
        }
        console.log("Sending villages to backend:", JSON.stringify(updatedVillages));
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ villagesCovered: updatedVillages }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update villages covered.');
            }

            setVillagesCovered(updatedVillages);
            setActionMessage('Villages mis à jour avec succès!'); // French message
            setActionType('success');
            setHasVillagesCoveredBeenSet(true); // Mark as set after successful update
        } catch (error) {
            console.error('Error updating villages covered:', error);
            setActionMessage(`Erreur lors de la mise à jour des villages: ${error.message}`); // French message
            setActionType('error');
        }
    };


    if (loadingAvailabilities || reservationsLoading || loadingVillages) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
                <ClipLoader color={"#3b82f6"} loading={true} size={50} />
            </div>
        );
    }

    if (errorAvailabilities || reservationsError || errorVillages) {
        return (
            <div className="container mx-auto p-6 dark:bg-gray-900">
                <div className="bg-white rounded-lg shadow-xl p-8 text-center dark:bg-gray-800">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
                    {errorAvailabilities && <p className="text-red-600 dark:text-red-400 mb-2">Erreur de disponibilités: {errorAvailabilities}</p>}
                    {reservationsError && <p className="text-red-600 dark:text-red-400 mb-2">Erreur de réservations: {reservationsError}</p>}
                    {errorVillages && <p className="text-red-600 dark:text-red-400">Erreur de villages: {errorVillages}</p>}
                </div>
            </div>
        );
    }


    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-md py-6">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                            <FontAwesomeIcon icon={faPaw} className="mr-2" />
                            Tableau de Bord Bénévole
                        </h2>
                    </div>
                    <LogoutButton handleLogout={handleLogout} />
                </div>
            </header>

            <main className="container mx-auto mt-8 px-4 pb-8">
                {actionMessage && (
                    <div className={`mb-6 p-4 rounded-md shadow-lg overflow-hidden ${actionType === 'success' ? 'bg-green-500 dark:bg-green-700' : 'bg-red-500 dark:bg-red-700'} text-white`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className={`h-6 w-6 ${actionType === 'success' ? 'text-green-100' : 'text-red-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {actionType === 'success' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">
                                    {actionMessage}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Villages Covered Section */}
                    <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                            Villages de promenade
                        </h3>


                        <div className="mt-4 space-y-4 dark:text-gray-300">
                            {!hasVillagesCoveredBeenSet ? (
                                <div>
                                    <label htmlFor="villageSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choisir votre village (choix définitif)</label>
                                    <div className="flex">
                                        <select
                                            id="villageSelect"
                                            className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300 mr-2"
                                            value={selectedVillage}
                                            onChange={(e) => setSelectedVillage(e.target.value)}
                                            disabled={hasVillagesCoveredBeenSet}
                                        >
                                            <option value="">Sélectionner un village</option>
                                            {villageOptions.map(village => (
                                                <option key={village} value={village}>{village}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAddVillage}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm cursor-pointer"
                                            disabled={!selectedVillage || hasVillagesCoveredBeenSet}
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Villages de promenade définis :</p>
                                    {villagesCovered.length > 0 && (
                                        <div className="mt-2">
                                            <ul className="list-disc ml-6">
                                                {villagesCovered.map(village => (
                                                    <li key={village} className="flex items-center justify-between dark:text-gray-300 my-2">
                                                        {village}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Villages de promenade définis, modifications impossibles.</p>
                                </div>
                            )}

                            {villagesCovered.length > 0 && !hasVillagesCoveredBeenSet && (
                                <div className="mt-2">
                                    <ul className="list-disc ml-6">
                                        {villagesCovered.map(village => (
                                            <li key={village} className="flex items-center justify-between dark:text-gray-300 my-2">
                                                {village}
                                                <button
                                                    onClick={() => handleRemoveVillage(village)}
                                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-xs cursor-pointer"
                                                    disabled={hasVillagesCoveredBeenSet}
                                                >
                                                    Enlever
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                    </section>


                    {/* Availability Section */}
                    <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
                        {/* ... rest of Availability and Reservations sections */}
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <FontAwesomeIcon icon={faClock} className="mr-2" />
                            Mes disponibilités
                        </h3>
                        {showAvailabilityForm ? (
                            <div className="dark:text-gray-300">
                                <AvailabilityForm onAvailabilitySaved={handleAvailabilitySaved} />
                            </div>
                        ) : (
                            <>
                                {availabilities.length === 0 ? (
                                    <div className="text-center dark:text-gray-300">
                                        <p className="text-gray-500 mb-4 dark:text-gray-400">Aucune disponibilité définie.</p>
                                        <button
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm cursor-pointer"
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
                                                <div key={dayNumber} className="mb-4">
                                                    <h4 className="text-lg font-semibold mb-2 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700 flex items-center">
                                                        {label}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {groupedAvailabilities[dayNumber].map((slot, i) => (
                                                            <button
                                                                key={i}
                                                                className="bg-blue-100 dark:bg-blue-500 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-100 font-medium py-1.5 px-3 rounded-md text-sm transition-colors duration-200 cursor-pointer"
                                                            >
                                                                {slot.startTime} - {slot.endTime}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                    {/* Reservations Section */}
                    <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800 col-span-full">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
                            Réservations
                        </h3>
                        {reservationsLoading ? (
                            <div className="flex justify-center">
                                <ClipLoader color={"#3b82f6"} loading={true} size={30} />
                            </div>
                        ) : reservationsError ? (
                            <p className="text-red-500 dark:text-red-400">{reservationsError}</p>
                        ) : reservations.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">Aucune réservation</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto border-collapse w-full">
                                    <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                        <tr>
                                            {["Client", "Chien", "Date", "Début", "Fin", "Statut", "Actions"].map((header) => (
                                                <th key={header} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {reservations.map((reservation) => {
                                            let statusColor = "";
                                            let statusIcon = null;
                                            let statusText = frenchStatusMap[reservation.status] || reservation.status; // French status

                                            switch (reservation.status) {
                                                case "accepted":
                                                    statusColor = "bg-green-200 text-green-800";
                                                    statusIcon = <FontAwesomeIcon icon={faCheck} className="mr-1" />;
                                                    break;
                                                case "pending":
                                                    statusColor = "bg-yellow-200 text-yellow-800";
                                                    statusIcon = <FontAwesomeIcon icon={faClock} className="mr-1" />;
                                                    break;
                                                case "rejected":
                                                case "cancelled":
                                                    statusColor = "bg-red-200 text-red-800";
                                                    statusIcon = <FontAwesomeIcon icon={faBan} className="mr-1" />;
                                                    break;
                                                default:
                                                    statusColor = "";
                                                    statusIcon = null;
                                            }

                                            return (
                                                <tr key={reservation.id} className=" hover:bg-gray-100 dark:hover:bg-gray-900">
                                                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.client_name}</td>
                                                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.dog_name}</td>
                                                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                                                        {moment(reservation.reservation_date).format("DD/MM/YYYY")}
                                                    </td>
                                                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.start_time}</td>
                                                    <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.end_time}</td>
                                                    <td className={`border px-4 py-2 capitalize dark:border-gray-700 dark:text-gray-300 text-sm font-semibold text-center`}>
                                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${statusColor}`}>
                                                            {statusIcon}
                                                            {statusText}
                                                        </span>
                                                    </td>
                                                    <td className="border px-4 py-2 text-center dark:border-gray-700 dark:text-gray-300">
                                                        {reservation.status === "pending" ? (
                                                            <div className="flex space-x-2 justify-center">
                                                                <button
                                                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline text-xs cursor-pointer"
                                                                    onClick={() => handleReservationAction(reservation.id, "accepted")}
                                                                >
                                                                    Accepter
                                                                </button>
                                                                <button
                                                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline text-xs cursor-pointer"
                                                                    onClick={() => handleReservationAction(reservation.id, "rejected")}
                                                                >
                                                                    Refuser
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span>
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                    <HolidayModeButton />
                </div>
            </main>
        </div>
    );
};

VolunteerDashboard.propTypes = {
    handleLogout: PropTypes.func.isRequired,
};

export default VolunteerDashboard;