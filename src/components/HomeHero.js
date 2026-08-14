import Link from "next/link";
import { getImageProps } from "next/image";
import React from "react";
import heroMobile from "../../public/hero1.jpg";
import heroDesktop from "../../public/hero2.jpg";

const HomeHero = () => {
  const imageProps = {
    alt: "",
    sizes: "100vw",
    priority: true,
    loading: "eager",
    fetchPriority: "high",
  };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...imageProps, src: heroDesktop });
  const { props: mobileImageProps } = getImageProps({
    ...imageProps,
    src: heroMobile,
  });

  return (
    <section
      className="relative overflow-hidden h-[calc(100vh-140px)] flex items-center justify-center md:px-24 px-6 md:mt-28 mt-16"
    >
      <picture className="absolute inset-0 block">
        <source
          media="(min-width: 768px)"
          srcSet={desktopSrcSet}
          sizes="100vw"
        />
        <img
          {...mobileImageProps}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
      </picture>
      <div className="relative z-10">
        <h1 className="md:text-5xl text-3xl font-bebas-neue font-bold tracking-widest text-white text-center">
          Bienvenue au Casse-Croûte Courteau
        </h1>
        <p className="md:text-xl text-base font-inter font-medium text-white mt-6 text-center md:px-36 px-0">
          Venez découvrir les généreuses et délicieuses poutines ou les
          succulentes pizzas du Casse-Croûte Courteau. Le meilleur menu à
          Trois-Rivières.
        </p>
        <div className="flex md:flex-row flex-col items-center justify-center mt-10 md:gap-8 gap-4">
          <Link
            href="/menu"
            className="bg-pr rounded-md  px-12 py-2 md:text-2xl text-lg cursor-pointer"
          >
            <span className="text-black font-bebas-neue">
              Commander maintenant
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
