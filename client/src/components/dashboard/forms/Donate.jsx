import { Link } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Navbar from '../../landing-page/Navbar'

ChartJS.register(ArcElement, Tooltip, Legend);

const Donate = () => {
    // Expense data
    const expensesData = {
        labels: [
            'Assurance MAIF',
            'Kit promeneur',
            'Affiches',
            'Hébergement du site',
            'Compte bancaire',
        ],
        datasets: [
            {
                label: 'Dépenses annuelles (€)',
                data: [84, (3.70 * (16 + 37)) + 4.40, 42, 37, 9 * 12], // Kit promeneur cost calculation (16 + 37 bénévoles) + livraison
                backgroundColor: [
                    'rgba(30, 144, 255, 0.8)',   // Vivid Blue (Dodger Blue)
                    'rgba(0, 191, 255, 0.8)',    // Vivid Cyan (Deep Sky Blue)
                    'rgba(0, 255, 255, 0.8)',    // Vivid Light Blue (Cyan)
                    'rgba(127, 255, 212, 0.8)',  // Vivid Aquamarine (Aquamarine)
                    'rgba(152, 251, 152, 0.8)',  // Vivid Green (Pale Green)
                ],
                borderColor: [
                    'rgba(30, 144, 255, 1)',     // Vivid Blue (Dodger Blue)
                    'rgba(0, 191, 255, 1)',      // Vivid Cyan (Deep Sky Blue)
                    'rgba(0, 255, 255, 1)',      // Vivid Light Blue (Cyan)
                    'rgba(127, 255, 212, 1)',    // Vivid Aquamarine (Aquamarine)
                    'rgba(152, 251, 152, 1)',    // Vivid Green (Pale Green)
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Allow chart to adjust to container size
    };


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
                                Pour assurer la pérennité de nos actions et continuer à offrir des promenades gratuites, nous avons besoin de votre soutien.  Un aperçu de nos dépenses annuelles est ci-dessous.  Chaque don, petit ou grand, compte énormément et nous aide à couvrir ces frais essentiels.
                            </p>

                            <div className="chart-container" style={{ position: 'relative', height: '300px', width: '100%' }}>
                                <Pie data={expensesData} options={chartOptions} />
                            </div>
                        </div>


                        <div className="mt-8 grid grid-cols-6 gap-6 opacity-50 pointer-events-none"> {/* Opacity and pointer-events to disable */}
                            <div className="col-span-6">
                                <p className="block text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                                    Les dons seront bientôt disponibles. Merci de votre patience.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </section>
    );
};

export default Donate;