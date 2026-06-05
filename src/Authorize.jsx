// This file is kept for backward compatibility but ProtectedRoute in App.tsx handles all authorization now.
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Authorize = ({ allowedRoles, children }) => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let role = null;
  try {
    if (token) role = JSON.parse(atob(token.split(".")[1])).role;
  } catch {}

  useEffect(() => {
    if (!role) navigate("/login", { replace: true });
    else if (!allowedRoles.includes(role)) {
      navigate(role === "ADMIN" ? "/admin" : "/staff", { replace: true });
    }
  }, []);

  if (!role || !allowedRoles.includes(role)) return null;
  return <>{children}</>;
};

export default Authorize;
