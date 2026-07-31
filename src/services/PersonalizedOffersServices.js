import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getActiveOffer = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/personalized-offers/active/${userId}`);
    if (response?.status === 200) {
      return { status: true, data: response?.data };
    }
    return { status: false, message: "Error fetching active offer" };
  } catch (error) {
    return { status: false, message: error.message };
  }
};

const logOfferEvent = async (offerId, userId, eventType) => {
  try {
    const response = await axios.post(`${API_URL}/personalized-offers/event`, {
      offerId,
      userId,
      eventType,
    });
    if (response?.status === 200) {
      return { status: true, data: response?.data };
    }
    return { status: false, message: "Error logging offer event" };
  } catch (error) {
    return { status: false, message: error.message };
  }
};

export {
  getActiveOffer,
  logOfferEvent,
};
