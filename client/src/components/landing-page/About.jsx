import { useState, useEffect } from "react";
import paws from "../../assets/landing-page/icons/paws-blue.svg";

const About = () => {
  const [stats, setStats] = useState({
    volunteers: 20, // Default values while loading
    villages: 30
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/stats`); // Use environment variable
        const data = await response.json();
        setStats({
          volunteers: data.volunteers,
          villages: data.villages
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Keep default values if fetch fails
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="bg-secondary-blue w-screen py-16 lg:py-40 relative overflow-hidden text-primary-black">
      <img
        className="absolute -top-30 left-40 z-0 hidden md:block" 
        src={paws}
        alt="Paws background pattern"
      />

      <h1 className="text-primary-blue font-semibold text-3xl lg:text-4xl pl-6 md:pl-20 mb-8">
        Qui sommes-nous?
      </h1>

      <div className="flex flex-col md:flex-row justify-center md:justify-between items-center px-6 md:px-0">
        {/* Text Section */}
        <div className="bg-white z-8 w-full md:w-2/3 mb-6 md:mb-0 md:mr-8 pt-6 pb-10 lg:pt-10 px-6 lg:px-16 min-h-[18.5rem] flex flex-col rounded-tr-4xl rounded-br-4xl shadow-[0_3px_4px_rgba(0,0,0,0.25)]">
          <p className="text-md lg:text-2xl flex-grow overflow-hidden">
            <span className="text-primary-blue font-semibold">
              Depuis 2024, notre association offre des promenades aux chiens dont
              les propriétaires ne peuvent plus les sortir, que ce soit
              temporairement ou durablement.
            </span>{" "}
            Nos bénévoles, répartis sur tout le territoire, adaptent chaque
            balade aux besoins de votre compagnon, en fonction de leur
            disponibilité et de votre secteur, pour garantir son bien-être. Ce
            service s’adresse aux personnes âgées, en situation de handicap, aux
            jeunes mamans ou à toute personne immobilisée....{" "}
            <span className="text-primary-blue font-semibold">
              Bien plus qu’un simple coup de main, Chiens en Cavale crée du lien
              en réunissant passionnés d’animaux et personnes en difficulté
            </span>.
          </p>
        </div>

        {/* Stats Section */}
        <div className="sm:flex hidden items-center justify-center sm:visible bg-white w-full md:w-1/3 ml-0 md:ml-4 lg:ml-8 h-60 z-10 rounded-tl-4xl rounded-bl-4xl shadow-[0_3px_4px_rgba(0,0,0,0.25)]">
          <div className="mr-3 lg:mr-12">
            <h3 className="text-primary-blue font-bold text-center text-3xl lg:text-5xl">
              5/5
            </h3>
            <p className="text-center">Avis</p>
          </div>
          <div className="mr-3 lg:mr-12">
            <h3 className="text-primary-blue font-bold text-center text-3xl lg:text-5xl">
              {stats.volunteers}
            </h3>
            <p className="text-center">Bénévoles</p>
          </div>
          <div>
            <h3 className="text-primary-blue font-bold text-center text-3xl lg:text-5xl">
              {stats.villages}
            </h3>
            <p className="text-center">Communes</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;