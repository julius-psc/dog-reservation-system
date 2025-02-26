import { useState } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const AvailabilityForm = ({ onAvailabilitySaved }) => {
    const [daysAvailability, setDaysAvailability] = useState(
        Array(7).fill(null).map((_, i) => ({
            dayOfWeek: i + 1,
            timeRanges: [{ startTime: '', endTime: '' }],
            enabled: true,
        }))
    );

    const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

    const handleTimeRangeChange = (dayIndex, rangeIndex, field, value) => {
        const updatedDaysAvailability = [...daysAvailability];
        updatedDaysAvailability[dayIndex].timeRanges[rangeIndex][field] = value;
        setDaysAvailability(updatedDaysAvailability);
    };

    const handleAddTimeRange = (dayIndex) => {
        const updatedDaysAvailability = [...daysAvailability];
        updatedDaysAvailability[dayIndex].timeRanges.push({ startTime: '', endTime: '' });
        updatedDaysAvailability[dayIndex].enabled = true;
        setDaysAvailability(updatedDaysAvailability);
    };

    const removeTimeRange = (dayIndex, rangeIndex) => {
        const updatedDaysAvailability = [...daysAvailability];
        updatedDaysAvailability[dayIndex].timeRanges.splice(rangeIndex, 1);
        if (updatedDaysAvailability[dayIndex].timeRanges.length === 0) {
            updatedDaysAvailability[dayIndex].enabled = false;
        }
        setDaysAvailability(updatedDaysAvailability);
    };

    const handleAvailabilityToggle = (index) => {
        const updatedDaysAvailability = [...daysAvailability];
        updatedDaysAvailability[index].enabled = !updatedDaysAvailability[index].enabled;
        if (updatedDaysAvailability[index].enabled && updatedDaysAvailability[index].timeRanges.length === 0) {
            updatedDaysAvailability[index].timeRanges.push({ startTime: '', endTime: '' });
        }
        setDaysAvailability(updatedDaysAvailability);
    };

    // Function to check for overlapping time ranges within the same day
    const hasOverlappingRanges = (timeRanges) => {
        for (let i = 0; i < timeRanges.length; i++) {
            for (let j = i + 1; j < timeRanges.length; j++) {
                const range1 = timeRanges[i];
                const range2 = timeRanges[j];
                if (
                    range1.startTime && range1.endTime && range2.startTime && range2.endTime &&
                    range1.startTime < range2.endTime && range2.startTime < range1.endTime
                ) {
                    return true; // Overlap detected
                }
            }
        }
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = Cookies.get('token');
        if (!token) {
            toast.error('Aucun jeton trouvé. Veuillez vous connecter.');
            return;
        }

        let allAvailabilitiesToSubmit = [];
        for (const dayAvailability of daysAvailability) {
            if (dayAvailability.enabled) {
                const validRanges = dayAvailability.timeRanges.filter(range => range.startTime && range.endTime);
                if (validRanges.length > 0) {
                    // Check for overlaps within this day's time ranges
                    if (hasOverlappingRanges(validRanges)) {
                        toast.error('Erreur : Les plages horaires pour un même jour ne doivent pas se chevaucher (ex. : 07:00–09:00 et 08:00–10:00).');
                        return;
                    }
                    validRanges.forEach(range => {
                        allAvailabilitiesToSubmit.push({
                            dayOfWeek: dayAvailability.dayOfWeek,
                            startTime: range.startTime,
                            endTime: range.endTime,
                        });
                    });
                }
            }
        }

        if (allAvailabilitiesToSubmit.length === 0) {
            toast.error('Veuillez désactiver les jours ou supprimer les plages horaires si vous n\'êtes pas disponible.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/availabilities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(allAvailabilitiesToSubmit),
            });

            if (!response.ok) {
                if (response.status === 403) {
                    Cookies.remove('token');
                    Cookies.remove('userId');
                    toast.error('Session expirée. Veuillez vous reconnecter.');
                    return;
                }
                const errorData = await response.json();
                toast.error(errorData.error || 'Échec de l\'enregistrement des disponibilités');
                return;
            }

            toast.success('Disponibilités enregistrées avec succès !');
            if (onAvailabilitySaved) {
                onAvailabilitySaved();
            }
            setDaysAvailability(
                Array(7).fill(null).map((_, i) => ({
                    dayOfWeek: i + 1,
                    timeRanges: [{ startTime: '', endTime: '' }],
                    enabled: true,
                }))
            );

        } catch (err) {
            console.error("Erreur dans la requête :", err);
            toast.error(err.message || 'Une erreur inattendue s\'est produite.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                Attention : Vous ne pouvez définir vos disponibilités qu’une seule fois de manière permanente. Assurez-vous que vos choix sont corrects avant de soumettre.
            </p>

            {daysAvailability.map((dayAvailability, dayIndex) => (
                <div key={dayIndex} className={`mb-6 p-4 rounded-lg border dark:border-gray-700 ${!dayAvailability.enabled ? 'opacity-50 bg-gray-100 dark:bg-gray-700 dark:text-gray-400' : 'dark:bg-gray-900'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                            {daysOfWeek[dayIndex]}
                        </label>
                        <button
                            type="button"
                            onClick={() => handleAvailabilityToggle(dayIndex)}
                            className="inline-block shrink-0 rounded-md border border-gray-500 bg-gray-400 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-transparent hover:text-gray-600 focus:ring-3 focus:outline-hidden dark:border-gray-400 dark:bg-gray-600 dark:hover:bg-transparent dark:hover:text-gray-100 dark:text-white"
                        >
                            {dayAvailability.enabled ? "Désactiver le jour" : "Activer le jour"}
                        </button>
                    </div>

                    {dayAvailability.enabled && dayAvailability.timeRanges.map((timeRange, rangeIndex) => (
                        <div key={rangeIndex} className="flex mt-2 items-start">
                            <div className="w-1/2 mr-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Heure de début :</label>
                                <input
                                    type="time"
                                    step="3600" // Restricts to hourly intervals
                                    value={timeRange.startTime}
                                    onChange={(e) => handleTimeRangeChange(dayIndex, rangeIndex, 'startTime', e.target.value)}
                                    className="mt-1 py-2 px-3 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white block w-full"
                                    required
                                    disabled={!dayAvailability.enabled}
                                />
                            </div>
                            <div className="w-1/2 mr-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Heure de fin :</label>
                                <input
                                    type="time"
                                    step="3600" // Restricts to hourly intervals
                                    value={timeRange.endTime}
                                    onChange={(e) => handleTimeRangeChange(dayIndex, rangeIndex, 'endTime', e.target.value)}
                                    className="mt-1 py-2 px-3 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white block w-full"
                                    required
                                    disabled={!dayAvailability.enabled}
                                />
                            </div>
                            {dayAvailability.timeRanges.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeTimeRange(dayIndex, rangeIndex)}
                                    className="inline-block shrink-0 rounded-md border border-red-500 bg-red-400 px-4 py-2 text-sm font-medium text-white transition hover:bg-transparent hover:text-red-600 focus:ring-3 focus:outline-hidden dark:border-red-400 dark:bg-red-600 dark:hover:bg-transparent dark:hover:text-red-100 self-start mt-7"
                                >
                                    Supprimer
                                </button>
                            )}
                        </div>
                    ))}

                    {dayAvailability.enabled && (
                        <button
                            type="button"
                            onClick={() => handleAddTimeRange(dayIndex)}
                            className="inline-block shrink-0 rounded-md border border-green-500 bg-green-400 px-4 py-2 font-medium text-white transition hover:bg-transparent hover:text-green-600 focus:ring-3 focus:outline-hidden dark:border-green-400 dark:bg-green-600 dark:hover:bg-transparent dark:hover:text-green-100 text-xs mt-3"
                        >
                            Ajouter une plage horaire
                        </button>
                    )}
                </div>
            ))}

            <button type="submit" className="inline-block shrink-0 rounded-md border border-pink-500 bg-pink-400 px-4 py-2 text-sm font-medium text-white transition hover:bg-transparent hover:text-pink-600 focus:ring-3 focus:outline-hidden dark:border-pink-400 dark:bg-pink-600 dark:hover:bg-transparent dark:hover:text-pink-100">
                Enregistrer les disponibilités
            </button>
        </form>
    );
};

AvailabilityForm.propTypes = {
    onAvailabilitySaved: PropTypes.func.isRequired,
};

export default AvailabilityForm;