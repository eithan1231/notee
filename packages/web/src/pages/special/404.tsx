import { useEffect } from "react";
import { Link, RouteObject, useNavigate } from "react-router-dom";

const Component = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const legacyGlobalSuffix = "/notee";
    if (window.location.pathname.startsWith(legacyGlobalSuffix)) {
      navigate(window.location.pathname.substring(legacyGlobalSuffix.length));
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          to={"/notee/"}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default {
  path: "*",
  Component: Component,
} as RouteObject;
