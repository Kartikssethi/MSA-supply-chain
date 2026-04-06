import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { Vehicles } from "./pages/Vehicles";
import { Drivers } from "./pages/Drivers";
import { Trips } from "./pages/Trips";
import { Tracking } from "./pages/Tracking";
import { Maintenance } from "./pages/Maintenance";

export const router = createBrowserRouter([
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
    ],
  },
]);
