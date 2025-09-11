"use client";
import { useUser } from "@/context/UserContext";
import { addToFavorites, removeFromFavorites } from "@/services/UserServices";
import React from "react";
import { FaHeart } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa6";
const LikeButton = ({ itemId }) => {
  const { user, createUser } = useUser();

  const like = user?.favorites?.some((like) => like === itemId);
  if (!user) {
    return null;
  }

  const toggleLike = async () => {
    if (like) {
      removeFromFavorites(user._id, itemId).then((response) => {
        if (response.status) {
          createUser(response.data);
        }
      });
    } else {
      addToFavorites(user._id, itemId).then((response) => {
        if (response.status) {
          createUser(response.data);
        }
      });
    }
  };
  return (
    <button
      className="text-red-500 absolute top-4 right-4 z-20 text-5xl cursor-pointer"
      onClick={toggleLike}
    >
      {like ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
};

export default LikeButton;
