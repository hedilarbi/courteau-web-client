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

const getDayScheduleForRestaurant = (date, restaurant) => {
  if (!date || !restaurant?.settings?.emploie_du_temps) return null;
  const dayKey = DAY_KEYS[date.getDay()];
  return restaurant.settings.emploie_du_temps[dayKey] || null;
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

  const daySchedule = getDayScheduleForRestaurant(candidate, restaurant);
  if (!daySchedule || !daySchedule.open || !daySchedule.close) {
    return "Horaires non disponibles pour ce jour.";
  }

  const openDate = parseTimeToDate(candidate, daySchedule.open);
  const closeDate = parseTimeToDate(candidate, daySchedule.close);
  if (!openDate || !closeDate) {
    return "Horaires non disponibles pour ce jour.";
  }

  if (candidate < openDate) {
    return `L'heure doit être après l'ouverture (${daySchedule.open}).`;
  }

  if (candidate > closeDate) {
    return `L'heure doit être avant la fermeture (${daySchedule.close}).`;
  }

  return "";
};

function isOpenNow(emploieDuTemps) {
  const now = new Date();

  // Get the current day name in French
  const today = DAY_KEYS[now.getDay()]; // Get the current day

  if (!emploieDuTemps[today]) {
    return false; // No schedule for today
  }

  const { open, close } = emploieDuTemps[today];

  if (!open || !close) {
    return false;
  }

  // Convert times to Date objects for comparison
  const [openHours, openMinutes] = open.split(":").map(Number);
  const [closeHours, closeMinutes] = close.split(":").map(Number);

  const openTime = new Date(now);
  openTime.setHours(openHours, openMinutes, 0, 0);

  const closeTime = new Date(now);
  closeTime.setHours(closeHours, closeMinutes, 0, 0);

  // Check if the current time is between open and close
  return now >= openTime && now <= closeTime;
}

export {
  isOpenNow,
  MIN_SCHEDULE_MINUTES,
  getMinScheduleDate,
  getDayScheduleForRestaurant,
  parseTimeToDate,
  getScheduleValidationError,
};
