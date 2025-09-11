"use client";
import Spinner from "@/components/spinner/Spinner";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import React, { useEffect } from "react";
import { FaClockRotateLeft } from "react-icons/fa6";
import { FaHeart } from "react-icons/fa";
import { MdLocationPin } from "react-icons/md";
import { IoChevronForwardOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { GiTrophyCup } from "react-icons/gi";
const Page = () => {
  const { user, loading } = useUser();

  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/connexion");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen md:mt-28 mt-20">
        <Spinner />
      </div>
    );
  }
  if (!user && !loading) {
    return null;
  }
  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-2 pb-20 relative ">
      <div className="bg-black rounded-xl shadow-md p-4 flex flex-col items-center">
        <div className="md:w-24 md:h-24 h-16 w-16 rounded-full overflow-hidden border-4 border-white mb-2 flex items-center justify-center ">
          <p className="md:text-5xl text-2xl font-bold text-white font-inter uppercase">
            {user?.email[0] || "A"}
          </p>
        </div>
        <p className="md:text-2xl text-lg font-bold text-white font-interuppercase">
          {user.name}
        </p>
        <p className="md:text-sm text-xs font-bold text-white font-inter uppercase mt-1">
          {user?.email}
        </p>
        <div className="mt-2 flex items-center gap-1 text-white px-3 py-1 font-semibold font-inter">
          <GiTrophyCup /> {user.fidelity_points}
        </div>
        <Link
          href="/profil/modifier"
          className="mt-4 bg-pr  text-black font-bold py-2 px-4 rounded flex items-center"
        >
          <p className="md:text-sm text-xs font-bold  font-inter uppercase ">
            Modifier le profil
          </p>
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-md mt-6">
        <Link
          href="/profil/mes-commandes"
          className="flex items-center gap-2  p-3 border-b border-gray-300 "
        >
          <div className="md:w-10 md:h-10 h-8 w-8 text-[#ea580c] rounded-md overflow-hidden  flex items-center justify-center bg-[#ffedd5]">
            <FaClockRotateLeft />
          </div>
          <p className="text-sm font-bold text-black font-inter flex-1 ">
            Historique des commandes
          </p>
          <div className="text-[#9ca3af] ">
            <IoChevronForwardOutline />
          </div>
        </Link>
        <Link
          href="/profil/mes-favoris"
          className="flex items-center gap-2  p-3 border-b border-gray-300 "
        >
          <div className="md:w-10 md:h-10 h-8 w-8 text-[#dc2626] rounded-md overflow-hidden  flex items-center justify-center bg-[#fee2e2]">
            <FaHeart />
          </div>
          <p className="text-sm font-bold text-black font-inter flex-1  ">
            Plats favoris
          </p>
          <div className="text-[#9ca3af] ">
            <IoChevronForwardOutline />
          </div>
        </Link>
        <Link
          href="/profil/mes-adresses"
          className="flex items-center gap-2 p-3  "
        >
          <div className="md:w-10 md:h-10 h-8 w-8 text-[#16a34a] rounded-md overflow-hidden  flex items-center justify-center bg-[#dcfce7]">
            <MdLocationPin />
          </div>
          <p className="text-sm font-bold text-black font-inter flex-1 ">
            Adresses de livraison
          </p>
          <div className="text-[#9ca3af] ">
            <IoChevronForwardOutline />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Page;
