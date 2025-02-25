import { Link } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Navbar from "../../landing-page/Navbar";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import PropTypes from "prop-types";

ChartJS.register(ArcElement, Tooltip, Legend);

// Load Stripe with VITE_STRIPE_PUBLISHABLE_KEY from .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de l’initiation du paiement");
      }

      const { clientSecret } = await response.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message);
        onError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        onSuccess();
      }
    } catch (error) {
      setErrorMessage(error.message);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg w-120 max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Faire un don de €{amount}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": { color: "#aab7c4" },
              },
              invalid: { color: "#9e2146" },
            },
          }}
          className="p-2 border rounded-md"
        />
        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
        <div className="flex justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-6 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition-colors duration-300"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className={`w-full rounded-full bg-primary-pink hover:bg-pink-600 text-white font-bold py-3 px-6 focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-opacity-50 transition-colors duration-300 ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessing ? "Traitement..." : "Confirmer le don"}
          </button>
        </div>
      </form>
    </div>
  );
};

// PropTypes for CheckoutForm
CheckoutForm.propTypes = {
  amount: PropTypes.number.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const Donate = () => {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Expense data (labels translated to French)
  const expensesData = {
    labels: [
      "Assurance MAIF",
      "Kit promeneur",
      "Affiches",
      "Hébergement du site",
      "Compte bancaire",
    ],
    datasets: [
      {
        label: "Dépenses annuelles (€)",
        data: [84, 3.7 * (16 + 37) + 4.4, 42, 37, 9 * 12],
        backgroundColor: [
          "rgba(30, 144, 255, 0.8)",
          "rgba(0, 191, 255, 0.8)",
          "rgba(0, 255, 255, 0.8)",
          "rgba(127, 255, 212, 0.8)",
          "rgba(152, 251, 152, 0.8)",
        ],
        borderColor: [
          "rgba(30, 144, 255, 1)",
          "rgba(0, 191, 255, 1)",
          "rgba(0, 255, 255, 1)",
          "rgba(127, 255, 212, 1)",
          "rgba(152, 251, 152, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const handleDonateSuccess = () => {
    alert("Merci pour votre don !");
    setSelectedAmount(null);
    setCustomAmount("");
    setShowCustomInput(false);
  };

  const handleDonateError = (message) => {
    alert(`Échec du don : ${message}`);
  };

  const handleClosePopup = () => {
    setSelectedAmount(null);
  };

  const donationAmounts = [2, 5, 10, 20, 50, 100];

  return (
    <section className="bg-white dark:bg-gray-900">
      <Navbar />
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        <aside className="relative block h-16 lg:order-last lg:col-span-5 lg:h-full xl:col-span-6">
          <img
            alt=""
            src="https://images.unsplash.com/photo-1542641698-fb122d995914?q=80&w=3332&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </aside>

        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6 mt-8">
          <div className="max-w-xl lg:max-w-3xl relative">
            <Link to="/" className="block text-primary-pink">
              Retour à l&#39;accueil
            </Link>

            <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl dark:text-white">
              Soutenir Chiens en Cavale 🦮
            </h1>

            <p className="mt-4 leading-relaxed text-gray-500 dark:text-gray-400">
              Aidez-nous à maintenir nos promenades 100% gratuites.
            </p>

            <div className="mt-8">
              <p className="leading-relaxed text-gray-500 dark:text-gray-400 mb-4">
                Pour assurer la pérennité de nos actions et continuer à offrir
                des promenades gratuites, nous avons besoin de votre soutien. Un
                aperçu de nos dépenses annuelles est ci-dessous. Chaque don,
                qu&#39;il soit modeste ou généreux, est précieux. Il nous permet
                de couvrir les frais essentiels au bon fonctionnement de
                l’association : hébergement du site internet, assurance
                multirisques pour nos bénévoles, frais bancaires, impressions de
                supports de communication, et bien plus encore.
              </p>

              <div
                className="chart-container"
                style={{ position: "relative", height: "300px", width: "100%" }}
              >
                <Pie data={expensesData} options={chartOptions} />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Faites un don
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className="rounded-full bg-primary-pink hover:bg-pink-600 text-white font-bold py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-opacity-50 transition-colors duration-300"
                  >
                    €{amount}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="rounded-full bg-primary-pink hover:bg-pink-600 text-white font-bold py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-opacity-50 transition-colors duration-300"
                >
                  Montant personnalisé
                </button>
              </div>

              {showCustomInput && (
                <div className="mt-4">
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Entrez un montant (EUR)"
                    className="w-full p-2 border rounded-md text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-pink"
                  />
                  <button
                    onClick={() => setSelectedAmount(parseFloat(customAmount) || null)}
                    disabled={!customAmount || customAmount < 1}
                    className="mt-2 w-full rounded-full bg-primary-pink hover:bg-pink-600 text-white font-bold py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-opacity-50 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmer le montant
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Popup for Card Details */}
      {selectedAmount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <Elements stripe={stripePromise}>
              <CheckoutForm
                amount={selectedAmount}
                onSuccess={handleDonateSuccess}
                onError={handleDonateError}
                onClose={handleClosePopup}
              />
            </Elements>
          </div>
        </div>
      )}
    </section>
  );
};

// PropTypes for Donate (currently no props, but added for future-proofing)
Donate.propTypes = {
  // Add any future props here if needed
};

export default Donate;