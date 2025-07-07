import { Thermometer, Clock } from 'lucide-react';

export default function HotWeatherWarningClient() {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 p-4 mb-6 m-4 rounded-lg shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Thermometer className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-orange-800">
              Alerte Températures Élevées
            </h3>
          </div>
          <p className="text-orange-700 mb-3">
            En raison des températures élevées, nous recommandons fortement de privilégier les 
            <span className="font-medium"> réservations matinales (avant 10h) ou en soirée (après 18h) </span> 
            pour le bien-être de nos bénévoles et de vos compagnons à quatre pattes.
          </p>
          <div className="flex items-center space-x-2 text-sm text-orange-600">
            <Clock className="h-4 w-4" />
            <span>Créneaux recommandés : 6h-10h et 18h-21h</span>
          </div>
        </div>
      </div>
    </div>
  );
}