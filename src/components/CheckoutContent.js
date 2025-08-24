"use client";
import React, { useEffect, useState } from "react";

import { useUser } from "@/context/UserContext";

import { getClosestRestaurant } from "@/utils/locationHandlers";
import OrderTypeBlock from "./OrderTypeBlock";
import AddressesBlock from "./AddressesBlock";
import PromoCodeBlock from "./PromoCodeBlock";
import { useSelectBasketTotal } from "@/context/BasketContext";
import TipsBlock from "./TipsBlock";
import ResumeBlock from "./ResumeBlock";
import Spinner from "./spinner/Spinner";
import { useRouter } from "next/navigation";
const CheckoutContent = ({ restaurantsSettings }) => {
  const { user, loading } = useUser();
  const router = useRouter();
  const subTotal = useSelectBasketTotal();
  const [tips, setTips] = useState("");
  const [selectedTip, setSelectedTip] = useState(0);
  const subTotalWithDiscount = !user?.firstOrderDiscountApplied
    ? subTotal * 0.8
    : subTotal;
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [promoCodeData, setPromoCodeData] = useState(null);
  const [promoCodeIsValid, setPromoCodeIsValid] = useState(false);
  const [total, setTotal] = useState(0);
  const [tvq, setTvq] = useState(0);
  const [tps, setTps] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    restaurantsSettings && restaurantsSettings.length > 0
      ? restaurantsSettings[0]
      : null
  );
  const [address, setAddress] = useState({});

  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0 && !loading) {
      setAddress(user.addresses[0]);
      const restaurantIndex = getClosestRestaurant(
        user.addresses[0].coords,
        restaurantsSettings
      );

      const closestRestaurant = restaurantsSettings[restaurantIndex];

      setSelectedRestaurant(closestRestaurant);
    }
  }, [loading]);

  useEffect(() => {
    let promoCodeDiscount = null;
    if (promoCodeIsValid && promoCodeData) {
      if (promoCodeData.type === "percent") {
        promoCodeDiscount =
          (subTotalWithDiscount * promoCodeData.percent) / 100;
      }
      if (promoCodeData.type === "amount") {
        promoCodeDiscount = promoCodeData.amount;
      }
    }

    let tipValue = 0;
    if (selectedTip === "other") {
      tipValue = parseFloat(tips);
      if (parseFloat(tips) < 0 || isNaN(parseFloat(tips))) {
        tipValue = 0;
      }
    } else if (!selectedTip) {
      tipValue = 0;
      setTips(0);
    } else {
      tipValue = (subTotalWithDiscount * parseFloat(selectedTip)) / 100;
      setTips(tipValue);
    }
    if (deliveryMode === "delivery") {
      const tvqValue =
        ((subTotalWithDiscount + selectedRestaurant.settings.delivery_fee) *
          9.975) /
        100;
      const tpsValue =
        ((subTotalWithDiscount + selectedRestaurant.settings.delivery_fee) *
          5) /
        100;
      setTvq(tvqValue);
      setTps(tpsValue);

      setTotal(
        selectedRestaurant.settings.delivery_fee +
          parseFloat(subTotalWithDiscount) +
          tvqValue +
          tpsValue +
          tipValue -
          promoCodeDiscount
      );
    } else {
      const tvqValue = (subTotalWithDiscount * 9.975) / 100;
      const tpsValue = (subTotalWithDiscount * 5) / 100;
      setTvq(tvqValue);
      setTps(tpsValue);

      setTotal(
        parseFloat(subTotalWithDiscount) +
          tvqValue +
          tipValue +
          tpsValue -
          promoCodeDiscount
      );
    }
  }, [
    deliveryMode,
    tips,
    selectedTip,
    selectedRestaurant,
    promoCodeData?.code,
    user,
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/connexion");
    }
    if (!subTotal) {
      router.replace("/menu");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 relative ">
      <div className="md:w-[70%] w-full mx-auto">
        <h1 className="font-inter font-semibold text-black md:text-2xl text-lg">
          Finaliser la commande
        </h1>
        <p className="font-inter font-medium  text-[#4B5563] md:text-lg text-base">
          Complétez les informations ci-dessous pour confirmer votre commande
        </p>
        <section className=" mt-3">
          <OrderTypeBlock
            deliveryMode={deliveryMode}
            setDeliveryMode={setDeliveryMode}
          />
          <AddressesBlock
            address={address}
            setAddress={setAddress}
            selectedRestaurant={selectedRestaurant}
            setSelectedRestaurant={setSelectedRestaurant}
            restaurantsSettings={restaurantsSettings}
            userId={user.id}
            userAddresses={user.addresses}
            deliveryMode={deliveryMode}
          />

          <PromoCodeBlock
            userId={user._id}
            promoCodeData={promoCodeData}
            setPromoCodeData={setPromoCodeData}
            promoCodeIsValid={promoCodeIsValid}
            setPromoCodeIsValid={setPromoCodeIsValid}
            firstOrderDiscountApplied={user.firstOrderDiscountApplied}
          />
          <TipsBlock
            selectedTip={selectedTip}
            setSelectedTip={setSelectedTip}
            setTips={setTips}
            tips={tips}
          />
          <ResumeBlock
            subTotal={subTotal}
            total={total}
            tvq={tvq}
            tps={tps}
            deliveryFee={selectedRestaurant.settings.delivery_fee}
            tips={tips}
            firstOrderDiscountApplied={user.firstOrderDiscountApplied}
            promoCodeData={promoCodeData}
            promoCodeIsValid={promoCodeIsValid}
            deliveryMode={deliveryMode}
            subTotalWithDiscount={subTotalWithDiscount}
          />
        </section>
      </div>
    </div>
  );
};

export default CheckoutContent;
