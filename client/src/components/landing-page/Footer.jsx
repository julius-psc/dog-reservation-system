import { Link } from "react-router-dom";
import logo from "../../assets/landing-page/icons/landing-page-circular-logo.png";

const Footer = () => {
  return (
    <footer className="bg-secondary-pink w-screen relative overflow-hidden text-primary-black dark:text-white">
      <div className="bg-white dark:bg-gray-800 my-8 container mx-auto md:w-10/12 flex flex-col md:flex-row justify-between items-start px-10 py-4 rounded-2xl">
        <div className="md:w-1/3 mb-8 md:mb-0">
          <img src={logo} alt="Chiens en Cavale Logo" className="w-40 mb-4" />
        </div>

        {/* Links Column */}
        <div className="md:w-1/3 md:mb-0 mt-6">
          <h3 className="text-xl font-semibold text-primary-pink dark:text-primary-pink">
            Liens rapides
          </h3>
          <div className="flex flex-col">
            <Link
              to="/benefits"
              className="hover:text-primary-pink dark:hover:text-primary-pink mb-2"
            >
              Les bienfaits des promenades
            </Link>
            <Link
              to="/donate"
              className="hover:text-primary-pink dark:hover:text-primary-pink"
            >
              Faire un don
            </Link>
          </div>
        </div>

        {/* Contact Column */}
        <div className="md:w-1/3">
          <h3 className="text-xl font-semibold mt-6 text-primary-pink dark:text-primary-pink">
            Nous contacter
          </h3>
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <a
                href="https://www.facebook.com/profile.php?id=61572840741270
"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-pink dark:hover:text-primary-pink"
              >
                Facebook
              </a>
            </div>
            <div className="flex items-center">
              <a
                href="mailto:contact.chiensencavale@gmail.com"
                className="hover:text-primary-pink dark:hover:text-primary-pink"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto w-11/12 md:w-10/12 px-10 pb-4 text-center text-sm">
        <p>&copy; 2024 Chiens en Cavale</p>
        <p className="text-xs">
          Association à but non lucratif pour la promenade de chiens
        </p>
        <p className="text-xs">SIREN 94120905800010</p>
      </div>
    </footer>
  );
};

export default Footer;
