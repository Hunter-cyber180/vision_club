import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Workshops from "./pages/Workshops";
import CourseDetail from "./pages/CourseDetail";
import WorkshopDetail from "./pages/WorkshopDetail";
import Auth from "./pages/Auth";
import ComingSoon from "./pages/ComingSoon";
import Dashboard from "./pages/panel/Dashboard";
import ConsultantDashboard from "./pages/panel/ConsultantDashboard";
import MyCourses from "./pages/panel/MyCourses";
import MyWorkshops from "./pages/panel/MyWorkshops";
import Settings from "./pages/panel/Settings";
import ConsultantSettings from "./pages/panel/ConsultantSettings";
import Reports from "./pages/panel/Reports";
import WeeklySchedule from "./pages/panel/WeeklySchedule";
import Students from "./pages/panel/Students";
import StudentDetail from "./pages/panel/StudentDetail";
import UserDetail from "./pages/panel/UserDetail";
import MyClasses from "./pages/panel/MyClasses";
import Wallet from "./pages/panel/Wallet";
import Cart from "./pages/panel/Cart";
import StudentOnlyNotice from "./pages/panel/StudentOnlyNotice";
import AdminDashboard from "./pages/panel/AdminDashboard";
import AdminFinance from "./pages/panel/AdminFinance";
import AdminWorkshops from "./pages/panel/AdminWorkshops";
import AdminStudents from "./pages/panel/AdminStudents";
import AdminConsultants from "./pages/panel/AdminConsultants";
import AdminConsultantDetail from "./pages/panel/AdminConsultantDetail";
import AdminClasses from "./pages/panel/AdminClasses";
import AdminSettings from "./pages/panel/AdminSettings";
import ChatList from "./pages/panel/ChatList";
import ChatThread from "./pages/panel/ChatThread";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
}

function RequireStudent({ children }) {
  const { panelRole } = useAuth();
  if (panelRole !== "student") return <StudentOnlyNotice />;
  return children;
}

// سبد خرید فقط برای اکانت‌های نوع «user» (چه دانش‌آموز چه کاربر عادی) معنی
// داره؛ مشاور/ادمین اصلاً چیزی برای خریدن ندارن.
function RequireBuyerAccount({ children }) {
  const { role } = useAuth();
  if (role !== "user") return <Navigate to="/panel/dashboard" replace />;
  return children;
}

function RequireConsultant({ children }) {
  const { panelRole } = useAuth();
  if (panelRole !== "consultant") return <Navigate to="/panel/dashboard" replace />;
  return children;
}

// چند مسیر (لیست/جزئیات دانش‌آموز، کلاس‌ها و جزوات) هم برای مشاور و هم ادمین
// مشترکه — فقط محتوای صفحه (که خودِ کامپوننت‌های Router زیر تصمیم می‌گیرن)
// بسته به نقش فرق می‌کنه.
function RequireConsultantOrAdmin({ children }) {
  const { panelRole } = useAuth();
  if (panelRole !== "consultant" && panelRole !== "admin") return <Navigate to="/panel/dashboard" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { panelRole } = useAuth();
  if (panelRole !== "admin") return <Navigate to="/panel/dashboard" replace />;
  return children;
}

// داشبورد و تنظیمات بسته به نقش، کامپوننت متفاوتی نشون می‌دن
function DashboardRouter() {
  const { panelRole } = useAuth();
  if (panelRole === "consultant") return <ConsultantDashboard />;
  if (panelRole === "admin") return <AdminDashboard />;
  return <Dashboard />;
}

function SettingsRouter() {
  const { panelRole } = useAuth();
  if (panelRole === "consultant") return <ConsultantSettings />;
  if (panelRole === "admin") return <AdminSettings />;
  return <Settings />;
}

// لیست «دانش‌آموزان» برای مشاور فقط دانش‌آموزهای خودشه؛ برای ادمین همه‌ی
// کاربران سایت + امکان تخصیص/حذف از لیست مشاور.
function StudentsRouter() {
  const { panelRole } = useAuth();
  return panelRole === "admin" ? <AdminStudents /> : <Students />;
}

// «کلاس‌ها و جزوات» برای مشاور فقط کلاس‌های خودشه؛ برای ادمین همه‌ی
// کلاس‌های همه‌ی مشاوران + تایید/رد.
function ClassesRouter() {
  const { panelRole } = useAuth();
  return panelRole === "admin" ? <AdminClasses /> : <MyClasses />;
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/workshops" element={<Workshops />} />
        <Route path="/workshops/:id" element={<WorkshopDetail />} />
        <Route path="/exams" element={<ComingSoon title="آزمون‌های عمومی" icon="exam" />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/panel/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        <Route path="/panel/settings" element={<ProtectedRoute><SettingsRouter /></ProtectedRoute>} />

        {/* پنل کاربر/دانش‌آموز */}
        <Route path="/panel/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
        <Route path="/panel/my-workshops" element={<ProtectedRoute><MyWorkshops /></ProtectedRoute>} />
        <Route path="/panel/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/panel/cart" element={<ProtectedRoute><RequireBuyerAccount><Cart /></RequireBuyerAccount></ProtectedRoute>} />
        <Route path="/panel/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
        <Route path="/panel/chat/:id" element={<ProtectedRoute><ChatThread /></ProtectedRoute>} />
        <Route path="/panel/my-exams" element={<ProtectedRoute><ComingSoon title="آزمون‌های من" icon="exam" /></ProtectedRoute>} />
        <Route path="/panel/reports" element={<ProtectedRoute><RequireStudent><Reports /></RequireStudent></ProtectedRoute>} />
        <Route path="/panel/weekly-schedule" element={<ProtectedRoute><RequireStudent><WeeklySchedule /></RequireStudent></ProtectedRoute>} />

        {/* پنل مشاور (و برای دانش‌آموزان/کلاس‌ها، ادمین هم مشترکه) */}
        <Route path="/panel/students" element={<ProtectedRoute><RequireConsultantOrAdmin><StudentsRouter /></RequireConsultantOrAdmin></ProtectedRoute>} />
        <Route path="/panel/students/:id" element={<ProtectedRoute><RequireConsultantOrAdmin><StudentDetail /></RequireConsultantOrAdmin></ProtectedRoute>} />
        <Route path="/panel/users/:id" element={<ProtectedRoute><RequireAdmin><UserDetail /></RequireAdmin></ProtectedRoute>} />
        <Route path="/panel/my-classes" element={<ProtectedRoute><RequireConsultantOrAdmin><ClassesRouter /></RequireConsultantOrAdmin></ProtectedRoute>} />

        {/* پنل ادمین */}
        <Route path="/panel/finance" element={<ProtectedRoute><RequireAdmin><AdminFinance /></RequireAdmin></ProtectedRoute>} />
        <Route path="/panel/workshops" element={<ProtectedRoute><RequireConsultantOrAdmin><AdminWorkshops /></RequireConsultantOrAdmin></ProtectedRoute>} />
        <Route path="/panel/consultants" element={<ProtectedRoute><RequireAdmin><AdminConsultants /></RequireAdmin></ProtectedRoute>} />
        <Route path="/panel/consultants/:id" element={<ProtectedRoute><RequireAdmin><AdminConsultantDetail /></RequireAdmin></ProtectedRoute>} />

        <Route path="/panel/*" element={<ProtectedRoute><Navigate to="/panel/dashboard" replace /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
