import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const ClientCharterForm = () => {
  const [charterFile, setCharterFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFile, setSubmittedFile] = useState(null);
  const [hasCharter, setHasCharter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setSubmittedFile(data.client_charter_filename || 'Charte déjà soumise');
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

      setSubmittedFile(charterFile.name);
      setCharterFile(null);
      setHasCharter(true);
      toast.success('Charte soumise avec succès !');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-gray-700 text-lg animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (hasCharter) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md max-w-lg mx-auto mt-8">
        <h2 className="text-xl font-semibold text-green-700 mb-2">
          Charte déjà soumise
        </h2>
        <p className="text-green-600">
          Votre charte a été téléversée avec succès :{' '}
          <span className="font-medium">{submittedFile}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-md shadow-md w-1/2 my-4">
      <h2 className="text-2xl font-bold text-primary-pink mb-4">
        Téléverser la Charte du Propriétaire
      </h2>
      <p className="text-gray-600 mb-6">
        Avant de réserver une promenade, soumettez votre charte signée. Téléchargez le document, signez-le et téléversez-le ici !
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="charter-upload"
            className="block text-md font-medium text-gray-800 mb-2"
          >
            Votre charte signée{' '}
            <span className="text-gray-500 text-sm">(PDF, JPG, PNG)</span>
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                id="charter-upload"
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isSubmitting}
              />
              <label
                htmlFor="charter-upload"
                className="inline-flex items-center px-4 py-2 bg-primary-pink text-white rounded-md font-semibold cursor-pointer hover:bg-pink-600 transition duration-200"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 4v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6m12 0l4-4m0 0l-4-4"
                  />
                </svg>
                Choisir un fichier
              </label>
            </div>
            {charterFile && (
              <span className="text-gray-700 text-sm truncate max-w-xs">
                {charterFile.name}
              </span>
            )}
          </div>
          {fileError && (
            <p className="text-red-500 text-sm mt-2">{fileError}</p>
          )}
        </div>

        {submittedFile && (
          <div className="bg-green-100 p-3 rounded-md text-green-700">
            <p>
              Fichier soumis :{' '}
              <span className="font-medium">{submittedFile}</span>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !charterFile}
          className={`w-full py-3 px-4 rounded-md font-semibold text-white transition duration-200 ${
            isSubmitting || !charterFile
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-pink hover:bg-pink-600'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                />
              </svg>
              Soumission...
            </span>
          ) : (
            'Soumettre la charte'
          )}
        </button>
      </form>
    </div>
  );
};

export default ClientCharterForm;