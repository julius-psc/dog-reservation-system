import { Link } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import paws from "../../assets/landing-page/icons/paws-blue.svg";
import guideProm from '../../assets/landing-page/documents/guide_promeneur.pdf';
import guideProprio from '../../assets/landing-page/documents/guide_proprio.pdf';

import { useState, useEffect } from 'react';

const Doc = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);

      try {
        await new Promise(resolve => setTimeout(resolve, 400));

        const initialDocuments = [
          { 
            title: "Guide pour Promeneurs", 
            file: guideProm, 
            description: "Guide pour les promeneurs de chiens",
            date: "Mars 2025",
          },
          { 
            title: "Guide pour Propriétaires", 
            file: guideProprio, 
            description: "Guide pour les propriétaires de chiens",
            date: "Mars 2025",
          },
        ];
        setDocuments(initialDocuments);
      } catch (err) {
        setError(err);
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <section className="bg-secondary-blue min-h-screen w-screen py-20 relative overflow-hidden text-primary-black flex flex-col">
        <img className="absolute bottom-10 left-40 z-0" src={paws} alt="Paws background pattern" />
        <div className="relative z-10 flex-grow flex flex-col justify-center">
          <h1 className="text-primary-blue font-semibold text-4xl pl-20 mb-8">Nos Documents</h1>
          <div className="flex justify-center gap-8">
            {[1, 2].map((index) => (
              <div key={index} className="bg-white p-4 shadow-md w-80 relative">
                <Skeleton variant="rectangular" width="100%" height={200} />
                <Skeleton variant="text" height={40} />
                <Skeleton variant="text" height={60} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-secondary-blue min-h-screen w-screen py-20 relative overflow-hidden text-primary-black flex flex-col justify-center items-center">
        <p>Error: {error.message}</p>
      </section>
    );
  }

  return (
    <section className="bg-secondary-blue min-h-screen w-screen py-20 relative overflow-hidden text-primary-black flex flex-col">
      <img
        className="absolute bottom-10 left-40 z-0"
        src={paws}
        alt="Paws background pattern"
      />
      <div className="relative z-10 flex-grow flex flex-col justify-center">
        <h1 className="text-primary-blue font-semibold text-4xl pl-20 mb-8">
          Nos Documents
        </h1>

        <div className="flex justify-center gap-8 flex-wrap">
          {documents.map((doc, index) => (
            <div key={index} className="bg-white p-4 shadow-md w-80 relative rounded-lg">
              <div className="relative w-full h-48 mb-4 overflow-hidden rounded-t-lg">
                <img
                  src={doc.image}
                  alt={`${doc.title} preview`}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-primary-black font-semibold text-lg mb-2">{doc.title}</h3>
              <p className="text-primary-black text-sm mb-2">{doc.description}</p>
              <p className="text-primary-black text-xs mb-4">Ajouté: {doc.date}</p>
              <a 
                href={doc.file} 
                download 
                className="bg-primary-blue hover:bg-blue-400 text-white py-2 px-4 rounded-lg transition duration-200 text-sm inline-block"
              >
                Télécharger
              </a>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link 
            to="/documents" 
            className="bg-primary-blue hover:bg-blue-400 text-white py-3 px-8 rounded-lg transition duration-200"
          >
            Voir tous les documents
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Doc;