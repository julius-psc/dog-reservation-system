import paws from "../../assets/landing-page/icons/paws-blue.svg";

const About = () => {
  return (
    <section className="bg-secondary-blue w-screen py-40 relative overflow-hidden text-primary-black">
      <img
        className="absolute -top-30 left-40 z-0"
        src={paws}
        alt="Paws background pattern"
      />

      <h1 className="text-primary-blue font-semibold text-4xl pl-20 mb-8">
        Qui sommes-nous?
      </h1>
      <div className="flex justify-between items-center">
        <div className="bg-white z-8 w-2/3 mr-8 pt-10 px-16 h-74 flex flex-col rounded-tr-4xl rounded-br-4xl shadow-[0_3px_4px_rgba(0,0,0,0.25)]">
          <p className="text-2xl flex-grow">
            <span className="text-primary-blue font-semibold">
              Depuis 2024, notre association offre des promenades aux chiens dont
              les propriétaires ne peuvent plus les sortir, que ce soit
              temporairement ou durablement.
            </span> Nos bénévoles, répartis sur tout le
            territoire, adaptent chaque balade aux besoins de votre compagnon,
            en fonction de leur disponibilité et de votre secteur, pour garantir
            son bien-être. Ce service s’adresse aux personnes âgées, en
            situation de handicap, aux jeunes mamans ou à toute personne
            immobilisée.... <span className="text-primary-blue font-semibold">
              Bien plus qu’un simple coup de main, Chiens en
              Cavale crée du lien en réunissant passionnés d’animaux et personnes
              en difficulté
            </span>.
            
          </p>
        </div>
        <div className="flex items-center justify-center bg-white w-1/3 ml-8 h-60 rounded-tl-4xl rounded-bl-4xl shadow-[0_3px_4px_rgba(0,0,0,0.25)]">
          <div className="mr-12">
            <h3 className="text-primary-blue font-bold text-center text-5xl">
              5/5
            </h3>
            <p>Avis</p>
          </div>
          <div className="mr-12">
            <h3 className="text-primary-blue font-bold text-center text-5xl">
              20+
            </h3>
            <p>Bénévoles</p>
          </div>
          <div>
            <h3 className="text-primary-blue font-bold text-center text-5xl">
              30+
            </h3>
            <p>Communes</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
