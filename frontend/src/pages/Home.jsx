import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function Home() {
  return (
    <>
      <section className="wrap hero-grid fade-in" style={{ padding: "26px 16px 8px" }}>
        <div className="hero-text">
          <div className="eyebrow"><span className="dot" /> مشاوره تخصصی کنکور سراسری</div>
          <h1 style={{ fontSize: "clamp(20px,6vw,30px)", fontWeight: 800, lineHeight: 1.5, marginBottom: 14 }}>
            از امروز تا کنکور،<br />یک{" "}
            <span style={{ background: "linear-gradient(90deg,var(--gold-bright),var(--gold))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              نقشه‌ی روشن
            </span>{" "}
            برای رتبه‌ات بساز.
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 14.5, lineHeight: 1.9, marginBottom: 20 }}>
            ویژن کلاب ویدیوهای آموزشی، کارگاه‌های تخصصی و ارتباط مستقیم با مشاور رو کنار هم می‌ذاره تا هر روز دقیق بدونی باید چیکار کنی.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" to="/auth">شروع مسیر رایگان</Link>
            <Link className="btn btn-ghost" to="/courses">آشنایی با امکانات</Link>
          </div>
          <div className="hero-proof">
            <div className="avatars"><span>م.ر</span><span>س.ک</span><span>ن.ح</span><span>+</span></div>
            <small><strong>+۱۲۰۰</strong> دانش‌آموز همین حالا در حال پیشرفت هستن</small>
          </div>
        </div>
      </section>

      <div className="glass stat-row four fade-in">
        <div className="stat"><b>۱٬۲۰۰+</b><span>دانش‌آموز فعال</span></div>
        <div className="stat"><b>۳۲۰+</b><span>ویدیوی آموزشی</span></div>
        <div className="stat"><b>۴۵</b><span>کارگاه تخصصی</span></div>
        <div className="stat"><b>۹۶٪</b><span>رضایت خانواده‌ها</span></div>
      </div>

      <section className="section-pad wrap">
        <div className="sec-head fade-in">
          <span className="sec-eyebrow">امکانات آکادمی</span>
          <h2>هر چی برای قبولی لازم داری، یک‌جا</h2>
          <p>سه بخش اصلی که کنار هم یک مسیر کامل می‌سازن؛ نه یه سری فایل پراکنده.</p>
        </div>
        <div className="feature-grid fade-in">
          <div className="glass feature-card">
            <div className="feature-icon" style={{ background: "color-mix(in srgb, var(--gold) 16%, transparent)", color: "var(--gold-bright)" }}><Icon name="play" /></div>
            <h3>ویدیوهای آموزشی</h3>
            <p>دروس کنکور رو گام‌به‌گام و مرتب‌شده بر اساس سرفصل ببین، هر وقت که خودت وقت داری.</p>
            <Link className="feature-link" to="/courses">مشاهده ویدیوها <Icon name="chev" /></Link>
          </div>
          <div className="glass feature-card">
            <div className="feature-icon" style={{ background: "color-mix(in srgb, var(--teal) 16%, transparent)", color: "var(--teal)" }}><Icon name="workshop" /></div>
            <h3>کارگاه‌های تخصصی</h3>
            <p>کارگاه‌های زنده و آفلاین برنامه‌ریزی، تست‌زنی و مدیریت استرس؛ همراه با تمرین عملی و بازخورد مشاور.</p>
            <Link className="feature-link" to="/workshops">رزرو کارگاه <Icon name="chev" /></Link>
          </div>
          <div className="glass feature-card">
            <div className="feature-icon" style={{ background: "color-mix(in srgb, var(--blue) 16%, transparent)", color: "var(--blue)" }}><Icon name="chat" /></div>
            <h3>ارتباط مستقیم با مشاور</h3>
            <p>سوال‌هات رو همون لحظه از مشاورت بپرس و گزارش پیشرفت هفتگی‌ت رو با هم مرور کنید.</p>
            <Link className="feature-link" to="/auth">شروع گفتگو <Icon name="chev" /></Link>
          </div>
        </div>
      </section>

      <section className="section-pad wrap">
        <div className="sec-head fade-in">
          <span className="sec-eyebrow">مسیر شروع</span>
          <h2>در چهار قدم وارد مسیر می‌شی</h2>
          <p>یه ترتیب ساده و مشخص، بدون سردرگمی از کجا شروع کنم.</p>
        </div>
        <div className="road-list fade-in">
          <div className="road-step"><div className="road-num">۱</div><h4>ثبت‌نام</h4><p>پروفایل درسیت رو می‌سازی و هدفت رو مشخص می‌کنی.</p></div>
          <div className="road-step"><div className="road-num">۲</div><h4>تعیین سطح</h4><p>با یه آزمون کوتاه، نقطه‌ی شروع واقعیت مشخص می‌شه.</p></div>
          <div className="road-step"><div className="road-num">۳</div><h4>برنامه‌ریزی</h4><p>مشاور برنامه‌ی هفتگی ویدیو و تست رو برات می‌چینه.</p></div>
          <div className="road-step"><div className="road-num">۴</div><h4>پیگیری هفتگی</h4><p>پیشرفتت رو با گزارش‌های روزانه و کارگاه‌ها دنبال می‌کنی.</p></div>
        </div>
      </section>

      <section className="wrap">
        <div className="glass testi fade-in">
          <div className="stars"><Icon name="star" /><Icon name="star" /><Icon name="star" /><Icon name="star" /><Icon name="star" /></div>
          <blockquote>«با ویژن کلاب می‌دونستم دقیقاً امروز باید چیکار کنم. برنامه‌ریزی و کارگاه‌ها باعث شد استرسم خیلی کم بشه.»</blockquote>
          <div className="who"><div className="avatar">م.م</div><div><b>محمدرضا محمودیان</b><span>رتبه ۶۴۰ منطقه یک</span></div></div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 8 }}>
        <div className="glass cta-inner fade-in">
          <h3>همین امروز مسیرت رو شروع کن</h3>
          <p>ثبت‌نام رایگانه؛ اولین جلسه تعیین سطح رو همین هفته برات هماهنگ می‌کنیم.</p>
          <div className="cta-actions">
            <Link className="btn btn-gold" to="/auth">ثبت‌نام رایگان</Link>
            <Link className="btn btn-ghost" to="/auth">صحبت با مشاور</Link>
          </div>
        </div>
      </section>

      <footer className="site-footer wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="logo"><div className="logo-mark">VC</div> ویژن کلاب</div>
            <p>مشاوره کنکور با ویدیوهای آموزشی، کارگاه‌های تخصصی و ارتباط مستقیم با مشاور، برای یه مسیر روشن تا قبولی.</p>
          </div>
          <div className="foot-col"><h5>آکادمی</h5><ul>
            <li><Link to="/">امکانات</Link></li>
            <li><Link to="/courses">مسیر یادگیری</Link></li>
            <li><Link to="/">نظرات دانش‌آموزان</Link></li>
          </ul></div>
          <div className="foot-col"><h5>دانش‌آموزان</h5><ul>
            <li><Link to="/courses">ویدیوهای آموزشی</Link></li>
            <li><Link to="/workshops">کارگاه‌ها</Link></li>
            <li><Link to="/exams">آزمون‌ها</Link></li>
          </ul></div>
          <div className="foot-col"><h5>ارتباط با ما</h5><ul>
            <li><a href="javascript:void(0)">پشتیبانی تلگرام</a></li>
            <li><a href="javascript:void(0)">شماره تماس</a></li>
            <li><a href="javascript:void(0)">درباره آکادمی</a></li>
          </ul></div>
        </div>
        <div className="foot-bottom"><span>© ۱۴۰۴ ویژن کلاب. تمامی حقوق محفوظ است.</span><span>ساخته‌شده برای مسیر قبولی تو</span></div>
      </footer>
    </>
  );
}
