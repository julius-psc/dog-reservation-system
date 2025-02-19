import { Link } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import paws from "../../assets/landing-page/icons/paws-blue.svg";
import dog1 from "../../assets/landing-page/icons/dog-photo1.png";
import dog2 from "../../assets/landing-page/icons/dog-photo2.png";
import dog3 from "../../assets/landing-page/icons/dog-photo3.png";
import star from "../../assets/landing-page/icons/dog-star-rate.svg";
import { useState, useEffect } from 'react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true before fetching

      try {
        // Simulate API call delay (replace with your actual fetch)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const hardcodedReviews = [
          { image: dog1, rating: 5, text: "Référence", dogName: "N/A" },
          { image: dog2, rating: 4, text: "Référence", dogName: "N/A" },
          { image: dog3, rating: 3, text: "Référence", dogName: "N/A" },
        ];
        setReviews(hardcodedReviews);

      } catch (err) {
        setError(err); // Set error state
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false); // Set loading to false regardless of success/failure
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="bg-secondary-blue w-screen py-20 relative overflow-hidden text-primary-black">
        <img className="absolute bottom-10 left-40 z-0" src={paws} alt="Paws background pattern" />
        <div className="relative z-10">
          <h1 className="text-primary-blue font-semibold text-4xl pl-20 mb-8">Nos avis</h1>
          <div className="flex justify-center gap-8">
            {/* Skeleton for the whole review card */}
            {[1, 2, 3].map((index) => ( // Render 3 skeletons (adjust as needed)
              <div key={index} className="bg-white p-4 shadow-md w-80 relative">
                <Skeleton variant="rectangular" width="100%" height={256}  /> {/* Image and text container height combined */}
                <Skeleton variant="circular" width={24} height={24} count={5} style={{margin: '10px auto'}}/>
                <Skeleton variant="text" height={40} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-secondary-blue w-screen py-20 relative overflow-hidden text-primary-black">
        <p>Error: {error.message}</p> {/* Display error message */}
      </section>
    );
  }


  return (
    <section className="bg-secondary-blue w-screen py-20 relative overflow-hidden text-primary-black">
      <img
        className="absolute bottom-10 left-40 z-0"
        src={paws}
        alt="Paws background pattern"
      />

      <div className="relative z-10">
        <h1 className="text-primary-blue font-semibold text-4xl pl-20 mb-8">
          Nos avis
        </h1>

        <div className="flex justify-center gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white p-4 shadow-md w-80 relative">
              <div className="relative w-full h-64 mb-4 overflow-hidden">
                <p className="text-primary-black text-right text-sm mt-2">Propriétaire de <span className='xl font-secondary'>{review.dogName}</span></p>
                <img
                  src={review.image}
                  alt={`Review ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-center mb-2">
                {Array(review.rating).fill(null).map((_, i) => (
                  <img
                    key={i}
                    src={star}
                    alt="Star"
                    className={`h-6 w-6 text-yellow-400`}
                  />
                ))}
              </div>
              <p className="text-primary-black">{review.text}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link to="/avis" className="bg-primary-blue hover:bg-blue-400 text-white py-3 px-8 rounded-lg transition duration-200">
            Voir tous les avis
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Reviews;