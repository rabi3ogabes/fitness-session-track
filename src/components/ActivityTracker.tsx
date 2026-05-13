import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { logActivity } from "@/lib/activityTracker";

/**
 * Tracks every route change as a page_view. Mount once inside <BrowserRouter>.
 */
const ActivityTracker = () => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;
    lastPath.current = path;
    logActivity("page_view", {
      path,
      details: { title: typeof document !== "undefined" ? document.title : undefined },
    });
  }, [location.pathname, location.search]);

  return null;
};

export default ActivityTracker;
