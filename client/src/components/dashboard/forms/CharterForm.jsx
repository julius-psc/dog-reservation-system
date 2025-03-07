import { memo, useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie'; // Fixed typo from 'js-cookies'
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import charterPDF from '../../../assets/dashboard/charte-benevole.pdf';

const ProgressIcon = ({ completed }) => (
    <svg
        className={`size-5 transition-opacity duration-300 ${completed ? 'opacity-100' : 'opacity-0'}`}
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 20 20'
        fill='#FEAE23'
    >
        <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 01.414 0l4-4z'
            clipRule='evenodd'
        />
    </svg>
);

ProgressIcon.propTypes = {
    completed: PropTypes.bool.isRequired,
};

const CharterFormComponent = ({ onCharterComplete, volunteerStatus }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [charterFile, setCharterFile] = useState(null);
    const [insuranceFile, setInsuranceFile] = useState(null);
    const [fileErrors, setFileErrors] = useState({ charter: '', insurance: '' });
    const navigate = useNavigate();

    // Move handleLogout outside useEffect to avoid dependency issues
    const handleLogout = useCallback(() => {
        Cookies.remove('token');
        Cookies.remove('userId');
        toast.success('Vous avez été déconnecté.');
        navigate('/login');
    }, [navigate]);

    useEffect(() => {
        if (volunteerStatus === 'pending') {
            setStep(3);
        } else if (volunteerStatus === 'rejected') {
            setStep(1);
        }

        // Logout on page close or refresh
        const handleBeforeUnload = () => {
            Cookies.remove('token');
            Cookies.remove('userId');
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [volunteerStatus]); // Removed handleLogout from dependencies

    const nextStep = useCallback(() => setStep(prev => prev + 1), []);
    const prevStep = useCallback(() => setStep(prev => prev - 1), []);

    const handleFileChange = (type, file) => {
        if (!file) {
            setFileErrors(prev => ({ ...prev, [type]: `Veuillez téléverser votre ${type === 'charter' ? 'charte signée' : 'certificat assurance'}` }));
            return;
        }
        setFileErrors(prev => ({ ...prev, [type]: '' }));
        type === 'charter' ? setCharterFile(file) : setInsuranceFile(file);
    };

    const handleCompletion = useCallback(async () => {
        let hasError = false;
        const newErrors = { charter: '', insurance: '' };

        if (!charterFile) {
            newErrors.charter = 'Veuillez téléverser votre charte signée';
            hasError = true;
        }
        if (!insuranceFile) {
            newErrors.insurance = 'Veuillez téléverser votre certificat d\'assurance';
            hasError = true;
        }

        if (hasError) {
            setFileErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('Session invalide. Veuillez vous reconnecter.');
            }

            const formData = new FormData();
            formData.append('charter', charterFile);
            formData.append('insurance', insuranceFile);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/update-charter`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'La soumission a échoué. Veuillez réessayer.');
            }

            const data = await response.json();
            nextStep(); // Move to step 3
            onCharterComplete(data.user.volunteer_status || 'pending');
            setCharterFile(null);
            setInsuranceFile(null);
            toast.success('Documents soumis avec succès !');

            // Wait 5 seconds, then logout and redirect
            setTimeout(() => {
                handleLogout();
            }, 5000);
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.message);
            handleLogout(); // Logout on error
        } finally {
            setIsSubmitting(false);
        }
    }, [charterFile, insuranceFile, nextStep, onCharterComplete, handleLogout]);

    const renderProgressBar = () => (
        <div aria-label='Progress steps' role='navigation'>
            <div className='relative after:mt-4 after:block after:h-1 after:w-full after:rounded-lg after:bg-gray-200'>
                <ol className='grid grid-cols-3 text-sm font-medium text-gray-500 relative z-20'>
                    {[1, 2, 3].map((stepNumber) => (
                        <li
                            key={stepNumber}
                            className={`relative flex ${stepNumber === 1 ? 'justify-start' : stepNumber === 2 ? 'justify-center' : 'justify-end'} transition-colors duration-300 ${step >= stepNumber ? 'text-primary-yellow' : 'text-gray-500'}`}
                        >
                            <span className={`absolute -bottom-[1.75rem] rounded-full bg-white border-2 ${step >= stepNumber ? 'border-primary-yellow bg-primary-yellow' : 'border-gray-200'} ${stepNumber === 1 ? 'start-0' : stepNumber === 2 ? 'left-1/2 -translate-x-1/2' : 'end-0'}`}>
                                {step >= stepNumber && <ProgressIcon completed={step >= stepNumber} />}
                            </span>
                            <span className='hidden sm:block'>
                                {stepNumber === 1 ? 'Bienvenue' : stepNumber === 2 ? 'Formalités' : 'Confirmation'}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );

    return (
        <div className='fixed inset-0 z-50 bg-gray-100/90 overflow-auto' role='dialog' aria-modal='true'>
            <div className='flex justify-center items-center min-h-screen p-6 md:p-8'>
                <div className='bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full space-y-8'>
                    {renderProgressBar()}

                    <div className='mt-8 space-y-6'>
                        {step === 1 && (
                            <div className='space-y-6 text-center'>
                                <h2 className='text-3xl font-semibold text-gray-900'>
                                    Bienvenue jeune promeneur !
                                </h2>
                                <p className='text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto'>
                                    Merci de vouloir faire une différence dans la vie des chiens ! En rejoignant notre communauté, vous offrirez des promenades joyeuses et sécurisées aux chiens dans le besoin. Commençons par quelques étapes simples.
                                </p>
                                <div className='flex justify-center pt-4'>
                                    <button
                                        onClick={nextStep}
                                        className='rounded-full bg-primary-yellow hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 w-full max-w-xs focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-colors duration-300'
                                        aria-label='Continuer vers les formalités'
                                    >
                                        Continuer
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className='space-y-8'>
                                <h2 className='text-3xl font-semibold text-gray-900 text-center'>
                                    Formalités d&#39;adhésion
                                </h2>
                                <p className='text-lg text-gray-600 text-center max-w-2xl mx-auto'>
                                    Pour garantir une expérience optimale pour tous, veuillez soumettre les documents suivants :
                                </p>

                                <div className='space-y-8'>
                                    {/* Charter Section */}
                                    <div className='bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200'>
                                        <div className='flex items-center space-x-3 mb-4'>
                                            <span className='text-2xl text-primary-yellow'>1.</span>
                                            <p className='text-lg text-gray-700'>
                                                Téléchargez et signez notre{' '}
                                                <a
                                                    href={charterPDF}
                                                    download
                                                    className='text-primary-yellow hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors'
                                                    aria-label='Télécharger la Charte du Promeneur de Chiens'
                                                >
                                                    Charte du Promeneur de Chiens
                                                </a>
                                            </p>
                                        </div>
                                        <label htmlFor='charter-upload' className='block text-md font-medium text-gray-700 mb-2'>
                                            Téléversez la charte signée <span className='text-gray-500 text-sm'>(JPG, PNG, PDF)</span>
                                        </label>
                                        <div className='flex items-center space-x-4'>
                                            <input
                                                id='charter-upload'
                                                type='file'
                                                onChange={(e) => handleFileChange('charter', e.target.files[0])}
                                                className='hidden'
                                                aria-describedby='charter-error'
                                            />
                                            <label
                                                htmlFor='charter-upload'
                                                className='inline-flex items-center px-4 py-2 bg-primary-yellow text-white rounded-lg hover:bg-yellow-500 cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-300'
                                            >
                                                Choisir un fichier
                                            </label>
                                            {charterFile && <span className='text-gray-600 text-sm truncate'>{charterFile.name}</span>}
                                        </div>
                                        {fileErrors.charter && (
                                            <p id='charter-error' className='text-red-500 text-sm mt-2'>{fileErrors.charter}</p>
                                        )}
                                    </div>

                                    {/* Insurance Section */}
                                    <div className='bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200'>
                                        <div className='flex items-center space-x-3 mb-4'>
                                            <span className='text-2xl text-primary-yellow'>2.</span>
                                            <p className='text-lg text-gray-700'>
                                                Fournissez une attestation d&#39;assurance responsabilité civile valide
                                            </p>
                                        </div>
                                        <label htmlFor='insurance-upload' className='block text-md font-medium text-gray-700 mb-2'>
                                            Téléversez votre attestation <span className='text-gray-500 text-sm'>(JPG, PNG, PDF)</span>
                                        </label>
                                        <div className='flex items-center space-x-4'>
                                            <input
                                                id='insurance-upload'
                                                type='file'
                                                onChange={(e) => handleFileChange('insurance', e.target.files[0])}
                                                className='hidden'
                                                aria-describedby='insurance-error'
                                            />
                                            <label
                                                htmlFor='insurance-upload'
                                                className='inline-flex items-center px-4 py-2 bg-primary-yellow text-white rounded-lg hover:bg-yellow-500 cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-300'
                                            >
                                                Choisir un fichier
                                            </label>
                                            {insuranceFile && <span className='text-gray-600 text-sm truncate'>{insuranceFile.name}</span>}
                                        </div>
                                        {fileErrors.insurance && (
                                            <p id='insurance-error' className='text-red-500 text-sm mt-2'>{fileErrors.insurance}</p>
                                        )}
                                        <p className='text-sm text-gray-600 mt-2'>
                                            C&#39;est quoi une attestation civile ?{' '}
                                            <a
                                                href='https://www.groupama.fr/assurance-habitation/conseils/attestation-responsabilite-civile/'
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-primary-yellow hover:underline font-semibold'
                                                aria-label='Découvrir une attestation civile sur groupama.fr'
                                            >
                                               Découvrir ici
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className='flex flex-col sm:flex-row justify-center gap-4'>
                                    <button
                                        onClick={prevStep}
                                        className='w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors duration-300'
                                        aria-label='Retour à l’étape précédente'
                                    >
                                        Retour à la page précédente
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className='w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-500 transition-colors duration-300'
                                        aria-label='Se déconnecter'
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleCompletion}
                                        disabled={isSubmitting}
                                        className={`w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-colors duration-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        aria-label='Soumettre les documents'
                                    >
                                        {isSubmitting ? 'Soumission...' : 'Valider'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className='text-center space-y-6'>
                                <h2 className='text-3xl font-semibold text-gray-900'>
                                    Merci d&#39;avoir rejoint Chiens en Cavale !
                                </h2>
                                <p className='text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto'>
                                    Votre demande est en cours d&#39;examen par notre équipe. Cela prend généralement 24 à 48 heures. Vous recevrez un e-mail une fois votre adhésion approuvée. Vous serez redirigé vers la page de connexion dans quelques secondes...
                                </p>
                                <p className='text-md text-gray-600'>
                                    Des questions ? Contactez-nous à{' '}
                                    <a
                                        href='mailto:contact.chiensencavale@gmail.com'
                                        className='text-primary-yellow hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors'
                                        aria-label='Envoyer un email à contact.chiensencavale@gmail.com'
                                    >
                                        contact.chiensencavale@gmail.com
                                    </a>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

CharterFormComponent.propTypes = {
    onCharterComplete: PropTypes.func.isRequired,
    volunteerStatus: PropTypes.string,
};

const CharterForm = memo(CharterFormComponent);
export default CharterForm;