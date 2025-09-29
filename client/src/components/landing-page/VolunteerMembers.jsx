import ben1 from "../../assets/landing-page/icons/ben1-pfp.png";
import ben3 from "../../assets/landing-page/icons/ben3-pfp.png";
import ben4 from "../../assets/landing-page/icons/ben4-pfp.png";
import ben5 from "../../assets/landing-page/icons/ben5-pfp.png";
import ben6 from "../../assets/landing-page/icons/ben6-pfp.jpg";
import ben7 from "../../assets/landing-page/icons/ben7-pfp.png";
import ben8 from "../../assets/landing-page/icons/ben8-pfp.png";
import ben9 from "../../assets/landing-page/icons/ben9-pfp.png";
import ben10 from "../../assets/landing-page/icons/ben10-pfp.png";
import ben11 from "../../assets/landing-page/icons/ben11-pfp.png";
import ben12 from "../../assets/landing-page/icons/ben12-pfp.png";
import julius from "../../assets/landing-page/icons/julius-pfp.png";
import lilou from "../../assets/landing-page/icons/lilou-pfp.png";
import nana from "../../assets/landing-page/icons/nana-pfp.png";
import nath from "../../assets/landing-page/icons/nath-pfp.png";

import useLandingPageImages from "./useLandingPageImages";

const VolunteerMembers = () => {
  const { memberImages, loading, error } = useLandingPageImages();

  // Static fallback avatars
  const staticAvatars = [
    nana,
    julius,
    lilou,
    nath,
    ben1,
    ben3,
    ben4,
    ben5,
    ben6,
    ben7,
    ben8,
    ben9,
    ben10,
    ben11,
    ben12,
  ];

  if (loading) {
    return <p>Chargement des images...</p>;
  }
  if (error) {
    console.error(error);
    return <p>Erreur lors du chargement des images.</p>;
  }

  // Combine static and dynamic URLs with a hard guard
  const avatars = [
    ...staticAvatars,
    ...(Array.isArray(memberImages) ? memberImages : []),
  ];

  return (
    <div className="pb-4">
      <h1 className="text-primary-pink text-center text-lg font-semibold">
        Notre équipe
      </h1>
      <div className="flex flex-wrap justify-center">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className="rounded-full w-[40px] h-[40px] md:w-[50px] md:h-[50px] shadow-md overflow-hidden m-2"
          >
            <img
              src={avatar}
              alt={`Membre ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolunteerMembers;