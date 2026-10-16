import { useState } from "react";
import { AuthContext } from "./authContextObject";
import { setSelfResidentId } from "../api/currentResident";
import { setCurrentActor } from "../api/currentActor";

const STORAGE_KEY = "barangay-portal-session";

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user?.role === "Resident" && user.id) setSelfResidentId(user.id);
    if (user?.role && user.id) setCurrentActor(user.role, user.id);
    return user;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(readStoredUser);

  function setUser(next) {
    setUserState(next);
    if (next) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      setSelfResidentId(null);
      setCurrentActor(null, null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
