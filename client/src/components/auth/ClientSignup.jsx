import { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";

const ClientSignup = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [village, setVillage] = useState("");
  const [showAutresCommunesForm, setShowAutresCommunesForm] = useState(false);
  const [autreCommuneVillageSouhaite, setAutreCommuneVillageSouhaite] = useState("");
  const [role, setRole] = useState("client");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupError, setSignupError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [noRiskConfirmed, setNoRiskConfirmed] = useState(false); // New state for "no risk"
  const [unableToWalkConfirmed, setUnableToWalkConfirmed] = useState(false); // New state for "unable to walk"
  const [photoPermission, setPhotoPermission] = useState(false); // New state for optional photo permission
  const [allVillages, setAllVillages] = useState([]);

  // Memoized static village options
  const staticVillageOptions = useMemo(() => [
    "Anisy", "Mathieu", "Epron", "Cambes-en-Plaine", "Authie",
    "Saint-Contest", "Banville", "Biéville-Beuville", "Périers-sur-le-Dan",
    "Blainville-sur-Orne", "Caen", "Douvres-la-Délivrande",
    "Hérouville-Saint-Clair", "Ouistreham", "Vire", "Autres communes"
  ], []);

  // Fetch villages from the server
  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/villages`);
        if (!response.ok) throw new Error("Failed to fetch villages");
        const data = await response.json();
        const volunteerVillages = data.villages || [];
        const combinedVillages = [...new Set([...staticVillageOptions, ...volunteerVillages])].sort();
        setAllVillages(combinedVillages);
      } catch (error) {
        console.error("Error fetching villages:", error);
        setAllVillages(staticVillageOptions);
      }
    };
    fetchVillages();
  }, [staticVillageOptions]);

  useEffect(() => {
    if (signupError) {
      toast.error(signupError);
      setSignupError("");
    }
  }, [signupError]);

  // --- Validation Functions ---
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Adresse email invalide";
  const validatePhoneNumber = (phoneNumber) => /^[0-9]{10}$/.test(phoneNumber) ? null : "Numéro de téléphone invalide (10 chiffres requis)";
  const validateRequired = (value) => value.trim() ? null : "Ce champ est obligatoire";
  const validateUsername = (username) => username.length >= 3 ? null : "Nom d'utilisateur doit avoir au moins 3 caractères";
  const validatePassword = (password) => password.length >= 6 ? null : "Mot de passe doit avoir au moins 6 caractères";
  const validateCheckbox = (checked) => checked ? null : "Vous devez cocher cette case";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");
    setValidationErrors({});

    let errors = {};
    errors.username = validateUsername(username) || validateRequired(username);
    errors.password = validatePassword(password) || validateRequired(password);
    errors.email = validateEmail(email) || validateRequired(email);
    errors.village = validateRequired(village);
    errors.address = validateRequired(address);
    errors.phoneNumber = validatePhoneNumber(phoneNumber) || validateRequired(phoneNumber);
    errors.noRiskConfirmed = validateCheckbox(noRiskConfirmed);
    errors.unableToWalkConfirmed = validateCheckbox(unableToWalkConfirmed);

    if (showAutresCommunesForm) {
      errors.autreCommuneVillageSouhaite = validateRequired(autreCommuneVillageSouhaite);
    }

    if (Object.values(errors).some(error => error)) {
      setValidationErrors(errors);
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    let endpoint = `${import.meta.env.VITE_API_BASE_URL}/register`;
    let registrationData = {
      username, password, email, village, role, address, phoneNumber,
      noRiskConfirmed, unableToWalkConfirmed, photoPermission // Include checkbox data
    };

    if (showAutresCommunesForm) {
      endpoint = `${import.meta.env.VITE_API_BASE_URL}/client/other-village`;
      registrationData = {
        autreCommuneNom: username,
        autreCommuneEmail: email,
        autreCommuneTelephone: phoneNumber,
        autreCommuneVillageSouhaite,
        village: "Autres communes",
        role: "client",
        noRiskConfirmed, unableToWalkConfirmed, photoPermission
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || "Signup failed";
        if (errorData.error?.includes("Username is already taken")) {
          errorMessage = "Nom d'utilisateur déjà pris. Veuillez en choisir un autre.";
        }
        setSignupError(errorMessage);
        throw new Error(errorMessage);
      }

      setUsername("");
      setPassword("");
      setEmail("");
      setVillage("");
      setShowAutresCommunesForm(false);
      setAutreCommuneVillageSouhaite("");
      setRole("client");
      setAddress("");
      setPhoneNumber("");
      setNoRiskConfirmed(false);
      setUnableToWalkConfirmed(false);
      setPhotoPermission(false);
      setValidationErrors({});

      const successMessage = showAutresCommunesForm
        ? "Demande envoyée avec succès ! Vous serez redirigé vers la page de connexion dans 3 secondes."
        : "Inscription réussie ! Vous serez redirigé vers la page de connexion dans 3 secondes.";
      toast.success(successMessage);

      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error("Signup Error:", error);
    }
  };

  const handleVillageChange = (e) => {
    setVillage(e.target.value);
    setShowAutresCommunesForm(e.target.value === "Autres communes");
  };

  const handleInputChange = (e, setter, validator) => {
    setter(e.target.value);
    if (validator) {
      setValidationErrors(prevErrors => ({ ...prevErrors, [e.target.name]: validator(e.target.value) }));
    } else {
      setValidationErrors(prevErrors => ({ ...prevErrors, [e.target.name]: null }));
    }
  };

  const handleCheckboxChange = (e, setter, fieldName) => {
    setter(e.target.checked);
    setValidationErrors(prevErrors => ({
      ...prevErrors,
      [fieldName]: e.target.checked ? null : "Vous devez cocher cette case"
    }));
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        <aside className="relative block h-16 lg:order-last lg:col-span-5 lg:h-full xl:col-span-6">
          <img
            alt=""
            src="https://images.unsplash.com/photo-1542483525-f50967958e6a?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </aside>

        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-xl lg:max-w-3xl">
            <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
              Inscription propriétaire de chien
            </h1>

            <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
              Rejoignez Chiens en Cavale pour des promenades gratuites en France!
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
              {/* Existing Fields */}
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nom d&#39;utilisateur</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => handleInputChange(e, setUsername, validateUsername)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.username && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.username}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => handleInputChange(e, setPassword, validatePassword)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.password && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.password}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => handleInputChange(e, setEmail, validateEmail)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.email && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.email}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Numéro de téléphone portable</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Numéro de téléphone (10 chiffres)"
                  value={phoneNumber}
                  onChange={(e) => handleInputChange(e, setPhoneNumber, validatePhoneNumber)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.phoneNumber && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.phoneNumber}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="village" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Commune de résidence</label>
                <div className="relative">
                  <select
                    id="village"
                    name="village"
                    value={village}
                    onChange={handleVillageChange}
                    required
                    className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 appearance-none"
                  >
                    <option value="" disabled>Sélectionnez votre commune</option>
                    {allVillages.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                {validationErrors.village && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.village}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Voie</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Adresse"
                  value={address}
                  onChange={(e) => handleInputChange(e, setAddress, validateRequired)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.address && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.address}</p>}
              </div>

              {showAutresCommunesForm && (
                <div className="col-span-6 p-4 bg-gray-50 rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Demande pour autres communes</h3>
                  <input
                    type="text"
                    placeholder="Commune souhaitée"
                    name="autreCommuneVillageSouhaite"
                    value={autreCommuneVillageSouhaite}
                    onChange={(e) => handleInputChange(e, setAutreCommuneVillageSouhaite, validateRequired)}
                    required
                    className="col-span-6 mt-1 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs mb-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  />
                  {validationErrors.autreCommuneVillageSouhaite && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.autreCommuneVillageSouhaite}</p>}
                </div>
              )}

              {/* New Checkboxes */}
              <div className="col-span-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">J&#39;atteste sur l&#39;honneur que :</p>

                {validationErrors.noRiskConfirmed && <p className="text-xs text-red-500 dark:text-red-400">{validationErrors.noRiskConfirmed}</p>}
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    name="noRiskConfirmed"
                    checked={noRiskConfirmed}
                    onChange={(e) => handleCheckboxChange(e, setNoRiskConfirmed, "noRiskConfirmed")}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink dark:bg-gray-800 dark:border-gray-600"
                    required
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Mon animal ne présente aucun risque pour le promeneur (pas d&#39;antécédents d&#39;agressivité, morsures ou autres comportements dangereux).</span>
                </label>
            

                {validationErrors.unableToWalkConfirmed && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{validationErrors.unableToWalkConfirmed}</p>}
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    name="unableToWalkConfirmed"
                    checked={unableToWalkConfirmed}
                    onChange={(e) => handleCheckboxChange(e, setUnableToWalkConfirmed, "unableToWalkConfirmed")}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink dark:bg-gray-800 dark:border-gray-600"
                    required
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Je ne suis pas en mesure de promener ou de faire promener mon chien quotidiennement.</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="photoPermission"
                    checked={photoPermission}
                    onChange={(e) => setPhotoPermission(e.target.checked)}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink dark:bg-gray-800 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">J&#39;autorise Chiens en Cavale à diffuser les photographies de mon chien (réseaux sociaux, supports de communication, ...)</span>
                </label>
              </div>

              <div className="col-span-6">
                <button
                  type="submit"
                  className="inline-block shrink-0 rounded-md border border-primary-pink bg-primary-pink px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-primary-pink focus:ring-3 focus:outline-hidden w-full dark:border-primary-pink dark:bg-primary-pink dark:hover:bg-transparent dark:hover:text-primary-pink"
                >
                  {showAutresCommunesForm ? "Envoyer la demande" : "S'inscrire en tant que propriétaire de chien"}
                </button>
              </div>

              <div className="col-span-6 sm:col-span-6 sm:flex-none sm:items-center sm:gap-4 text-center">
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                  Vous avez déjà un compte ?
                  <button type="button" onClick={() => navigate('/login')} className="text-gray-700 underline dark:text-gray-200 mx-2">
                    Se connecter
                  </button>
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
};

export default ClientSignup;