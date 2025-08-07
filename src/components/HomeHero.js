import React from "react";

const HomeHero = () => {
  return (
    <section
      style={{ backgroundImage: "url('/HomeHero.jpg')" }}
      className="bg-cover bg-center h-[calc(100vh-140px)] flex items-center justify-center md:px-24 px-6 md:mt-28 mt-16"
    >
      <div>
        <h1 className="md:text-5xl text-3xl font-bebas-neue font-bold tracking-widest text-white text-center">
          Bienvenu au Casse-Croûte Courteau
        </h1>
        <p className="md:text-xl text-base font-inter font-medium text-white mt-6 text-center md:px-36 px-0">
          Venez découvrir les généreuses et délicieuses poutines ou les
          succulentes pizzas du Casse-Croûte Courteau. Le meilleur menu à
          Trois-Rivières.
        </p>
        <div className="flex md:flex-row flex-col items-center justify-center mt-10 md:gap-8 gap-4">
          <button className="bg-pr rounded-md  px-12 py-2 md:text-2xl text-lg cursor-pointer">
            <span className="text-black font-bebas-neue">
              Commander maintenant
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
