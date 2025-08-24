import React from "react";

const TipsBlock = ({ setSelectedTip, selectedTip, setTips, tips }) => {
  const tipOptions = [0, 15, 18, 20, 25];
  return (
    <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Pourboire
      </h2>
      <div className="flex items-center gap-2 mt-4 w-full flex-wrap">
        {tipOptions.map((tip) => (
          <button
            key={tip}
            onClick={() => setSelectedTip(tip)}
            className={`border border-gray-300 rounded-md p-2 font-semibold focus:outline-none focus:ring-2 focus:ring-pr ${
              selectedTip === tip
                ? "bg-[#F7A700]/20 border-pr"
                : "bg-[#FFFFFF] border-[#E5E7EB]"
            }`}
          >
            {tip}%
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setSelectedTip("other");
          setTips("");
        }}
        className={
          selectedTip === "other"
            ? "bg-pr rounded-md items-center justify-center py-2 w-1/4 mt-4 font-semibold"
            : "border border-pr rounded-md items-center justify-center py-2 w-1/4 mt-4 font-semibold"
        }
      >
        Autres
      </button>
      {selectedTip === "other" && (
        <input
          type="text"
          value={tips}
          onChange={(e) => setTips(Number(e.target.value))}
          placeholder="$0"
          className="ml-2 w-1/4 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pr"
        />
      )}
    </div>
  );
};

export default TipsBlock;
