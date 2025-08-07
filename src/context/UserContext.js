"use client";

import { createContext, useContext, useReducer } from "react";

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

    default:
      return state;
  }
}

const UserContext = createContext();

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const createUser = (user) => dispatch({ type: "CREATE_USER", payload: user });
  const selectUser = (user) => dispatch({ type: "SELECT_USER", payload: user });
  const deleteUser = () => dispatch({ type: "DELETE_USER" });

  return (
    <UserContext.Provider
      value={{
        user: state.user,
        createUser,
        selectUser,
        deleteUser,
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
