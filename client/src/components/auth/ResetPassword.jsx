import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast'; // Import toast

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resettingPassword, setResettingPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setResettingPassword(true);

        if (newPassword !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas."); // Use toast.error
            setResettingPassword(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                toast.error(data.error || "Échec de la réinitialisation du mot de passe."); 
            }
        } catch (err) {
            toast.error(`Erreur serveur: ${err.message || 'Unknown error'}`); 
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <div className="reset-password-container bg-gray-50 dark:bg-gray-900 min-h-screen flex justify-center items-center p-6">
            <div className="bg-white rounded-md shadow-xl p-8 max-w-md w-full dark:bg-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Réinitialisation du mot de passe</h2>

                <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            id="new-password"
                            placeholder="Nouveau mot de passe"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>
                    <div className="col-span-6">
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="mt-1 py-2 px-3 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>
                    <div className="col-span-6">
                        <button
                            type="submit"
                            disabled={resettingPassword}
                            className="inline-block shrink-0 rounded-md border border-pink-500 bg-pink-400 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:ring-3 focus:outline-hidden w-full dark:border-pink-400 dark:bg-pink-400 dark:hover:bg-transparent dark:hover:text-blue-500 disabled:opacity-50"
                        >
                            {resettingPassword ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;