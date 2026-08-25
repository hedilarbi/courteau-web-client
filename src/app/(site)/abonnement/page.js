import SubscriptionContent from "@/components/SubscriptionContent";
import React from "react";

export const metadata = {
  title: "Club Courteau | Abonnement",
  description: "Profitez de 15 % de rabais, de la livraison gratuite et d’un article offert chaque mois avec le Club Courteau.",
  alternates: { canonical: "/abonnement" },
};

const Page = () => {
  return <SubscriptionContent mode="offer" />;
};

export default Page;
