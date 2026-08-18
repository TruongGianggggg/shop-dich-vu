"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export function ScrollToPageTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    // Hash links intentionally point to a section on the destination page.
    if (window.location.hash) {
      return;
    }

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;

    // The global stylesheet enables smooth scrolling. Temporarily overriding
    // it prevents route changes from animating through the previous position.
    root.style.scrollBehavior = "auto";
    const routeTarget = document.querySelector<HTMLElement>(
      "[data-route-scroll-target]",
    );

    if (routeTarget) {
      routeTarget.scrollIntoView({ block: "start", behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      root.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    const frame = window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [pathname]);

  return null;
}
