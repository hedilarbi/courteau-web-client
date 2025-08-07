import Image from "next/image";
import React from "react";
import Navigation from "./Navigation";
import HeaderLoginButton from "./HeaderLoginButton";

const Header = () => {
  return (
    <header className="bg-black text-white md:px-14 px-4 md:py-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <Image
        src="/logo.svg"
        alt="Logo"
        width={40}
        height={40}
        className="md:w-44 h-auto w-32 "
      />
      <Navigation />
      <div className="hidden md:flex items-center justify-center">
        <HeaderLoginButton />
      </div>
    </header>
  );
};

export default Header;
