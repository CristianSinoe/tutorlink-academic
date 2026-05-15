import { useState } from "react";
import { AuthContext } from "./auth-context.js";

function readStoredAuth() {
  try {
    const saved = localStorage.getItem("auth");
    if (!saved) {
      return {
        token: null,
        role: null,
        email: null,
        name: null,
        loading: false,
      };
    }

    const parsed = JSON.parse(saved);
    return {
      token: parsed.token ?? null,
      role: parsed.role ?? null,
      email: parsed.email ?? null,
      name: parsed.name ?? null,
      loading: false,
    };
  } catch (error) {
    console.error("Error parseando auth de localStorage", error);
    return {
      token: null,
      role: null,
      email: null,
      name: null,
      loading: false,
    };
  }
}

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const login = ({ token, role, email, name }) => {
    const data = { token, role, email, name };
    localStorage.setItem("auth", JSON.stringify(data));
    setAuth({ ...data, loading: false });
  };

  const logout = () => {
    localStorage.removeItem("auth");
    setAuth({
      token: null,
      role: null,
      email: null,
      name: null,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
