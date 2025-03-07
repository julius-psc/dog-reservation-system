import PropTypes from "prop-types";

const VolunteerPendingApproval = ({ handleLogout }) => {

  return (
    <div className='fixed inset-0 z-50 bg-gray-100/90 overflow-auto flex justify-center items-center p-6 md:p-8'>
      <div className='bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full space-y-6 text-center'>
        <h2 className='text-3xl font-semibold text-gray-900'>
          En attente de validation
        </h2>
        <p className='text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto'>
          Veuillez attendre la confirmation d&#39;un administrateur. Votre demande est en cours de traitement (24-48 heures). Vous recevrez un e-mail une fois approuvée. Merci de votre patience !
        </p>
        <p className='text-md text-gray-600'>
          Des questions ? Contactez-nous à{' '}
          <a
            href='mailto:contact.chiensencavale@gmail.com'
            className='text-primary-yellow hover:underline font-semibold'
          >
            contact.chiensencavale@gmail.com
          </a>
        </p>
        <div className='flex justify-center gap-4'>
          <button
            onClick={handleLogout}
            className='px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-500 transition-colors duration-300'
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

VolunteerPendingApproval.propTypes = {
  handleLogout: PropTypes.func.isRequired
};

export default VolunteerPendingApproval;