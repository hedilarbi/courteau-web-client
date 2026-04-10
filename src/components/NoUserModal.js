import { useRouter } from "next/navigation";
import React from "react";
import { AiOutlineClose } from "react-icons/ai";

const NoUserModal = ({
  showNoUserModal,
  setShowNoUserModal,
  title = "Vous devez être connecté pour valider votre commande.",
  description = "",
  loginHref = "/connexion",
  signupHref = "/inscription",
}) => {
  const router = useRouter();
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
          {title}
        </h4>
        {description ? (
          <p className="text-center text-sm text-gray-600 font-inter mt-3">
            {description}
          </p>
        ) : null}
        <div className=" flex flex-col gap-3 font-semibold font-inter mt-6">
          <button
            className="px-4 py-2 bg-pr text-black rounded-md hover:bg-[#e69500] transition"
            onClick={() => {
              setShowNoUserModal(false);
              router.push(loginHref);
            }}
          >
            Se connecter
          </button>
          <button
            className="px-4 py-2 border-pr border text-black rounded-md hover:bg-[#e69500] transition"
            onClick={() => {
              setShowNoUserModal(false);
              router.push(signupHref);
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
