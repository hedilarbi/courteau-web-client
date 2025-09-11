import Link from "next/link";
import React from "react";

const SuccessPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <svg
            className="w-16 h-16 text-green-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="white"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2l4-4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Commande passée avec succès !
        </h1>
        <p className="text-gray-600 mb-6">
          Merci pour votre commande.
          <br />
          Elle est en attente de confirmation.
          <br />
          Vous recevrez un courriel dès qu&apos;elle sera validée.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-pr text-black rounded-lg shadow  transition"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;
