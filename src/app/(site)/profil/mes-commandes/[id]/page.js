"use client";
import BackButton from "@/components/BackButton";
import Spinner from "@/components/spinner/Spinner";
import { useUser } from "@/context/UserContext";
import { getOrder } from "@/services/UserServices";
import { useParams, useRouter } from "next/navigation";

import React, { useEffect } from "react";

const Page = () => {
  const { id } = useParams();
  const router = useRouter();
  const { loading, user } = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [order, setOrder] = React.useState(null);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await getOrder(id);
      if (response.status) {
        setOrder(response.data);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchOrder();
    }
    if (!loading && !user) {
      router.push("/connexion");
    }
  }, [user, loading]);

  if (loading || isLoading) {
    return (
      <div className="md:mt-28 mt-20 flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user && !loading) {
    return null;
  }

  const getStatusLabel = (status) =>
    status === "Livreé" ? "Livrée" : status;

  const statusStyles = (status) => {
    switch (getStatusLabel(status)) {
      case "Livrée":
        return "text-green-400";
      case "En cours":
        return "text-yellow-400";
      case "Annulé":
        return "text-red-400";
      case "En Livraison":
        return "text-yellow-400";

      case "Terminée":
        return "text-green-400";
      case "Ramassé":
        return "text-green-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="md:mt-28 mt-20  min-h-[80vh]  bg-[#F3F4F6] p-4 pb-20">
      {order && (
        <div className="w-full space-y-8 ">
          <BackButton />
          <div className="flex items-center justify-between shadow-lg bg-white p-6 rounded-xl mb-6">
            <h2 className="text-3xl font-extrabold text-pr-700 tracking-tight text-pr">
              Commande #{order.code}
            </h2>
            <p
              className={`px-4 py-1 rounded-full text-sm font-bold shadow transition 
                ${statusStyles(order.status)}`}
            >
              {getStatusLabel(order.status)}
            </p>
          </div>
          <div className="shadow-lg bg-white p-6 rounded-xl mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-pr-900">
              <div className="space-y-4">
                <div>
                  <span className="font-semibold text-pr-500">Type :</span>{" "}
                  <span className="text-pr-700">
                    {order.type === "pick up" ? "À emporter" : "Livraison"}
                  </span>
                </div>
                {order.promoCode && (
                  <div>
                    <span className="font-semibold text-pr-500">
                      Code promo :
                    </span>{" "}
                    <span className="text-pr-700">
                      {order.promoCode.code} (
                      {order.promoCode.percent
                        ? `-${order.promoCode.percent}%`
                        : order.promoCode.amount
                        ? `-${order.promoCode.amount.toFixed(2)}$`
                        : "Article gratuit"}
                      )
                    </span>
                  </div>
                )}
                {order.type === "delivery" && (
                  <div>
                    <span className="font-semibold text-pr-500">Adresse :</span>{" "}
                    <span className="text-pr-700">{order.address}</span>
                  </div>
                )}
                {order.restaurant?.name && (
                  <div>
                    <span className="font-semibold text-pr-500">
                      Restaurant :
                    </span>{" "}
                    <span className="text-pr-700">{order.restaurant.name}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-pr-500">Date :</span>{" "}
                  <span className="text-pr-700">
                    {new Date(order.createdAt).toLocaleString("fr-FR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="shadow-lg bg-white p-6 rounded-xl mb-6">
            {order.orderItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-inter font-semibold text-xl">Articles</h3>
                {order.orderItems.map((item, index) => (
                  <div
                    key={item._id}
                    className={`flex justify-between items-center ${
                      order.orderItems.length - 1 === index
                        ? ""
                        : "border-b border-gray-200 pb-2"
                    }`}
                  >
                    <div>
                      <p className="font-semibold font-inter text-pr-700">
                        {item.item.name}{" "}
                        <span className="text-gray-500 font-medium">
                          {" "}
                          ({item.size}){" "}
                        </span>
                      </p>
                    </div>
                    <div className="font-inter font-semibold">
                      {item.price.toFixed(2)} $
                    </div>
                  </div>
                ))}
              </div>
            )}
            {order.offers.length > 0 && (
              <div className="space-y-4 mt-4">
                <h3 className="font-inter font-semibold text-xl">Offres</h3>
                {order.offers.map((item, index) => (
                  <div
                    key={item._id}
                    className={`flex justify-between items-center ${
                      order.offers.length - 1 === index
                        ? ""
                        : "border-b border-gray-200 pb-2"
                    }`}
                  >
                    <div>
                      <p className="font-semibold font-inter text-pr-700">
                        {item.offer.name}
                      </p>
                    </div>
                    <div className="font-inter font-semibold">
                      {item.price.toFixed(2)} $
                    </div>
                  </div>
                ))}
              </div>
            )}
            {order.rewards.length > 0 && (
              <div className="space-y-4 mt-4">
                <h3 className="font-inter font-semibold text-xl">
                  Récompenses
                </h3>
                {order.rewards.map((item, index) => (
                  <div
                    key={item._id}
                    className={`flex justify-between items-center ${
                      order.rewards.length - 1 === index
                        ? ""
                        : "border-b border-gray-200 pb-2"
                    }`}
                  >
                    <div>
                      <p className="font-semibold font-inter text-pr-700">
                        {item.item.name}
                      </p>
                    </div>
                    <div className="font-inter font-semibold">
                      {item.points} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shadow-lg bg-white p-6 rounded-xl mb-6">
            <div className="space-y-3 ">
              <div className="flex justify-between">
                <span className="font-semibold text-pr-500">Sous-total</span>
                <span className="text-pr-700">
                  ${order.sub_total.toFixed(2)}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold text-pr-500">
                    Promo 1ère commande (-20%)
                  </span>
                  <span className="text-red-600">
                    -$
                    {(order.sub_total - order.sub_total_after_discount).toFixed(
                      2
                    )}
                  </span>
                </div>
              )}
              {order.promoCode && (
                <div className="flex justify-between">
                  <span className="font-semibold text-pr-500">
                    Code promo (
                    {order.promoCode.percent
                      ? `-${order.promoCode.percent}%`
                      : order.promoCode.amount
                      ? `-${order.promoCode.amount.toFixed(2)}$`
                      : "Article grauit"}
                    )
                  </span>
                  <span className="text-pr-700">
                    -$
                    {order.sub_total -
                      order.sub_total_after_discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-pr-500">TPS (5%) </span>
                <span className="text-pr-700">
                  ${(order.sub_total * 0.05).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-pr-500">TVQ (9.975%)</span>
                <span className="text-pr-700">
                  ${(order.sub_total * 0.09975).toFixed(2)}
                </span>
              </div>
              {order.tip > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold ">Pourboire</span>
                  <span className="text-pr-700">
                    ${order.tip ? order.tip.toFixed(2) : "0.00"}
                  </span>
                </div>
              )}

              {order.type === "delivery" && (
                <div className="flex justify-between">
                  <span className="font-semibold text-pr-500">
                    Frais de livraison
                  </span>
                  <span className="text-pr-700">
                    $
                    {order.delivery_fee
                      ? order.delivery_fee.toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              )}
              <div className="mt-4 border-t border-pr-200 pt-4 flex justify-between items-center">
                <span className="font-bold text-pr-600 text-lg">Total</span>
                <span className="text-pr-900 font-extrabold text-lg">
                  $ {order.total_price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
