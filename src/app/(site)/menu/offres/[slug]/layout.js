import React from "react";

const layout = ({ children }) => {
  return (
    <div className="mt-20 md:mt-28  bg-[#F3F4F6]  w-full md:px-14 px-4  overflow-y-auto pb-20">
      {children}
    </div>
  );
};

export default layout;
