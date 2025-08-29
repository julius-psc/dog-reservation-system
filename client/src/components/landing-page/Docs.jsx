import { Link } from "react-router-dom";
import guideProm from "../../assets/landing-page/documents/guide_promeneur.pdf";
import guideProprio from "../../assets/landing-page/documents/guide_proprio.pdf";
import affiche from "../../assets/landing-page/documents/chiensencavale_affiche.pdf";
import regles from "../../assets/landing-page/documents/chiensencavale_regles.pdf";
import bio1 from "../../assets/landing-page/documents/tome1_bio.png";
import bio2 from "../../assets/landing-page/documents/tome2_bio.png";
import bio3 from "../../assets/landing-page/documents/tome3_bio.pdf";

const Docs = () => {
  const documentCategories = [
    {
      title: "Guides 🐾",
      description:
        "Des guides utiles pour les promeneurs et les propriétaires.",
      documents: [
        {
          title: "Guide du Promeneur",
          description:
            "Tout ce que vous devez savoir pour promener les chiens en toute sécurité.",
          file: guideProm,
        },
        {
          title: "Guide du Propriétaire",
          description:
            "Informations importantes pour les propriétaires de chiens.",
          file: guideProprio,
        },
      ],
    },
    {
      title: "Marketing 📣",
      description:
        "Supports de communication pour promouvoir Chiens en Cavale.",
      documents: [
        {
          title: "Affiche Chiens en Cavale",
          description: "Affiche promotionnelle pour notre association.",
          file: affiche,
        },
      ],
    },
    {
      title: "Biodiversité 🌿",
      description: "Notre engagement en faveur de la biodiversité.",
      documents: [
        {
          title: "Tome 1",
          description: "Promenades sur les sentiers.",
          file: bio1,
        },
        {
          title: "Tome 2",
          description: "Les espaces protégés.",
          file: bio2,
        },
        {
          title: "Tome 3",
          description: "Climats changeants, chiens prudents!",
          file: bio3,
        },
      ],
    },
    {
      title: "Règlementation 📜",
      description: "Règles et directives pour assurer la sécurité de tous.",
      documents: [
        {
          title: "Règlement Intérieur",
          description:
            "Les règles à suivre pour participer aux activités de Chiens en Cavale.",
          file: regles,
        },
      ],
    },
  ];

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        {/* Side Image */}
        <aside className="relative block h-16 lg:order-last lg:col-span-5 lg:h-full xl:col-span-6">
          <img
            alt=""
            src="https://images.unsplash.com/photo-1542227422-f589a2124ffe?q=80&w=3400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </aside>

        {/* Main Content */}
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6 mt-8">
          <div className="max-w-xl lg:max-w-3xl relative">
            <Link to="/" className="block text-primary-pink mb-6">
              Retour à l&#39;accueil
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
              Publications - Chiens en Cavale 🦮
            </h1>

            <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
              Retrouvez ici tous les documents nécessaires pour Chiens en
              Cavale, organisés par catégorie.
            </p>

            {/* Document Categories */}
            <div className="mt-8 space-y-8">
              {documentCategories.map((category, index) => (
                <div key={index}>
                  {/* Category Header */}
                  <h2 className="text-xl font-semibold text-primary-blue dark:text-white mb-4">
                    {category.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {category.description}
                  </p>

                  {/* Document List */}
                  <div className="space-y-6">
                    {category.documents.map((doc, docIndex) => (
                      <div
                        key={docIndex}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                      >
                        <h3 className="text-lg font-semibold text-primary-pink dark:text-white">
                          {doc.title}
                        </h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          {doc.description}
                        </p>
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block px-6 py-2 bg-primary-pink text-white font-bold rounded-full hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-opacity-50 transition-colors duration-300"
                        >
                          Télécharger le document
                        </a>
                      </div>
                    ))}
                    <hr className="opacity-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Docs;