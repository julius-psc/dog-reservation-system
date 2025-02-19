import { Link } from 'react-router-dom';
import navLogo from '../../assets/landing-page/desktop-landing-navbar-logo.svg';
import emailIcon from '../../assets/landing-page/icons/chiens-email-icon.svg';
import DogButton from '../dashboard/recycled/DogButton';

function Navbar() {
  return (
    <nav className="py-10 w-[100%] absolute top-0 z-100">
      <div className="container mx-auto flex items-center justify-between bg-white dark:bg-gray-800 pr-10 rounded-4xl pt-4 pb-8 px-8">

        {/* Logo (Left Side) */}
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl">
          <img className='h-auto w-80' src={navLogo}/>
          </Link>
        </div>

        {/* Navigation Links (Center) */}
        <div className="hidden md:flex space-x-8 pt-4">
        <Link to="/" className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200">
            Accueil
          </Link>
          <Link to="/articles" className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200">
            Les bienfaits des promenades
          </Link>
          <Link to="/donate" className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200">
            Faire un don
          </Link>
            <a href="mailto:contact@chiensencavale.com"><img src={emailIcon} alt="Envoyer un email à Chiens en Cavale" /></a>
        </div>

        {/* Login (Right Side) */}
        <div className="flex items-center">
          <Link to="/login" className="">
          <DogButton/>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;