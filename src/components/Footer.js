import Image from "next/image";
import Link from "next/link";
import React from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa6";
import { AiFillInstagram } from "react-icons/ai";

const Footer = () => {
  return (
    <footer className="bg-[#1a1714] text-[#fffdf9] font-inter pt-16 pb-8 px-5 md:px-14 border-t border-[#3d372f]">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          
          {/* Logo & Description */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="flex items-baseline gap-2">
              <Link href="/">
                <Image
                  src="/logo-footer.png"
                  alt="Casse-Croûte Courteau"
                  width={277}
                  height={100}
                  className="w-40 md:w-48 h-auto"
                />
              </Link>
            </div>
            <p className="text-sm leading-relaxed text-[#9c9184] max-w-xs">
              Né à Trois-Rivières, Courteau a grandi autour d’une idée toute simple : préparer des repas frais, généreux et remplis de saveur.
            </p>
            <div className="flex gap-4 items-center mt-2">
              <a 
                href="https://www.facebook.com/cassecroutecourto" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="grid place-items-center w-11 h-11 rounded-full bg-[#2a2420] text-white transition hover:-translate-y-1 hover:bg-pr hover:text-black hover:shadow-[0_4px_14px_rgba(247,166,0,.4)]"
                aria-label="Facebook"
              >
                <FaFacebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/casse_croute_courteau" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="grid place-items-center w-11 h-11 rounded-full bg-[#2a2420] text-white transition hover:-translate-y-1 hover:bg-pr hover:text-black hover:shadow-[0_4px_14px_rgba(247,166,0,.4)]"
                aria-label="Instagram"
              >
                <AiFillInstagram size={22} />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <h3 className="font-bebas-neue text-2xl tracking-wide text-white">Navigation</h3>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-[#9c9184]">
              <li><Link href="/" className="hover:text-pr transition">Accueil</Link></li>
              <li><Link href="/menu" className="hover:text-pr transition">Menu</Link></li>
              <li><Link href="/a-propos" className="hover:text-pr transition">À Propos</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <h3 className="font-bebas-neue text-2xl tracking-wide text-white">Infos</h3>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-[#9c9184]">
              <li><Link href="/blogue" className="hover:text-pr transition">Blogue</Link></li>
              <li><Link href="/contact" className="hover:text-pr transition">Contact</Link></li>
              <li><Link href="/termes-conditions" className="hover:text-pr transition">Conditions</Link></li>
            </ul>
          </div>

          {/* Succursales */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <h3 className="font-bebas-neue text-2xl tracking-wide text-white">Succursales</h3>
            <ul className="flex flex-col gap-3 text-sm font-semibold text-[#9c9184]">
              <li><Link href="/succursales/des-prairies-trois-rivieres" className="hover:text-pr transition">Cap-de-la-Madeleine</Link></li>
              <li><Link href="/succursales/boulevard-des-forges-trois-rivieres" className="hover:text-pr transition">Des Forges</Link></li>
              <li><Link href="/succursales/chemin-ste-marguerite-trois-rivieres" className="hover:text-pr transition">Pointe-du-Lac</Link></li>
              <li><Link href="/succursales/avenue-arseneault-becancour" className="hover:text-pr transition">Saint-Grégoire</Link></li>
              <li><Link href="/succursales/boulevard-trudel-est-saint-boniface" className="hover:text-pr transition">Saint-Boniface</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <h3 className="font-bebas-neue text-2xl tracking-wide text-white">Nous joindre</h3>
            <div className="flex flex-col gap-4 text-sm font-semibold text-[#9c9184]">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6e6659] mb-1">Téléphone</span>
                <a href="tel:+18193713935" className="text-xl text-white hover:text-pr transition font-bebas-neue tracking-wider">(819) 371-3935</a>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6e6659] mb-1">Horaire</span>
                <span className="text-white">Ouvert 7 jours</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-[#2a2420] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6e6659] font-medium">
            © {new Date().getFullYear()} Casse-Croûte Courteau. Tous droits réservés.
          </p>
          <div className="text-[10px] font-bold text-[#6e6659] uppercase tracking-widest">
            Fier d&apos;être d&apos;ici
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
