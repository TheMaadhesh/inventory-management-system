// UpdateInventory is handled inline via the EditModal in ManageInventory.tsx
// This stub redirects to manage if accessed directly.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const UpdateInventory = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate("/admin/inventory/manage"); }, []);
  return null;
};
export default UpdateInventory;
