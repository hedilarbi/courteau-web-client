"use client";

import { getToken, logout } from "@/app/actions";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

const initialState = {
  user: null,
};

function userReducer(state, action) {
  switch (action.type) {
    case "CREATE_USER":
      return { ...state, user: action.payload };

    case "SELECT_USER":
      return { ...state, user: action.payload };

    case "DELETE_USER":
      return { ...state, user: null };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    case "REMOVE_POINTS":
      return {
        ...state,
        user: {
          ...state.user,
          fidelity_points: state.user.fidelity_points - action.payload,
        },
      };

    default:
      return state;
  }
}

const UserContext = createContext();

export function UserProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [state, dispatch] = useReducer(userReducer, initialState);
  const router = useRouter();
  const createUser = (user) => dispatch({ type: "CREATE_USER", payload: user });
  const selectUser = (user) => dispatch({ type: "SELECT_USER", payload: user });
  const updateUser = (user) => dispatch({ type: "UPDATE_USER", payload: user });
  const removePoints = (points) =>
    dispatch({ type: "REMOVE_POINTS", payload: points });
  const deleteUser = () => dispatch({ type: "DELETE_USER" });
  const getUserToken = async () => {
    try {
      const token = await getToken();

      if (!token) {
        return null;
      }
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/userByToken`,
        {
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        },
      );
      if (response.status === 200) {
        createUser(response.data);

        if (!response.data.is_profile_setup) {
          router.push("/completer-profil");
        }
      } else {
        return null;
      }
      return token ? token.value : null;
    } catch (error) {
      console.error("Erreur lors de la récupération du token utilisateur :", error);
      await logout();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserToken();
  }, []);
  return (
    <UserContext.Provider
      value={{
        user: state.user,
        createUser,
        selectUser,
        deleteUser,
        updateUser,
        removePoints,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
