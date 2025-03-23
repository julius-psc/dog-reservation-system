import { Link } from "react-router-dom";
import bal1 from '../../assets/landing-page/images/bal_1.png';
import bal2 from '../../assets/landing-page/images/bal_2.png';
import bal3 from '../../assets/landing-page/images/bal_3.png';
import bal4 from '../../assets/landing-page/images/bal_4.png';
import bal5 from '../../assets/landing-page/images/bal_5.png';
import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const Benefits = () => {
  const images = useMemo(() => [bal1, bal2, bal3, bal4, bal5], []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Preload images
    const preloadImages = async () => {
      const promises = images.map(src => 
        new Promise(resolve => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = resolve; // Resolve even if error to prevent hanging
        })
      );
      
      await Promise.all(promises);
      setIsLoading(false);
    };

    preloadImages();
  }, [images]); // Now images is stable due to useMemo

  const SkeletonLoader = ({ type }) => (
    type === 'image' ? (
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
    ) : (
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
      </div>
    )
  );

  SkeletonLoader.propTypes = {
    type: PropTypes.oneOf(['image', 'text']).isRequired
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="lg:grid lg:grid-cols-12">
        <aside className="hidden lg:block lg:col-span-5 xl:col-span-6 fixed inset-y-0 right-0 w-full lg:w-[41.666667%] xl:w-[50%]">
          <img
            alt="Side banner"
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </aside>

        <main className="lg:col-span-7 xl:col-span-6 px-8 py-8 sm:px-12 lg:px-16 lg:py-12 mt-8">
          <div className="max-w-xl lg:max-w-3xl mx-auto relative">
            <Link to="/" className="block text-primary-pink mb-6">
              Retour à l&#39;accueil
            </Link>

            {isLoading ? (
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            ) : (
              <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
                Les bienfaits des promenades sur le chien 🐾
              </h1>
            )}

            {isLoading ? (
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
              </div>
            ) : (
              <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
                Promener un chien offre de nombreux bienfaits pour l’animal. C&#39;est une activité essentielle pour maintenir une bonne santé physique et mentale.
              </p>
            )}

            {/* Article Section */}
            <article className="mt-8">
              {isLoading ? (
                <SkeletonLoader type="text" />
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-primary-yellow dark:text-white mb-4">
                    Pourquoi les promenades sont-elles essentielles?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Les chiens, comme les humains, ont besoin d&#39;exercice régulier pour rester en bonne santé. Les promenades ne sont pas seulement une occasion de faire de l&#39;exercice physique, mais aussi un moment privilégié pour renforcer le lien avec votre animal. Des études montrent que les chiens qui sortent régulièrement sont moins sujets au stress et à l&#39;anxiété.
                  </p>
                  <a target='_blank' className="text-primary-pink" href="https://www.chien.com/activites/promener-son-chien-621.php">https://www.chien.com/activites/promener-son-chien-621.php</a>
                </>
              )}
            </article>

            {/* Benefits List */}
            <div className="mt-8 space-y-8">
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(7)].map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                      <SkeletonLoader type="text" />
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

            {/* Image Gallery */}
            <h2 className="mt-12 text-xl font-semibold text-primary-yellow dark:text-white mb-6">
              Galerie de promenades 📸
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  {isLoading ? (
                    <SkeletonLoader type="image" />
                  ) : (
                    <img
                      className="w-full h-48 object-cover rounded-md"
                      src={image}
                      alt={`Image de promenade ${index + 1}`}
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

Benefits.propTypes = {
  // No props are being passed to this component currently
};

export default Benefits;