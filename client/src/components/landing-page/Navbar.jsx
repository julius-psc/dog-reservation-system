import { Link } from "react-router-dom";
import navLogo from "../../assets/landing-page/desktop-landing-navbar-logo.svg";
import emailIcon from "../../assets/landing-page/icons/chiens-email-icon.svg";
import { useState, useEffect } from "react";

// Simple button without animation
const SimpleDogButton = () => {
  return (
    <button className="text-white bg-primary-pink px-4 md:px-5 py-3 md:py-4 text-lg md:text-xl cursor-pointer w-full rounded-3xl">
      Se connecter
    </button>
  );
};

// Original animated button (unchanged)
const AnimatedDogButton = () => {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <div className="relative group">
        {/* Button */}
        <button className="text-white bg-primary-pink px-5 py-4 text-xl rounded-xl cursor-pointer relative box-border">
          Se connecter
        </button>

        {/* Dog */}
        <div className="absolute w-[65px] h-[65px] -top-1 -right-1 transform transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] opacity-0 group-hover:opacity-100 group-hover:translate-x-5 group-hover:-translate-y-[55px] group-hover:rotate-[15deg] group-hover:delay-[600ms]">
          {/* Tail */}
          <div className="absolute w-[10%] h-[35%] -left-1/2 -bottom-[44%] rotate-[-25deg] transition-opacity duration-100 opacity-0 group-hover:opacity-100 group-hover:delay-[600ms]">
            <div className="absolute origin-bottom w-full h-full rounded-t-full bg-[#E1A46E] animate-tail"></div>
          </div>

          {/* Body */}
          <div className="absolute w-[70%] h-1/2 -bottom-[30%] left-1/2 -translate-x-1/2 bg-[#9F6A43] rounded-t-full"></div>

          {/* Head */}
          <div className="absolute w-[65%] h-[70%] bottom-[5%] left-1/2 -translate-x-1/2 rounded-[80%_80%_60%_60%] bg-[#E1A46E]">
            {/* Eyes */}
            <div className="absolute w-4/5 h-[35%] top-1/4 -translate-x-1/2 left-1/2">
              <div className="absolute rounded-[1000px] bg-gray-900 w-1/4 h-[52%] top-1/2 -translate-y-1/2 left-[15%] after:content-[''] after:absolute after:w-[30%] after:h-[30%] after:bg-white after:opacity-70 after:rounded-[1000px] after:left-[15%] after:top-[15%]"></div>
              <div className="absolute rounded-[1000px] bg-gray-900 w-1/4 h-[52%] top-1/2 -translate-y-1/2 right-[15%] after:content-[''] after:absolute after:w-[30%] after:h-[30%] after:bg-white after:opacity-70 after:rounded-[1000px] after:left-[15%] after:top-[15%]"></div>
            </div>

            {/* Nuzzle */}
            <div className="absolute w-[70%] h-[40%] bottom-0 left-1/2 -translate-x-1/2">
              <div className="absolute w-full h-full">
                <div className="absolute w-1/2 h-full top-0 left-0 bg-[#C28E5F] rounded-[70%_30%_50%_20%] z-10"></div>
                <div className="absolute w-1/2 h-full top-0 right-0 bg-[#C28E5F] rounded-[70%_30%_50%_20%] z-10 scale-x-[-1]"></div>
              </div>

              {/* Mouth */}
              <div className="absolute w-1/2 h-[90%] rounded-full bg-gray-900 left-1/2 -bottom-[20%] -translate-x-1/2">
                <div className="absolute w-1/2 h-1/2 bg-red-500 left-1/2 -translate-x-1/2 bottom-[5%] rounded-full animate-tongue"></div>
              </div>

              {/* Nose */}
              <div className="absolute w-[30%] h-[20%] left-1/2 top-0 -translate-x-1/2 z-10">
                <div className="absolute w-full h-[60%] -top-1/2 left-0 bg-gray-800 rounded-t-[1000px]"></div>
                <div className="absolute w-full h-full top-[10%] left-0 bg-gray-800 rounded-b-[1000px]"></div>
                <div className="absolute w-[90%] h-full top-0 z-10 left-1/2 -translate-x-1/2">
                  <div className="absolute w-[30%] left-[10%] h-full bg-black rounded-full"></div>
                  <div className="absolute w-[30%] right-[10%] h-full bg-black rounded-full"></div>
                </div>
                <div className="absolute -top-1/2 left-1/2 w-4/5 h-[30%] -translate-x-1/2 rounded-t-[1000px] bg-gradient-to-b from-white to-transparent opacity-30"></div>
              </div>
            </div>
          </div>

          {/* Ears */}
          <div className="absolute w-[90%] h-[90%] top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute w-[30%] h-1/2 left-0 top-0 bg-[#9F6A43] rotate-[15deg] rounded-[60%_20%_80%_10%] z-10"></div>
            <div className="absolute w-[30%] h-1/2 right-0 top-0 bg-[#9F6A43] -rotate-[15deg] scale-x-[-1] rounded-[60%_20%_80%_10%] z-10"></div>
          </div>
        </div>

        {/* Paws */}
        <div className="absolute -right-5 top-[15px] overflow-hidden w-5 h-5 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:right-[-5px] group-hover:delay-[300ms]">
          <div className="absolute -left-full top-0 w-full h-full rounded-full bg-[#E1A46E] transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] delay-[300ms] group-hover:left-0 group-hover:delay-0"></div>
        </div>
        <div className="absolute -right-5 -top-5 overflow-hidden w-5 h-5 -rotate-90 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:right-10 group-hover:-top-2 group-hover:delay-[400ms]">
          <div className="absolute -left-full top-0 w-full h-full rounded-full bg-[#E1A46E] transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] delay-[300ms] group-hover:left-0 group-hover:delay-0"></div>
        </div>
      </div>
    </div>
  );
};

function Navbar() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024); // lg breakpoint
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Scroll to About section function
  const scrollToAbout = (e) => {
    e.preventDefault();
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="py-4 md:py-5 lg:py-6 w-full fixed top-0 z-[100] flex justify-center items-center">
      <div
        className={`container max-w-5xl flex items-center justify-between bg-white dark:bg-gray-800 pr-4 md:pr-5 lg:pr-6 pt-4 md:pt-3 pb-5 md:pb-4 lg:pb-5 px-4 md:px-5 lg:px-6 ${
          isMobileMenuOpen ? "mx-0 rounded-t-4xl" : "mx-4 rounded-4xl"
        }`}
      >
        {/* Logo (Left Side) */}
        <div className="flex items-center my-2">
          <Link to="/" className="font-bold text-base md:text-lg">
            <img className="h-auto w-44" src={navLogo} alt="Logo" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-primary-black dark:text-white focus:outline-none cursor-pointer"
          onClick={toggleMobileMenu}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            )}
          </svg>
        </button>

        {/* Navigation Links (Center) */}
        <div className="hidden lg:flex space-x-3 lg:space-x-4 pt-2 md:pt-3">
          <Link
            to="/"
            className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-xs md:text-sm lg:text-base"
          >
            Accueil
          </Link>
          <Link
            to="/about"
            className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-xs md:text-sm lg:text-base"
            onClick={scrollToAbout}
          >
            A propos
          </Link>
          <Link
            to="/benefits"
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
          <Link
            to="/documents"
            className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-xs md:text-sm lg:text-base"
          >
            Publications
          </Link>
          <a href="mailto:contact.chiensencavale@gmail.com" target="_blank">
            <img
              src={emailIcon}
              alt="Envoyer un email à Chiens en Cavale"
              className="w-4 md:w-5 lg:w-6"
            />
          </a>
        </div>

        {/* Login (Right Side) */}
        <div className="hidden lg:flex items-center mt-2">
          <Link to="/login">
            {isDesktop ? <AnimatedDogButton /> : <SimpleDogButton />}
          </Link>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-[72px] left-0 w-full bg-white dark:bg-gray-800 rounded-t-none shadow-lg transition-all duration-300 ease-in-out">
            <div className="flex flex-col space-y-4 p-4">
              <Link
                to="/"
                className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-sm"
                onClick={toggleMobileMenu}
              >
                Accueil
              </Link>
              <Link
                to="/about"
                className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-sm"
                onClick={scrollToAbout}
              >
                A propos
              </Link>
              <Link
                to="/benefits"
                className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-sm"
                onClick={toggleMobileMenu}
              >
                Les bienfaits des promenades
              </Link>
              <Link
                to="/donate"
                className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-sm"
                onClick={toggleMobileMenu}
              >
                Faire un don
              </Link>
              <Link
                to="/documents"
                className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-sm"
              >
                Publications
              </Link>
              <a
                href="mailto:contact.chiensencavale@gmail.com"
                className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-sm"
                onClick={toggleMobileMenu}
              >
                Contact
              </a>
              <Link
                to="/login"
                className="text-primary-black dark:text-white hover:text-primary-pink dark:hover:text-primary-pink transition duration-200 text-sm"
                onClick={toggleMobileMenu}
              >
                <SimpleDogButton />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
