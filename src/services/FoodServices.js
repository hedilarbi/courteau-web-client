import axios from "axios";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
axios.defaults.timeout = 15000; // Timeout of 10 seconds
const getCategories = async () => {
  try {
    let categoriesResponse = await axios.get(`${API_URL}/categories/`, {
      timeout: 10000,
    });
    if (categoriesResponse?.status === 200) {
      return {
        status: true,
        message: "categories data fetched",
        data: categoriesResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "categories data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getCategoriesNames = async () => {
  try {
    let categoriesResponse = await axios.get(`${API_URL}/categories/names`, {
      timeout: 10000,
    });
    if (categoriesResponse?.status === 200) {
      return {
        status: true,
        message: "categories data fetched",
        data: categoriesResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "categories data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getOffers = async () => {
  try {
    let offersResponse = await axios.get(`${API_URL}/offers/`, {
      timeout: 10000,
    });
    if (offersResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: offersResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "offers data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getMenuItems = async () => {
  try {
    let menuItemsResponse = await axios.get(`${API_URL}/menuItems/`, {
      timeout: 10000,
    });
    if (menuItemsResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: menuItemsResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "menu items data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getMenuItem = async (id) => {
  try {
    let menuItemResponse = await axios.get(`${API_URL}/menuItems/${id}`, {
      timeout: 10000,
    });
    if (menuItemResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: menuItemResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "menu item data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getRewards = async () => {
  try {
    let rewardsResponse = await axios.get(`${API_URL}/rewards/`, {
      timeout: 10000,
    });
    if (rewardsResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: rewardsResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "menu item data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getNewItems = async () => {
  try {
    let getNewItemsResponse = await axios.get(`${API_URL}/menuItems/new`, {
      timeout: 10000,
    });
    if (getNewItemsResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: getNewItemsResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "menu item data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getRestaurantItems = async (id) => {
  try {
    let getNewItemsResponse = await axios.get(
      `${API_URL}/restaurants/items/${id}`,
      {
        timeout: 10000,
      }
    );
    if (getNewItemsResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: getNewItemsResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "menu item data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};
const getRestaurantItem = async (id, restaurantId) => {
  try {
    let getNewItemsResponse = await axios.get(
      `${API_URL}/restaurants/${restaurantId}/items/${id}`,
      {
        timeout: 10000,
      }
    );
    if (getNewItemsResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: getNewItemsResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "menu item data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getRestaurantOffer = async (id, restaurantId) => {
  try {
    let getNewItemsResponse = await axios.get(
      `${API_URL}/restaurants/${restaurantId}/offer/${id}`,
      {
        timeout: 10000,
      }
    );
    if (getNewItemsResponse?.status === 200) {
      return {
        status: true,
        message: "offers data fetched",
        data: getNewItemsResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "menu item data not found",
      };
    }
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

const getVedettes = async () => {
  try {
    let vedettesResponse = await axios.get(`${API_URL}/vedettes/`, {
      timeout: 10000,
    });
    if (vedettesResponse?.status === 200) {
      return {
        status: true,
        message: "vedettes data fetched",
        data: vedettesResponse?.data,
      };
    } else {
      return {
        status: false,
        message: "vedettes data not found",
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
  getCategories,
  getOffers,
  getMenuItems,
  getCategoriesNames,
  getMenuItem,
  getRewards,
  getNewItems,
  getRestaurantItems,
  getRestaurantItem,
  getRestaurantOffer,
  getVedettes,
};
