import { useState } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDog } from "@fortawesome/free-solid-svg-icons";

const DogProfilesManager = ({
  dogs,
  setDogs,
  selectedDog,
  setSelectedDog,
  fetchDogData,
}) => {
  const [showDogForm, setShowDogForm] = useState(false);
  const [dogData, setDogData] = useState({ name: "", breed: "", age: "" });

  const handleDogFormChange = (e) => {
    setDogData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDogFormSubmit = async (e) => {
    e.preventDefault();
    const ageAsNumber = Number(dogData.age);

    if (isNaN(ageAsNumber) || ageAsNumber < 0) {
      toast.error("Veuillez entrer un âge valide (nombre positif).");
      return;
    }

    try {
      const token = Cookies.get("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addDog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: dogData.name,
          breed: dogData.breed,
          age: ageAsNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP ! Statut : ${response.status}`);
      }

      const newDogData = await response.json();
      setDogs((prevDogs) => [...prevDogs, newDogData]);
      setShowDogForm(false);
      setSelectedDog(newDogData);
      toast.success("Profil du chien ajouté avec succès !");
      setDogData({ name: "", breed: "", age: "" });
      fetchDogData(); // Refresh dog data
    } catch (error) {
      console.error("Erreur lors de l'ajout du chien :", error);
      toast.error(`Erreur lors de l'ajout du chien : ${error.message}`);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <FontAwesomeIcon icon={faDog} className="mr-2" />
        Mes profils chiens
      </h3>
      {showDogForm ? (
        <form onSubmit={handleDogFormSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="dogName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nom du chien
            </label>
            <input
              type="text"
              id="dogName"
              name="name"
              placeholder="Nom du chien"
              value={dogData.name}
              onChange={handleDogFormChange}
              required
              className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
            />
          </div>
          <div>
            <label
              htmlFor="breed"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Race
            </label>
            <input
              type="text"
              id="breed"
              name="breed"
              placeholder="Race"
              value={dogData.breed}
              onChange={handleDogFormChange}
              required
              className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
            />
          </div>
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Âge
            </label>
            <input
              type="number"
              id="age"
              name="age"
              placeholder="Âge"
              value={dogData.age}
              onChange={handleDogFormChange}
              min="0"
              max="20"
              step="1"
              required
              className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
            />
          </div>
          <div className="flex justify-start">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
            >
              Ajouter un profil chien
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 dark:text-gray-300">
          {dogs.length > 0 && (
            <div className="space-y-3">
              {dogs.map((dog) => (
                <div
                  key={dog.id}
                  className="p-4 border rounded-md border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                >
                  <p className="dark:text-gray-300 text-sm">
                    <span className="font-semibold dark:text-gray-100">Nom:</span>{" "}
                    {dog.name}
                  </p>
                  <p className="dark:text-gray-300 text-sm">
                    <span className="font-semibold dark:text-gray-100">Race:</span>{" "}
                    {dog.breed}
                  </p>
                  <p className="dark:text-gray-300 text-sm">
                    <span className="font-semibold dark:text-gray-100">Âge:</span>{" "}
                    {dog.age}
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowDogForm(true)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
          >
            Ajouter un autre profil chien
          </button>
        </div>
      )}
      {dogs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Choix du chien pour la réservation
          </h4>
          <select
            value={selectedDog ? selectedDog.id : ""}
            onChange={(e) => {
              const selectedDogData = dogs.find((dog) => dog.id === e.target.value);
              setSelectedDog(selectedDogData);
            }}
            className="block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="">Sélectionnez un chien</option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.name} ({dog.breed})
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
};

DogProfilesManager.propTypes = {
  dogs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      breed: PropTypes.string.isRequired,
      age: PropTypes.number.isRequired,
    })
  ).isRequired,
  setDogs: PropTypes.func.isRequired,
  selectedDog: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    breed: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
  }),
  setSelectedDog: PropTypes.func.isRequired,
  fetchDogData: PropTypes.func.isRequired,
};

export default DogProfilesManager;