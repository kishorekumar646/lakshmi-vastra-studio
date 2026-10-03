import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getWishlist, addToWishlist, removeFromWishlist } from "../api";
import { useAuth } from "./AuthContext";

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
      setFullItems([]);
    }
  }, [customer]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isWishlisted = (product_id) => fullItems.some((i) => i.product_id === product_id);

  const toggle = async (product_id) => {
    if (!customer) return;
    if (isWishlisted(product_id)) {
      await removeFromWishlist(product_id);
      setFullItems((prev) => prev.filter((i) => i.product_id !== product_id));
    } else {
      const res = await addToWishlist(product_id);
      setFullItems((prev) => [...prev, res.data]);
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
