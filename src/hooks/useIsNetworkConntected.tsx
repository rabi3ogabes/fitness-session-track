import React, { useEffect } from "react";

export default function useIsNetworkConnected(
  setIsNetworkConnected,
  fetchClasses
) {
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkConnected(true);
      fetchClasses();
    };

    const handleOffline = () => {
      setIsNetworkConnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return;
}
