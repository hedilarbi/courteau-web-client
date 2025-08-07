"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import HamburgerMenuButton from "./HamburgerMenuButton";
import HeaderLoginButton from "./HeaderLoginButton";
const Navigation = () => {
  const pathname = usePathname();
  const currentPath = pathname.split("/")[1];
  return (
    <nav className="font-bebas-neue text-white md:p-4 p-0 text-2xl relative ">
      <ul className=" space-x-4 md:flex hidden">
        <li>
          <Link
            href="/"
            className={`hover:text-pr ${currentPath === "" ? "text-pr" : ""}`}
          >
            Accueil
          </Link>
        </li>
        <li>
          <Link
            href="/menu"
            className={`hover:text-pr ${
              currentPath === "menu" ? "text-pr" : ""
            }`}
          >
            Menu
          </Link>
        </li>
        <li>
          <Link
            href="/a-propos"
            className={`hover:text-pr ${
              currentPath === "a-propos" ? "text-pr" : ""
            }`}
          >
            À propos
          </Link>
        </li>
        <li>
          <Link
            href="/contact"
            className={`hover:text-pr ${
              currentPath === "contact" ? "text-pr" : ""
            }`}
          >
            Contact
          </Link>
        </li>
        <li>
          <Link
            href="/blogue"
            className={`hover:text-pr ${
              currentPath === "blogue" ? "text-pr" : ""
            }`}
          >
            Blogue
          </Link>
        </li>
      </ul>

      <HamburgerMenuButton />
    </nav>
  );
};

export default Navigation;
