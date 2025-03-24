import chienPartner from '../../assets/landing-page/icons/chien.com_partner.svg';

const Partner = () => {
  return (
    <div className='w-full flex justify-center bg-white py-8'>
      <div className="">
          <p className="font-sans font-medium text-primary-pink mb-6">
            Avec le soutien de nos partenaires
          </p>
          <a href="https://www.chien.com" target="_blank">
              <img
                src={chienPartner}
                alt="Chien.com Partner"
                className="h-10 w-auto object-contain"
              />
          </a>
      </div>
    </div>
  );
};

export default Partner;