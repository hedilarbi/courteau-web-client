"use client";

import React from "react";
import { MIN_SCHEDULE_MINUTES, getMinScheduleDate } from "@/utils/dateHandlers";

const formatDateTimeLocal = (date) => {
  if (!date) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const ScheduleBlock = ({
  scheduleOption,
  setScheduleOption,
  scheduledDateTime,
  setScheduledDateTime,
  scheduleError,
}) => {
  const minDateValue = formatDateTimeLocal(getMinScheduleDate());
  const inputValue = scheduledDateTime
    ? formatDateTimeLocal(scheduledDateTime)
    : "";

  return (
    <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Horaire de la commande
      </h2>
      <div className="flex items-center gap-4 mt-4">
        <button
          type="button"
          onClick={() => setScheduleOption("now")}
          className={`px-4 py-2 border-2 rounded-md font-inter font-semibold ${
            scheduleOption === "now"
              ? "bg-[#F7A700]/20 border-pr"
              : "bg-[#FFFFFF] border-[#E5E7EB]"
          }`}
        >
          Maintenant
        </button>
        <button
          type="button"
          onClick={() => setScheduleOption("later")}
          className={`px-4 py-2 border-2 rounded-md font-inter font-semibold ${
            scheduleOption === "later"
              ? "bg-[#F7A700]/20 border-pr"
              : "bg-[#FFFFFF] border-[#E5E7EB]"
          }`}
        >
          Plus tard
        </button>
      </div>
      {scheduleOption === "later" && (
        <div className="mt-4 space-y-2">
          <label className="block font-inter text-sm text-gray-700">
            Date et heure souhaitées
          </label>
          <input
            type="datetime-local"
            value={inputValue}
            min={minDateValue}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) {
                setScheduledDateTime(null);
                return;
              }
              const candidate = new Date(value);
              if (Number.isNaN(candidate.getTime())) {
                setScheduledDateTime(null);
                return;
              }
              setScheduledDateTime(candidate);
            }}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pr"
          />
          <p className="text-xs text-gray-500">
            Minimum {MIN_SCHEDULE_MINUTES} minutes à l&apos;avance.
          </p>
          {scheduleError && (
            <p className="text-sm text-red-600">{scheduleError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleBlock;
