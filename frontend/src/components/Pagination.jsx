import { toFa } from "../utils/toFa";

// props: page, totalPages, totalItems, itemWord, onChange(nextPage)
export default function Pagination({ page, totalPages, totalItems, itemWord, onChange }) {
  if (totalPages <= 1) return null;

  const nums = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) nums.push(p);
  }

  const go = (p) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    onChange(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  let prev = 0;
  const items = [];
  nums.forEach((p) => {
    if (prev && p - prev > 1) items.push(<span key={`dots-${p}`} className="page-dots">…</span>);
    items.push(
      <button
        key={p}
        className={`page-btn ${p === page ? "active" : ""}`}
        onClick={() => go(p)}
      >
        {toFa(p)}
      </button>
    );
    prev = p;
  });

  return (
    <>
      <div className="pagination">
        <button className="page-btn" disabled={page === 1} onClick={() => go(page - 1)}>›</button>
        {items}
        <button className="page-btn" disabled={page === totalPages} onClick={() => go(page + 1)}>‹</button>
      </div>
      <div className="page-info">
        صفحه {toFa(page)} از {toFa(totalPages)} — {toFa(totalItems)} {itemWord}
      </div>
    </>
  );
}
