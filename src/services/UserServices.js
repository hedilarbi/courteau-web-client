import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
axios.defaults.timeout = 15000; // Timeout of 10 seconds
const createUserService = async (phone_number) => {
  try {
    let createUserResponse = await axios.post(`${API_URL}/users/create`, {
      phone_number,
    });

    if (createUserResponse?.status === 200) {
      return {
        status: true,
        message: "user data",
        data: createUserResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "no user data",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const updateUserExpoToken = async (id, token) => {
  try {
    let updateUserExpoTokenResponse = await axios.put(
      `${API_URL}/users/update/expoToken/${id}`,
      { token }
    );
    if (updateUserExpoTokenResponse?.status === 200) {
      return {
        status: true,
        message: "expo token updated",
        data: updateUserExpoTokenResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "didn't add",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const addToFavorites = async (userId, itemId) => {
  try {
    let addToFavoritesResponse = await axios.put(
      `${API_URL}/users/favorites/update/add/${userId}`,
      { itemId }
    );
    if (addToFavoritesResponse?.status === 200) {
      return {
        status: true,
        message: "favorites added",
        data: addToFavoritesResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "didn't add",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const addToAddresses = async (userId, address, coords) => {
  try {
    let addToAddressesResponse = await axios.put(
      `${API_URL}/users/addresses/update/add/${userId}`,
      { address, coords }
    );
    if (addToAddressesResponse?.status === 200) {
      return {
        status: true,
        message: "Address added",
        data: addToAddressesResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "didn't add",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const removeFromFavorites = async (userId, itemId) => {
  try {
    let removeFromFavoritesResponse = await axios.put(
      `${API_URL}/users/favorites/update/remove/${userId}`,
      { menuItem_id: itemId }
    );
    if (removeFromFavoritesResponse?.status === 200) {
      return {
        status: true,
        message: "favorites added",
        data: removeFromFavoritesResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "didn't add",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const removeFromAddresses = async (userId, addressId) => {
  try {
    let removeFromFavoritesResponse = await axios.put(
      `${API_URL}/users/${userId}/delete/addresses/${addressId}`
    );
    if (removeFromFavoritesResponse?.status === 200) {
      return {
        status: true,
        message: "favorites added",
        data: removeFromFavoritesResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "didn't add",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getUserByToken = async (token) => {
  try {
    let getUserByTokenResponse = await axios.get(
      `${API_URL}/users/userByToken/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    if (getUserByTokenResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: getUserByTokenResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const setUserInfo = async (id, name, email, address, coords, date) => {
  try {
    let updateUserInfoResponse = await axios.put(`${API_URL}/users/set/${id}`, {
      name,
      email,
      address,
      date_of_birth: date,
      coords,
    });
    if (updateUserInfoResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: updateUserInfoResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const updateUserInfo = async (id, name, email) => {
  try {
    let updateUserInfoResponse = await axios.put(
      `${API_URL}/users/update/${id}`,
      {
        name,
        email,
      }
    );
    if (updateUserInfoResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: updateUserInfoResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getOrdersList = async (id) => {
  try {
    let getOrdersListResponse = await axios.get(
      `${API_URL}/users/orders/${id}`,
      {
        timeout: 10000,
      }
    );
    if (getOrdersListResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: getOrdersListResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const deleteUser = async (id) => {
  try {
    let deleteUserResponse = await axios.delete(
      `${API_URL}/users/delete/${id}`,
      {
        timeout: 10000,
      }
    );
    if (deleteUserResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: deleteUserResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getFavoritesList = async (id) => {
  try {
    let getFavoritesListResponse = await axios.get(
      `${API_URL}/users/favorites/${id}`,
      {
        timeout: 10000,
      }
    );
    if (getFavoritesListResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: getFavoritesListResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const storeCustomerData = async (id, customerId, paymentMethodId) => {
  try {
    let storeCustomerDataResponse = await axios.put(
      `${API_URL}/users/card/add/${id}`,
      {
        customerId,
        paymentMethodId,
      }
    );
    if (storeCustomerDataResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: storeCustomerDataResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getOrder = async (id) => {
  try {
    let getOrderResponse = await axios.get(`${API_URL}/orders/${id}`, {
      timeout: 10000,
    });
    if (getOrderResponse.status === 200) {
      return {
        status: true,
        message: "order data",
        data: getOrderResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const createOrder = async (order) => {
  try {
    let createOrderResponse = await axios.post(
      `${API_URL}/orders/create/`,
      {
        order,
      },
      {
        timeout: 15000,
      }
    );
    if (createOrderResponse.status === 201) {
      return {
        status: true,
        message: "order data",
        data: createOrderResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getPaymentMethods = async (customerId) => {
  try {
    let getPaymentIntentClientSecretResponse = await axios.get(
      `${API_URL}/payments/get-payment-methods/${customerId}`,

      {
        timeout: 15000,
      }
    );
    if (getPaymentIntentClientSecretResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: getPaymentIntentClientSecretResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getPaymentIntentClientSecret = async (
  userId,
  amount,
  email,
  paymentMethod,
  saved
) => {
  try {
    let getPaymentIntentClientSecretResponse = await axios.post(
      `${API_URL}/payments/create-payment-intent`,
      { amount, email, paymentMethod, saved, userId },
      {
        timeout: 15000,
      }
    );
    if (getPaymentIntentClientSecretResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: getPaymentIntentClientSecretResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    let message = "";

    if (error?.response?.data?.error?.decline_code) {
      const { decline_code } = error.response.data.error;
      if (decline_code === "generic_decline") {
        message =
          "La carte a été refusée. Veuillez vérifier les détails de la carte.";
      } else if (decline_code === "insufficient_funds") {
        message = "Fonds insuffisants sur la carte.";
      } else if (decline_code === "incorrect_cvc") {
        message = "Le CVC de la carte est incorrect.";
      } else if (decline_code === "expired_card") {
        message = "La carte a expiré.";
      } else if (decline_code === "email_invalid") {
        message = "L'adresse e-mail est invalide.";
      } else if (decline_code === "amount_too_small") {
        message = "Le montant est trop faible.";
      } else if (decline_code === "amount_too_large") {
        message = "Le montant est trop élevé.";
      } else if (decline_code === "incorrect_number") {
        message = "Le numéro de la carte est incorrect.";
      } else if (decline_code === "invalid_expiry_month") {
        message = "Le mois d'expiration de la carte est invalide.";
      } else if (decline_code === "invalid_expiry_year") {
        message = "L'année d'expiration de la carte est invalide.";
      } else if (decline_code === "authentication_required") {
        message = "Carte non approuvée.";
      } else if (decline_code === "card_not_supported") {
        message = "La carte n'est pas prise en charge.";
      } else if (decline_code === "invalid_amount") {
        message = "Le montant du paiement est invalide.";
      } else if (decline_code === "restricted_card") {
        message = "Carte restreinte.";
      } else if (decline_code === "card_declined") {
        message = "La carte a été refusée.";
      } else {
        message = decline_code;
      }
    } else if (error?.response?.data?.error?.code) {
      const { code } = error.response.data.error;
      if (code === "card_declined") {
        message = "La carte a été refusée.";
      } else if (code === "invalid_request_error") {
        message = "Erreur de demande invalide.";
      } else if (code === "api_connection_error") {
        message = "Erreur de connexion à l'API.";
      } else if (code === "api_error") {
        message = "Erreur de l'API.";
      } else if (code === "rate_limit_error") {
        message = "Limite de taux dépassée.";
      } else if (code === "email_invalid") {
        message = "L'adresse e-mail est invalide.";
      } else {
        message = code;
      }
    } else {
      message = error?.response?.data?.error;
    }

    return {
      status: false,
      message: message || "Une erreur s'est produite . Veuillez réessayer.",
    };
  }
};
const catchError = async (userId, error, source) => {
  try {
    let getPaymentIntentClientSecretResponse = await axios.post(
      `${API_URL}/payments/catch-error`,
      { error, userId, source },
      {
        timeout: 15000,
      }
    );
    if (getPaymentIntentClientSecretResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: getPaymentIntentClientSecretResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.response.data.error,
    };
  }
};

const confirmPaiment = async (paymentIntentId) => {
  try {
    let confirmPaimentResponse = await axios.post(
      `${API_URL}/payments/confirm-payment`,
      { paymentIntentId },
      {
        timeout: 15000,
      }
    );
    if (confirmPaimentResponse.status === 200) {
      return {
        status: true,
        message: "user data",
        data: confirmPaimentResponse.data,
      };
    } else {
      return {
        status: false,
        message: "didn't found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.response.data.error,
    };
  }
};
export {
  createUserService,
  removeFromFavorites,
  addToFavorites,
  getUserByToken,
  updateUserInfo,
  getOrdersList,
  getFavoritesList,
  setUserInfo,
  deleteUser,
  updateUserExpoToken,
  addToAddresses,
  storeCustomerData,
  getOrder,
  removeFromAddresses,
  getPaymentMethods,
  getPaymentIntentClientSecret,
  catchError,
  createOrder,
  confirmPaiment,
};
