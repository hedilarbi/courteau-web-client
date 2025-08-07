"use client";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import React from "react";
import { FaUser, FaCartShopping } from "react-icons/fa6";

const HeaderLoginButton = () => {
  const { user, deleteUser } = useUser();
  return (
    <div className="flex items-center ">
      {user ? (
        <div className="flex items-center">
          <button
            className="text-white border-2 border-pr rounded-md  font-bebas-neue px-8 py-1 text-xl cursor-pointer"
            onClick={deleteUser}
          >
            Déconnexion
          </button>
          <Link href="/profil" className="text-white hover:text-pr ml-6">
            <FaUser size={28} />
          </Link>
        </div>
      ) : (
        <Link
          href="/connexion"
          className="text-black  font-bebas-neue bg-pr rounded-md px-8 py-1 text-xl"
        >
          Se connecter
        </Link>
      )}

      <Link
        href="/panier"
        className="bg-pr rounded-full text-black flex justify-center items-center h-10 w-10 ml-6 p-2"
      >
        <FaCartShopping size={20} />
      </Link>
    </div>
  );
};

export default HeaderLoginButton;
