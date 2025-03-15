import paws from "../../assets/landing-page/icons/paws-yellow.svg";
import dog from "../../assets/landing-page/icons/landing-page-crown-dog.png";
import pawList from "../../assets/landing-page/icons/paw-list.svg";
import guideProp from '../../assets/landing-page/documents/guide_proprio.pdf';
import guideProm from '../../assets/landing-page/documents/guide_promeneur.pdf';

const Tutorial = () => {
  return (
    <section className="bg-secondary-yellow w-screen min-h-screen py-20 relative overflow-hidden text-primary-black">
      <img
        className="absolute top-10 left-20 z-0 hidden md:block" // Hide on mobile
        src={paws}
        alt="Paws background pattern"
      />
      <img
        className="absolute -bottom-30 -rotate-34 -right-16 z-0 hidden md:block" // Hide on mobile
        src={dog}
        alt="Dog with crown photo"
      />

      <h1 className="text-primary-yellow font-semibold text-3xl lg:text-4xl pl-6 md:pl-20 mb-8">
        Comment ca marche?
      </h1>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[0.5fr_2fr_0.5fr_2fr] grid-rows-auto gap-4 md:gap-0 mt-6 px-6 md:px-20 text-lg relative z-10">
        {/* Propriétaires Heading */}
        <div className="md:row-start-1 md:col-start-2 flex items-center justify-center md:justify-start">
          <h3 className="text-3xl">
            <span className="font-semibold text-primary-yellow">
              Propriétaires
            </span>
          </h3>
        </div>

        {/* Ma première réservation */}
        <div className="md:row-start-2 md:col-start-1 flex opacity-50 rounded-lg p-4">
          Ma première réservation
        </div>
        <div className="md:row-start-2 md:col-start-2 rounded-lg p-4">
          <ul className="list-inside list-disc">
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>
                Je télécharge le{" "}
                <a
                  href={guideProp}
                  download="Guide_Propriétaire"
                  className="text-primary-yellow underline hover:text-primary-black"
                >
                  Guide du Propriétaire
                </a>
              </span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je crée mon compte et je me connecte</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je crée le profil de mon chien</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je réserve un ou des créneaux de promenades</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>J&#39;attends la confirmation du promeneur</span>
            </li>
          </ul>
        </div>

        {/* J'ai déjà réservé une promenade */}
        <div className="md:row-start-2 md:col-start-3 opacity-50 rounded-lg p-4">
          J&#39;ai déjà réservé une promenade
        </div>
        <div className="md:row-start-3 md:col-start-2 rounded-lg p-4">
          <ul className="list-inside list-disc">
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je me connecte</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je peux visualiser mes réservations</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je réserve un ou des créneaux de promenades</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>J&#39;attends la confirmation du promeneur</span>
            </li>
          </ul>
        </div>

        {/* Promeneurs Heading */}
        <div className="md:row-start-1 md:col-start-4 flex items-center justify-center md:justify-start">
          <h3 className="text-3xl text-center md:text-left">
            <span className="font-semibold text-primary-yellow">
              Promeneurs
            </span>
          </h3>
        </div>

        {/* je souaite devenir promeneur */}
        <div className="md:row-start-3 md:col-start-1 flex opacity-50 rounded-lg p-4">
          Je souhaite devenir promeneur
        </div>
        <div className="md:row-start-2 md:col-start-4 rounded-lg p-4">
          <ul className="list-inside list-disc">
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>
                Je télécharge le{" "}
                <a
                  href={guideProm}
                  download="Guide_Promeneur"
                  className="text-primary-yellow underline hover:text-primary-black"
                >
                  Guide du Promeneur
                </a>
              </span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je crée mon compte et je me connecte</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je suis le processus pour adhérer</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Ma demande est en cours de traitement (48h)</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>
                Je saisis mes disponibilités et la (ou les) communes(s) de
                promenade
              </span>
            </li>
          </ul>
        </div>

        {/* je suis déja promeneur */}
        <div className="md:row-start-3 md:col-start-3 flex opacity-50 rounded-lg p-4">
          Je suis déjà promeneur
        </div>
        <div className="md:row-start-3 md:col-start-4 rounded-lg p-4">
          <ul className="list-inside list-disc">
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je me connecte</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je peux visualiser les promenades réservées</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>Je peux passer en mode &#34;vacances&#34;</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Tutorial;