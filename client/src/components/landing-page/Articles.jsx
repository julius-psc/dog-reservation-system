import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

const Articles = () => {
  const [articles] = useState([
    {
      title: "Les 7 avantages de promener votre chien",
      excerpt:
        "Découvrez les nombreux bienfaits physiques et mentaux que procure une promenade quotidienne à votre chien.",
      link: "https://www.eukanuba.com/ca/fr_ca/articles/7-benefits-of-walking-your-dog-daily",
      image:
        "https://images.unsplash.com/photo-1530700131180-d43d9b8cc41f?q=80&w=3468&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image illustrative de la promenade du chien
    },
    {
      title:
        "Les promenades, au cœur de la santé mentale (et physique) des chiens",
      excerpt:
        "Une étude révèle l'importance capitale des promenades régulières pour garantir le bien-être mental des chiens.",
      link: "https://savoir-animal.fr/promenades-au-coeur-de-sante-mentale-et-physique-des-chiens/",
      image:
        "https://images.unsplash.com/photo-1560743173-567a3b5658b1?q=80&w=3538&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image illustrant le bien-être du chien
    },
    {
      title:
        "La promenade des chiens en France, Suisse et Belgique : Le Guide Complet",
      excerpt:
        "Tout ce que vous devez savoir pour offrir à votre chien des promenades adaptées et enrichissantes.",
      link: "https://mon-bibou.fr/blog/promenade-chien",
      image:
        "https://images.unsplash.com/photo-1505475082603-e217c4a87795?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image sur la durée et la fréquence des promenades
    },
    {
      title:
        "Les plus belles promenades à faire avec son chien autour de Paris",
      excerpt:
        "Découvrez des itinéraires de balades incontournables pour vous et votre chien aux alentours de la capitale.",
      link: "https://www.jardiland.com/conseils-idees/les-plus-belles-promenades-a-faire-avec-son-chien-autour-de-paris",
      image:
        "https://images.unsplash.com/photo-1610706467969-fc5b687ab1cb?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image illustrant une promenade avec un chien
    },
    {
      title:
        "Comment trouver des endroits de promenades pour chien près de chez soi ?",
      excerpt:
        "Astuces et conseils pour dénicher les meilleurs lieux de balades pour votre compagnon à quatre pattes.",
      link: "https://woog.app/promener-son-chien/comment-trouver-des-promenades-pour-chien-pres-de-chez-soi/",
      image:
        "https://images.unsplash.com/photo-1532983523122-9f7448e9e6cd?q=80&w=3348&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Image représentant un chien en promenade
    },
  ]);
  const [error] = useState(null);

  if (error) {
    return (
      <div className="text-red-500">
        Erreur lors de la récupération des articles : {error.message}
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-gray-100 text-gray-900 py-6 dark:bg-gray-900 dark:text-white">
        <Navbar/>
      <div className="max-w-7xl mx-auto mt-50 px-6">
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-8 dark:text-gray-100">
          Articles
        </h1>
        <Link to="/" className="block text-primary-pink">
          Retour à l&#39;accueil
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col dark:bg-gray-800 dark:shadow-none"
            >
              <img
                className="h-48 w-full object-cover"
                src={article.image}
                alt={article.title}
              />
              <div className="px-6 py-4 flex-grow">
                <h2 className="block mt-1 text-xl leading-tight font-semibold text-gray-900 hover:underline dark:text-white dark:hover:text-gray-300">
                  {article.title}
                </h2>
              </div>
              <div className="px-6 pb-2 flex-grow">
                <p className="text-gray-700 text-base dark:text-gray-400">
                  {article.excerpt}
                </p>
              </div>
              <div className="px-6 py-4">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-primary-pink hover:bg-pink-400 text-white font-bold py-2 px-4 rounded dark:primary-pink dark:hover:bg-pink-500"
                >
                  Lire l&#39;article complet
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Articles;
