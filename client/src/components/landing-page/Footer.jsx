import { Link } from "react-router-dom";
import logo from "../../assets/landing-page/icons/landing-page-circular-logo.png";

const Footer = () => {
  return (
    <footer className="bg-secondary-pink w-screen relative overflow-hidden text-primary-black dark:text-white">
      <div className="bg-white dark:bg-gray-800 my-8 container mx-auto md:w-10/12 flex flex-col md:flex-row justify-between items-start px-10 py-8 rounded-2xl shadow-lg">
        {/* Logo Section */}
        <div className="md:w-1/3 mb-8 md:mb-0 flex flex-col items-center md:items-start">
          <img 
            src={logo} 
            alt="Chiens en Cavale Logo" 
            className="w-40 mb-4 transform transition-transform hover:scale-105" 
          />
        </div>

        {/* Links Column */}
        <div className="md:w-1/3 mb-4 mt-6">
          <h3 className="text-xl font-semibold text-primary-pink dark:text-primary-pink mb-4 border-b-2 border-primary-pink pb-1 w-fit">
            Liens rapides
          </h3>
          <div className="flex flex-col space-y-3">
            <Link
              to="/benefits"
              className="hover:text-primary-pink dark:hover:text-primary-pink transition-colors duration-200 text-base"
            >
              Les bienfaits des promenades
            </Link>
            <Link
              to="/donate"
              className="hover:text-primary-pink dark:hover:text-primary-pink transition-colors duration-200 text-base"
            >
              Faire un don
            </Link>
          </div>
        </div>

        {/* Contact Column */}
        <div className="md:w-1/3">
          <h3 className="text-xl font-semibold mt-6 text-primary-pink dark:text-primary-pink mb-4 border-b-2 border-primary-pink pb-1 w-fit">
            Nous contacter
          </h3>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <a
                href="https://www.facebook.com/profile.php?id=61572840741270"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-pink dark:hover:text-primary-pink transition-colors duration-200 text-base flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.845c0-2.522 1.494-3.915 3.788-3.915 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
                Facebook
              </a>
            </div>
            <div className="flex items-center">
              <a
                href="mailto:contact.chiensencavale@gmail.com"
                className="hover:text-primary-pink dark:hover:text-primary-pink transition-colors duration-200 text-base flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="container mx-auto w-11/12 md:w-10/12 px-10 pb-4 text-center text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="font-medium">© 2024 Chiens en Cavale</p>
        <p className="text-xs mt-1 opacity-80">
          Association à but non lucratif pour la promenade de chiens
        </p>
        <p className="text-xs mt-1 opacity-80">SIREN 94120905800010</p>
      </div>
    </footer>
  );
};

export default Footer;