import { Footprints, Shield, XCircle } from 'lucide-react';

export default function VolunteerHotWeatherWarning() {
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-5 mb-6 m-4 rounded-lg shadow-md">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">
              Consignes de Sécurité - Températures Élevées
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Footprints className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">
                <span className="font-medium">Évitez absolument les surfaces goudronnées</span> qui peuvent brûler les coussinets des chiens. Privilégiez les chemins en terre, l'herbe, ou les zones ombragées.
              </p>
            </div>
            
            <div className="flex items-start space-x-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">
                <span className="font-medium">N'hésitez pas à annuler une promenade</span> si les conditions météorologiques ne sont pas appropriées. La sécurité du chien est notre priorité absolue.
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-red-100 rounded-md">
            <p className="text-sm text-red-800 font-medium">
              💡 Test simple : Posez votre main sur le sol pendant 5 secondes. Si c'est trop chaud pour vous, c'est trop chaud pour les pattes du chien.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}