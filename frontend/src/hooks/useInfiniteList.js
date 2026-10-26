import { useCallback, useEffect, useRef, useState } from "react";

// لیست اسکرولی: به‌جای صفحه‌بندی، آیتم‌ها به‌صورت تدریجی (با رسیدن به انتهای لیست) نمایش داده می‌شن.
// استفاده:
//   const { visible, hasMore, sentinelRef } = useInfiniteList(items, 20, [search, filter]);
//   ... visible.map(...) ...
//   {hasMore && <div ref={sentinelRef} className="scroll-sentinel">در حال بارگذاری...</div>}
export default function useInfiniteList(items, chunk = 20, resetDeps = []) {
  const [count, setCount] = useState(chunk);
  const observerRef = useRef(null);

  // با تغییر جستجو/فیلتر، از اول شروع کن
  useEffect(() => {
    setCount(chunk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const hasMore = count < items.length;

  const sentinelRef = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setCount((c) => c + chunk);
        },
        { rootMargin: "300px" }
      );
      observerRef.current.observe(node);
    },
    [chunk, count, items.length]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { visible: items.slice(0, count), hasMore, sentinelRef };
}
