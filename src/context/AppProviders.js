"use client";

import React from "react";
import { UserProvider } from "./UserContext";
import { BasketProvider } from "./BasketContext";

export function AppProviders({ children }) {
  return (
    <UserProvider>
      <BasketProvider>{children}</BasketProvider>
    </UserProvider>
  );
}
