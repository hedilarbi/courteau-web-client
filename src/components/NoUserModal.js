import React from "react";
import { AiOutlineClose } from "react-icons/ai";

const NoUserModal = ({ showNoUserModal, setShowNoUserModal }) => {
  return (
    <div
      className={`h-screen bg-black/40 flex justify-center items-center fixed inset-0 z-50 w-full md:px-14 px-4  overflow-y-auto text-black duration-400 ease-in-out ${
        showNoUserModal ? "" : "translate-y-[100%]"
      } `}
    >
      <div className="bg-white p-4 rounded-md shadow-md w-11/12 max-w-md">
        <div className="flex justify-end">
          <button
            className="text-black p-2 cursor-pointer"
            onClick={() => setShowNoUserModal(false)}
          >
            <AiOutlineClose size={32} />
          </button>
        </div>
        <h4 className="text-center text-lg font-inter font-semibold">
          Vous devez être connecté pour valider votre commande.
        </h4>
        <div className=" flex flex-col gap-3 font-semibold font-inter mt-6">
          <button
            className="px-4 py-2 bg-pr text-black rounded-md hover:bg-[#e69500] transition"
            onClick={() => {
              setShowNoUserModal(false);
              router.push("/connexion");
            }}
          >
            Se connecter
          </button>
          <button
            className="px-4 py-2 border-pr border text-black rounded-md hover:bg-[#e69500] transition"
            onClick={() => {
              setShowNoUserModal(false);
              router.push("/inscription");
            }}
          >
            S&apos;inscrire
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoUserModal;
