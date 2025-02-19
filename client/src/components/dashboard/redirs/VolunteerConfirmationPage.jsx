import CharterForm from '../forms/CharterForm';
import toast from 'react-hot-toast';

const VolunteerConfirmationPage = () => {

    const handleCharterCompletion = () => {
        toast.success("Charter completed and submitted successfully! Waiting for admin approval."); 
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen font-sans">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 text-center">
                    Volunteer Application Confirmation
                </h2>
            </header>
            <CharterForm onCharterComplete={handleCharterCompletion} />
        </div>
    );
};

export default VolunteerConfirmationPage;