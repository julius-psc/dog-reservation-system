import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";

const VolunteerSignup = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [villageInput, setVillageInput] = useState("");
  const [village, setVillage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role] = useState("volunteer");
  const [isAdult, setIsAdult] = useState(null);
  const [commitments, setCommitments] = useState({
    honorWalks: false,
    keepLeash: false,
    reportBehavior: false,
  });
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [signupError, setSignupError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [allVillages, setAllVillages] = useState([]);

  const capitalizeEachWord = (str) => {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(" ")
      .map((word) =>
        word
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("-")
      )
      .join(" ");
  };

  const staticVillageOptions = useMemo(
    () => [
      "Anisy",
      "Authie",
      "Banville",
      "Biéville-Beuville",
      "Blainville-sur-Orne",
      "Caen",
      "Cambes-en-Plaine",
      "Douvres-la-Délivrande",
      "Epron",
      "Hérouville-Saint-Clair",
      "Mathieu",
      "Ouistreham",
      "Périers-sur-le-Dan",
      "Saint-Contest",
      "Vire",
    ].map((village) => capitalizeEachWord(village)),
    []
  );

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/villages`);
        if (!response.ok) throw new Error("Failed to fetch villages");
        const data = await response.json();
        const volunteerVillages = data.villages || [];
        const combinedVillagesSet = [
          ...new Set([...staticVillageOptions, ...volunteerVillages.map((v) => capitalizeEachWord(v))]),
        ];
        const sortedVillages = combinedVillagesSet.sort((a, b) => a.localeCompare(b));
        setAllVillages(sortedVillages);
      } catch (error) {
        console.error("Error fetching villages:", error);
        const sortedVillages = staticVillageOptions.sort((a, b) => a.localeCompare(b));
        setAllVillages(sortedVillages);
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

  // Validation Functions
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Adresse email invalide";
  const validatePhoneNumber = (phoneNumber) =>
    /^[0-9]{10}$/.test(phoneNumber) ? null : "Numéro de téléphone invalide (10 chiffres requis)";
  const validateRequired = (value) => (value.trim() ? null : "Ce champ est obligatoire");
  const validateUsername = (username) =>
    username.length >= 3 ? null : "Le nom d'utilisateur doit comporter au moins 3 caractères";
  const validatePassword = (password) =>
    password.length >= 6 ? null : "Le mot de passe doit comporter au moins 6 caractères";
  const validateCommitments = () =>
    Object.values(commitments).every((val) => val) ? null : "Vous devez accepter tous les engagements";
  const validateInsurance = (file) => (file ? null : "Veuillez téléverser votre certificat d'assurance");
  const validateIsAdult = (value) => (value !== null ? null : "Veuillez indiquer votre statut d’âge");

  const handleVillageInputChange = (e) => {
    const value = e.target.value;
    setVillageInput(value);
    setVillage(value);
    setShowSuggestions(true);
  };

  const handleVillageSelect = (selectedVillage) => {
    setVillage(selectedVillage);
    setVillageInput(selectedVillage);
    setShowSuggestions(false);
    setValidationErrors((prev) => ({ ...prev, village: null }));
  };

  const filteredVillages = allVillages.filter((v) =>
    v.toLowerCase().includes(villageInput.toLowerCase())
  );

  const handleCommitmentChange = (e) => {
    const { name, checked } = e.target;
    setCommitments((prev) => ({ ...prev, [name]: checked }));
    setValidationErrors((prev) => ({ ...prev, commitments: validateCommitments() }));
  };

  const handleInputChange = (e, setter, validator) => {
    setter(e.target.value);
    setValidationErrors((prev) => ({
      ...prev,
      [e.target.name]: validator ? validator(e.target.value) : null,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setInsuranceFile(file);
    setValidationErrors((prev) => ({ ...prev, insurance: validateInsurance(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");
    setValidationErrors({});

    const normalizedVillage = capitalizeEachWord(village.trim());

    const errors = {
      username: validateUsername(username) || validateRequired(username),
      password: validatePassword(password) || validateRequired(password),
      email: validateEmail(email) || validateRequired(email),
      village: validateRequired(normalizedVillage),
      address: validateRequired(address),
      phoneNumber: validatePhoneNumber(phoneNumber) || validateRequired(phoneNumber),
      isAdult: validateIsAdult(isAdult),
      commitments: validateCommitments(),
      insurance: validateInsurance(insuranceFile),
    };

    if (Object.values(errors).some((error) => error)) {
      setValidationErrors(errors);
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("email", email);
    formData.append("village", normalizedVillage.toUpperCase());
    formData.append("role", role);
    formData.append("address", address);
    formData.append("phoneNumber", phoneNumber);
    formData.append("isAdult", isAdult);
    formData.append("commitments", JSON.stringify(commitments));
    formData.append("insurance", insuranceFile);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/register`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || "Échec de l'inscription";
        if (errorData.error?.includes("Username is already taken")) {
          errorMessage = "Nom d'utilisateur déjà pris. Veuillez en choisir un autre.";
        }
        setSignupError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      toast.success("Inscription réussie ! Vous serez redirigé dans 3 secondes.");

      setUsername("");
      setPassword("");
      setEmail("");
      setVillage("");
      setVillageInput("");
      setAddress("");
      setPhoneNumber("");
      setIsAdult(null);
      setCommitments({ honorWalks: false, keepLeash: false, reportBehavior: false });
      setInsuranceFile(null);
      setValidationErrors({});
      setShowSuggestions(false);

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(data.token, role);
        else navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Erreur d'inscription :", error);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        <aside className="relative block h-16 lg:order-last lg:col-span-5 lg:h-full xl:col-span-6">
          <img
            alt="Chien en promenade"
            src="https://images.unsplash.com/photo-1542483525-f50967958e6a?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </aside>

        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-xl lg:max-w-3xl">
            <Link to="/" className="block text-primary-pink">
              Retour à l&#39;accueil
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
              Inscription Bénévole
            </h1>
            <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
              Rejoignez Chiens en Cavale en tant que bénévole et partagez votre passion pour les chiens !
            </p>
            <p className="text-sm text-primary-blue dark:text-gray-400 sm:mt-0">
                  Vous avez déjà un compte ?
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-gray-700 underline dark:text-gray-200 mx-2"
                  >
                    Se connecter
                  </button>
                </p>

            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
              {/* Username */}
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Nom d&#39;utilisateur
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Votre nom d'utilisateur"
                  value={username}
                  onChange={(e) => handleInputChange(e, setUsername, validateUsername)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.username && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => handleInputChange(e, setPassword, validatePassword)}
                    required
                    className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => handleInputChange(e, setEmail, validateEmail)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Village Autocomplete */}
              <div className="col-span-6 sm:col-span-3 relative">
                <label
                  htmlFor="village"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Commune
                </label>
                <input
                  type="text"
                  id="village"
                  name="village"
                  placeholder="Tapez votre commune"
                  value={villageInput}
                  onChange={handleVillageInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {showSuggestions && filteredVillages.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-60 overflow-auto shadow-lg dark:bg-gray-800 dark:border-gray-700">
                    {filteredVillages.map((option) => (
                      <li
                        key={option}
                        onClick={() => handleVillageSelect(option)}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
                {validationErrors.village && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.village}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Adresse
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Votre adresse"
                  value={address}
                  onChange={(e) => handleInputChange(e, setAddress, validateRequired)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.address && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.address}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="col-span-6 sm:col-span-3">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Votre numéro de téléphone (10 chiffres)"
                  value={phoneNumber}
                  onChange={(e) => handleInputChange(e, setPhoneNumber, validatePhoneNumber)}
                  required
                  className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
                {validationErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Age Status */}
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Statut d&#39;âge (requis)
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="isAdult"
                      name="ageStatus"
                      checked={isAdult === true}
                      onChange={() => setIsAdult(true)}
                      className="h-4 w-4 text-primary-pink focus:ring-primary-pink border-gray-300"
                    />
                    <label htmlFor="isAdult" className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                      Je suis majeur(e)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="isMinor"
                      name="ageStatus"
                      checked={isAdult === false}
                      onChange={() => setIsAdult(false)}
                      className="h-4 w-4 text-primary-pink focus:ring-primary-pink border-gray-300"
                    />
                    <label htmlFor="isMinor" className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                      Je suis mineur(e) et je m’engage à fournir une attestation parentale
                    </label>
                  </div>
                </div>
                {validationErrors.isAdult && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.isAdult}
                  </p>
                )}
              </div>

              {/* Commitments */}
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  En tant que bénévole promeneur, je m’engage à :
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="honorWalks"
                      name="honorWalks"
                      checked={commitments.honorWalks}
                      onChange={handleCommitmentChange}
                      className="h-4 w-4 text-primary-pink focus:ring-primary-pink border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                    />
                    <label htmlFor="honorWalks" className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                      Honorer les promenades que j’ai acceptées
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="keepLeash"
                      name="keepLeash"
                      checked={commitments.keepLeash}
                      onChange={handleCommitmentChange}
                      className="h-4 w-4 text-primary-pink focus:ring-primary-pink border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                    />
                    <label htmlFor="keepLeash" className="ml-2 text-sm text-gray-700 replaces-dark:text-gray-200">
                      Tenir le chien en laisse en permanence
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reportBehavior"
                      name="reportBehavior"
                      checked={commitments.reportBehavior}
                      onChange={handleCommitmentChange}
                      className="h-4 w-4 text-primary-pink focus:ring-primary-pink border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                    />
                    <label htmlFor="reportBehavior" className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                      Signaler à Chiens en Cavale tout comportement anormal du chien
                    </label>
                  </div>
                </div>
                {validationErrors.commitments && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.commitments}
                  </p>
                )}
              </div>

              {/* Insurance File */}
              <div className="col-span-6">
                <label
                  htmlFor="insurance"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Attestation de responsabilité civile (JPG, PNG, PDF)
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    id="insurance"
                    name="insurance"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    required
                    className="hidden"
                  />
                  <label
                    htmlFor="insurance"
                    className="inline-flex items-center px-4 py-2 bg-primary-pink text-white rounded-md cursor-pointer hover:bg-pink-600 transition-colors"
                  >
                    Choisir un fichier
                  </label>
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {insuranceFile ? insuranceFile.name : "Aucun fichier sélectionné"}
                  </span>
                </div>
                {validationErrors.insurance && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {validationErrors.insurance}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="col-span-6">
                <button
                  type="submit"
                  className="inline-block shrink-0 rounded-md border border-primary-pink bg-primary-pink px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-primary-pink focus:ring-3 focus:outline-hidden w-full dark:border-primary-pink dark:bg-primary-pink dark:hover:bg-transparent dark:hover:text-primary-pink"
                >
                  S&#39;inscrire en tant que bénévole
                </button>
              </div>

              {/* Login Link */}
              <div className="col-span-6 sm:flex-none sm:items-center sm:gap-4 text-center">
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
};

VolunteerSignup.propTypes = {
  onLoginSuccess: PropTypes.func,
};

export default VolunteerSignup;