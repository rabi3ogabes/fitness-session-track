import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { logActivity } from "@/lib/activityTracker";

/**
 * Captures every meaningful click in the app (buttons, links, tabs, menu items,
 * dialog triggers) and logs it as a `ui_click` activity event so admins can
 * audit exactly what each user did inside the dashboard.
 *
 * Lightweight: single delegated listener, dedupes rapid duplicate clicks,
 * ignores typing/scrolling and noisy elements.
 */
const GlobalClickTracker = () => {
  const location = useLocation();
  const lastRef = useRef<{ key: string; ts: number }>({ key: "", ts: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Find the closest interactive element
        const el = target.closest(
          'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [data-track]'
        ) as HTMLElement | null;
        if (!el) return;

        // Skip disabled and purely decorative
        if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;

        // Build a human-readable label
        const explicit =
          el.getAttribute("data-track") ||
          el.getAttribute("aria-label") ||
          el.getAttribute("title");
        const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
        const label = (explicit || text || el.tagName.toLowerCase()).slice(0, 120);

        // Classify the action
        const role = el.getAttribute("role");
        let kind: "button_click" | "link_click" | "tab_change" | "menu_select" = "button_click";
        if (role === "tab") kind = "tab_change";
        else if (role === "menuitem" || role === "option") kind = "menu_select";
        else if (el.tagName === "A") kind = "link_click";

        // Dedupe: same label within 600ms = ignore (covers double-fires)
        const key = `${kind}:${label}:${location.pathname}`;
        const now = Date.now();
        if (lastRef.current.key === key && now - lastRef.current.ts < 600) return;
        lastRef.current = { key, ts: now };

        // Skip empty / noisy labels
        if (!label || label.length < 1) return;

        logActivity("ui_click" as any, {
          path: location.pathname,
          details: {
            kind,
            label,
            href: el.getAttribute("href") || undefined,
            tag: el.tagName.toLowerCase(),
          },
        });
      } catch {
        // never let tracking break clicks
      }
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [location.pathname]);

  return null;
};

export default GlobalClickTracker;
