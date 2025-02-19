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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/volunteer/holiday-mode`, {
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
                setConfirmationMessage("Woohoo ! Temps de bronzer ! 🌴✨\nLes toutous vous souhaitent de bonnes vacances !");
            } else {
                setConfirmationMessage("Yay ! Les toutous sont super contents de vous revoir ! 🐾💖");
            }
            setIsConfirmationVisible(true);
            setShowParticles(true);
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

    const Particles = () => (
        <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className={`
                        absolute animate-ping
                        ${Math.random() > 0.5 ? 'text-yellow-400' : 'text-blue-400'}
                    `}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `ping ${1 + Math.random() * 2}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                        opacity: Math.random(),
                        transform: `scale(${0.5 + Math.random()})`,
                    }}
                >
                    {Math.random() > 0.5 ? '✨' : '🌟'}
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                <span>Chargement en cours...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Oops ! Quelque chose s&#39;est mal passé 😅</div>;
    }

    return (
        <div className="relative">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative bg-white rounded-xl p-8 max-w-md w-full mx-4 transform animate-bounce-gentle">
                        {showParticles && <Particles />}
                        <div className="text-center space-y-6">
                            <div className="flex justify-center space-x-4">
                                {isOnHoliday ? (
                                    <>
                                        <Sun className="h-12 w-12 text-yellow-400 animate-spin-slow" />
                                    </>
                                ) : (
                                    <>
                                        <PawPrint className="h-12 w-12 text-brown-400 animate-bounce-gentle" />
                                    </>
                                )}
                            </div>
                            <p className="text-xl font-bold whitespace-pre-line">{confirmationMessage}</p>
                            <button
                                onClick={handleConfirmationDismiss}
                                className="bg-gradient-to-r from-blue-400 to-blue-600 
                                         text-white font-bold py-3 px-6 rounded-full
                                         transform transition-all duration-200
                                         hover:scale-105 hover:shadow-lg cursor-pointer "
                            >
                                {isOnHoliday ? "À bientôt ! 👋" : "C'est parti ! 🎉"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayButton;