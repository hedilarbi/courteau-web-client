"use client";
import Spinner from "@/components/spinner/Spinner";
import { useUser } from "@/context/UserContext";
import { removeFromAddresses } from "@/services/UserServices";
import { useRouter } from "next/navigation";
import React from "react";
import { FaTrashAlt } from "react-icons/fa";
import { FaArrowLeftLong } from "react-icons/fa6";
const Page = () => {
  const router = useRouter();

  const { user, loading, createUser } = useUser();

  const removeAddress = async (addressId) => {
    try {
      const response = await removeFromAddresses(user._id, addressId);

      if (response.status) {
        createUser(response.data);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'adresse:", error);
    }
  };

  if (loading) {
    return (
      <div className="md:mt-28 mt-20 flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!loading && !user) {
    router.push("/connexion");
    return null;
  }
  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-2 pb-20 min-h-screen ">
      <div className="flex items-center  gap-2 my-6">
        <div
          className="bg-black rounded-full h-8 w-8 md:h-10 md:w-10 flex justify-center items-center p-2 text-pr"
          onClick={() => router.replace("/profil")}
        >
          <FaArrowLeftLong />
        </div>
        <h1 className="text-2xl font-bold">Mes Addresses</h1>
      </div>
      {user.addresses.length === 0 ? (
        <p className="text-gray-500">
          Vous n&apos;avez pas encore d&apos;adresses.
        </p>
      ) : (
        <div className="space-y-4">
          {user.addresses.map((address, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-md shadow-md flex justify-between items-center"
            >
              <h3 className="font-semibold">{address.address}</h3>
              <button onClick={() => removeAddress(address._id)}>
                <FaTrashAlt className="text-red-500 hover:text-red-700" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
