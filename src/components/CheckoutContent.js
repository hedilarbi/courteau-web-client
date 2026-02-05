"use client";
import React, { useEffect, useRef, useState } from "react";

import { useUser } from "@/context/UserContext";

import { getClosestRestaurant } from "@/utils/locationHandlers";
import OrderTypeBlock from "./OrderTypeBlock";
import AddressesBlock from "./AddressesBlock";
import PromoCodeBlock from "./PromoCodeBlock";
import { useSelectBasketTotal } from "@/context/BasketContext";
import TipsBlock from "./TipsBlock";
import ResumeBlock from "./ResumeBlock";
import ScheduleBlock from "./ScheduleBlock";

import { useRouter } from "next/navigation";
import ProcessPaiement from "./ProcessPaiement";
import WarningBanner from "./WarningBanner";
import { getScheduleValidationError } from "@/utils/dateHandlers";
const CheckoutContent = ({ restaurantsSettings }) => {
  const { user, loading } = useUser();
  const router = useRouter();
  const subTotal = useSelectBasketTotal();
  const [tips, setTips] = useState("");
  const [selectedTip, setSelectedTip] = useState(0);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [scheduleError, setScheduleError] = useState("");

  const subTotalWithDiscount = useRef(
    !user?.firstOrderDiscountApplied ? subTotal * 0.8 : subTotal
  );
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
  const [canOrder, setCanOrder] = useState(true);
  const isAddressValid =
    deliveryMode !== "delivery" ||
    (!!address?.address &&
      !!address?.coords?.latitude &&
      !!address?.coords?.longitude);

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

  const isScheduledOrder = scheduleOption === "later";

  useEffect(() => {
    if (deliveryMode !== "delivery") {
      setScheduleOption("now");
      setScheduledDateTime(null);
      setScheduleError("");
    }
  }, [deliveryMode]);

  useEffect(() => {
    if (scheduleOption === "now") {
      setScheduledDateTime(null);
      setScheduleError("");
    }
  }, [scheduleOption]);

  useEffect(() => {
    if (!isScheduledOrder || !scheduledDateTime || !selectedRestaurant) {
      setScheduleError("");
      return;
    }
    const error = getScheduleValidationError(
      scheduledDateTime,
      selectedRestaurant
    );
    setScheduleError(error || "");
  }, [isScheduledOrder, scheduledDateTime, selectedRestaurant]);

  useEffect(() => {
    let promoCodeDiscount = null;

    if (promoCodeIsValid && promoCodeData) {
      if (promoCodeData.type === "percent") {
        promoCodeDiscount =
          (parseFloat(subTotalWithDiscount.current) * promoCodeData.percent) /
          100;
        subTotalWithDiscount.current -= promoCodeDiscount;
      }
      if (promoCodeData.type === "amount") {
        promoCodeDiscount = promoCodeData.amount;
        subTotalWithDiscount.current -= promoCodeDiscount;
      }
    } else {
      subTotalWithDiscount.current = !user?.firstOrderDiscountApplied
        ? subTotal * 0.8
        : subTotal;
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
      tipValue =
        (parseFloat(subTotalWithDiscount.current) * parseFloat(selectedTip)) /
        100;
      setTips(tipValue);
    }
    if (deliveryMode === "delivery") {
      const tvqValue =
        ((parseFloat(subTotalWithDiscount.current) +
          selectedRestaurant.settings.delivery_fee) *
          9.975) /
        100;
      const tpsValue =
        ((parseFloat(subTotalWithDiscount.current) +
          selectedRestaurant.settings.delivery_fee) *
          5) /
        100;
      setTvq(tvqValue);
      setTps(tpsValue);

      setTotal(
        selectedRestaurant.settings.delivery_fee +
          parseFloat(subTotalWithDiscount.current) +
          tvqValue +
          tpsValue +
          tipValue
      );
    } else {
      const tvqValue = (parseFloat(subTotalWithDiscount.current) * 9.975) / 100;
      const tpsValue = (parseFloat(subTotalWithDiscount.current) * 5) / 100;
      setTvq(tvqValue);
      setTps(tpsValue);

      setTotal(
        parseFloat(subTotalWithDiscount.current) +
          tvqValue +
          tipValue +
          tpsValue
      );
    }
  }, [
    deliveryMode,

    selectedTip,
    selectedRestaurant,
    promoCodeData?.code,
    user,
    promoCodeIsValid,
    subTotal,

    selectedRestaurant?.settings?.delivery_fee,
    promoCodeData,
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/connexion");
    }
    if (!subTotal || subTotal <= 0) {
      router.replace("/menu");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 min-h-screen">
        <div className="md:w-[70%] w-full mx-auto">
          <h1 className="font-inter font-semibold text-black md:text-2xl text-lg">
            Finaliser la commande
          </h1>
          <p className="font-inter font-medium  text-[#4B5563] md:text-lg text-base">
            Complétez les informations ci-dessous pour confirmer votre commande
          </p>
          <div className="rounded-md bg-white p-6 shadow-md  ">
            <div className="animate-pulse">
              <div className="w-full h-10 bg-gray-200 dark:bg-gray-400 mb-4"></div>
              <div className="w-full h-10 bg-gray-200 dark:bg-gray-400 mb-4"></div>
              <div className="w-full h-10 bg-gray-200 dark:bg-gray-400 mb-4"></div>
            </div>
          </div>
          <div className="rounded-md bg-white p-6 shadow-md mt-4  ">
            <div className="animate-pulse">
              <div className="w-full h-10 bg-gray-200 dark:bg-gray-400 mb-4"></div>
              <div className="w-full h-10 bg-gray-200 dark:bg-gray-400 mb-4"></div>
              <div className="w-full h-10 bg-gray-200 dark:bg-gray-400 mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 relative ">
      <div className="md:w-[70%] w-full mx-auto">
        {user.isBanned && (
          <div className="bg-red-500 text-white font-inter font-semibold mb-4">
            <p className="text-center py-2 px-4">
              Votre compte a été désactivé. Veuillez contacter le support pour
              plus d&apos;informations.
            </p>
          </div>
        )}
        <WarningBanner
          settings={selectedRestaurant.settings}
          deliveryMode={deliveryMode}
          setCanOrder={setCanOrder}
          addressValid={isAddressValid}
        />
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
            userId={user._id}
            userAddresses={user.addresses}
            deliveryMode={deliveryMode}
          />
          <ScheduleBlock
            scheduleOption={scheduleOption}
            setScheduleOption={setScheduleOption}
            scheduledDateTime={scheduledDateTime}
            setScheduledDateTime={setScheduledDateTime}
            scheduleError={scheduleError}
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
            subTotalWithDiscount={parseFloat(
              subTotalWithDiscount.current
            ).toFixed(2)}
          />
          <ProcessPaiement
            user={user}
            total={total}
            selectedRestaurant={selectedRestaurant}
            address={address}
            deliveryMode={deliveryMode}
            tipAmount={tips}
            promoCode={promoCodeIsValid ? promoCodeData : null}
            subTotal={subTotal}
            subTotalWithDiscount={parseFloat(
              subTotalWithDiscount.current
            ).toFixed(2)}
            tvq={tvq}
            tps={tps}
            canOrder={canOrder}
            isScheduledOrder={isScheduledOrder}
            scheduledDateTime={scheduledDateTime}
          />
        </section>
      </div>
    </div>
  );
};

export default CheckoutContent;
