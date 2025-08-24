"use client";
import { useSelectBasketItemCount } from "@/context/BasketContext";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import React from "react";
import { FaUser, FaCartShopping } from "react-icons/fa6";
import BasketSlider from "./BasketSlider";
import { logout } from "@/app/actions";

const HeaderLoginButton = () => {
  const { user, deleteUser, loading } = useUser();
  const count = useSelectBasketItemCount();
  const [showBasketSlider, setShowBasketSlider] = React.useState(false);
  const handleLogout = async () => {
    deleteUser();
    await logout();
  };
  return (
    <div className="flex items-center ">
      <BasketSlider
        showBasketSlider={showBasketSlider}
        setShowBasketSlider={setShowBasketSlider}
      />
      {loading ? null : user ? (
        <div className="flex items-center">
          <button
            className="text-white border-2 border-pr rounded-md  font-bebas-neue px-8 py-1 text-xl cursor-pointer"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
          <Link href="/profil" className="text-white hover:text-pr ml-6">
            <FaUser size={28} />
          </Link>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link
            href="/inscription"
            className="text-black   bg-pr rounded-md px-8 py-1 text-xl"
          >
            <span className="font-bebas-neue">S&apos;inscrire</span>
          </Link>
          <Link
            href="/connexion"
            className="text-pr  font-bebas-neue border-2 border-pr rounded-md px-8 py-1 text-xl"
          >
            Se connecter
          </Link>
        </div>
      )}

      <button
        onClick={() => setShowBasketSlider(!showBasketSlider)}
        className="bg-pr rounded-full text-black flex justify-center cursor-pointer items-center h-10 w-10 ml-6 p-2 relative"
      >
        <FaCartShopping size={20} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
    </div>
  );
};

export default HeaderLoginButton;
