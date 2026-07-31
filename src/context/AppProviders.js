"use client";

import React from "react";
import { UserProvider } from "./UserContext";
import { BasketProvider } from "./BasketContext";
import { SmartOfferProvider } from "./SmartOfferContext";

export function AppProviders({ children }) {
  return (
    <UserProvider>
      <SmartOfferProvider>
        <BasketProvider>{children}</BasketProvider>
      </SmartOfferProvider>
    </UserProvider>
  );
}
