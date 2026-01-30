import { isOpenNow } from "@/utils/dateHandlers";
import React, { useEffect, useState } from "react";

const WarningBanner = ({
  settings,
  deliveryMode,
  setCanOrder,
  addressValid,
}) => {
  const { open, delivery, emploie_du_temps } = settings;
  const [message, setMessage] = useState("");
  useEffect(() => {
    setMessage("");
    setCanOrder(true);
    if (!open) {
      setMessage("Le restaurant est actuellement fermé.");
      setCanOrder(false);
    } else if (!isOpenNow(emploie_du_temps)) {
      setMessage("Le restaurant est actuellement fermé.");
      setCanOrder(false);
    } else if (!delivery && deliveryMode === "delivery") {
      setMessage("La livraison n'est pas disponible.");
      setCanOrder(false);
    } else if (deliveryMode === "delivery" && addressValid === false) {
      setMessage(
        "Votre adresse semble incomplète ou invalide. Veuillez la mettre à jour."
      );
      setCanOrder(false);
    }
  }, [settings, deliveryMode, addressValid]);
  if (message === "") {
    return null;
  }
  return (
    <div className="bg-red-500 text-white font-inter font-semibold mb-4 rounded-md">
      <p className="text-center py-2 px-4">{message}</p>
    </div>
  );
};

export default WarningBanner;
