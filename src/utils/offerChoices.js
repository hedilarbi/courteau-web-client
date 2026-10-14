// Offres à choix (Offer.itemsToChoose fixé par l'admin) : nombre d'articles que le client choisit,
// 0 si tous les articles sont inclus. Fichier sans "use client" : utilisable côté serveur
// (cartes d'offres du menu / accueil) comme côté client.
export const getItemsToChoose = (offer) => {
  const count = Number(offer?.itemsToChoose);
  const total = offer?.items?.length || 0;
  return Number.isInteger(count) && count > 0 && count < total ? count : 0;
};
