import Image from "next/image";
import Link from "next/link";
import React from "react";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa6";
import { AiFillInstagram } from "react-icons/ai";
const Footer = () => {
  return (
    <footer
      style={{ backgroundImage: "url('/footer-background.jpeg')" }}
      className="bg-cover bg-center text-white py-6 md:py-14 px-4 md:px-14 "
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="">
          <Image
            src="/footer-logo.svg"
            alt="Logo"
            width={20}
            height={32}
            className="md:w-52 h-auto w-42 mr-4"
          />
          <p className="text-black text-sm font-inter font-semibold mt-4">
            Venez découvrir les généreuses et délicieuses poutines ou les
            succulentes pizzas du Casse-Croûte Courteau. Le meilleur menu à
            Trois-Rivières.
          </p>
        </div>
        <div className="text-black font-inter space-x-4">
          <h3 className=" font-bold text-2xl">Liens</h3>
          <ul className="font-semibold text-black  mt-2 space-y-2">
            <li>
              <Link href="/" className="hover:underline">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/menu" className="hover:underline">
                Menu
              </Link>
            </li>
            <li>
              <Link href="/blogue" className="hover:underline">
                Blogue
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="hover:underline">
                À Propos
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/termes-conditions" className="hover:underline">
                Termes et conditions
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-black font-inter space-x-4">
          <h3 className=" font-bold text-2xl">Contact</h3>
          <ul className="font-semibold text-black  mt-2 space-y-2">
            <li className="flex items-center">
              <FaPhoneAlt />
              <span className="font-inter font-semibold ml-2 ">
                (819) 371-3935
              </span>
            </li>
            <li className="flex items-center">
              <FaEnvelope />
              <span className="font-inter font-semibold ml-2 ">
                support@lecourteau.com
              </span>
            </li>
          </ul>
        </div>
        <div className="text-black font-inter space-x-4">
          <h3 className=" font-bold text-2xl">Suivez-nous</h3>
          <ul className="font-semibold text-black  mt-2 flex gap-4 items-center">
            <a
              href="https://www.facebook.com/cassecroutecourto"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook size={32} />
            </a>
            <a
              href="https://www.instagram.com/casse_croute_courteau"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AiFillInstagram size={32} />
            </a>
          </ul>
        </div>
      </div>
      <div className="border-t-2 border-black mt-4 pt-4 text-center">
        <p className="text-base font-inter font-semibold text-black">
          © {new Date().getFullYear()} Casse-Croûte Courteau. Tous droits
          réservés.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
