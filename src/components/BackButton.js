"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
const BackButton = () => {
  const router = useRouter();
  return (
    <div
      className="bg-black rounded-full h-8 w-8 md:h-10 md:w-10 flex justify-center items-center p-2 text-pr"
      onClick={() => router.back()}
    >
      <FaArrowLeftLong />
    </div>
  );
};

export default BackButton;
