import { useMemo, useState, useEffect } from "react";

export const useDisplayMode = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const displayMode: "mobile" | "tablet" | "desktop" = useMemo(() => {
    if (windowWidth <= 768) {
      return "mobile";
    }

    if (windowWidth <= 1024) {
      return "tablet";
    }
    return "desktop";
  }, [windowWidth]);

  return { displayMode, windowWidth };
};
