import React from "react";

const Page = () => {
  return (
    <main className="md:px-14 md:py-10 p-4 md:mt-28 mt-20 mb-20">
      <h1 className="md:text-4xl text-2xl font-bold mb-4 font-bebas-neue text-center">
        Supprimer un compte
      </h1>
      <div className="max-w-2xl mx-auto">
        <p className="md:text-base/7 text-sm font-inter text-gray-700 font-semibold mb-6">
          Pour supprimer votre compte, suivez les étapes ci-dessous dans
          l&apos;application mobile Casse-croûte Courteau.
        </p>
        <ol className="list-decimal pl-6 space-y-2 md:text-base text-sm font-inter text-gray-700 font-semibold">
          <li>Ouvrir l&apos;application mobile Casse-croûte Courteau.</li>
          <li>Naviguer vers la page Profil.</li>
          <li>Choisir l&apos;option Supprimer le compte.</li>
          <li>Valider.</li>
        </ol>
      </div>
    </main>
  );
};

export default Page;
