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