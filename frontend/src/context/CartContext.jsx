import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCart, addToCart, updateCartItem, removeCartItem } from "../api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const GUEST_CART_KEY = "lvs_cart";

function loadGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { customer } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(() => {
    if (customer) {
      setLoading(true);
      getCart()
        .then((r) => setItems(r.data))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      setItems(loadGuestCart());
    }
  }, [customer]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (product, quantity = 1) => {
    if (customer) {
      await addToCart(product.id, quantity);
      fetchCart();
    } else {
      const current = loadGuestCart();
      const idx = current.findIndex((i) => i.product_id === product.id);
      if (idx >= 0) {
        current[idx].quantity += quantity;
      } else {
        current.push({
          id: Date.now(),
          product_id: product.id,
          quantity,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          category_name: product.category_name || "",
        });
      }
      saveGuestCart(current);
      setItems([...current]);
    }
  };

  const removeItem = async (item_id) => {
    if (customer) {
      await removeCartItem(item_id);
      fetchCart();
    } else {
      const updated = items.filter((i) => i.id !== item_id);
      saveGuestCart(updated);
      setItems(updated);
    }
  };

  const updateItem = async (item_id, quantity) => {
    if (customer) {
      await updateCartItem(item_id, quantity);
      fetchCart();
    } else {
      if (quantity <= 0) {
        removeItem(item_id);
        return;
      }
      const updated = items.map((i) => (i.id === item_id ? { ...i, quantity } : i));
      saveGuestCart(updated);
      setItems(updated);
    }
  };

  const clearCartLocal = () => {
    setItems([]);
    if (!customer) saveGuestCart([]);
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addItem, removeItem, updateItem, clearCartLocal, cartCount, cartTotal, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
