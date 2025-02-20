import { Link } from 'react-router-dom';
import navLogo from '../../assets/landing-page/desktop-landing-navbar-logo.svg';
import emailIcon from '../../assets/landing-page/icons/chiens-email-icon.svg';
import DogButton from '../dashboard/recycled/DogButton';

function Navbar() {
  return (
    <nav className="py-4 md:py-5 lg:py-6 w-full absolute top-0 z-100">
      <div className="container max-w-4xl mx-auto flex items-center justify-between bg-white dark:bg-gray-800 pr-4 md:pr-5 lg:pr-6 rounded-4xl pt-2 md:pt-3 pb-3 md:pb-4 lg:pb-5 px-4 md:px-5 lg:px-6">
        
        {/* Logo (Left Side) - Reduced size with responsive width */}
        <div className="flex items-center">
          <Link to="/" className="font-bold text-base md:text-lg">
            <img 
              className="h-auto w-32 sm:w-40 md:w-48 lg:w-56" 
              src={navLogo} 
              alt="Logo" 
            />
          </Link>
        </div>

        {/* Navigation Links (Center) - Smaller text and spacing */}
        <div className="hidden md:flex space-x-2 lg:space-x-4 pt-2 md:pt-3">
          <Link 
            to="/" 
            className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-xs md:text-sm lg:text-base"
          >
            Accueil
          </Link>
          <Link 
            to="/articles" 
            className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-xs md:text-sm lg:text-base"
          >
            Les bienfaits des promenades
          </Link>
          <Link 
            to="/donate" 
            className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-xs md:text-sm lg:text-base"
          >
            Faire un don
          </Link>
          <a href="mailto:contact@chiensencavale.com">
            <img 
              src={emailIcon} 
              alt="Envoyer un email à Chiens en Cavale" 
              className="w-4 md:w-5 lg:w-6"
            />
          </a>
        </div>

        {/* Login (Right Side) - Always visible */}
        <div className="flex items-center">
          <Link to="/login">
            <DogButton />
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;