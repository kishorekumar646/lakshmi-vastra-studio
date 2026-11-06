import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getWishlist, addToWishlist, removeFromWishlist } from "../api";
import { useAuth } from "./AuthContext";

const WISHLIST_GUEST_KEY = "lvs_wishlist";

function loadGuestWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_GUEST_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGuestWishlist(items) {
  localStorage.setItem(WISHLIST_GUEST_KEY, JSON.stringify(items));
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { customer } = useAuth();
  const [fullItems, setFullItems] = useState([]);

  const fetchWishlist = useCallback(() => {
    if (customer) {
      getWishlist()
        .then((r) => setFullItems(r.data))
        .catch(() => setFullItems([]));
    } else {
      setFullItems(loadGuestWishlist());
    }
  }, [customer]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isWishlisted = (product_id) => fullItems.some((i) => i.product_id === product_id);

  const toggle = async (product_id) => {
    if (customer) {
      if (isWishlisted(product_id)) {
        // Optimistic remove
        setFullItems((prev) => prev.filter((i) => i.product_id !== product_id));
        try {
          await removeFromWishlist(product_id);
        } catch {
          fetchWishlist(); // revert
        }
      } else {
        // Optimistic add
        setFullItems((prev) => [...prev, { id: `tmp-${Date.now()}`, product_id }]);
        try {
          const res = await addToWishlist(product_id);
          setFullItems((prev) =>
            prev.map((i) => i.product_id === product_id ? res.data : i)
          );
        } catch {
          setFullItems((prev) => prev.filter((i) => i.product_id !== product_id)); // revert
        }
      }
    } else {
      // Guest: use localStorage wishlist
      const current = loadGuestWishlist();
      if (isWishlisted(product_id)) {
        // Remove from guest wishlist
        setFullItems(current.filter((i) => i.product_id !== product_id));
        saveGuestWishlist(current.filter((i) => i.product_id !== product_id));
      } else {
        // Add to guest wishlist
        setFullItems([...current, { id: Date.now(), product_id }]);
        saveGuestWishlist([...current, { id: Date.now(), product_id }]);
      }
    }
  };

  const wishlistCount = fullItems.length;

  return (
    <WishlistContext.Provider value={{ fullItems, isWishlisted, toggle, wishlistCount, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
