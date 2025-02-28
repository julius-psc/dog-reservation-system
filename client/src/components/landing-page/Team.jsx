import paws from "../../assets/landing-page/icons/paws-pink.svg";
import julius from "../../assets/landing-page/icons/julius-pfp.png";
import lilou from "../../assets/landing-page/icons/lilou-pfp.png";
import nana from "../../assets/landing-page/icons/nana-pfp.png";
import nath from "../../assets/landing-page/icons/nath-pfp.png";
import ben1 from "../../assets/landing-page/icons/ben1-pfp.png";
import ben2 from "../../assets/landing-page/icons/ben2-pfp.png";
import ben3 from "../../assets/landing-page/icons/ben3-pfp.png";
import ben4 from "../../assets/landing-page/icons/ben4-pfp.png";
import ben5 from "../../assets/landing-page/icons/ben5-pfp.png";
import ben6 from "../../assets/landing-page/icons/ben6-pfp.png";
import ben7 from "../../assets/landing-page/icons/ben7-pfp.png";
import ben8 from "../../assets/landing-page/icons/ben8-pfp.png";
import ben9 from "../../assets/landing-page/icons/ben9-pfp.png";
import ben10 from "../../assets/landing-page/icons/ben10-pfp.png";
import { useState, useEffect } from "react";
import { Skeleton } from "@mui/material";

const Team = () => {
  const [admins, setAdmins] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

        const hardcodedAdmins = [
          {
            image: nana,
            name: "Louisiana Richard",
            role: "Présidente",
            email: "louisiana.richard@gmail.com",
          },
          {
            image: julius,
            name: "Julius Peschard",
            role: "Vice-président",
            email: "peschardjulius03@gmail.com",
          },
          {
            image: lilou,
            name: "Lilou-Ann Mossmann",
            role: "Secrétaire et promeneuse",
            email: "lilou.ann.mossmann@gmail.com",
          },
          {
            image: nath,
            name: "Nathalie Mossmann",
            role: "Trésorière",
            email: "nathalie.mossmann@gmail.com",
          },
        ];
        setAdmins(hardcodedAdmins);

        const hardcodedMembers = [
          ben1,
          ben2,
          ben3,
          ben4,
          ben5,
          ben6,
          ben7,
          ben8,
          ben9,
          ben10,
        ];
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
      <section className="bg-secondary-pink w-screen py-16 md:py-40 relative overflow-hidden text-primary-black">
        <img
          className="absolute bottom-10 left-40 z-0 hidden md:block"
          src={paws}
          alt="Paws background pattern"
        />
        <div className="relative z-10 px-6 md:px-20">
          <h1 className="text-primary-pink font-semibold text-3xl md:text-4xl mb-8">
            Notre association
          </h1>

          <div className="flex flex-wrap justify-center mb-8 md:mb-16">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="mx-4 my-2 flex flex-col items-center">
                <Skeleton variant="circular" width={100} height={100} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={80} />
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-center items-center">
            <p className="text-primary-black text-lg md:text-xl mb-4">
              et le réseau des{" "}
              <span className="font-bold text-primary-pink">bénévoles</span>!
            </p>
            <div className="flex flex-wrap justify-center">
              {[1, 2, 3, 4, 5, 6, 7].map((index) => (
                <Skeleton
                  key={index}
                  variant="circular"
                  width={40}
                  height={40}
                  style={{ margin: "4px" }}
                />
              ))}
            </div>
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
    <section className="bg-secondary-pink w-screen pt-16 md:pt-40 pb-20 relative overflow-hidden text-primary-black">
      <img
        className="absolute bottom-10 left-40 z-0 hidden md:block"
        src={paws}
        alt="Paws background pattern"
      />
      <div className="relative z-10 px-6 md:px-20">
        <h1 className="text-primary-pink font-semibold text-3xl md:text-4xl mb-8">
          Notre association
        </h1>

        <div className="flex flex-wrap justify-center mb-8 md:mb-16">
          {admins.map((admin, index) => (
            <div key={index} className="mx-4 my-2 flex flex-col items-center">
              <div className="rounded-full bg-white w-[140px] h-[140px] md:w-[70px] md:h-[70px] lg:w-[180px] lg:h-[180px] shadow-md overflow-hidden">
                <img
                  src={admin.image}
                  alt={`Admin ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-2 text-center text-lg md:text-base text-primary-black">
                {admin.name}
              </p>
              <p className="text-center text-md md:text-sm opacity-70 text-primary-pink">
                {admin.role}
              </p>
              <p className="text-center text-md md:text-sm opacity-70 text-primary-black">
                {admin.email}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center items-center">
          <p className="text-primary-black text-xl md:text-xl mb-4">
            et le réseau des{" "}
            <span className="font-bold text-primary-pink">bénévoles</span>!
          </p>
          <div className="flex flex-wrap justify-center">
            {members.map((avatar, index) => (
              <div
                key={index}
                className="rounded-full w-[40px] h-[40px] md:w-[50px] md:h-[50px] shadow-md overflow-hidden m-2"
              >
                <img
                  src={avatar}
                  alt={`Member ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center mt-8 md:mt-20">
          <iframe
            src="https://www.google.com/maps/d/u/0/embed?mid=14msch42jhWHs_xkxjKK-WVUtPpTPrSc&ehbc=2E312F"
            width="100%"
            height="480"
            className="max-w-[640px] w-full"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default Team;
