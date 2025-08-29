import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faUpload, faPaw } from "@fortawesome/free-solid-svg-icons";
import cecLogo from "../../../assets/landing-page/identity/chiensencavale-logo.png";
import { QRCodeSVG } from "qrcode.react";
import heic2any from "heic2any";

const VolunteerCard = () => {
  const [username, setUsername] = useState("");
  const [personalId, setPersonalId] = useState(null);
  const [, setSubscriptionPaid] = useState(false); // kept for potential future display
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState(null); // ISO
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [personalIdSet, setPersonalIdSet] = useState(false);
  const [canUnlockCard, setCanUnlockCard] = useState(false); // TRUE only if paid & not expired
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);

  const fullProfilePictureUrl = profilePictureUrl || "";

  useEffect(() => {
    const fetchVolunteerData = async () => {
      setLoading(true);
      setError(null);
      const token = Cookies.get("token");
      if (!token) {
        setError("Authentification requise");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/volunteer/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Échec du chargement des données du bénévole");
        const data = await response.json();
        setUsername(data.username);
        setPersonalId(data.personalId);
        setSubscriptionPaid(data.subscriptionPaid);
        setSubscriptionExpiryDate(data.subscriptionExpiryDate);
        setProfilePictureUrl(data.profilePictureUrl);
        setPersonalIdSet(data.personalIdSet);
        setCanUnlockCard(data.canUnlockCard);
      } catch (err) {
        setError(err.message || "Erreur inattendue");
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteerData();
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type === "image/heic") {
      try {
        const convertedBlob = await heic2any({ blob: file });
        const convertedFile = new File(
          [convertedBlob],
          file.name.replace(".heic", ".jpg"),
          { type: "image/jpeg" }
        );
        setSelectedFile(convertedFile);
      } catch (error) {
        console.error("Error converting HEIC file:", error);
      }
    } else {
      setSelectedFile(file);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!selectedFile) {
      setError("Veuillez sélectionner une image avant de soumettre.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    const token = Cookies.get("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/profile-picture`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Failed to upload profile picture");
      const data = await response.json();
      setProfilePictureUrl(data.profilePictureUrl);
      setSelectedFile(null);
      setError(null);
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError("Erreur lors du téléchargement de la photo de profil");
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const cardWidth = cardRef.current.offsetWidth;
      const cardHeight = cardRef.current.offsetHeight;

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: null,
        width: cardWidth,
        height: cardHeight,
        quality: 1,
        skipAutoScale: true,
      });

      saveAs(dataUrl, `carte_benevole_${personalId ?? "np"}.png`);
    } catch (err) {
      console.error("Erreur lors de la génération de l'image :", err);
      setError("Erreur lors de la génération de l'image");
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full max-w-md mx-auto bg-white rounded-lg shadow-md">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 w-full max-w-md mx-auto bg-white rounded-lg shadow-md text-red-500 text-center">
        Erreur: {error}
      </div>
    );
  }

  // Gate strictly on subscription validity
  if (!canUnlockCard) {
    return (
      <div className="my-8">
        <div className="w-full max-w-md">
          <div className="relative rounded-lg shadow-md overflow-hidden flex flex-row h-[200px] bg-transparent">
            <div className="bg-[#F7749D] w-[30%] flex items-center justify-center">
              <div className="w-28 h-auto">
                <img src={cecLogo} alt="Chiens en Cavale Logo" className="w-full" />
              </div>
            </div>
            <div className="w-[70%] p-6 flex flex-col justify-center bg-white">
              <h2 className="text-lg font-bold text-[#F7749D] text-center">
                Cotisation Requise
              </h2>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Vous devez payer votre cotisation annuelle pour obtenir votre carte.
              </p>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Rendez-vous à la section de paiement pour activer votre abonnement.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-[#F7749D] opacity-20 rounded-bl-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const formattedExpiryDate = subscriptionExpiryDate
    ? new Date(subscriptionExpiryDate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "N/A";

  const qrCodeValue = `https://chiensencavale.com`;

  return (
    <div className="my-8">
      <div className="w-full max-w-md">
        {/* Profile Picture Upload Section */}
        <div className="flex gap-2 mb-4">
          <label
            className={`flex-1 p-2 text-white text-center rounded cursor-pointer transition-colors ${
              personalIdSet ? "bg-[#F7749D] hover:bg-[#db7595]" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            <span className="text-sm font-semibold">
              {selectedFile ? selectedFile.name : "Choisir ma photo de profil"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={!personalIdSet}
            />
          </label>
          <button
            onClick={handleProfilePictureUpload}
            disabled={!selectedFile || !personalIdSet}
            className={`${
              selectedFile && personalIdSet
                ? "bg-[#F7749D] hover:bg-[#db7595]"
                : "bg-gray-300 cursor-not-allowed"
            } text-white px-3 py-2 rounded font-semibold text-sm flex items-center justify-center transition-colors`}
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            Soumettre
          </button>
        </div>

        <div
          ref={cardRef}
          className={`relative rounded-lg shadow-md overflow-hidden transition-all duration-300 flex flex-row h-[230px] bg-transparent ${
            !personalIdSet ? "opacity-50 pointer-events-none bg-gray-200" : ""
          }`}
        >
          <div className="bg-[#F7749D] w-[30%] flex items-center justify-center">
            <div className="w-24 h-auto">
              <img src={cecLogo} alt="Chiens en Cavale Logo" className="w-full" />
            </div>
          </div>
          <div className="w-[70%] p-6 flex flex-row justify-between bg-white">
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#F7749D]">Ma Carte Promeneur</h2>
                <p className="text-base font-semibold text-gray-700 mt-1.5">{username}</p>
                <p className="text-sm text-gray-600 mt-1">
                  NP {personalId ?? "Non défini"}
                </p>
                <div className="flex justify-start mt-2">
                  <QRCodeSVG value={qrCodeValue} size={64} />
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs mt-1 text-gray-600">Chiens en Cavale</p>
                <p className="text-xs text-gray-600">
                  Valable jusqu&#39;au {formattedExpiryDate}
                </p>
              </div>
            </div>
            {/* Profile Picture Display */}
            <div className="flex items-center">
              {profilePictureUrl ? (
                <img
                  src={fullProfilePictureUrl}
                  alt="Profile"
                  className="w-20 h-20 object-cover rounded-full border-2 border-[#F7749D]"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error("Image failed to load:", fullProfilePictureUrl, e);
                    e.currentTarget.src = "/default-profile.png";
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faPaw} className="text-gray-600 text-3xl" />
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={!personalIdSet}
          className={`mt-4 w-full text-white py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center transition-colors ${
            personalIdSet ? "bg-[#F7749D] hover:bg-[#db7595]" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <FontAwesomeIcon icon={faDownload} className="mr-2" />
          Télécharger
        </button>
      </div>
    </div>
  );
};

export default VolunteerCard;