import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { RequireAuth } from "./components/auth/RequireAuth";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Vehicles } from "./pages/Vehicles";
import { Drivers } from "./pages/Drivers";
import { Trips } from "./pages/Trips";
import { Tracking } from "./pages/Tracking";
import { Maintenance } from "./pages/Maintenance";
import { Operations } from "./pages/Operations";
import { Dispatch } from "./pages/Dispatch";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: Auth,
  },
  {
    Component: RequireAuth,
    children: [
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "vehicles", Component: Vehicles },
      { path: "drivers", Component: Drivers },
      { path: "trips", Component: Trips },
      { path: "tracking", Component: Tracking },
      { path: "maintenance", Component: Maintenance },
      { path: "operations", Component: Operations },
      { path: "dispatch", Component: Dispatch },
    ],
  },
    ],
  },
]);
