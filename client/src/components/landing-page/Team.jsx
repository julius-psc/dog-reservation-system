import { useState, useEffect } from "react";

// Asset imports (Admins and background)
import paws from "../../assets/landing-page/icons/paws-pink.svg";
import julius from "../../assets/landing-page/icons/julius-pfp.png";
import lilou from "../../assets/landing-page/icons/lilou-pfp.png";
import nana from "../../assets/landing-page/icons/nana-pfp.png";
import nath from "../../assets/landing-page/icons/nath-pfp.png";

// Define your API base URL, ideally from environment variables
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const Team = () => {
  // Admins are kept hardcoded as their details (role, email) are specific
  const [admins] = useState([
    {
      image: nana,
      name: "Louisiana Richard",
      role: "Présidente",
      email: "louisiana.richard@gmail.com",
    },
    {
      image: julius,
      name: "Julius Peschard",
      role: "Vice-président & Webmaster",
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
  ]);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Step 1: Create a set of admin image filenames for easy filtering
        // This extracts "nana-pfp.png" from the full import path
        const adminImageFiles = new Set(
          admins.map((admin) => admin.image.split("/").pop())
        );

        // Step 2: Fetch all member images from the public API endpoint
        // NOTE: Ensure you have a public endpoint like `/member-images`
        const res = await fetch(`${API_BASE}/member-images`);
        if (!res.ok) {
          throw new Error("Failed to fetch member images from the server.");
        }
        const data = await res.json();
        const allMembers = data.items || [];

        // Step 3: Filter out the members who are already in the admin list
        const volunteerMembers = allMembers.filter((member) => {
          const memberImageFile = member.url.split("/").pop();
          return !adminImageFiles.has(memberImageFile);
        });

        setMembers(volunteerMembers);
      } catch (err) {
        setError(err);
        console.error("Error fetching team data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admins]); // Depend on admins in case it ever becomes dynamic

  if (loading) {
    // Skeleton loading state (no changes needed here)
    return (
      <section className="bg-secondary-pink w-screen py-16 md:py-40 relative overflow-hidden text-primary-black">
        {/* ... existing skeleton JSX ... */}
      </section>
    );
  }

  if (error) {
    // Error display state
    return (
      <section className="bg-secondary-pink w-screen py-40 relative overflow-hidden text-primary-black text-center">
        <p className="text-red-500">
          Une erreur est survenue lors du chargement de l&#39;équipe.
        </p>
        <p className="text-gray-600 text-sm mt-2">{error.message}</p>
      </section>
    );
  }

  // Final rendered component
  return (
    <section className="bg-secondary-pink w-screen pt-8 md:pt-40 pb-20 relative overflow-hidden text-primary-black">
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
              {/* ... existing admin display JSX ... */}
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center items-center">
          <p className="text-primary-black text-xl md:text-xl mb-4">
            et le réseau des{" "}
            <span className="font-bold text-primary-pink">bénévoles</span>!
          </p>
          <div className="flex flex-wrap justify-center">
            {/* UPDATED: Map over the fetched and filtered members */}
            {members.map((member) => (
              <div
                key={member.id} // Use a unique ID from the API
                className="rounded-full w-[40px] h-[40px] md:w-[50px] md:h-[50px] shadow-md overflow-hidden m-2"
              >
                <img
                  src={member.url} // Use the URL from the API
                  alt={`Bénévole ${member.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center mt-8 md:mt-20">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2593.992816301364!2d-0.3421289233621931!3d49.20818987138381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x480a63c9071c6679%3A0x629553f86b45d233!2sLa%20Colline%20aux%20Oiseaux!5e0!3m2!1sen!2sfr!4v1727638334460!5m2!1sen!2sfr"
            width="640"
            height="480"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default Team;