import paws from "../../assets/landing-page/icons/paws-pink.svg";
import funnyDog from "../../assets/landing-page/icons/landing-page-dog-funny.png";

const Hero = () => {
  return (
    <section className="bg-secondary-pink h-screen w-screen pl-20 pt-60 relative">
      <img
        className="absolute -top-30 left-40 z-0"
        src={paws}
        alt="Paws background pattern"
      />
      <img
        className="absolute bottom-0 right-20 h-auto w-200 z-10"
        src={funnyDog}
        alt="Funny dog photo"
      />
      <div className="z-10 relative">
        <h1 className="text-7xl leading-22 text-primary-pink font-semibold">
          Besoin d&#39;un coup de<br></br>{" "}
          patte ?
        </h1>
        <p className="text-2xl w-1/2 leading-9 text-primary-black">
          Vous rencontrez des difficultés pour sortir votre chien ? Que ce soit
          temporaire ou permanent (handicap, douleurs, mobilité réduite,
          grossesse, accident de vie,...), notre réseau de bénévoles passionés
          est là pour vous aider! Des balades 100%{" "}
          <span className="text-primary-pink">gratuites</span>, pour le bien-être de votre compagnon et votre tranquilité d&#39;esprit.<br></br>Faites appel à nous ou rejoignez l&#39;aventure!
        </p>
        <div className="">
          <button className="bg-primary-pink hover:bg-pink-400 text-white font-semibold py-3 px-6 mt-4 rounded-xl transition duration-200 mr-2">
            <a href="/client-signup">Réserver une promenade</a>
          </button>
          <button className="bg-primary-pink hover:bg-pink-400 text-white font-semibold py-3 px-6 mt-4 rounded-xl transition duration-200">
            <a href="volunteer-signup">Devenir promeneur</a>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
