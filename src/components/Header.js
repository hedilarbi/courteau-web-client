import Image from "next/image";
import React from "react";
import Navigation from "./Navigation";
import HeaderLoginButton from "./HeaderLoginButton";
import Link from "next/link";
import CartButton from "./CartButton";
import { FaFacebookF, FaInstagram, FaPhoneAlt, FaTiktok } from "react-icons/fa";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 text-white">
      <div className="h-8 bg-pr px-4 text-black md:h-9 md:px-14">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between">
          <a
            href="tel:+18193713935"
            className="flex items-center gap-2 text-xs font-bold transition-opacity hover:opacity-70 md:text-sm"
            aria-label="Téléphoner au Casse-Croûte Courteau au 819 371-3935"
          >
            <FaPhoneAlt aria-hidden="true" className="text-[11px] md:text-xs" />
            <span>(819) 371-3935</span>
          </a>

          <nav className="flex items-center gap-3 md:gap-4" aria-label="Réseaux sociaux">
            <a
              href="https://www.facebook.com/cassecroutecourto"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:-translate-y-0.5"
              aria-label="Casse-Croûte Courteau sur Facebook"
            >
              <FaFacebookF aria-hidden="true" className="text-sm md:text-base" />
            </a>
            <a
              href="https://www.instagram.com/casse_croute_courteau"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:-translate-y-0.5"
              aria-label="Casse-Croûte Courteau sur Instagram"
            >
              <FaInstagram aria-hidden="true" className="text-base md:text-lg" />
            </a>
            <a
              href="https://www.tiktok.com/@cassecroutecourteau"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:-translate-y-0.5"
              aria-label="Casse-Croûte Courteau sur TikTok"
            >
              <FaTiktok aria-hidden="true" className="text-sm md:text-base" />
            </a>
          </nav>
        </div>
      </div>

      <div className="flex items-center justify-between bg-black px-4 py-4 md:px-14 md:py-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Casse-Croûte Courteau"
            width={277}
            height={100}
            priority
            className="h-auto w-32 md:w-44"
          />
        </Link>
        <Navigation />
        <div className="hidden items-center justify-center md:flex">
          <HeaderLoginButton />
        </div>
        <CartButton />
      </div>
    </header>
  );
};

export default Header;
