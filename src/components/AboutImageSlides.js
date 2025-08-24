"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const images = ["/about-image1.png", "/about-image2.png", "/about-image3.png"];
const AboutImageSlides = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % images.length);
        setFade(true);
      }, 400); // fade out duration
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="relative h-full min-h-[280px]">
      <Image
        key={index}
        src={images[index]}
        alt="Cuisine et équipe du Casse-Croûte Courteau à Trois-Rivières"
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className={`rounded-lg shadow-md object-cover transition-opacity duration-400 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
        priority
      />
    </div>
  );
};

export default AboutImageSlides;
