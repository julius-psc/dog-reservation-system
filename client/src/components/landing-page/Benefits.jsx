import { Link } from "react-router-dom";

const Benefits = () => {
  // Array of Unsplash images from your original articles (kept as-is)
  const images = [
    "https://images.unsplash.com/photo-1530700131180-d43d9b8cc41f?q=80&w=3468&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1560743173-567a3b5658b1?q=80&w=3538&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1505475082603-e217c4a87795?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1610706467969-fc5b687ab1cb?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1532983523122-9f7448e9e6cd?q=80&w=3348&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  return (
    <div className="font-sans antialiased bg-gray-100 text-gray-900 py-6 dark:bg-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Title */}
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-8 dark:text-gray-100">
          Les bienfaits des promenades sur le chien
        </h1>

        {/* Back to Home Link */}
        <Link to="/" className="block text-primary-pink mb-6">
          Retour à l&#39;accueil
        </Link>

        {/* Main Text Content */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 dark:bg-gray-800 dark:shadow-none">
          <p className="text-gray-700 text-base leading-relaxed dark:text-gray-400">
            Promener un chien offre de nombreux bienfaits pour l’animal. C&#39;est une activité essentielle pour maintenir une bonne santé physique et mentale. Les promenades doivent être adaptées à l’âge, la race et la santé du chien.
          </p>
          <p className="text-gray-500 text-sm italic mt-2 dark:text-gray-400">
            © Lilou-Ann Mossmann
          </p>

          {/* Benefits List */}
          <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
            Voici les 7 avantages des promenades :
          </h2>
          <ul className="mt-4 space-y-4 text-gray-700 text-base dark:text-gray-400">
            <li>
              <span className="font-semibold">Santé des articulations :</span> L’exercice régulier assouplit les articulations du chien, même à un âge avancé.
            </li>
            <li>
              <span className="font-semibold">Gestion du poids :</span> Les promenades augmentent la dépense énergétique, aidant à prévenir l’obésité, un problème croissant chez les chiens.
            </li>
            <li>
              <span className="font-semibold">Amélioration de la digestion et de la santé urinaire :</span> Les sorties régulières permettent au chien de se soulager et réduisent les risques d&#39;infections urinaires.
            </li>
            <li>
              <span className="font-semibold">Stimulation mentale :</span> Découvrir de nouveaux environnements stimule le cerveau du chien grâce à une variété de stimuli visuels et olfactifs.
            </li>
            <li>
              <span className="font-semibold">Socialisation :</span> Rencontrer d’autres chiens et personnes lors des promenades favorise des comportements équilibrés.
            </li>
            <li>
              <span className="font-semibold">Amélioration du comportement :</span> Les promenades sont une excellente occasion de travailler sur l&#39;obéissance et de canaliser l&#39;énergie du chien, réduisant les comportements destructeurs liés à l’ennui.
            </li>
            <li>
              <span className="font-semibold">Prévention de l’ennui :</span> Une activité quotidienne aide à brûler l’énergie excédentaire, apaise l’animal et lui assure un meilleur repos.
            </li>
          </ul>
        </div>

        {/* Image Grid */}
        <h2 className="text-center text-xl font-semibold text-gray-800 mb-6 dark:text-gray-100">
          Galerie de promenades
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:shadow-none"
            >
              <img
                className="h-48 w-full object-cover"
                src={image}
                alt={`Image de promenade ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Benefits;