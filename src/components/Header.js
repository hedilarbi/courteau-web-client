import Image from "next/image";
import React from "react";
import Navigation from "./Navigation";
import HeaderLoginButton from "./HeaderLoginButton";
import Link from "next/link";
import CartButton from "./CartButton";

const Header = () => {
  return (
    <header className="bg-black text-white md:px-14 px-4 md:py-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-40">
      <Link href="/" className="flex items-center">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={40}
          height={40}
          priority
          className="md:w-44 h-auto w-32 "
        />
      </Link>
      <Navigation />
      <div className="hidden md:flex items-center justify-center">
        <HeaderLoginButton />
      </div>
      <CartButton />
    </header>
  );
};

export default Header;
