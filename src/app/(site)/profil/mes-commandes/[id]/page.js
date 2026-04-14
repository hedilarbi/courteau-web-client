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

  const getPaymentMethodLabel = (paymentMethod) => {
    const normalizedPaymentMethod = String(paymentMethod || "")
      .trim()
      .toLowerCase();

    switch (normalizedPaymentMethod) {
      case "cash_at_counter":
        return "Paiement au comptoir";
      case "card":
        return "Paiement en ligne";
      case "subscription_free_item":
        return "Article gratuit";
      default:
        return "Non disponible";
    }
  };

  const toSafeNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const parseRuleValue = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const getFreeLimit = (rule) => {
    if (!rule) return 0;
    if (rule?.max === null || rule?.max === undefined) return Infinity;
    const max = parseRuleValue(rule?.max);
    if (max !== null) return max;
    const min = parseRuleValue(rule?.min);
    if (min !== null) return min;
    return 0;
  };
  const normalizeCustomizationGroups = (rawGroups) => {
    if (!rawGroups) return [];
    const groups = Array.isArray(rawGroups) ? rawGroups : [rawGroups];
    return groups.filter((group) => Array.isArray(group?.toppings));
  };
  const normalizeCustomizationSelection = (customization) => {
    if (!customization) return null;
    if (typeof customization === "string") {
      const fallbackName = customization.trim();
      if (!fallbackName) return null;
      return { _id: fallbackName, name: fallbackName, price: 0 };
    }

    const id = String(customization?._id || "").trim();
    const name = String(
      customization?.name ||
        customization?.title ||
        customization?.label ||
        customization?._id ||
        "",
    ).trim();
    const normalizedPrice = toSafeNumber(customization?.price, 0);
    if (!id && !name) return null;

    return {
      _id: id || name,
      name,
      price: normalizedPrice,
    };
  };
  const getCustomizationDisplayItems = (customizations, rawGroups) => {
    const normalizedSelections = Array.isArray(customizations)
      ? customizations.map(normalizeCustomizationSelection).filter(Boolean)
      : [];
    if (!normalizedSelections.length) return [];

    const normalizedGroups = normalizeCustomizationGroups(rawGroups).map(
      (group) => {
        const toppings = Array.isArray(group?.toppings) ? group.toppings : [];
        const toppingsById = new Map();
        const toppingIdSet = new Set();
        toppings.forEach((topping) => {
          const toppingId = String(topping?._id || "").trim();
          if (!toppingId) return;
          toppingsById.set(toppingId, topping);
          toppingIdSet.add(toppingId);
        });
        return {
          toppingsById,
          toppingIdSet,
          freeLimit: getFreeLimit(group?.selectionRule),
        };
      },
    );

    const groupSelectionsCount = normalizedGroups.map(() => 0);

    return normalizedSelections.map((selection) => {
      const selectionId = String(selection?._id || "").trim();
      const matchedGroupIndex = normalizedGroups.findIndex((group) =>
        group.toppingIdSet.has(selectionId),
      );

      if (matchedGroupIndex === -1) {
        const fallbackPrice = toSafeNumber(selection?.price, 0);
        return {
          name: selection?.name || selectionId,
          chargedPrice: fallbackPrice,
        };
      }

      const group = normalizedGroups[matchedGroupIndex];
      const selectionPosition = groupSelectionsCount[matchedGroupIndex];
      groupSelectionsCount[matchedGroupIndex] += 1;

      const topping = group.toppingsById.get(selectionId);
      const toppingPrice = toSafeNumber(topping?.price, selection?.price);
      const shouldCharge =
        group.freeLimit !== Infinity && selectionPosition >= group.freeLimit;

      return {
        name: selection?.name || topping?.name || selectionId,
        chargedPrice: shouldCharge ? toppingPrice : 0,
      };
    });
  };
  const formatCustomizationLabel = (displayItem) => {
    if (!displayItem) return "";
    const name = String(displayItem?.name || "").trim();
    const chargedPrice = Math.max(0, toSafeNumber(displayItem?.chargedPrice, 0));
    if (chargedPrice > 0) {
      if (!name) return `+${chargedPrice.toFixed(2)} $`;
      return `${name} (+${chargedPrice.toFixed(2)} $)`;
    }
    if (!name) return "Gratuit";
    return `${name} (Gratuit)`;
  };
  const getSizeLabel = (size) => {
    if (!size) return "";
    if (typeof size === "string") return size;
    return String(size?.size || size?.name || "").trim();
  };
  const subscriptionBenefits =
    order?.subscriptionBenefits && typeof order.subscriptionBenefits === "object"
      ? order.subscriptionBenefits
      : null;
  const subscriptionUsed = Boolean(subscriptionBenefits?.isApplied);
  const subscriptionDiscountPercent = toSafeNumber(
    subscriptionBenefits?.discountPercent,
    0,
  );
  const orderDiscountPercent = toSafeNumber(order?.discount, 0);
  const isFirstOrderDiscountApplied = orderDiscountPercent >= 20;
  const showSubscriptionDiscountInfo =
    subscriptionUsed &&
    !isFirstOrderDiscountApplied &&
    (subscriptionDiscountPercent > 0 || orderDiscountPercent > 0);
  const displayedSubscriptionDiscountPercent =
    subscriptionDiscountPercent > 0
      ? subscriptionDiscountPercent
      : orderDiscountPercent;
  const orderDiscountAmount = Math.max(
    0,
    toSafeNumber(order?.sub_total, 0) - toSafeNumber(order?.sub_total_after_discount, 0),
  );

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
                {order.type === "pick up" && (
                  <div>
                    <span className="font-semibold text-pr-500">
                      Mode de paiement :
                    </span>{" "}
                    <span className="text-pr-700">
                      {getPaymentMethodLabel(order.payment_method)}
                    </span>
                  </div>
                )}
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
                    className={`${
                      order.orderItems.length - 1 === index
                        ? ""
                        : "border-b border-gray-200 pb-2"
                    }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold font-inter text-pr-700">
                          {item?.item?.name}
                          {getSizeLabel(item?.size) ? (
                            <span className="text-gray-500 font-medium">
                              {" "}
                              ({getSizeLabel(item.size)})
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="font-inter font-semibold">
                        {toSafeNumber(item?.price).toFixed(2)} $
                      </div>
                    </div>
                    {(() => {
                      const customizationDisplayItems = getCustomizationDisplayItems(
                        item?.customizations,
                        item?.item?.customization_group,
                      );
                      if (!customizationDisplayItems.length) return null;
                      return (
                      <div className="mt-1 ml-1">
                        <p className="text-xs font-semibold text-gray-500">
                          Personnalisations
                        </p>
                        <div className="mt-1 space-y-1">
                            {customizationDisplayItems.map(
                              (customizationDisplay, customIndex) => (
                            <p
                              key={`${item?._id || "item"}-custom-${customIndex}`}
                              className="text-sm text-gray-700"
                            >
                                    • {formatCustomizationLabel(customizationDisplay)}
                            </p>
                              ),
                            )}
                        </div>
                      </div>
                      );
                    })()}
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
                    className={`${
                      order.offers.length - 1 === index
                        ? ""
                        : "border-b border-gray-200 pb-2"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-semibold font-inter text-pr-700">
                          {item?.offer?.name}
                        </p>
                      </div>
                      <div className="font-inter font-semibold">
                        {toSafeNumber(item?.price).toFixed(2)} $
                      </div>
                    </div>
                    {Array.isArray(item?.items) && item.items.length > 0 ? (
                      <div className="mt-2 ml-1 space-y-2">
                        {item.items.map((offerItem, offerItemIndex) => (
                          <div
                            key={`${item?._id || "offer"}-item-${offerItemIndex}`}
                          >
                            <p className="text-sm font-semibold text-gray-700">
                              • {offerItem?.item?.name || "Article"}
                            </p>
                            {(() => {
                              const customizationDisplayItems =
                                getCustomizationDisplayItems(
                                  offerItem?.customizations,
                                  offerItem?.item?.customization_group,
                                );
                              if (!customizationDisplayItems.length) return null;
                              return (
                              <div className="mt-1 ml-3 space-y-1">
                                  {customizationDisplayItems.map(
                                    (customizationDisplay, customIndex) => (
                                    <p
                                      key={`${item?._id || "offer"}-item-${offerItemIndex}-custom-${customIndex}`}
                                      className="text-sm text-gray-700"
                                    >
                                        -{" "}
                                        {formatCustomizationLabel(
                                          customizationDisplay,
                                        )}
                                    </p>
                                  ),
                                )}
                              </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : null}
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

              {isFirstOrderDiscountApplied && (
                <div className="flex justify-between">
                  <span className="font-semibold text-pr-500">
                    Rabais première commande ({`-${orderDiscountPercent}%`})
                  </span>
                  <span className="text-red-600">
                    -${orderDiscountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {showSubscriptionDiscountInfo && (
                <div className="flex justify-between">
                  <span className="font-semibold text-pr-500">
                    Rabais abonnement (
                    {`-${displayedSubscriptionDiscountPercent}%`})
                  </span>
                  <span className="text-red-600">
                    -${orderDiscountAmount.toFixed(2)}
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
                    -${orderDiscountAmount.toFixed(2)}
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
