function isOpenNow(emploieDuTemps) {
  const now = new Date();

  // Get the current day name in French
  const days = [
    "dimanche", // Sunday
    "lundi", // Monday
    "mardi", // Tuesday
    "mercredi", // Wednesday
    "jeudi", // Thursday
    "vendredi", // Friday
    "samedi", // Saturday
  ];

  const today = days[now.getDay()]; // Get the current day

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

export { isOpenNow };
