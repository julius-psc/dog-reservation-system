import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const ClientCharterForm = () => {
  const [charterFile, setCharterFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFile, setSubmittedFile] = useState(null); // Track submitted file locally
  const [hasCharter, setHasCharter] = useState(false); // Track if charter is already uploaded
  const [isLoading, setIsLoading] = useState(true); // Track initial loading state

  // Fetch user's charter status on mount
  useEffect(() => {
    const fetchCharterStatus = async () => {
      const token = Cookies.get('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/client/charter-status`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la vérification du statut de la charte');
        }

        const data = await response.json();
        if (data.client_charter_file_path) {
          setHasCharter(true);
          setSubmittedFile(data.client_charter_filename || 'Charte déjà soumise'); // Optional: Extract filename if stored
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du statut de la charte :', error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharterStatus();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFileError('Veuillez sélectionner votre charte signée');
      setCharterFile(null);
    } else {
      setFileError('');
      setCharterFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!charterFile) {
      setFileError('Veuillez sélectionner votre charte signée');
      return;
    }

    setIsSubmitting(true);
    const token = Cookies.get('token');
    const formData = new FormData();
    formData.append('charter', charterFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/client/submit-charter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la soumission');
      }

      setSubmittedFile(charterFile.name); // Display the submitted file name
      setCharterFile(null); // Clear the input
      setHasCharter(true); // Hide the form after successful submission
      toast.success('Charte soumise avec succès !');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-gray-700">Chargement...</p>;
  }

  if (hasCharter) {
    return
  }

  return (
    <div className="">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Téléverser la Charte du Propriétaire
      </h2>
      <p className="text-gray-700 mb-4">
        Veuillez sélectionner votre fichier de charte signée. Vous devez soumettre ce document avant de pouvoir faire une réservation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="charter-upload" className="block text-lg font-medium text-gray-700 mb-2">
            Sélectionnez votre charte signée <span className="text-gray-500">(PDF, JPG, PNG, etc.)</span>
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                id="charter-upload"
                type="file"
                onChange={handleFileChange}
                className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting}
              />
              <label
                htmlFor="charter-upload"
                className="text-lg text-white file:mr-4 bg-primary-pink file:py-2 file:px-4 px-4 py-2 rounded-lg file:rounded-full file:border-0 file:text-md file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
              >
                Choisir un fichier
              </label>
            </div>
            {charterFile && (
              <span className="text-gray-700 text-sm">{charterFile.name}</span>
            )}
          </div>
          {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
        </div>

        {submittedFile && (
          <div className="text-gray-700">
            <p>Fichier soumis : <span className="font-medium">{submittedFile}</span></p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !charterFile}
          className={`w-full rounded-md bg-primary-pink text-white py-2 px-4 font-medium transition ${
            isSubmitting || !charterFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600'
          }`}
        >
          {isSubmitting ? 'Soumission...' : 'Soumettre la charte'}
        </button>
      </form>
    </div>
  );
};

export default ClientCharterForm;