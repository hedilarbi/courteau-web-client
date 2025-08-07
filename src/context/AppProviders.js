"use client";

import React from "react";
import { UserProvider } from "./UserContext";

export function AppProviders({ children }) {
  return <UserProvider>{children}</UserProvider>;
}
