import { Link } from "react-router-dom";
import bal1 from '../../assets/landing-page/images/bal_1.png';
import bal2 from '../../assets/landing-page/images/bal_2.png';
import bal3 from '../../assets/landing-page/images/bal_3.png';
import bal4 from '../../assets/landing-page/images/bal_4.png';
import bal5 from '../../assets/landing-page/images/bal_5.png';
import { useState, useEffect } from 'react';

const Benefits = () => {
  const images = [bal1, bal2, bal3, bal4, bal5];
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="lg:grid lg:grid-cols-12">
        {/* Side Image */}
        <aside className="hidden lg:block lg:col-span-5 xl:col-span-6 fixed inset-y-0 right-0 w-full lg:w-[41.666667%] xl:w-[50%]">
          <img
            alt=""
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="h-full w-full object-cover"
          />
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-7 xl:col-span-6 px-8 py-8 sm:px-12 lg:px-16 lg:py-12 mt-8">
          <div className="max-w-xl lg:max-w-3xl mx-auto relative">
            {/* Back to Home Link */}
            <Link to="/" className="block text-primary-pink mb-6">
              Retour à l&#39;accueil
            </Link>

            {/* Title */}
            {isLoading ? (
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            ) : (
              <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
                Les bienfaits des promenades sur le chien 🐾
              </h1>
            )}

            {/* Main Text Content */}
            {isLoading ? (
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse"></div>
              </div>
            ) : (
              <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
                Promener un chien offre de nombreux bienfaits pour l’animal. C&#39;est une activité essentielle pour maintenir une bonne santé physique et mentale. Les promenades doivent être adaptées à l’âge, la race et la santé du chien. 🐕‍🦺
              </p>
            )}

            {/* Benefits List */}
            <div className="mt-8 space-y-8">
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(7)].map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-primary-yellow dark:text-white mb-4">
                    7 avantages des promenades 🎾
                  </h2>
                  <ul className="space-y-6">
                    <li className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-semibold text-primary-blue dark:text-white">
                        Santé des articulations 🦴
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        L’exercice régulier assouplit les articulations du chien, même à un âge avancé.
                      </p>
                    </li>
                    <li className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-semibold text-primary-blue dark:text-white">
                        Gestion du poids ⚖️
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Les promenades augmentent la dépense énergétique, aidant à prévenir l’obésité, un problème croissant chez les chiens.
                      </p>
                    </li>
                    <li className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-semibold text-primary-blue dark:text-white">
                        Amélioration de la digestion et de la santé urinaire 🚽
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Les sorties régulières permettent au chien de se soulager et réduisent les risques d&#39;infections urinaires.
                      </p>
                    </li>
                    <li className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-semibold text-primary-blue dark:text-white">
                        Stimulation mentale 🧠
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Découvrir de nouveaux environnements stimule le cerveau du chien grâce à une variété de stimuli visuels et olfactifs.
                      </p>
                    </li>
                    <li className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-semibold text-primary-blue dark:text-white">
                        Socialisation 🐾
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Rencontrer d’autres chiens et personnes lors des promenades favorise des comportements équilibrés.
                      </p>
                    </li>
                    <li className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-semibold text-primary-blue dark:text-white">
                        Amélioration du comportement 🐶
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Les promenades sont une excellente occasion de travailler sur l&#39;obéissance et de canaliser l&#39;énergie du chien, réduisant les comportements destructeurs liés à l’ennui.
                      </p>
                    </li>
                    <li className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <h3 className="text-lg font-semibold text-primary-blue dark:text-white">
                        Prévention de l’ennui 🎉
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Une activité quotidienne aide à brûler l’énergie excédentaire, apaise l’animal et lui assure un meilleur repos.
                      </p>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Image Grid */}
            <h2 className="mt-12 text-xl font-semibold text-primary-yellow dark:text-white mb-6">
              Galerie de promenades 📸
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                  >
                    <img
                      className="w-full h-48 object-cover rounded-md"
                      src={image}
                      alt={`Image de promenade ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Benefits;