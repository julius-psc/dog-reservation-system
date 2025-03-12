import { useState } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import ForgotPassword from "./ForgotPassword";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Login = ({ onLogin, setError }) => {
  const [identifier, setIdentifier] = useState(""); // Changed from username to identifier
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for show/hide password

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }), // Updated to use identifier
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur de réponse:", errorData);
        toast.error(errorData.error || "Échec de la connexion");
        return;
      }

      const data = await response.json();
      console.log("Réponse de l'API:", data);

      if (data && data.token && data.user && data.user.id && data.user.role) {
        Cookies.set("token", data.token, { expires: 7 });
        Cookies.set("userId", data.user.id, { expires: 7 });
        onLogin(data.token, data.user.role);
        toast.success("Connexion réussie !");
      } else {
        console.error("Réponse de connexion invalide:", data);
        toast.error("Réponse de connexion invalide. Veuillez réessayer.");
        if (setError) {
          setError("Réponse de connexion invalide. Veuillez réessayer.");
        }
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error(error.message);
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
      {/* Email or Username */}
      <div className="col-span-6">
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Email ou nom d&#39;utilisateur
        </label>
        <input
          type="text"
          id="identifier"
          placeholder="Email ou nom d'utilisateur"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Password with Show/Hide */}
      <div className="col-span-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            {showPassword ? (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="col-span-6">
        <button
          type="submit"
          className="cursor-pointer inline-block shrink-0 rounded-md border border-pink-500 bg-primary-pink px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-primary-pink focus:ring-3 focus:outline-hidden w-full dark:border-primary-pink dark:bg-primary-pink dark:hover:bg-transparent dark:hover:text-primary-pink"
        >
          Se connecter
        </button>
      </div>

      {/* Signup Links */}
      <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
          Vous n&#39;avez pas de compte ?
        </p>
      </div>

      <div className="col-span-6 text-center -mt-2">
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/volunteer-signup" className="text-gray-700 underline dark:text-gray-200">
            Je n&#39;ai pas de compte et je souhaite devenir promeneur
          </Link>
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/client-signup" className="text-gray-700 underline dark:text-gray-200">
            Je n&#39;ai pas de compte et je suis propriétaire
          </Link>
        </p>
        <button
          type="button"
          onClick={handleForgotPasswordClick}
          className="cursor-pointer mt-4 text-sm text-gray-500 underline dark:text-gray-400"
        >
          Mot de passe oublié ?
        </button>
      </div>
    </form>
  );

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        {/* Side Image */}
        <aside className="relative block h-16 lg:order-last lg:col-span-5 lg:h-full xl:col-span-6">
          <img
            alt=""
            src="https://images.unsplash.com/photo-1542483525-f50967958e6a?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </aside>

        {/* Main Content */}
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-xl lg:max-w-3xl relative">
            <Link to="/" className="block text-primary-pink">
              Retour à l&#39;accueil
            </Link>

            <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
              Bienvenue sur Chiens en Cavale 🦮
            </h1>

            <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
              Association de promenades 100% gratuites en France
            </p>

            {!showForgotPassword ? renderLoginForm() : <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />}
          </div>
        </main>
      </div>
    </section>
  );
};

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
  setError: PropTypes.func,
};

export default Login;