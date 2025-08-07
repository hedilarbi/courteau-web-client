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
};
