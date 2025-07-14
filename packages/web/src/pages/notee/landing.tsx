import { useContext, useEffect } from "react";
import { RouteObject, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/auth-context";

const Component = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (!authContext.authInitialised) {
      return;
    }

    if (!authContext.auth) {
      navigate("/notee/auth/login");
    }

    if (authContext.auth) {
      navigate("/notee/notes/");
    }
  }, [authContext.authInitialised, authContext.auth]);

  return null;
};

export default {
  path: "/notee/",
  Component: Component,
} as RouteObject;
