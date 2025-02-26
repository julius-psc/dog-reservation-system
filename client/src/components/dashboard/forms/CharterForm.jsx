import { memo, useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import charterPDF from '../../../assets/dashboard/charte-benevole.pdf';

// Composant d'icône de progression réutilisable - Déjà bien conçu
const ProgressIcon = ({ completed }) => (
    <svg
        className={`size-5 transition-opacity duration-300 ${completed ? 'opacity-100' : 'opacity-0'}`}
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 20 20'
        fill='#FEAE23' // Changed to primary yellow for progress icon fill
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
    const navigate = useNavigate(); // Hook for programmatic navigation

    useEffect(() => {
        if (volunteerStatus === 'pending') {
            setStep(3);
        } else if (volunteerStatus === 'rejected') {
            setStep(1);
        }
    }, [volunteerStatus]);

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
                toast.error(errorData.error || 'La soumission a échoué. Veuillez réessayer.');
                throw new Error(errorData.error || 'La soumission a échoué. Veuillez réessayer.');
            }

            const data = await response.json();
            nextStep();
            onCharterComplete(data.user.volunteer_status || 'pending');
            setCharterFile(null);
            setInsuranceFile(null);
            toast.success('Documents soumis avec succès !');

            // Remove cookies and redirect to /login
            Cookies.remove('token');
            Cookies.remove('userId'); // Remove any other relevant cookies if applicable
            setTimeout(() => navigate('/login'), 3000)
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [charterFile, insuranceFile, nextStep, onCharterComplete, navigate]);

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
            <div className='flex justify-center items-center min-h-screen p-6 md:p-4'>
                <div className='bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full space-y-8 md:space-y-6'>
                    {renderProgressBar()}

                    <div className='mt-8 space-y-8 md:space-y-6'>
                        {step === 1 && (
                            <div className='space-y-5'>
                                <h2 className='text-3xl font-semibold text-gray-900 text-center'>
                                    Bienvenue jeune promeneur !
                                </h2>
                                <p className='text-lg text-gray-700 text-center'>
                                    Merci de vouloir faire une différence dans la vie des chiens ! En rejoignant notre communauté de bénévoles,
                                    vous contribuerez à offrir des promenades joyeuses et des aventures sécurisées aux chiens dans le besoin. Commençons par quelques exigences simples pour assurer la sécurité et le plaisir de tous.
                                </p>
                                <div className='flex justify-center'>
                                    <button
                                        onClick={nextStep}
                                        className='rounded-full bg-primary-yellow hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:ring-opacity-50 transition-colors duration-300'
                                    >
                                        Continuer
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className='space-y-6'>
                                <h2 className='text-3xl font-semibold text-gray-900 text-center'>Formalités d&#39;adhésion</h2>
                                <p className='text-lg text-gray-700 text-center'>
                                    Pour garantir la meilleure expérience à nos bénévoles et à nos amis à fourrure, nous exigeons :
                                </p>

                                <div className='space-y-8'>
                                    <div className='flex items-start space-x-3'>
                                        <div className='flex-shrink-0'>
                                            <span className='text-xl text-gray-700'>•</span>
                                        </div>
                                        <div>
                                            <p className='text-lg text-gray-700'>
                                                Téléchargez et signez notre{' '}
                                                <a
                                                    href={charterPDF}
                                                    download
                                                    className='text-primary-yellow hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:ring-opacity-50 transition-colors duration-300'
                                                >
                                                    Charte du Promeneur de Chiens
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                    <div className='flex items-start space-x-3'>
                                        <div className='flex-shrink-0'>
                                            <span className='text-xl text-gray-700'>•</span>
                                        </div>
                                        <div>
                                            <p className='text-lg text-gray-700'>
                                                Fournissez une documentation d&#39;assurance responsabilité civile pour animaux de compagnie valide
                                            </p>
                                        </div>
                                    </div>

                                    <div className='space-y-6'>
                                        <div>
                                            <label htmlFor='charter-upload' className='block text-lg font-medium text-gray-700 mb-3'>
                                                Téléversez la charte promeneur signée ici   
                                                <span className='text-gray-500 ml-1'>(JPG, PNG, PDF, etc.)</span>
                                            </label>
                                            <div className='flex items-center space-x-4'>
                                                <div className='relative'>
                                                    <input
                                                        id='charter-upload'
                                                        type='file'
                                                        onChange={(e) => handleFileChange('charter', e.target.files[0])}
                                                        className='peer absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                                                    />
                                                    <label
                                                        htmlFor='charter-upload'
                                                        className='text-lg text-white file:mr-4 bg-primary-yellow file:py-2 file:px-4 px-4 py-2 rounded-lg file:rounded-full file:border-0 file:text-md file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer'
                                                    >
                                                        Choisir un fichier
                                                    </label>
                                                </div>
                                                {charterFile && (
                                                    <span className='text-gray-700 dark:text-gray-500 text-sm'>
                                                        {charterFile.name}
                                                    </span>
                                                )}
                                            </div>
                                            {fileErrors.charter && (
                                                <p className='text-red-500 text-sm mt-1'>{fileErrors.charter}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor='insurance-upload' className='block text-lg font-medium text-gray-700 mb-3'>
                                                Téléverser l&#39;attestation de responsabilitié civile ici
                                                <span className='text-gray-500 ml-1'>(JPG, PNG, PDF, etc.)</span>
                                            </label>
                                            <div className='flex items-center space-x-4'>
                                                <div className='relative'>
                                                    <input
                                                        id='insurance-upload'
                                                        type='file'
                                                        onChange={(e) => handleFileChange('insurance', e.target.files[0])}
                                                        className='peer absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                                                    />
                                                    <label
                                                        htmlFor='insurance-upload'
                                                        className='text-lg text-white file:mr-4 bg-primary-yellow file:py-2 file:px-4 px-4 py-2 rounded-lg file:rounded-full file:border-0 file:text-md file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer'
                                                    >
                                                        Choisir un fichier
                                                    </label>
                                                </div>
                                                {insuranceFile && (
                                                    <span className='text-gray-700 dark:text-gray-300 text-sm'>
                                                        {insuranceFile.name}
                                                    </span>
                                                )}
                                            </div>
                                            {fileErrors.insurance && (
                                                <p className='text-red-500 text-sm mt-1'>{fileErrors.insurance}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className='flex flex-col sm:flex-row justify-center gap-6 mt-8'>
                                        <button
                                            onClick={prevStep}
                                            className='order-2 sm:order-1 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-6 flex-1 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition-colors duration-300'
                                        >
                                            Retour
                                        </button>
                                        <button
                                            onClick={handleCompletion}
                                            disabled={isSubmitting}
                                            className={`order-1 sm:order-2 rounded-full bg-primary-yellow hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 flex-1 focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:ring-opacity-50 transition-colors duration-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? 'Soumission...' : 'Soumettre les documents'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className='text-center space-y-5'>
                                <h2 className='text-3xl font-semibold text-gray-900'>
                                    Merci d&#39;avoir rejoint Chiens en Cavale !
                                </h2>
                                <p className='text-lg text-gray-700'>
                                    Votre demande est maintenant en cours d&#39;examen par notre équipe. Nous traitons généralement les demandes dans un délai de 24 à 48 heures. Vous recevrez une notification par e-mail une fois votre adhésion approuvée.
                                </p>
                                <p className='text-gray-600 text-md'>
                                    En attendant, n&#39;hésitez pas à nous contacter à{' '}
                                    <a
                                        href='mailto:contact@chiensencavale.com'
                                        className='text-primary-yellow hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:ring-opacity-50 transition-colors duration-300'
                                    >
                                        contact@chiensencavale.com
                                    </a>{' '}
                                    si vous avez des questions.
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