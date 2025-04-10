import Hero from './Hero';
import Navbar from './Navbar';
import About from './About';
import Tutorial from './Tutorial';
import Team from './Team';
import Footer from './Footer';
import ConfettiEaster from '../misc/ConfettiEasterEgg';
import Partners from './Partners';

const LandingPage = () => {
  return (
    <div className='font-primary bg-secondary-pink relative overflow-x-hidden'>
      <Navbar />  
      <Hero />
      <div id="about">
        <About />
      </div>
      <Tutorial />
      <Team />
      <Partners />
      <Footer />
      <ConfettiEaster />
    </div>
  );
};

export default LandingPage;