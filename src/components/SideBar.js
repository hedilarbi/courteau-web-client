import Link from "next/link";
import React from "react";
import { MdClose } from "react-icons/md";
import { FaFacebook } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";

const SideBar = ({ setShowSidebar, showSidebar, user, deleteUser }) => {
  const pathname = usePathname();

  const handleLogout = async () => {
    deleteUser();
    await logout();
    setShowSidebar(false);
  };
  return (
    <div
      className={`${
        showSidebar ? "" : "translate-x-[100%]"
      }  w-[90%] bg-black fixed top-0 right-0 border-l border-gray-200 shadow-md h-screen min-h-screen p-4 z-30 transition-width duration-300 ease-in-out`}
    >
      <div className="flex justify-end mb-4">
        <button className="text-white " onClick={() => setShowSidebar(false)}>
          <MdClose size={28} />
        </button>
      </div>
      <div className="  flex flex-col justify-center gap-8  font-lato mt-8 border-b pb-8 border-black">
        <Link
          href="/"
          onClick={() => setShowSidebar(false)}
          className={` hover:text-pr  ${
            pathname === "/" ? "text-pr" : "text-white"
          } `}
        >
          Accueil
        </Link>
        <Link
          href="/menu"
          className={` hover:text-pr ${
            pathname === "/menu" ? "text-pr" : "text-white"
          } `}
          onClick={() => setShowSidebar(false)}
        >
          Menu
        </Link>
        <Link
          href="/a-propos"
          className={` hover:text-pr ${
            pathname === "/a-propos" ? "text-pr" : "text-white"
          } `}
          onClick={() => setShowSidebar(false)}
        >
          À Propos
        </Link>
        <Link
          href="/blogue"
          className={` hover:text-pr ${
            pathname === "/blogue" ? "text-pr" : "text-white"
          } `}
          onClick={() => setShowSidebar(false)}
        >
          Blogue
        </Link>
        <Link
          href="/contact"
          className={` hover:text-pr ${
            pathname === "/contact" ? "text-pr" : "text-white"
          } `}
          onClick={() => setShowSidebar(false)}
        >
          Contact
        </Link>
      </div>

      {user ? (
        <div className="flex flex-col gap-4 mt-8 border-b pb-8 border-black">
          <Link
            href="/profil"
            className={` hover:text-pr ${
              pathname === "/profil" ? "text-pr" : "text-white"
            } `}
            onClick={() => setShowSidebar(false)}
          >
            Profil
          </Link>
          <button onClick={handleLogout} className={`text-white text-left`}>
            Déconnexion
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-8 border-b pb-8 border-black">
          <Link
            href="/inscription"
            className={`text-white hover:text-pr ${
              pathname === "/inscription" && "text-pr"
            } `}
            onClick={() => setShowSidebar(false)}
          >
            S&apos;inscrire
          </Link>
          <Link
            href="/connexion"
            className={`text-white hover:text-pr ${
              pathname === "/connexion" && "text-pr"
            } `}
            onClick={() => setShowSidebar(false)}
          >
            Se connecter
          </Link>
        </div>
      )}
      <div className="flex items-center justify-center mt-2 gap-4 ">
        <Link href="https://www.facebook.com/">
          <FaFacebook size={24} color="white" />
        </Link>
        <Link href="https://www.facebook.com/">
          <FaFacebook size={24} color="white" />
        </Link>
        <Link href="https://www.facebook.com/">
          <FaFacebook size={24} color="white" />
        </Link>
      </div>
    </div>
  );
};

export default SideBar;
