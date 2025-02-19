import paws from "../../assets/landing-page/icons/paws-yellow.svg";
import dog from "../../assets/landing-page/icons/landing-page-crown-dog.png";
import pawList from '../../assets/landing-page/icons/paw-list.svg';

const Tutorial = () => {
  return (
    <section className="bg-secondary-yellow w-screen h-screen py-20 relative overflow-hidden text-primary-black">
      <img
        className="absolute top-10 left-20 z-0"
        src={paws}
        alt="Paws background pattern"
      />
      <img
        className="absolute -bottom-30 -rotate-34 -right-16"
        src={dog}
        alt="Dog with crown photo"
      />

      <h1 className="text-primary-yellow font-semibold text-4xl pl-20 mb-8">
        Comment ca marche?
      </h1>

      <div className="grid grid-cols-[0.5fr_2fr_0.5fr_2fr] grid-rows-3 gap-0 mt-20 px-20 text-lg">
        <div className="row-start-1 col-start-2 flex items-center">
          <div>
            <h3 className="text-3xl">
              <span className=" font-semibold text-primary-yellow">
                Propriétaires
              </span>
            </h3>
          </div>
        </div>
        <div className="row-start-1 col-start-4 flex items-center">
          <div>
            <h3 className="text-3xl text-center">
              <span className="font-semibold text-primary-yellow">
                Promeneurs
              </span>
            </h3>
          </div>
        </div>

        <div className=" opacity-50 row-start-2 col-start-1 rounded-lg p-4 h-20">
          Ma première réservation
        </div>
        <div className="row-start-2 col-start-2 rounded-lg p-4">
          <ul className="list-inside list-disc">
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
        <div className=" row-start-2 opacity-50 col-start-3 rounded-lg p-4 h-24">
          Je souhaite devenir promeneur
        </div>
        <div className="row-start-2 col-start-4  rounded-lg p-4">
          <ul className="list-inside list-disc">
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
              <span>Je saisis mes disponibilités et les communes de promenade</span>
            </li>
          </ul>
        </div>
        <div className=" row-start-3 col-start-1 opacity-50 rounded-lg p-4 h-20">
          Jai déjà réservé une promenade
        </div>
        <div className="row-start-3 col-start-2  rounded-lg p-4">
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
              <span>Je peux réserver des créneaux</span>
            </li>
            <li className="flex items-center">
              <img src={pawList} alt="Paw bullet" className="w-4 h-4 mr-2" />
              <span>J&#39;attends la confirmation d&#39;un promeneur</span>
            </li>
          </ul>
        </div>
        <div className="row-start-3 col-start-3 opacity-50 rounded-lg p-4 h-20">
          Je suis déjà promeneur
        </div>
        <div className="row-start-3 col-start-4  rounded-lg p-4">
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
              <span>Je peux passer en mode &quot;vacances&quot;</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Tutorial;