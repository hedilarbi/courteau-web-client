// BasketContext.js
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

import { v4 as uuidv4 } from "uuid";

// ---------- State ----------
const initialState = {
  items: [],
  offers: [],
  rewards: [],
  size: 0,
  subtotal: 0,
};

// small helper to keep money stable (optional)
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------- Reducer ----------
function basketReducer(state, action) {
  switch (action.type) {
    case "addToBasket": {
      const added = { ...action.payload, uid: uuidv4() };
      return {
        ...state,
        items: [...state.items, added],
        size: state.size + 1,
        subtotal: round2(state.subtotal + (action.payload?.price || 0)),
      };
    }

    // delete first item by product id
    case "deleteFromBasket": {
      const idx = state.items.findIndex((it) => it.id === action.payload.id);
      if (idx < 0) return state;
      const itemPrice = state.items[idx]?.price || 0;
      const items = [...state.items];
      items.splice(idx, 1);
      return {
        ...state,
        items,
        size: Math.max(0, state.size - 1),
        subtotal: round2(Math.max(0, state.subtotal - itemPrice)),
      };
    }

    // remove by unique uid
    case "removeFromBasket": {
      const idx = state.items.findIndex((it) => it.uid === action.payload);

      if (idx < 0) return state;
      const itemPrice = state.items[idx]?.price || 0;
      const items = [...state.items];
      items.splice(idx, 1);
      return {
        ...state,
        items,
        size: Math.max(0, state.size - 1),
        subtotal: round2(Math.max(0, state.subtotal - itemPrice)),
      };
    }

    case "addOfferToBasket": {
      const added = { ...action.payload, uid: uuidv4() };
      return {
        ...state,
        offers: [...state.offers, added],
        size: state.size + 1,
        subtotal: round2(state.subtotal + (action.payload?.price || 0)),
      };
    }

    case "removeOfferFromBasket": {
      const idx = state.offers.findIndex((it) => it.uid === action.payload);
      if (idx < 0) return state;
      const itemPrice = state.offers[idx]?.price || 0;
      const offers = [...state.offers];
      offers.splice(idx, 1);
      return {
        ...state,
        offers,
        size: Math.max(0, state.size - 1),
        subtotal: round2(Math.max(0, state.subtotal - itemPrice)),
      };
    }

    case "addRewardToBasket": {
      return {
        ...state,
        rewards: [...state.rewards, action.payload],
        size: state.size + 1,
      };
    }

    case "removeRewardFromBasket": {
      const idx = state.rewards.findIndex((it) => it.id === action.payload.id);
      if (idx < 0) return state;
      const rewards = [...state.rewards];
      rewards.splice(idx, 1);
      return {
        ...state,
        rewards,
        size: Math.max(0, state.size - 1),
      };
    }

    case "updateItemInBasket": {
      const idx = state.items.findIndex((it) => it.uid === action.payload.uid);
      if (idx < 0) return state;
      const old = state.items[idx];
      const items = [...state.items];
      items[idx] = {
        ...old,
        customization: action.payload.customization,
        price: action.payload.price,
        size: action.payload.size,
        comment: action.payload.comment,
      };
      const subtotal = round2(
        state.subtotal - (old?.price || 0) + (action.payload?.price || 0)
      );
      return { ...state, items, subtotal };
    }

    case "updateOfferInBasket": {
      const idx = state.offers.findIndex((it) => it.uid === action.payload.uid);
      if (idx < 0) return state;
      const old = state.offers[idx];
      const offers = [...state.offers];
      offers[idx] = {
        ...old,
        customizations: action.payload.customizations,
        price: action.payload.price,
        comment: action.payload.comment,
      };
      const subtotal = round2(
        state.subtotal - (old?.price || 0) + (action.payload?.price || 0)
      );
      return { ...state, offers, subtotal };
    }

    case "clearBasket":
      return { ...initialState };

    default:
      return state;
  }
}

// ---------- Context ----------
const BasketContext = createContext(null);

export function BasketProvider({ children }) {
  const [state, dispatch] = useReducer(basketReducer, initialState);

  // ---- actions (same names as your slice) ----
  const addToBasket = useCallback(
    (payload) => dispatch({ type: "addToBasket", payload }),
    []
  );
  const deleteFromBasket = useCallback(
    (payload) => dispatch({ type: "deleteFromBasket", payload }),
    []
  );
  const removeFromBasket = useCallback(
    (payload) => dispatch({ type: "removeFromBasket", payload }),
    []
  );
  const addOfferToBasket = useCallback(
    (payload) => dispatch({ type: "addOfferToBasket", payload }),
    []
  );
  const removeOfferFromBasket = useCallback(
    (payload) => dispatch({ type: "removeOfferFromBasket", payload }),
    []
  );
  const addRewardToBasket = useCallback(
    (payload) => dispatch({ type: "addRewardToBasket", payload }),
    []
  );
  const removeRewardFromBasket = useCallback(
    (payload) => dispatch({ type: "removeRewardFromBasket", payload }),
    []
  );
  const updateItemInBasket = useCallback(
    (payload) => dispatch({ type: "updateItemInBasket", payload }),
    []
  );
  const updateOfferInBasket = useCallback(
    (payload) => dispatch({ type: "updateOfferInBasket", payload }),
    []
  );
  const clearBasket = useCallback(() => dispatch({ type: "clearBasket" }), []);

  const value = useMemo(
    () => ({
      state,
      // actions
      addToBasket,
      deleteFromBasket,
      removeFromBasket,
      addOfferToBasket,
      removeOfferFromBasket,
      addRewardToBasket,
      removeRewardFromBasket,
      updateItemInBasket,
      updateOfferInBasket,
      clearBasket,
    }),
    [
      state,
      addToBasket,
      deleteFromBasket,
      removeFromBasket,
      addOfferToBasket,
      removeOfferFromBasket,
      addRewardToBasket,
      removeRewardFromBasket,
      updateItemInBasket,
      updateOfferInBasket,
      clearBasket,
    ]
  );

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

// ---------- Hooks (selector equivalents) ----------
export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used within a BasketProvider");
  return ctx;
}

// exact analogs to your selectors:
export function useSelectBasket() {
  return useBasket().state;
}
export function useSelectBasketItems() {
  return useBasket().state.items;
}
export function useSelectBasketOffers() {
  return useBasket().state.offers;
}
export function useSelectBasketRewards() {
  return useBasket().state.rewards;
}
export function useSelectBasketItemCount() {
  return useBasket().state.size;
}
export function useSelectBasketTotal() {
  return useBasket().state.subtotal;
}
export function useSelectBasketItemWithUID(uid) {
  const items = useSelectBasketItems();
  return useMemo(() => items.filter((it) => it.uid === uid), [items, uid]);
}
export function useSelectBasketItemsWithID(itemId) {
  const items = useSelectBasketItems();
  return useMemo(
    () => items.filter((it) => it.id === itemId).length,
    [items, itemId]
  );
}
export function useSelectBasketOfferWithUID(uid) {
  const offers = useSelectBasketOffers();
  return useMemo(() => offers.filter((it) => it.uid === uid), [offers, uid]);
}
export function useSelectBasketOffersWithID(itemId) {
  const offers = useSelectBasketOffers();
  return useMemo(
    () => offers.filter((it) => it.id === itemId),
    [offers, itemId]
  );
}
