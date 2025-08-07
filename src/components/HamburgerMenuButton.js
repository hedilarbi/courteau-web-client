"use client ";
import { useUser } from "@/context/UserContext";

import React from "react";
import { HiOutlineMenuAlt1 } from "react-icons/hi";
import SideBar from "./SideBar";

const HamburgerMenuButton = () => {
  const [showSidebar, setShowSidebar] = React.useState(false);
  const { user, deleteUser } = useUser();
  return (
    <>
      <SideBar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        user={user}
        deleteUser={deleteUser}
      />
      <div className="md:hidden">
        <button
          className="text-white"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <HiOutlineMenuAlt1 size={36} />
        </button>
      </div>
    </>
  );
};

export default HamburgerMenuButton;
