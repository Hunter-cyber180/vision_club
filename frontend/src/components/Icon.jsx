import { ICONS } from "../icons";

// آیکون‌ها همون SVGهای استاتیک نسخه‌ی اورجینال هستن (بدون دیتای کاربر)،
// پس dangerouslySetInnerHTML اینجا امن است.
export default function Icon({ name, className }) {
  const svg = ICONS[name];
  if (!svg) return null;
  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}
