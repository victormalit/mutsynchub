import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const isAuthenticated = () => {
  // You can improve this logic: check for a valid token, expiry, etc.
  return !!localStorage.getItem("token");
};

const ProtectedRoute: React.FC = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
