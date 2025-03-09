import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Sun, PawPrint } from 'lucide-react';

const HolidayButton = () => {
    const [isOnHoliday, setIsOnHoliday] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmationMessage, setConfirmationMessage] = useState(null);
    const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
    const [showParticles, setShowParticles] = useState(false);

    useEffect(() => {
        const fetchHolidayMode = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = Cookies.get('token');
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/holiday-mode`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setIsOnHoliday(data.holidayMode);
            } catch (error) {
                console.error('Error fetching holiday mode:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHolidayMode();
    }, []);

    const handleToggleHolidayMode = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/holiday-mode`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ holidayMode: !isOnHoliday }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setIsOnHoliday(data.holidayMode);
            if (!isOnHoliday) {
                setConfirmationMessage("Il est l'heure de bronzer au soleil ! Les toutous vous souhaitent des vacances incroyables !");
                setShowParticles(true);
            } else {
                setConfirmationMessage("Les toutous sont ravis de vous revoir !");
            }
            setIsConfirmationVisible(true);
        } catch (error) {
            console.error('Error toggling holiday mode:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmationDismiss = () => {
        setIsConfirmationVisible(false);
        setShowParticles(false);
        setConfirmationMessage(null);
    };

    const SummerParticles = () => (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(10)].map((_, i) => (
                <div
                    key={i}
                    className="absolute text-yellow-300 animate-summer-drift"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `summer-drift ${3 + Math.random() * 3}s infinite ease-in-out`,
                        opacity: 0.6,
                        fontSize: '1.5rem',
                    }}
                >
                    ☀️
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center space-x-2">
                <Sun className="h-5 w-5 text-yellow-500 animate-spin" />
                <span className="text-yellow-600">Préparation de l&#39;été...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Oups, un petit nuage de pluie d&#39;erreurs</div>;
    }

    return (
        <div className="relative mt-6">
            <button
                onClick={handleToggleHolidayMode}
                className={`
                    cursor-pointer
                    transition-all duration-300 ease-in-out
                    transform hover:scale-105
                    flex items-center space-x-2
                    px-6 py-3 rounded-full shadow-lg
                    font-bold text-white
                    ${isOnHoliday 
                        ? 'bg-yellow-400 hover:bg-yellow-500' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }
                `}
                aria-pressed={isOnHoliday}
            >
                {isOnHoliday ? (
                    <>
                        <span>J&#39;ai profite du soleil, je suis de retour ! 🏖️</span>
                    </>
                ) : (
                    <>
                        <span>Je pars en vacances ! ✈</span>
                    </>
                )}
            </button>

            {isConfirmationVisible && (
                <div className="fixed inset-0 bg-gradient-to-b from-yellow-200 via-orange-200 to-blue-300 bg-opacity-80 flex items-center justify-center z-50">
                    <div className="relative bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100 hover:scale-102">
                        {isOnHoliday && showParticles && <SummerParticles />}
                        <div className="text-center space-y-6">
                            <div className="flex justify-center space-x-4">
                                {isOnHoliday ? (
                                    <Sun className="h-12 w-12 text-yellow-500 transition-transform duration-1000 ease-out transform rotate-0 hover:rotate-180" />
                                ) : (
                                    <PawPrint className="h-12 w-12 text-brown-500" />
                                )}
                            </div>
                            <p className="text-xl font-bold whitespace-pre-line text-gray-800">{confirmationMessage}</p>
                            <button
                                onClick={handleConfirmationDismiss}
                                className={`
                                    bg-gradient-to-r 
                                    ${isOnHoliday 
                                        ? 'from-orange-400 to-yellow-500' 
                                        : 'from-blue-400 to-blue-600'}
                                    text-white font-bold py-3 px-6 rounded-full
                                    transform transition-all duration-200
                                    hover:scale-105 hover:shadow-lg cursor-pointer
                                `}
                            >
                                {isOnHoliday ? "C'est parti!" : "Retour au bercail !"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default HolidayButton;