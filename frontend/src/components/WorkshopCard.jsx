import Icon from "./Icon";
import SvgThumb from "./SvgThumb";
import { formatToman } from "../utils/toFa";

// w: رکورد واقعی کارگاه از بکند (models/workshop.js) به همراه include دسته‌بندی
export default function WorkshopCard({ w, onOpen }) {
  const free = !w.price || Number(w.price) === 0;
  return (
    <div className="vcard" onClick={() => onOpen?.(w)}>
      <div className="thumb">
        {w.video_thumbnail ? (
          <img src={w.video_thumbnail} alt={w.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <SvgThumb tint="violet" seed={"w" + w.id} />
        )}
        <div className="play"><Icon name="play" /></div>
      </div>
      <div className="vbody">
        <div className="vbadge-row">
          <span className="vbadge-outline">{w.category?.name || "کارگاه تخصصی"}</span>
          <span className={`vbadge-fill ${free ? "free" : "paid"}`}>{free ? "رایگان" : "ویژه"}</span>
        </div>
        <h3 className="vtitle">{w.title}</h3>
        <div className="vdesc">مدرس: {w.instructor_name}</div>
        <div className="vstats-row">
          <span className="vstat-chip"><Icon name="clock2" /> {w.duration_minutes} دقیقه</span>
        </div>
        <div className="vcta-bar">
          <span className="watch">ثبت‌نام <Icon name="chev" /></span>
          <span className={`price-tag ${free ? "free" : "paid"}`}>{formatToman(w.price)}</span>
        </div>
      </div>
    </div>
  );
}
