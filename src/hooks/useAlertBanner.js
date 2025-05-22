import { useState, useCallback, useEffect } from "react";

// This variable will be reset on every hot reload
let isFirstRender = true;

export const useAlertBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show banner on every hot reload
  useEffect(() => {
    if (isFirstRender) {
      setIsVisible(true);
      isFirstRender = false;
    }
    return () => {
      // Reset on unmount (which happens during hot reload)
      isFirstRender = true;
    };
  }, []);

  const showBanner = useCallback(() => {
    // If banner is already visible, hide it first to trigger animation again
    if (isVisible) {
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(true);
    }
  }, [isVisible]);

  return {
    isVisible,
    showBanner,
  };
};
