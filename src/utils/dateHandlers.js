const DAY_KEYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const MIN_SCHEDULE_MINUTES = 45;

const getMinScheduleDate = (minutes = MIN_SCHEDULE_MINUTES) => {
  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + minutes);
  return minDate;
};

// Les horaires (emploie_du_temps) sont à l'heure du restaurant (Toronto), jamais à celle de
// l'ordinateur du client : un client en Tunisie, ou un navigateur réglé sur un autre fuseau,
// voyait le restaurant « fermé » alors qu'il était ouvert. Même règle que le serveur
// (checkRestaurantOrderAvailabilityService), y compris les plages qui finissent après minuit.
const RESTAURANT_TIMEZONE = "America/Toronto";
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getRestaurantLocalTime = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekdayIndex = WEEKDAYS_EN.indexOf(parts.find((part) => part.type === "weekday")?.value);
  const hours = Number(parts.find((part) => part.type === "hour")?.value);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value);
  return { weekdayIndex, minutesSinceMidnight: hours * 60 + minutes };
};

const parseScheduleTime = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const isWithinSchedule = (schedule, date = new Date()) => {
  if (!schedule || typeof schedule !== "object") return false;
  const { weekdayIndex, minutesSinceMidnight } = getRestaurantLocalTime(date);
  if (weekdayIndex < 0 || !Number.isFinite(minutesSinceMidnight)) return false;

  const today = schedule[DAY_KEYS[weekdayIndex]] || {};
  const todayOpen = parseScheduleTime(today.open);
  const todayClose = parseScheduleTime(today.close);
  if (todayOpen !== null && todayClose !== null) {
    if (todayClose >= todayOpen) {
      if (minutesSinceMidnight >= todayOpen && minutesSinceMidnight <= todayClose) return true;
    } else if (minutesSinceMidnight >= todayOpen) {
      return true;
    }
  }

  // Une plage qui finit après minuit appartient au jour précédent.
  const previousDay = schedule[DAY_KEYS[(weekdayIndex + 6) % 7]] || {};
  const previousOpen = parseScheduleTime(previousDay.open);
  const previousClose = parseScheduleTime(previousDay.close);
  return (
    previousOpen !== null &&
    previousClose !== null &&
    previousClose < previousOpen &&
    minutesSinceMidnight <= previousClose
  );
};

/** Horaires du jour de `date`, jour calculé à l'heure de Toronto. */
const getDayScheduleForRestaurant = (date, restaurant) => {
  if (!date || !restaurant?.settings?.emploie_du_temps) return null;
  const { weekdayIndex } = getRestaurantLocalTime(date);
  return restaurant.settings.emploie_du_temps[DAY_KEYS[weekdayIndex]] || null;
};

const parseTimeToDate = (baseDate, timeStr) => {
  if (!baseDate || !timeStr) return null;
  const [hours, minutes] = timeStr
    .split(":")
    .map((part) => parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

const getScheduleValidationError = (candidate, restaurant) => {
  if (!candidate || Number.isNaN(candidate.getTime())) {
    return "Horaire invalide.";
  }

  const minDate = getMinScheduleDate();
  if (candidate < minDate) {
    return `La date sélectionnée doit être au moins ${MIN_SCHEDULE_MINUTES} minutes dans le futur.`;
  }

  const schedule = restaurant?.settings?.emploie_du_temps;
  if (isWithinSchedule(schedule, candidate)) return "";

  const daySchedule = getDayScheduleForRestaurant(candidate, restaurant);
  const open = parseScheduleTime(daySchedule?.open);
  const close = parseScheduleTime(daySchedule?.close);
  if (open === null || close === null) {
    return "Horaires non disponibles pour ce jour.";
  }

  const { minutesSinceMidnight } = getRestaurantLocalTime(candidate);
  if (minutesSinceMidnight < open) {
    return `L'heure doit être après l'ouverture (${daySchedule.open}).`;
  }
  return `L'heure doit être avant la fermeture (${daySchedule.close}).`;
};

function isOpenNow(emploieDuTemps) {
  return isWithinSchedule(emploieDuTemps, new Date());
}

export {
  isOpenNow,
  isWithinSchedule,
  MIN_SCHEDULE_MINUTES,
  getMinScheduleDate,
  getDayScheduleForRestaurant,
  parseTimeToDate,
  getScheduleValidationError,
};
