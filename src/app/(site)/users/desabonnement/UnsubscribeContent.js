"use client";

import { useEffect, useState } from "react";

export default function UnsubscribeContent({ email }) {
  const [state, setState] = useState(email ? "loading" : "invalid");

  useEffect(() => {
    if (!email) return;
    const unsubscribe = async () => {
      try {
        const response = await fetch("/api/users/desabonnement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setState(response.ok ? "success" : "error");
      } catch {
        setState("error");
      }
    };
    unsubscribe();
  }, [email]);

  const content = {
    loading: ["Désabonnement en cours…", "Nous traitons votre demande."],
    success: ["Vous êtes désabonné", "Votre adresse a bien été retirée de notre liste d’envoi."],
    invalid: ["Lien invalide", "L’adresse courriel est absente du lien de désabonnement."],
    error: ["Une erreur est survenue", "Nous n’avons pas pu traiter votre demande. Veuillez réessayer."],
  }[state];

  return (
    <section className="mt-20 flex min-h-[55vh] items-center justify-center bg-black px-5 py-20 text-white md:mt-28">
      <div className="w-full max-w-xl border border-zinc-700 bg-black p-8 text-center md:p-12">
        <div className="mx-auto mb-7 h-2 w-20 bg-pr" />
        <h1 className="font-bebas-neue text-5xl uppercase tracking-wide text-pr">{content[0]}</h1>
        <p className="mt-5 text-base leading-7 text-zinc-300">{content[1]}</p>
        {state === "error" && (
          <button className="mt-8 bg-pr px-6 py-3 font-bold text-black" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        )}
      </div>
    </section>
  );
}
