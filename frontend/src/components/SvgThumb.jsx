// پورت svgThumb() از نسخه‌ی اورجینال — یک بک‌گراند گرادیانی تولیدی وقتی
// عکس واقعی(thumbnail_url) برای دوره/کارگاه موجود نیست.
const TINTS = ["teal", "blue", "coral", "violet", "gold"];

export function tintFor(key) {
  if (key === "experimental" || key === "تجربی") return "teal";
  if (key === "math" || key === "ریاضی") return "blue";
  if (key === "humanities" || key === "انسانی") return "coral";
  return "violet";
}

export default function SvgThumb({ tint = "gold", seed = "s" }) {
  const gid = "tg" + seed;
  const cx1 = 60 + ((seed.length * 13) % 160);
  const cy1 = 50 + ((seed.length * 29) % 120);
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`var(--${tint})`} stopOpacity=".5" />
          <stop offset="1" stopColor="var(--bg3)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill={`url(#${gid})`} />
      <circle cx={cx1} cy={cy1} r="140" fill={`var(--${tint})`} opacity=".22" />
      <circle cx="560" cy="330" r="170" fill="var(--gold)" opacity=".14" />
      <circle cx="480" cy="70" r="60" fill="#ffffff" opacity=".08" />
    </svg>
  );
}
