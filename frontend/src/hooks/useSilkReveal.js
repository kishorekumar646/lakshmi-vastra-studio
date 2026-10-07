import { useEffect, useRef } from "react";

export function useSilkReveal(staggerChildren = false) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = staggerChildren ? Array.from(el.children) : [el];

    if (prefersReduced) return;

    targets.forEach((t) => {
      t.style.opacity = "0";
      t.style.transform = "translateY(36px)";
      t.style.filter = "blur(5px)";
      t.style.transition = "opacity 0.85s ease, transform 0.85s ease, filter 0.85s ease";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          targets.forEach((t, i) => {
            setTimeout(() => {
              t.style.opacity = "1";
              t.style.transform = "translateY(0)";
              t.style.filter = "blur(0px)";
            }, staggerChildren ? i * 110 : 0);
          });
          observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [staggerChildren]);

  return ref;
}
