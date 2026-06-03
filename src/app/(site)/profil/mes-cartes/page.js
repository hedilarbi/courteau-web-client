"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import BackButton from "@/components/BackButton";
import Spinner from "@/components/spinner/Spinner";
import {
  getPaymentMethods,
  deletePaymentMethod,
  attachPaymentMethod,
  updatePaymentMethod,
} from "@/services/UserServices";

const brandIcon = (brand) => {
  switch (brand) {
    case "visa":
      return <Image src="/visa.svg" alt="Visa" width={50} height={22} />;
    case "mastercard":
      return <Image src="/mastercard.svg" alt="Mastercard" width={50} height={32} />;
    case "amex":
      return <Image src="/amex.svg" alt="Amex" width={50} height={32} />;
    default:
      return (
        <span className="text-gray-400 text-2xl">💳</span>
      );
  }
};

const Page = () => {
  const { user, loading } = useUser();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [addError, setAddError] = useState("");

  const [editingCard, setEditingCard] = useState(null);
  const [editMonth, setEditMonth] = useState("");
  const [editYear, setEditYear] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  const fetchCards = async () => {
    if (!user?.stripe_id) {
      setCards([]);
      setCardsLoading(false);
      return;
    }
    try {
      const response = await getPaymentMethods(user.stripe_id);
      if (response.status) setCards(response.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCards();
  }, [user?.stripe_id]);

  const handleDelete = async (cardId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette carte ?")) return;
    setDeletingId(cardId);
    try {
      const response = await deletePaymentMethod(cardId);
      if (response.status) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
      } else {
        alert(response.message || "Impossible de supprimer la carte.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCard = async () => {
    if (!stripe || !elements) return;
    if (!cardComplete) {
      setAddError("Veuillez compléter les informations de la carte.");
      return;
    }
    setAddingCard(true);
    setAddError("");
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
        billing_details: { email: user?.email?.trim() || "" },
      });
      if (error) {
        setAddError(error.message || "Erreur lors de la création du moyen de paiement.");
        return;
      }
      const response = await attachPaymentMethod(user._id, paymentMethod.id);
      if (response.status) {
        setShowAddCard(false);
        setCardComplete(false);
        setCardsLoading(true);
        await fetchCards();
      } else {
        setAddError(response.message || "Impossible d'ajouter la carte.");
      }
    } finally {
      setAddingCard(false);
    }
  };

  const openEdit = (card) => {
    setEditingCard(card);
    setEditMonth(String(card.card?.exp_month || "").padStart(2, "0"));
    setEditYear(String(card.card?.exp_year || "").slice(-2));
    setEditError("");
  };

  const handleSaveEdit = async () => {
    const month = parseInt(editMonth, 10);
    const fullYear = editYear.length === 2 ? 2000 + parseInt(editYear, 10) : parseInt(editYear, 10);
    if (!month || month < 1 || month > 12) {
      setEditError("Mois invalide (01–12).");
      return;
    }
    if (!fullYear || fullYear < new Date().getFullYear()) {
      setEditError("Année invalide.");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      const response = await updatePaymentMethod(editingCard.id, month, fullYear);
      if (response.status) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === editingCard.id
              ? { ...c, card: { ...c.card, exp_month: month, exp_year: fullYear } }
              : c,
          ),
        );
        setEditingCard(null);
      } else {
        setEditError(response.message || "Impossible de modifier la carte.");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="flex items-center justify-center h-screen md:mt-28 mt-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-2 pb-20">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6 mt-4 font-bebas-neue">Mes cartes bancaires</h1>

      {cardsLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="max-w-lg space-y-3">
          {cards.length === 0 && !showAddCard && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500 text-sm">
              Aucune carte enregistrée
            </div>
          )}

          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-shrink-0">{brandIcon(card.card?.brand)}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">•••• {card.card?.last4}</p>
                <p className="text-xs text-gray-400">
                  {String(card.card?.exp_month || "").padStart(2, "0")}/
                  {String(card.card?.exp_year || "").slice(-2)}
                </p>
              </div>
              <button
                onClick={() => openEdit(card)}
                className="p-2 text-gray-500 hover:text-black transition"
                title="Modifier l'expiration"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(card.id)}
                disabled={deletingId === card.id}
                className="p-2 text-red-500 hover:text-red-700 transition disabled:opacity-50"
                title="Supprimer"
              >
                {deletingId === card.id ? <Spinner /> : "🗑️"}
              </button>
            </div>
          ))}

          {showAddCard ? (
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <p className="font-semibold text-sm">Nouvelle carte</p>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <CardElement
                  options={{ hidePostalCode: true }}
                  onChange={(e) => {
                    setCardComplete(!!e.complete);
                    setAddError("");
                  }}
                />
              </div>
              {addError && <p className="text-red-500 text-xs">{addError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddCard(false); setAddError(""); }}
                  disabled={addingCard}
                  className="flex-1 py-2 rounded-full border border-gray-300 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCard}
                  disabled={addingCard || !cardComplete}
                  className="flex-1 py-2 rounded-full bg-black text-white text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition"
                >
                  {addingCard ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCard(true)}
              className="w-full bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <span className="font-semibold text-sm">Ajouter une carte</span>
              <span className="text-xl text-gray-500">+</span>
            </button>
          )}
        </div>
      )}

      {editingCard && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setEditingCard(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-bold text-base mb-1">Modifier la date d&apos;expiration</p>
            <p className="text-xs text-gray-400 mb-4">Carte •••• {editingCard.card?.last4}</p>
            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Mois (MM)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  value={editMonth}
                  onChange={(e) => setEditMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-pr"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Année (AA)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="AA"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-pr"
                />
              </div>
            </div>
            {editError && <p className="text-red-500 text-xs mb-3">{editError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCard(null)}
                disabled={savingEdit}
                className="flex-1 py-2 rounded-full border border-gray-300 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 py-2 rounded-full bg-black text-white text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition"
              >
                {savingEdit ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
