import paws from "../../assets/landing-page/icons/paws-pink.svg";
import man from "../../assets/landing-page/icons/man-avatar.svg";
import woman from "../../assets/landing-page/icons/woman-avatar.svg";
import julius from "../../assets/landing-page/icons/julius-pfp.png";
import lilou from "../../assets/landing-page/icons/lilou-pfp.png";
import nana from "../../assets/landing-page/icons/nana-pfp.png";
import nath from "../../assets/landing-page/icons/nath-pfp.png";
import ben2 from "../../assets/landing-page/icons/ben2-pfp.png";
import ben3 from "../../assets/landing-page/icons/ben3-pfp.png";
import ben4 from "../../assets/landing-page/icons/ben4-pfp.png";
import ben5 from "../../assets/landing-page/icons/ben5-pfp.png";
import ben6 from "../../assets/landing-page/icons/ben6-pfp.png";
import { useState, useEffect } from 'react';
import { Skeleton } from '@mui/material';

const Team = () => {
  const [admins, setAdmins] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

        const hardcodedAdmins = [
          { image: nana, name: "Louisiana Richard", role: "Présidente" },
          { image: julius, name: "Julius Peschard", role: "Vice-président" },
          { image: lilou, name: "Lilou-ann Mossmann", role: "Secrétaire et promeneuse" },
          { image: nath, name: "Nathalie Mossmann", role: "Trésorière" }
        ];
        setAdmins(hardcodedAdmins);

        const hardcodedMembers = [man, woman, ben3, ben2, ben6, ben5, ben4];
        setMembers(hardcodedMembers);

      } catch (err) {
        setError(err);
        console.error("Error fetching team data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="bg-secondary-pink w-screen py-40 relative overflow-hidden text-primary-black">
        <img className="absolute bottom-10 left-40 z-0" src={paws} alt="Paws background pattern" />
        <div className="relative z-10">
          <h1 className="text-primary-pink font-semibold text-4xl pl-20 mb-8">Notre réseau</h1>

          <div className="flex justify-center mb-16">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="mx-4 flex flex-col items-center">
                <Skeleton variant="circular" width={70} height={70} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={80} />
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center">
            <p className="text-primary-black text-xl mr-8">et nos <span className="font-bold text-primary-pink">15</span> merveilleux bénévoles!</p>
            {[1, 2, 3, 4, 5, 6, 7].map((index) => (
              <Skeleton key={index} variant="circular" width={20} height={20} style={{ marginLeft: index > 0 ? '-8px' : '0px'}}/>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-secondary-pink w-screen py-40 relative overflow-hidden text-primary-black">
        <p>Error: {error.message}</p>
      </section>
    );
  }

  return (
    <section className="bg-secondary-pink w-screen py-40 relative overflow-hidden text-primary-black">
      <img className="absolute bottom-10 left-40 z-0" src={paws} alt="Paws background pattern" />
      <div className="relative z-10">
        <h1 className="text-primary-pink font-semibold text-4xl pl-20 mb-8">Notre association</h1>

        <div className="flex justify-center mb-16">
          {admins.map((admin, index) => (
            <div key={index} className="mx-4 flex flex-col items-center">
              <div className="rounded-full bg-white w-70 h-70 shadow-md overflow-hidden">
                <img src={admin.image} alt={`Admin ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <p className="mt-2 text-center text-lg text-primary-black">{admin.name}</p>
              <p className="text-center text-md opacity-70 text-primary-pink">{admin.role}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center">
          <p className="text-primary-black text-xl mr-8">et le réseau des <span className="font-bold text-primary-pink">bénévoles</span>!</p>
          {members.map((avatar, index) => (
            <div key={index} className={`rounded-full w-20 h-20 shadow-md relative overflow-hidden ${index > 0 ? "-ml-8" : ""}`}>
              <img src={avatar} alt={`Member ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;