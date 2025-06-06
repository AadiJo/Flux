import { useState, useCallback } from "react";

export const useAlertBanner = () => {
  const [bannerConfig, setBannerConfig] = useState({
    isVisible: false,
    message: "",
    backgroundColor: "",
  });

  const showBanner = useCallback((config) => {
    setBannerConfig({
      isVisible: true,
      message: config.message,
      backgroundColor: config.backgroundColor,
    });
  }, []);

  const hideBanner = useCallback(() => {
    setBannerConfig((config) => ({ ...config, isVisible: false }));
  }, []);

  return {
    bannerConfig,
    showBanner,
    hideBanner,
  };
};
