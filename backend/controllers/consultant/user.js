const moment = require("moment-jalaali");
const { attachFeedbacks } = require("../../utils/feedbacks");
const {
    User: UserModel,
    Consultant: ConsultantModel,
    DailyReport: DailyReportModel,
    DailyReportLesson,
    AnalysisExam: AnalysisExamModel,
    AnalysisExamLesson,
    TuitionPayment: TuitionPaymentModel,
    WeeklySchedule: WeeklyScheduleModel,
} = require("../../models");

function currentJalaliMonthYear() {
    const m = moment();
    return { jalali_year: m.jYear(), jalali_month: m.jMonth() + 1 };
}

// مطمئن می‌شه برای «ماه جاری» یک رکورد شهریه برای این دانش‌آموز وجود داره
// (پیش‌فرض: پرداخت‌نشده) — تا وقتی مشاور مبلغی رو تعیین می‌کنه یا صفحه‌ی
// جزئیات دانش‌آموز رو باز می‌کنه، بلافاصله وضعیت «پرداخت‌شده/پرداخت‌نشده»
// این ماه معلوم باشه، نه اینکه تا اولین پرداخت اصلاً هیچ رکوردی نباشه و
// جایی وضعیتش نوشته نشه.
async function ensureCurrentTuitionRow(consultantId, userId) {
    const period = currentJalaliMonthYear();
    const [row] = await TuitionPaymentModel.findOrCreate({
        where: {
            consultant_id: consultantId,
            user_id: userId,
            jalali_year: period.jalali_year,
            jalali_month: period.jalali_month,
        },
        defaults: { status: "unpaid" },
    });
    return row;
}

// برای یک لیست از user id، اینکه واقعاً توی ۲۴ ساعت اخیر گزارش کار فرستاده یا
// نه، و توی ۲۴ ساعت اخیر تحلیل آزمون فرستاده یا نه رو مستقیم از جدول‌های
// واقعی چک می‌کنیم — نه از روی «آیا توی لیست نفرستاده‌ها هست یا نه»، چون اون
// لیست‌ها فقط با یک روز (یا بیشتر) تاخیر توسط cron ساخته می‌شن.
//
// نکته‌ی مهم: قبلاً «تحلیل آزمون ارسالی» بر اساس تطابق با آخرین ExamSchedule
// محاسبه می‌شد (هر تحلیلی که بعد از تاریخ آخرین آزمون ثبت شده بود، برای
// همیشه «ارسالی» حساب می‌شد، حتی اگه از اون موقع چند روز/هفته گذشته باشه و
// ادمین هنوز آزمون جدیدی تعریف نکرده باشه) — این باعث می‌شد وضعیت هیچ‌وقت
// به‌روز نشه. حالا هم گزارش کار و هم تحلیل آزمون بر اساس یک پنجره‌ی متحرک
// ۲۴ ساعته (نسبت به همین لحظه، نه فقط «امروزِ» تقویمی) چک می‌شن، دقیقاً طبق
// درخواست: «بررسی هر ۲۴ ساعت یک‌بار رفرش بشه».
async function computeSubmissionStatus(userIds) {
    const { ExamSchedule } = require("../../models");
    const { Op } = require("sequelize");

    if (!userIds.length) {
        return { reportedTodayIds: new Set(), analyzedLatestExamIds: new Set(), latestExamSchedule: null };
    }

    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentReports, recentAnalyses, latestExamSchedule] = await Promise.all([
        DailyReportModel.findAll({
            where: { user_id: { [Op.in]: userIds }, created_at: { [Op.gte]: windowStart } },
            attributes: ["user_id"],
        }),
        AnalysisExamModel.findAll({
            where: { user_id: { [Op.in]: userIds }, created_at: { [Op.gte]: windowStart } },
            attributes: ["user_id"],
        }),
        ExamSchedule.findOne({ order: [["exam_date", "DESC"]] }),
    ]);

    const reportedTodayIds = new Set(recentReports.map((r) => r.user_id));
    const analyzedLatestExamIds = new Set(recentAnalyses.map((a) => a.user_id));

    return { reportedTodayIds, analyzedLatestExamIds, latestExamSchedule };
}
exports.computeSubmissionStatus = computeSubmissionStatus;

exports.getUsers = async (request, response) => {
    try {
        const consultant = request.user;

        const users = await UserModel.findAll({
            where: { consultant_id: consultant.id }
        });

        const userIds = users.map((u) => u.id);
        const { reportedTodayIds, analyzedLatestExamIds, latestExamSchedule } = await computeSubmissionStatus(userIds);

        const usersWithStatus = users.map((u) => {
            const plain = u.toJSON();
            plain.reported_today = reportedTodayIds.has(u.id);
            // اگه اصلاً هنوز آزمونی ثبت نشده، فعلاً معنی نداره که بگیم "نفرستاده"
            plain.analyzed_latest_exam = latestExamSchedule ? analyzedLatestExamIds.has(u.id) : null;
            return plain;
        });

        return response.status(200).json({
            success: true,
            data: usersWithStatus
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error get consultant`s users!",
            error: error.message
        });
    }
};

/* جستجوی کاربران عادی (role="user") که هنوز به هیچ مشاوری وصل نشدن — برای
   دکمه‌ی «افزودن دانش‌آموز جدید». حداقل ۲ کاراکتر عبارت جستجو لازمه (روی
   نام، نام‌خانوادگی، ایمیل و شماره دانش‌آموزی/تلفن) تا کل جدول کاربران رو
   با یک درخواست خالی لو نده؛ حداکثر ۱۵ نتیجه برمی‌گرده. */
exports.searchCandidateUsers = async (request, response) => {
    try {
        const search = (request.query.search || "").trim();
        if (search.length < 2) {
            return response.status(200).json({ success: true, data: [] });
        }

        const { Op } = require("sequelize");
        const users = await UserModel.findAll({
            where: {
                role: "user",
                consultant_id: null,
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { lastname: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                    { student_number: { [Op.like]: `%${search}%` } },
                    { father_number: { [Op.like]: `%${search}%` } },
                ],
            },
            limit: 15,
            order: [["created_at", "DESC"]],
        });

        return response.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error searching candidate users!",
            error: error.message,
        });
    }
};

exports.addToUsers = async (request, response) => {
    try {
        const { userId } = request.params;
        const consultant = request.user;

        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });
        
        if (user.consultant_id !== null && user.consultant_id !== undefined)
            return response.status(400).json({
                success: false,
                message: "این کاربر همین الان یک مشاور دارد."
            });

        await user.update({
            consultant_id: consultant.id,
            role: "student"
        });

        return response.status(200).json({
            success: true,
            message: "User added to consultant list.",
            data: user
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error add to users!",
            error: error.message
        });  
    }
};

exports.deleteFromUsers = async (request, response) => {
    try {
        const { userId } = request.params;
        const consultant = request.user;

        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });

        await user.update({
            consultant_id: null,
            role: "user"
        });

        return response.status(200).json({
            success: true,
            message: "User deleted from consultant list.",
            data: user
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error delete from users!",
            error: error.message
        });
    }
};

exports.getUserDailyReports = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });

        const dailyReorts = await DailyReportModel.findAll({
            where: { user_id: userId },
            include: [{ model: DailyReportLesson, as: "lessons" }],
            order: [["report_date", "DESC"]],
        });

        return response.status(200).json({
            success: true,
            data: await attachFeedbacks(dailyReorts, "daily_report")
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error get user daily reports!",
            error: error.message
        });
    };
};

exports.getUserAnalysisExams = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });
        
        const analysisExams = await AnalysisExamModel.findAll({
            where: { user_id: userId },
            include: [{ model: AnalysisExamLesson, as: "lessons" }],
            order: [["test_date", "DESC"]],
        });

        return response.status(200).json({
            success: true,
            data: await attachFeedbacks(analysisExams, "analysis_exam")
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error get user analysis exams!",
            error: error.message
        }); 
    };
};

// مشاور مبلغ شهریه‌ی ماهانه‌ی این دانش‌آموز رو تعیین/ویرایش می‌کنه تا دانش‌آموز
// بتونه بعداً همین مبلغ رو از کیف پول خودش پرداخت کنه.
exports.setTuitionAmount = async (request, response) => {
    try {
        const { userId } = request.params;
        const { tuition_amount } = request.body;
        const consultant = request.user;

        if (tuition_amount === undefined || tuition_amount === null || isNaN(tuition_amount) || Number(tuition_amount) < 0)
            return response.status(400).json({
                success: false,
                message: "مبلغ شهریه نامعتبر است"
            });

        const user = await UserModel.findByPk(userId);
        if (!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });

        if (request.role === "consultant" && user.consultant_id !== consultant.id)
            return response.status(403).json({
                success: false,
                message: "این دانش‌آموز متعلق به شما نیست."
            });

        await user.update({ tuition_amount: Math.round(Number(tuition_amount)) });

        // به محض تعیین/ویرایش مبلغ، اگه برای ماه جاری هنوز رکوردی نیست، یکی
        // با وضعیت «پرداخت‌نشده» ساخته می‌شه تا بلافاصله در پنل قابل مشاهده باشه.
        const consultantId = request.role === "consultant" ? consultant.id : user.consultant_id;
        if (consultantId) await ensureCurrentTuitionRow(consultantId, user.id);

        return response.status(200).json({
            success: true,
            message: "مبلغ شهریه به‌روزرسانی شد.",
            data: user
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error set tuition amount!",
            error: error.message
        });
    }
};

exports.getUserInformations = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });

        // همون محاسبه‌ی زنده‌ی وضعیت گزارش/تحلیل که توی لیست دانش‌آموزها
        // استفاده می‌شه، اینجا هم اعمال می‌شه تا صفحه‌ی جزئیات دیگه یک
        // مقدار قدیمی/همیشه‌ثابت نشون نده (باگ قبلی: این فیلدها اصلاً
        // توی پاسخ این endpoint نبودن).
        const { reportedTodayIds, analyzedLatestExamIds, latestExamSchedule } = await computeSubmissionStatus([user.id]);
        const plain = user.toJSON();
        plain.reported_today = reportedTodayIds.has(user.id);
        plain.analyzed_latest_exam = latestExamSchedule ? analyzedLatestExamIds.has(user.id) : null;

        // وضعیت شهریه‌ی «ماه جاری» رو هم همیشه همراه اطلاعات دانش‌آموز می‌فرستیم
        // (و اگه رکوردی نبود، می‌سازیمش) تا مشاور دقیقاً ببینه این ماه پرداخت
        // شده یا نه، نه فقط مبلغ تعیین‌شده.
        if (user.consultant_id) {
            const currentRow = await ensureCurrentTuitionRow(user.consultant_id, user.id);
            plain.current_tuition_status = currentRow.status;
            plain.current_tuition_payment = currentRow;
        } else {
            plain.current_tuition_status = null;
            plain.current_tuition_payment = null;
        }

        return response.status(200).json({
            success: true,
            data: plain
        });

    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error get user informations!",
            error: error.message
        }); 
    };
};

// آمار هفته‌ی اخیر یک دانش‌آموز برای سه نمودار پنل مشاور/ادمین (روند تراز،
// حجم تست/تشریحی، حجم مطالعه‌ی روزانه).
exports.getUserWeeklyStats = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await UserModel.findByPk(userId);
        if (!user)
            return response.status(404).json({ success: false, message: "User not found!" });

        const { computeWeeklyStats } = require("../../utils/weeklyStats");
        const stats = await computeWeeklyStats(userId);

        return response.status(200).json({ success: true, data: stats });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Error get user weekly stats!",
            error: error.message,
        });
    }
};

exports.getUserTuitionPayments = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });
        
        const tuitionPayments = await TuitionPaymentModel.findAll({
            where: { user_id: userId },
            order: [["jalali_year", "DESC"], ["jalali_month", "DESC"]],
        });

        return response.status(200).json({
            success: true,
            data: tuitionPayments
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error get user tuition payments!",
            error: error.message
        }); 
    };
};

// وقتی مشاور روی «چت با دانش‌آموز» در لیست دانش‌آموزانش کلیک می‌کند:
// یک گفتگوی جدید بین مشاور و آن دانش‌آموز ساخته می‌شود (یا اگر قبلاً ساخته شده، همان برگردانده می‌شود)
// و به لیست چت‌های مشاور اضافه می‌شود.
exports.startChatWithUser = async (request, response) => {
    try {
        const { userId } = request.params;
        const consultant = request.user;

        const user = await UserModel.findByPk(userId);
        if (!user)
            return response.status(404).json({
                success: false,
                message: "دانش‌آموز یافت نشد!"
            });

        // مشاور فقط با دانش‌آموزهای خودش می‌تونه گفتگو بسازه، نه با بقیه
        if (user.consultant_id !== consultant.id)
            return response.status(403).json({
                success: false,
                message: "شما فقط می‌توانید با دانش‌آموزان خودتان گفتگو کنید."
            });

        const { Conversation } = require("../../models");
        const { Op } = require("sequelize");

        let conversation = await Conversation.findOne({
            where: {
                [Op.or]: [
                    { participant_one_type: "consultant", participant_one_id: consultant.id, participant_two_type: "user", participant_two_id: user.id },
                    { participant_one_type: "user", participant_one_id: user.id, participant_two_type: "consultant", participant_two_id: consultant.id },
                ]
            }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participant_one_type: "consultant",
                participant_one_id: consultant.id,
                participant_two_type: "user",
                participant_two_id: user.id,
                is_support: false,
            });
        }

        return response.status(200).json({
            success: true,
            message: "گفتگو با دانش‌آموز آماده شد.",
            data: conversation
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ایجاد گفتگو با دانش‌آموز!",
            error: error.message
        });
    }
};

exports.getUserWeeklySchedules = async (request, response) => {
    try {
        const { userId } = request.params;
        const user = await UserModel.findByPk(userId);
        if(!user)
            return response.status(404).json({
                success: false,
                message: "User not found!"
            });
        
        const weeklySchedules = await WeeklyScheduleModel.findAll({
            where: { user_id: userId }
        });
        
        return response.status(200).json({
            success: true,
            data: weeklySchedules
        });
    } catch(error) {
        return response.status(500).json({
            success: false,
            message: "Error get user weekly schedules!",
            error: error.message
        }); 
    };
};
