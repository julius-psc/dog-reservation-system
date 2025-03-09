import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import cecLogo from "../../../assets/landing-page/identity/chiensencavale-logo.png";
import { QRCodeSVG } from "qrcode.react";

const VolunteerCard = () => {
  const [username, setUsername] = useState("");
  const [personalId, setPersonalId] = useState(null);
  const [subscriptionPaid, setSubscriptionPaid] = useState(false);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);

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
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok)
          throw new Error("Échec du chargement des données du bénévole");
        const data = await response.json();
        setUsername(data.username);
        setPersonalId(data.personalId);
        setSubscriptionPaid(data.subscriptionPaid);
        setSubscriptionExpiryDate(data.subscriptionExpiryDate);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteerData();
  }, []);

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const cardWidth = cardRef.current.offsetWidth;
        const cardHeight = cardRef.current.offsetHeight;
  
        const dataUrl = await toPng(cardRef.current, {
          pixelRatio: 3,
          backgroundColor: null, // Transparent background
          width: cardWidth, 
          height: cardHeight,
          quality: 1, // Maximum quality (higher than default 0.92)
          skipAutoScale: true, // Ensures it captures the correct size
        });
  
        saveAs(dataUrl, `carte_benevole_${personalId}.png`);
      } catch (err) {
        console.error("Erreur lors de la génération de l'image :", err);
        setError("Erreur lors de la génération de l'image");
      }
    }
  };
  

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          width: "100%",
          maxWidth: "480px", // Increased width
          margin: "16px auto",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              width: "96px",
              height: "96px",
              backgroundColor: "#e5e7eb",
              borderRadius: "50%",
            }}
          ></div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                height: "24px",
                width: "75%",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
              }}
            ></div>
            <div
              style={{
                height: "16px",
                width: "50%",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
              }}
            ></div>
            <div
              style={{
                height: "16px",
                width: "66%",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          width: "100%",
          maxWidth: "480px", // Increased width
          margin: "16px auto",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          color: "#ef4444",
          textAlign: "center",
        }}
      >
        Erreur: {error}
      </div>
    );
  }

  if (!subscriptionPaid) {
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}> {/* Increased width */}
          <div
            style={{
              position: "relative",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "row",
              height: "200px",
              background: "transparent",
            }}
          >
            <div
              style={{
                backgroundColor: "#F7749D",
                width: "30%", // Adjusted proportion
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: "112px", height: "auto" }}>
                <img src={cecLogo} alt="Chiens en Cavale Logo" style={{ width: "100%" }} />
              </div>
            </div>
            <div
              style={{
                width: "70%", // Adjusted proportion
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                backgroundColor: "#ffffff",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#F7749D",
                  textAlign: "center",
                }}
              >
                Cotisation Requise
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  marginTop: "8px",
                  textAlign: "center",
                }}
              >
                Vous devez payer votre cotisation pour obtenir votre carte de bénévole.
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "8px",
                  textAlign: "center",
                }}
              >
                Rendez-vous à la section de paiement pour activer votre abonnement.
              </p>
            </div>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "48px",
                height: "48px",
                backgroundColor: "#F7749D",
                opacity: 0.2,
                borderBottomLeftRadius: "48px",
              }}
            ></div>
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
    <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}> {/* Increased width */}
        <div
          ref={cardRef}
          style={{
            position: "relative",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            transition: "all 300ms",
            display: "flex",
            flexDirection: "row",
            height: "220px",
            background: "transparent",
          }}
        >
          <div
            style={{
              backgroundColor: "#F7749D",
              width: "30%", // Adjusted proportion
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "96px", height: "auto" }}>
              <img src={cecLogo} alt="Chiens en Cavale Logo" style={{ width: "100%" }} />
            </div>
          </div>
          <div
            style={{
              width: "70%", // Adjusted proportion
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "#ffffff",
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#F7749D" }}>
                Carte Promeneur
              </h2>
              <p style={{ fontSize: "16px", fontWeight: "600", color: "#4b5563", marginTop: "6px" }}>
                {username}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>NP {personalId}</p>
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "8px" }}>
                <QRCodeSVG value={qrCodeValue} size={64} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Chiens en Cavale</p>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                Valide jusqu&#39;au {formattedExpiryDate}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          style={{
            marginTop: "16px",
            width: "100%",
            backgroundColor: "#F7749D",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            transition: "background-color 300ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#db7595")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#F7749D")}
        >
          <FontAwesomeIcon icon={faDownload} style={{ marginRight: "8px" }} />
          Télécharger
        </button>
      </div>
    </div>
  );
};

export default VolunteerCard;