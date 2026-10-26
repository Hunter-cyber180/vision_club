const { sequelize } = require("../db");
const { Op } = require("sequelize");

// ---- import all model classes ----
const User = require("./user");
const Consultant = require("./consultant");
const Admin = require("./admin");

const Category = require("./category");
const Workshop = require("./workshop");
const Course = require("./course");
const Lesson = require("./lesson");
const CourseNote = require("./courseNote");

const Quiz = require("./quiz");
const Question = require("./question");
const Option = require("./option");
const UserAnswer = require("./userAnswer");
const UserQuiz = require("./userQuiz");

const Booklet = require("./booklet");
const BookletImage = require("./bookletImage");

const DailyReport = require("./dailyReport");
const DailyReportLesson = require("./dailyReportLesson");
const MissedDailyReport = require("./missedDailyReport");

const AnalysisExam = require("./analysisExam");
const AnalysisExamLesson = require("./analysisExamLesson");
const ExamSchedule = require("./examSchedule");
const MissedAnalysisExam = require("./missedAnalysisExam");

const ReportFeedback = require("./reportFeedback");

const TuitionPayment = require("./tuitionPayment");
const WeeklySchedule = require("./weeklySchedule");

const Charge = require("./charge");
const Checkout = require("./checkout");

const UserCourses = require("./userCourses");
const UserWorkshops = require("./userWorkshops");
const CartItem = require("./cartItem");

const Conversation = require("./conversation");
const Message = require("./message");

// ---- init all models ----
const models = {
    User, Consultant, Admin,
    Category, Workshop, Course, Lesson, CourseNote,
    Quiz, Question, Option, UserAnswer, UserQuiz,
    Booklet, BookletImage,
    DailyReport, DailyReportLesson, MissedDailyReport,
    AnalysisExam, AnalysisExamLesson, ExamSchedule, MissedAnalysisExam,
    ReportFeedback,
    TuitionPayment, WeeklySchedule,
    Charge, Checkout,
    UserCourses, UserWorkshops, CartItem,
    Conversation, Message,
};

Object.values(models).forEach((model) => model.init(sequelize));

/* =========================================================
 *  ASSOCIATIONS
 * ========================================================= */

// --- Category <-> Workshop ---
Category.hasMany(Workshop, { foreignKey: "category_id", as: "workshops", onDelete: "RESTRICT", onUpdate: "CASCADE" });
Workshop.belongsTo(Category, { foreignKey: "category_id", as: "category", onDelete: "RESTRICT", onUpdate: "CASCADE" });

// --- Course <-> Lesson ---
Course.hasMany(Lesson, { foreignKey: "course_id", as: "lessons", onDelete: "CASCADE" });
Lesson.belongsTo(Course, { foreignKey: "course_id", as: "course" });

// --- Course <-> CourseNote ---
Course.hasMany(CourseNote, { foreignKey: "course_id", as: "notes", onDelete: "CASCADE" });
CourseNote.belongsTo(Course, { foreignKey: "course_id", as: "course" });

// --- Consultant <-> Course ---
Consultant.hasMany(Course, { foreignKey: "consultant_id", as: "courses" });
Course.belongsTo(Consultant, { foreignKey: "consultant_id", as: "consultant" });

// --- Consultant <-> Workshop ---
Consultant.hasMany(Workshop, { foreignKey: "consultant_id", as: "workshops" });
Workshop.belongsTo(Consultant, { foreignKey: "consultant_id", as: "consultant" });

// --- Quiz / Question / Option / UserAnswer / UserQuiz ---
Quiz.hasMany(Question, { foreignKey: "quiz_id", as: "questions", onDelete: "CASCADE" });
Question.belongsTo(Quiz, { foreignKey: "quiz_id", as: "quiz" });

Question.hasMany(Option, { foreignKey: "question_id", as: "options", onDelete: "CASCADE" });
Option.belongsTo(Question, { foreignKey: "question_id", as: "question" });

Question.hasMany(UserAnswer, { foreignKey: "question_id", as: "userAnswers", onDelete: "CASCADE" });
UserAnswer.belongsTo(Question, { foreignKey: "question_id", as: "question" });

Option.hasMany(UserAnswer, { foreignKey: "selected_option_id", as: "userAnswers" });
UserAnswer.belongsTo(Option, { foreignKey: "selected_option_id", as: "selectedOption" });

User.hasMany(UserAnswer, { foreignKey: "user_id", as: "answers", onDelete: "CASCADE" });
UserAnswer.belongsTo(User, { foreignKey: "user_id", as: "user" });

Quiz.hasMany(UserQuiz, { foreignKey: "quiz_id", as: "userQuizzes", onDelete: "CASCADE" });
UserQuiz.belongsTo(Quiz, { foreignKey: "quiz_id", as: "quiz" });
User.hasMany(UserQuiz, { foreignKey: "user_id", as: "userQuizzes", onDelete: "CASCADE" });
UserQuiz.belongsTo(User, { foreignKey: "user_id", as: "user" });

// --- Booklet <-> BookletImage ---
Booklet.hasMany(BookletImage, { foreignKey: "bookletId", as: "images", onDelete: "CASCADE" });
BookletImage.belongsTo(Booklet, { foreignKey: "bookletId", as: "booklet" });

// --- User <-> Consultant (دانش‌آموز <-> مشاور) ---
Consultant.hasMany(User, { foreignKey: "consultant_id", as: "students" });
User.belongsTo(Consultant, { foreignKey: "consultant_id", as: "consultant" });

// --- DailyReport ---
User.hasMany(DailyReport, { foreignKey: "user_id", as: "dailyReports", onDelete: "CASCADE" });
DailyReport.belongsTo(User, { foreignKey: "user_id", as: "user" });

DailyReport.hasMany(DailyReportLesson, { foreignKey: "report_id", as: "lessons", onDelete: "CASCADE" });
DailyReportLesson.belongsTo(DailyReport, { foreignKey: "report_id", as: "report" });

User.hasMany(MissedDailyReport, { foreignKey: "user_id", as: "missedDailyReports", onDelete: "CASCADE" });
MissedDailyReport.belongsTo(User, { foreignKey: "user_id", as: "user" });

// --- AnalysisExam ---
User.hasMany(AnalysisExam, { foreignKey: "user_id", as: "analysisExams", onDelete: "CASCADE" });
AnalysisExam.belongsTo(User, { foreignKey: "user_id", as: "user" });
Consultant.hasMany(AnalysisExam, { foreignKey: "consultant_id", as: "analysisExams" });
AnalysisExam.belongsTo(Consultant, { foreignKey: "consultant_id", as: "consultant" });

AnalysisExam.hasMany(AnalysisExamLesson, { foreignKey: "analysis_id", as: "lessons", onDelete: "CASCADE" });
AnalysisExamLesson.belongsTo(AnalysisExam, { foreignKey: "analysis_id", as: "analysisExam" });

Admin.hasMany(ExamSchedule, { foreignKey: "set_by_admin_id", as: "examSchedules" });
ExamSchedule.belongsTo(Admin, { foreignKey: "set_by_admin_id", as: "admin" });
ExamSchedule.hasMany(AnalysisExam, { foreignKey: "exam_schedule_id", as: "analysisExams" });
AnalysisExam.belongsTo(ExamSchedule, { foreignKey: "exam_schedule_id", as: "examSchedule" });

User.hasMany(MissedAnalysisExam, { foreignKey: "user_id", as: "missedAnalysisExams", onDelete: "CASCADE" });
MissedAnalysisExam.belongsTo(User, { foreignKey: "user_id", as: "user" });
ExamSchedule.hasMany(MissedAnalysisExam, { foreignKey: "exam_schedule_id", as: "missedRecords", onDelete: "CASCADE" });
MissedAnalysisExam.belongsTo(ExamSchedule, { foreignKey: "exam_schedule_id", as: "examSchedule" });

// --- TuitionPayment ---
User.hasMany(TuitionPayment, { foreignKey: "user_id", as: "tuitionPayments", onDelete: "CASCADE" });
TuitionPayment.belongsTo(User, { foreignKey: "user_id", as: "user" });
Consultant.hasMany(TuitionPayment, { foreignKey: "consultant_id", as: "tuitionPayments" });
TuitionPayment.belongsTo(Consultant, { foreignKey: "consultant_id", as: "consultant" });

// --- WeeklySchedule ---
User.hasMany(WeeklySchedule, { foreignKey: "user_id", as: "weeklySchedules", onDelete: "CASCADE" });
WeeklySchedule.belongsTo(User, { foreignKey: "user_id", as: "user" });
Consultant.hasMany(WeeklySchedule, { foreignKey: "consultant_id", as: "weeklySchedules" });
WeeklySchedule.belongsTo(Consultant, { foreignKey: "consultant_id", as: "consultant" });

// --- Charge / Checkout ---
User.hasMany(Charge, { foreignKey: "user_id", as: "charges" });
Charge.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Checkout, { foreignKey: "user_id", as: "checkouts" });
Checkout.belongsTo(User, { foreignKey: "user_id", as: "user" });

// --- UserCourses / UserWorkshops ---
User.hasMany(UserCourses, { foreignKey: "user_id", as: "userCourses", onDelete: "CASCADE" });
UserCourses.belongsTo(User, { foreignKey: "user_id", as: "user" });
Course.hasMany(UserCourses, { foreignKey: "course_id", as: "userCourses", onDelete: "CASCADE" });
UserCourses.belongsTo(Course, { foreignKey: "course_id", as: "course" });
Lesson.hasMany(UserCourses, { foreignKey: "last_lesson_id", as: "userCoursesAtLesson" });
UserCourses.belongsTo(Lesson, { foreignKey: "last_lesson_id", as: "lastLesson" });

User.hasMany(UserWorkshops, { foreignKey: "user_id", as: "userWorkshops", onDelete: "CASCADE" });
UserWorkshops.belongsTo(User, { foreignKey: "user_id", as: "user" });
Workshop.hasMany(UserWorkshops, { foreignKey: "workshop_id", as: "userWorkshops", onDelete: "CASCADE" });
UserWorkshops.belongsTo(Workshop, { foreignKey: "workshop_id", as: "workshop" });

// --- CartItem (سبد خرید) ---
// item_type/item_id چندریختیه (به Course یا Workshop اشاره می‌کنه)، پس اینجا
// association مستقیم به Course/Workshop نمی‌گیره؛ کنترلر سبد خرید خودش بر
// اساس item_type، از جدول درست واکشی می‌کنه.
User.hasMany(CartItem, { foreignKey: "user_id", as: "cartItems", onDelete: "CASCADE" });
CartItem.belongsTo(User, { foreignKey: "user_id", as: "user" });

// --- Conversation / Message ---
Conversation.hasMany(Message, { foreignKey: "conversation_id", as: "messages", onDelete: "CASCADE" });
Message.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" });

module.exports = {
    sequelize,
    Op,
    ...models,
};
