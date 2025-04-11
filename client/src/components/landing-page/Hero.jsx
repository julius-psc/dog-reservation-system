import paws from "../../assets/landing-page/icons/paws-pink.svg";
import funnyDog from "../../assets/landing-page/icons/landing-page-dog-funny.png";
import dogowner from "../../assets/landing-page/images/dog_owner.png";
import dogwalker from "../../assets/landing-page/images/dog_walker.png";
import VolunteerMembers from "./VolunteerMembers";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="bg-secondary-pink h-screen w-screen pl-10 lg:pl-20 pt-28 lg:pt-60 relative">
      <img
        className="absolute -top-30 left-40 z-0 hidden sm:block"
        src={paws}
        alt="Motif de pattes en arrière-plan"
      />
      <img
        className="absolute bottom-0 right-0 sm:right-2 lg:right-6 h-auto w-120 max-[494px]:w-90 max-[394px]:w-74 sm:w-160 lg:w-200 z-10 hidden sm:block"
        src={funnyDog}
        alt="Photo de chien amusante"
      />
      <div className="z-10 relative mr-20 lg:mr-0">
        <VolunteerMembers />
        <h1 className="text-5xl sm:text-5xl lg:text-7xl leading-13 sm:leading-18 lg:leading-22 text-primary-pink font-semibold">
          Besoin d&#39;un coup de<br className="hidden sm:visible"></br> patte ?
        </h1>
        <p className="text-xl sm:text-2xl w-full lg:w-1/2 leading-8 sm:leading-9 text-primary-black">
          Vous rencontrez des difficultés pour sortir votre chien ? Que ce soit
          temporaire ou permanent (handicap, douleurs, mobilité réduite,
          grossesse, accident de vie,...), notre réseau de bénévoles passionnés
          est là pour vous aider ! Des balades 100%{" "}
          <span className="text-primary-pink">gratuites</span>, pour le
          bien-être de votre compagnon.
        </p>
        <div className="mt-8 max-w-3xl bg-white rounded-2xl p-8 border-2 border-transparent hidden sm:block">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Client Option */}
            <Link
              to="/client-signup"
              className="focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-offset-2 rounded-2xl"
            >
              <div className="bg-gradient-to-br shadow-md from-primary-pink/10 to-primary-blue/10 rounded-2xl p-4 sm:p-6 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 group">
                <img
                  src={dogowner}
                  alt="Illustration d'un propriétaire de chien ayant besoin d'aide pour promener son animal"
                  className="w-24 h-24 mx-auto mb-2 sm:mb-4 object-contain"
                />
                <h3 className="text-lg font-bold text-primary-black text-center mb-1 sm:mb-2 group-hover:text-primary-pink transition-colors">
                  Besoin d&#39;un promeneur ?
                </h3>
              </div>
            </Link>

            {/* Volunteer Option */}
            <Link
              to="/volunteer-signup"
              className="focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-offset-2 rounded-2xl"
            >
              <div className="bg-gradient-to-br shadow-md from-primary-pink/10 to-primary-blue/10 rounded-2xl p-4 sm:p-6 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 group">
                <img
                  src={dogwalker}
                  alt="Illustration d'un bénévole promenant un chien"
                  className="w-24 h-24 mx-auto mb-2 sm:mb-4 object-contain"
                />
                <h3 className="text-lg font-bold text-primary-black text-center mb-1 sm:mb-2 group-hover:text-primary-pink transition-colors">
                  Envie de devenir promeneur ?
                </h3>
              </div>
            </Link>
          </div>

          {/* Login Option */}
          <div className="text-center">
            <Link to="/login">
              <button className="inline-flex items-center px-6 py-3 bg-primary-pink text-white rounded-full hover:bg-primary-pink/80 transition-all duration-300 text-lg font-semibold shadow-md hover:shadow-lg">
                Déjà membre ? Connectez-vous ! ✨
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;