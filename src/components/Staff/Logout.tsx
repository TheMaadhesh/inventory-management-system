import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_pending");
    navigate("/staff/login", { replace: true });
  }, []);

  return null;
};

export default Logout;
