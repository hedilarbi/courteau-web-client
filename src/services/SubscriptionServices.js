import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
axios.defaults.timeout = 15000;

const mapSuccessResponse = (response) => ({
  status: true,
  data: response?.data?.data ?? null,
  message: response?.data?.message || "",
});

const mapErrorResponse = (error, fallbackMessage) => ({
  status: false,
  data: error?.response?.data?.data ?? null,
  message:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage,
});

const getSubscriptionConfig = async () => {
  try {
    const response = await axios.get(`${API_URL}/subscriptions/config`, {
      timeout: 15000,
    });
    return mapSuccessResponse(response);
  } catch (error) {
    return mapErrorResponse(
      error,
      "Erreur lors du chargement de la configuration abonnement."
    );
  }
};

const getUserSubscription = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/subscriptions/user/${userId}`, {
      timeout: 15000,
    });
    return mapSuccessResponse(response);
  } catch (error) {
    return mapErrorResponse(
      error,
      "Erreur lors du chargement de l'abonnement utilisateur."
    );
  }
};

const createUserSubscription = async (userId, paymentMethodId) => {
  try {
    const response = await axios.post(
      `${API_URL}/subscriptions/create`,
      {
        userId,
        paymentMethodId,
      },
      {
        timeout: 15000,
      }
    );
    return mapSuccessResponse(response);
  } catch (error) {
    return mapErrorResponse(error, "Erreur lors de la création de l'abonnement.");
  }
};

const confirmUserSubscriptionPayment = async (
  userId,
  subscriptionId,
  paymentIntentId,
  forceCleanupOnFailure = false
) => {
  try {
    const response = await axios.post(
      `${API_URL}/subscriptions/confirm-payment`,
      {
        userId,
        subscriptionId,
        paymentIntentId,
        forceCleanupOnFailure,
      },
      {
        timeout: 15000,
      }
    );
    return mapSuccessResponse(response);
  } catch (error) {
    return mapErrorResponse(
      error,
      "Erreur lors de la confirmation du paiement abonnement."
    );
  }
};

const cancelUserSubscription = async (userId, immediate = false) => {
  try {
    const response = await axios.post(
      `${API_URL}/subscriptions/cancel`,
      {
        userId,
        immediate,
      },
      {
        timeout: 15000,
      }
    );
    return mapSuccessResponse(response);
  } catch (error) {
    return mapErrorResponse(error, "Erreur lors de l'annulation de l'abonnement.");
  }
};

const refreshUserSubscription = async (userId) => {
  try {
    const response = await axios.post(
      `${API_URL}/subscriptions/refresh/${userId}`,
      {},
      {
        timeout: 15000,
      }
    );
    return mapSuccessResponse(response);
  } catch (error) {
    return mapErrorResponse(error, "Erreur lors du rafraîchissement abonnement.");
  }
};

export {
  getSubscriptionConfig,
  getUserSubscription,
  createUserSubscription,
  confirmUserSubscriptionPayment,
  cancelUserSubscription,
  refreshUserSubscription,
};
