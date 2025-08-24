import React from "react";

const loading = () => {
  return (
    <div className=" flex md:flex-row flex-col md:gap-10 gap-5 items-start py-10 ">
      <div className="md:w-1/2 w-full rounded-md  shadow-lg  bg-white ">
        <div className="px-10 py-8 ">
          <div className="mx-auto h-72 w-72 rounded-md animate-pulse bg-gray-200 dark:bg-gray-400" />
        </div>
        <div className="md:px-8 p-4 md:py-4 bg-[#F9FAFB] rounded-b-md">
          <div className="h-5 w-24 animate-pulse bg-gray-200 dark:bg-gray-400"></div>
          <div className="text-[#374151] font-inter font-medium text-sm md:text-lg ">
            <div className="h-14 w-24 animate-pulse bg-gray-200 dark:bg-gray-400"></div>
          </div>
        </div>
      </div>
      <div className="md:w-1/2 w-full rounded-md shadow-lg bg-white p-6   ">
        <h2 className="text-2xl font-bold mb-4 animate-pulse bg-gray-200 dark:bg-gray-400 w-1/2 h-6"></h2>
        <div className="flex justify-between items-center mt-2">
          <h4 className="md:text-2xl text-xl font-bebas-neue  animate-pulse bg-gray-200 dark:bg-gray-400 w-1/4 h-6"></h4>
          <div className="bg-pr text-black rounded-full px-6 py-2">
            <p className="font-bebas-neue md:text-lg text-sm animate-pulse bg-gray-200 dark:bg-gray-400 w-1/3 h-6"></p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex  gap-2">
            <div className=" text-xl md:text-2xl animate-pulse bg-gray-200 dark:bg-gray-400 w-6 h-6"></div>
          </div>
          <div className="flex gap-2 md:gap-4 mt-4 justify-between flex-wrap">
            <div className="border rounded-md md:px-4 px-2 items-center md:py-4 py-2 flex  md:gap-6 gap-3 cursor-pointer animate-pulse bg-gray-200 dark:bg-gray-400 w-full h-12"></div>
          </div>

          <div className="mt-4">
            <p className="text-base font-inter font-semibold capitalize animate-pulse bg-gray-200 dark:bg-gray-400 w-1/3 h-6"></p>
            <div className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2 animate-pulse bg-gray-200 dark:bg-gray-400 h-12"></div>
          </div>

          <div className="mt-4">
            <p className="text-base font-inter font-semibold capitalize animate-pulse bg-gray-200 dark:bg-gray-400 w-1/3 h-6"></p>
            <div className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2 animate-pulse bg-gray-200 dark:bg-gray-400 h-12"></div>
          </div>

          <div className="mt-4">
            <div className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2 animate-pulse bg-gray-200 dark:bg-gray-400 h-12"></div>
            <div className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2 animate-pulse bg-gray-200 dark:bg-gray-400 h-12"></div>
            <div className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2 animate-pulse bg-gray-200 dark:bg-gray-400 h-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default loading;
