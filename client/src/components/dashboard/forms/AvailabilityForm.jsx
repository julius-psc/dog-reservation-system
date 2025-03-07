import { useState } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const AvailabilityForm = ({ onAvailabilitySaved }) => {
  const [daysAvailability, setDaysAvailability] = useState(
    Array(7).fill(null).map((_, i) => ({
      dayOfWeek: i + 1,
      timeRanges: [{ startTime: '', endTime: '' }],
      enabled: false,
    }))
  );

  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const isHourlyTime = (time) => {
    if (!time) return true;
    const [, minutes] = time.split(':');
    return minutes === '00';
  };

  const handleTimeRangeChange = (dayIndex, rangeIndex, field, value) => {
    if (value && !isHourlyTime(value)) {
      toast.error('Veuillez sélectionner une heure ronde (ex. : 14:00, pas 14:45).');
      return;
    }

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

  const hasOverlappingRanges = (timeRanges) => {
    for (let i = 0; i < timeRanges.length; i++) {
      for (let j = i + 1; j < timeRanges.length; j++) {
        const range1 = timeRanges[i];
        const range2 = timeRanges[j];
        if (
          range1.startTime && range1.endTime && range2.startTime && range2.endTime &&
          range1.startTime < range2.endTime && range2.startTime < range1.endTime
        ) {
          return true;
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
          for (const range of validRanges) {
            if (!isHourlyTime(range.startTime) || !isHourlyTime(range.endTime)) {
              toast.error('Toutes les heures doivent être rondes (ex. : 07:00, 14:00).');
              return;
            }
          }
          if (hasOverlappingRanges(validRanges)) {
            toast.error('Erreur : Les plages horaires pour un même jour ne doivent pas se chevaucher.');
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
          enabled: false,
        }))
      );
    } catch (err) {
      console.error("Erreur dans la requête :", err);
      toast.error(err.message || 'Une erreur inattendue s\'est produite.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 max-w-2xl mx-auto transform transition-all duration-300 hover:shadow-xl">
      <p className="mb-6 text-sm text-red-600 dark:text-red-400 font-medium">
        Attention : Vous ne pouvez définir vos disponibilités qu’une seule fois de manière permanente. Les heures doivent être rondes (ex. : 07:00, 14:00).
      </p>

      {daysAvailability.map((dayAvailability, dayIndex) => (
        <div key={dayIndex} className={`mb-6 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ${!dayAvailability.enabled ? 'bg-gray-50 dark:bg-gray-800 opacity-75' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-semibold text-primary-blue dark:text-primary-blue">
              {daysOfWeek[dayIndex]}
            </label>
            <button
              type="button"
              onClick={() => handleAvailabilityToggle(dayIndex)}
              className="bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
            >
              {dayAvailability.enabled ? "Supprimer" : "Ajouter"}
            </button>
          </div>

          {dayAvailability.enabled && dayAvailability.timeRanges.map((timeRange, rangeIndex) => (
            <div key={rangeIndex} className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Début</label>
                <input
                  type="time"
                  step="3600"
                  value={timeRange.startTime}
                  onChange={(e) => handleTimeRangeChange(dayIndex, rangeIndex, 'startTime', e.target.value)}
                  className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200"
                  required
                  disabled={!dayAvailability.enabled}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fin</label>
                <input
                  type="time"
                  step="3600"
                  value={timeRange.endTime}
                  onChange={(e) => handleTimeRangeChange(dayIndex, rangeIndex, 'endTime', e.target.value)}
                  className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200"
                  required
                  disabled={!dayAvailability.enabled}
                />
              </div>
              {dayAvailability.timeRanges.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeRange(dayIndex, rangeIndex)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
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
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
            >
              Ajouter une plage horaire
            </button>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-primary-blue hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300"
      >
        Enregistrer les disponibilités
      </button>
    </form>
  );
};

AvailabilityForm.propTypes = {
  onAvailabilitySaved: PropTypes.func.isRequired,
};

export default AvailabilityForm;