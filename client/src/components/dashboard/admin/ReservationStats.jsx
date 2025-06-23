import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Cookies from "js-cookie";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const ReservationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reservations/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Invalid response: ${text}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const adjustOffPlatform = async (amount) => {
    const token = Cookies.get("token");
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/reservations/offplatform-adjust`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, type: "completed" }),
        }
      );
      if (!res.ok) throw new Error("Failed to update adjustment");
      toast.success("Ajout manuel mis à jour");
      fetchStats();
    } catch (err) {
      toast.error("Erreur mise à jour manuel");
      console.error(err);
    }
  };

  if (loading)
    return (
      <p className="text-gray-500 dark:text-gray-300">
        Chargement des stats...
      </p>
    );
  if (error) return <p className="text-red-500">Erreur : {error}</p>;

  const monthlyData = Object.entries(stats.monthly).map(
    ([label, completed]) => ({ label, completed })
  );
  const yearlyData = Object.entries(stats.yearly).map(([label, completed]) => ({
    label,
    completed,
  }));

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: "Réservations Complétées",
            count: stats.completed,
          },
          {
            title: "Réservations Hors-Plateforme",
            count: stats.off_platform_adjustments || 0,
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-gray-600 dark:text-gray-300 font-medium">
              {stat.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stat.count}
            </p>
            {stat.title.includes("Hors") && (
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-1 bg-green-600 text-white rounded"
                  onClick={() => adjustOffPlatform(1)}
                >
                  +1
                </button>
                <button
                  className="px-4 py-1 bg-red-600 text-white rounded"
                  onClick={() => adjustOffPlatform(-1)}
                >
                  -1
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {[
        { title: "Réservations Mensuelles", data: monthlyData },
        { title: "Réservations Annuelles", data: yearlyData },
      ].map((block, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 my-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
            {block.title}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={block.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#10B981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ReservationStats;



