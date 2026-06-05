/**
 * useUserInfo — single source of truth for the logged-in user's display data.
 * Reads JWT → localStorage fallbacks (written at signup + profile save).
 * Reactive: updates whenever a "userInfoUpdated" event is dispatched or
 *           localStorage changes in another tab.
 */
import { useState, useEffect, useCallback } from "react";

export interface UserInfo {
  firstName: string;
  lastName:  string;
  fullName:  string;
  initials:  string;
  email:     string;
  phone:     string;
  role:      string;
  avatar:    string | null;
}

const EMPTY: UserInfo = {
  firstName:"", lastName:"", fullName:"", initials:"?",
  email:"", phone:"", role:"", avatar:null,
};

function parseJwt(token: string) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function read(): UserInfo {
  try {
    const token = localStorage.getItem("token");
    if (!token) return EMPTY;
    const p = parseJwt(token);
    if (!p) return EMPTY;

    const email = p.sub || p.email || "";

    const firstName = p.firstname  || p.firstName  || p.given_name  || p.first_name
                   || localStorage.getItem(`profile_firstName_${email}`) || "";
    const lastName  = p.lastname   || p.lastName   || p.family_name || p.last_name
                   || localStorage.getItem(`profile_lastName_${email}`)  || "";
    const phone     = p.mobile     || p.phone      || p.phoneNumber || p.phone_number
                   || localStorage.getItem(`profile_phone_${email}`)     || "";
    const role      = p.role
                   || localStorage.getItem(`profile_role_${email}`)      || "";

    const fullName = `${firstName} ${lastName}`.trim();
    const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase()
                  || (email[0]?.toUpperCase() ?? "?");

    const avatar =
      localStorage.getItem(`profileAvatar_${email}`) ||
      localStorage.getItem(`profileAvatar_${email.toLowerCase()}`) ||
      null;

    return { firstName, lastName, fullName, initials, email, phone, role, avatar };
  } catch {
    return EMPTY;
  }
}

export function useUserInfo(): UserInfo {
  const [info, setInfo] = useState<UserInfo>(read);
  const refresh = useCallback(() => setInfo(read()), []);

  useEffect(() => {
    window.addEventListener("userInfoUpdated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("userInfoUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return info;
}

/** Dispatch after any profile save so all consumers re-render immediately */
export function notifyUserInfoUpdated() {
  window.dispatchEvent(new Event("userInfoUpdated"));
}
