import { Link, RouteObject } from "react-router-dom";

const Component = () => {
  return (
    <>
      This page should not be viewable :) Props to you kiddo. The page you are
      looking for is <Link to="/notee/">here.</Link>
    </>
  );
};

export default {
  path: "/",
  Component: Component,
} as RouteObject;
