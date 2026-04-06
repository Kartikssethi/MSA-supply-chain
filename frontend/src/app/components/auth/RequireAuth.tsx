import { Navigate, Outlet } from "react-router";
import { isAuthenticated } from "../../utils/auth";

export const RequireAuth = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};
