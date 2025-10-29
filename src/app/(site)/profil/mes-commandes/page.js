"use client";
import Spinner from "@/components/spinner/Spinner";
import { useUser } from "@/context/UserContext";
import { getOrdersList } from "@/services/UserServices";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { FaArrowLeftLong } from "react-icons/fa6";

const Page = () => {
  const { user, loading } = useUser();
  const [isLoading, setIsLoading] = React.useState(true);
  const [orders, setOrders] = React.useState([]);
  const [error, setError] = React.useState(null);
  const router = useRouter();
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await getOrdersList(user._id);

      if (response.status) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) fetchOrders();
    else if (!loading && !user) {
      router.push("/connexion");
    }
  }, [loading]);

  if (loading || isLoading) {
    return (
      <div className="md:mt-28 mt-20 flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }
  const statusStyles = (status) => {
    switch (status) {
      case "Livreé":
        return "text-green-400";
      case "En cours":
        return "text-yellow-400";
      case "Annulé":
        return "text-red-400";
      case "En Livraison":
        return "text-yellow-400";

      case "Terminée":
        return "text-green-400";
      case "Ramassé":
        return "text-green-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div>
      <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-2 pb-20 min-h-screen">
        <div className="flex items-center  gap-2 my-6">
          <div
            className="bg-black rounded-full h-8 w-8 md:h-10 md:w-10 flex justify-center items-center p-2 text-pr"
            onClick={() => router.replace("/profil")}
          >
            <FaArrowLeftLong />
          </div>
          <h1 className="text-2xl font-bold">Mes Commandes</h1>
        </div>
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {!error && orders.length === 0 && (
          <p className="text-gray-500">
            Vous n&apos;avez pas encore de commandes.
          </p>
        )}
        {!error &&
          orders.length > 0 &&
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-4 rounded-lg shadow mb-4 "
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold mb-2">
                    Commande #{order.code}
                  </h2>
                  <p className="text-gray-600 mb-1">
                    Date: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">
                    Total: ${order.total_price.toFixed(2)}
                  </p>
                  <p className="text-gray-600">
                    Statut:{" "}
                    <span className={`font-bold ${statusStyles(order.status)}`}>
                      {order.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Link
                  href={`/profil/mes-commandes/${order._id}`}
                  className="mt-2 m-auto px-8 py-2 bg-pr text-black font-bold rounded inline-block md:text-base text-sm"
                >
                  Voir les détails
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Page;
