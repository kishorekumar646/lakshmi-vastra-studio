import { createContext, useContext, useEffect, useState } from "react";
import { customerLogin, customerRegister, customerGoogleAuth, getMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      getMe()
        .then((r) => setCustomer(r.data))
        .catch(() => localStorage.removeItem("customer_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data) => {
    const res = await customerLogin(data);
    localStorage.setItem("customer_token", res.data.access_token);
    setCustomer(res.data.customer);
    return res.data;
  };

  const register = async (data) => {
    const res = await customerRegister(data);
    localStorage.setItem("customer_token", res.data.access_token);
    setCustomer(res.data.customer);
    return res.data;
  };

  const googleAuth = async (credential) => {
    const res = await customerGoogleAuth(credential);
    localStorage.setItem("customer_token", res.data.access_token);
    setCustomer(res.data.customer);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("customer_token");
    setCustomer(null);
  };

  return (
    <AuthContext.Provider value={{ customer, loading, login, register, googleAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
