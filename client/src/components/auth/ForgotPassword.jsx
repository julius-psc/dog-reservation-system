import { useState } from "react";
import PropTypes from "prop-types";
import toast from 'react-hot-toast';

const ForgotPassword = ({ onBackToLogin }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setRequestSent(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to send reset email.");
        setRequestSent(false);
        throw new Error(errorData.error || "Failed to send reset email.");
      }

      const data = await response.json();
      toast.success(data.message || "Reset email sent successfully!");
      setUsernameOrEmail("");
      setRequestSent(false);

    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Failed to send reset email.");
      setRequestSent(false);
    }
  };

  return (
    <form onSubmit={handleForgotPasswordSubmit} className="mt-8 grid grid-cols-6 gap-6">
      <div className="col-span-6">
        <label htmlFor="forgot-username" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Nom d&#39;utilisateur ou email
        </label>
        <input
          type="text"
          id="forgot-username"
          placeholder="Votre nom d'utilisateur ou email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          required
          className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      <div className="col-span-6">
        <button
          type="submit"
          disabled={requestSent}
          className="inline-block shrink-0 rounded-md border border-primary-pink bg-primary-pink px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-primary-pink  cursor-pointer focus:ring-3 focus:outline-hidden w-full dark:border-pink-400 dark:bg-pink-400 dark:hover:bg-transparent dark:hover:text-blue-500 disabled:opacity-50"
        >
          {requestSent ? "Envoi du mail..." : "Réinitialiser votre mot de passe"}
        </button>
      </div>
      <div className="col-span-6 text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="mt-2 text-sm text-gray-500 underline dark:text-gray-400"
        >
          Retour à la connexion
        </button>
      </div>
    </form>
  );
};

ForgotPassword.propTypes = {
  onBackToLogin: PropTypes.func.isRequired,
};

export default ForgotPassword;