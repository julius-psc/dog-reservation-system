import PropTypes from 'prop-types';

const LogoutButton = ({ handleLogout }) => {
  return (
    <button
      onClick={handleLogout}
      className="bg-primary-black hover:bg-white text-white hover:text-primary-black font-semibold py-2 px-4 my-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out cursor-pointer border border-primary-black hover:border-white"
      type="button"
    >
      Se déconnecter
    </button>
  );
};

LogoutButton.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default LogoutButton;