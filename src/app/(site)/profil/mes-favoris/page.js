"use client";
import Spinner from "@/components/spinner/Spinner";
import { useUser } from "@/context/UserContext";
import { getFavoritesList } from "@/services/UserServices";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { FaArrowLeftLong } from "react-icons/fa6";

const Page = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [favorites, setFavorites] = React.useState([]);
  const { user, loading } = useUser();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await getFavoritesList(user._id);
      if (response.status) {
        setFavorites(response.data.favorites);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (user && !loading) {
      fetchData();
    }
  }, [user, loading]);

  if (loading || isLoading) {
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
        <h1 className="text-2xl font-bold">Mes Favoris</h1>
      </div>

      {favorites.length === 0 ? (
        <p className="text-gray-500">Vous n&apos;avez pas encore de favoris.</p>
      ) : (
        <ul className="space-y-4">
          {favorites.map((item) => (
            <li
              key={item._id}
              className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
            >
              <div className="flex items-center mr-4">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={100}
                  height={100}
                  className="rounded-full h-14 w-14"
                />

                <h2 className="text-lg font-semibold ml-2">{item.name}</h2>
              </div>
              <Link
                className="bg-pr text-black px-4 py-2 rounded-lg font-semibold"
                href={`/menu/articles/${item.slug}`}
              >
                Voir
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Page;
