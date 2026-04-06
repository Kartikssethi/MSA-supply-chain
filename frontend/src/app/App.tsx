import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { router } from "./routes";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const finishLoading = () => {
      setTimeout(() => setIsLoading(false), 850);
    };

    if (document.readyState === "complete") {
      finishLoading();
      return;
    }

    window.addEventListener("load", finishLoading);
    return () => window.removeEventListener("load", finishLoading);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

export default App;
