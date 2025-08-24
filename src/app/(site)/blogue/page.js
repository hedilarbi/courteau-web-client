import Image from "next/image";
import Link from "next/link";
import React from "react";
import blogueList from "@/constants/blogueData";
const page = () => {
  return (
    <div className="md:mt-28 mt-18 pb-20" id="main">
      <section
        className="bg-black flex justify-center items-center md:h-[40vh] h-[50vh]"
        aria-labelledby="blogue-title"
      >
        <div className="px-4 text-center max-w-5xl">
          <h1
            id="blogue-title"
            className="text-white text-3xl md:text-5xl font-bold font-bebas-neue"
          >
            notre blogue
          </h1>
          <p className="text-white text-base md:text-xl mt-4 font-inter font-semibold">
            Après avoir dévoré l&apos;un de nos fameux repas, vous aurez
            certainement envie de dévorer les articles de blogue ci-dessous!
            Vous avez envie d&apos;en savoir plus sur le Courteau et ses
            fameuses recettes? Vous êtes donc au bon endroit. Bonne lecture!
          </p>
        </div>
      </section>
      <section className="md:px-14 px-4 mt-10">
        <h2
          id="blogue-list-title"
          className="text-2xl md:text-4xl font-bold font-bebas-neue text-center mb-6"
        >
          Articles récents
        </h2>
        <div className="grid md:grid-cols-3 grid-cols-1 gap-6">
          {blogueList.map((article) => (
            <article
              key={article.id}
              className="bg-white p-6 rounded-lg shadow-md font-inter"
              aria-labelledby={`${article.slug}-title`}
            >
              <Image
                src={article.image}
                alt={article.title}
                width={800}
                height={600}
                sizes="(max-width:768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <h3
                id={`${article.slug}-title`}
                className="text-xl font-semibold text-center mb-4"
              >
                <Link href={article.link} className="hover:underline">
                  {article.title}
                </Link>
              </h3>
              <p className="text-gray-600 mb-4">{article.content}</p>
              <Link
                href={article.link}
                className="bg-pr text-black px-4 py-2 rounded-md hover:bg-pr/80 transition-colors font-inter font-semibold text-center mx-auto mt-4"
              >
                Lire l&apos;article
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default page;
