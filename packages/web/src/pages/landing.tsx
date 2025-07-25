import { useContext, useEffect } from "react";
import { RouteObject, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth-context";

const Component = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (!authContext.authInitialised) {
      return;
    }

    if (!authContext.auth) {
      navigate("/autb/login");
    }

    if (authContext.auth) {
      navigate("/notes/");
    }
  }, [authContext.authInitialised, authContext.auth]);

  return null;
};

export default {
  path: "/",
  Component: Component,
} as RouteObject;
