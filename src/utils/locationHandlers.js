function calculateDistance(userCoords, restaurantCoords) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(restaurantCoords.latitude - userCoords.latitude);
  const dLon = deg2rad(restaurantCoords.longitude - userCoords.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(userCoords.latitude)) *
      Math.cos(deg2rad(restaurantCoords.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getClosestRestaurant(userCoords, restaurants) {
  let minDistance;
  let restaurantIndex = 0;

  for (let i = 0; i < restaurants.length; i++) {
    if (restaurants[i].location) {
      let distance = calculateDistance(userCoords, restaurants[i].location);

      if (i === 0 || distance < minDistance) {
        restaurantIndex = i;
        minDistance = distance;
      }
    }
  }

  return restaurantIndex;
}

export { calculateDistance, getClosestRestaurant };
