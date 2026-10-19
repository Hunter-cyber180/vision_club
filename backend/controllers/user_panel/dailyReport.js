const { DailyReport, DailyReportLesson, MissedDailyReport } = require("../../models");
const { Op } = require("sequelize");

const VALID_ACTIVITY_TYPES = ["review_cycle", "practice_review", "new_topic", "not_done"];

exports.create = async (request, response) => {
    try {
      const user = request.user; // authenticateAccessToken("user")
      const {
        report_date,
        sleep_time,
        wake_time,
        screen_time,
        weak_points,
        need_help,
        lessons // آرایه‌ی اختیاری: [{ subject, test_count, essay_count, study_minutes, activity_type }]
      } = request.body;

      const report = await DailyReport.create({
        user_id: user.id,
        report_date,
        sleep_time,
        wake_time,
        screen_time: screen_time || "",
        weak_points,
        need_help
      });

      if (Array.isArray(lessons) && lessons.length > 0) {
        // ستون activity_type توی دیتابیس ENUM با NOT NULL هست؛ اگه فرانت به هر
        // دلیلی مقدار نامعتبر یا خالی بفرسته (مثلاً هیچ گزینه‌ای انتخاب نشده)،
        // به‌جای اینکه کل درخواست با خطای دیتابیس ۵۰۰ بشه، یک مقدار پیش‌فرض
        // معتبر ("not_done") جایگزینش می‌کنیم.
        await DailyReportLesson.bulkCreate(
          lessons
            .filter((l) => l && l.subject)
            .map((l) => ({
              report_id: report.id,
              subject: l.subject,
              test_count: Number(l.test_count) || 0,
              essay_count: Number(l.essay_count) || 0,
              study_minutes: Number(l.study_minutes) || 0,
              activity_type: VALID_ACTIVITY_TYPES.includes(l.activity_type) ? l.activity_type : "not_done",
            }))
        );
      }

      // اگر برای همین تاریخ رکورد "گزارش نفرستاده" ثبت شده بود، حل‌شده علامت بزن
      const reportDateOnly = new Date(report_date).toISOString().slice(0, 10);
      await MissedDailyReport.update(
        { is_resolved: true, resolved_at: new Date() },
        { where: { user_id: user.id, report_date: reportDateOnly, is_resolved: false } }
      );

      // دریافت گزارش به همراه دروس برای بازگشت
      const createdReport = await DailyReport.findByPk(report.id, {
        include: [{
          model: DailyReportLesson,
          as: "lessons"
        }]
      });

      return response.status(201).json({
        success: true,
        data: createdReport
      });
    } catch (error) {
      console.error("❌ [daily-report:create] خطا در ثبت گزارش کار:", error);
      return response.status(500).json({
        success: false,
        message: "خطا در ثبت گزارش کار، لطفاً دوباره تلاش کن.",
        error: error.message
      });
    }
}

// GET /user-panel/daily-reports/mine -> گزارش‌های کار خود دانش‌آموز
exports.getMine = async (request, response) => {
    try {
      const user = request.user;
      const { startDate, endDate } = request.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = { report_date: { [Op.between]: [startDate, endDate] } };
      } else if (startDate) {
        dateFilter = { report_date: { [Op.gte]: startDate } };
      } else if (endDate) {
        dateFilter = { report_date: { [Op.lte]: endDate } };
      }

      const reports = await DailyReport.findAll({
        where: { user_id: user.id, ...dateFilter },
        include: [{ model: DailyReportLesson, as: "lessons" }],
        order: [["report_date", "DESC"]]
      });

      return response.status(200).json({ success: true, data: reports });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "خطا در دریافت گزارش‌های کار",
        error: error.message
      });
    }
}

exports.getAllByUser = async (request, response) => {
    try {
    //   const userId = req.params.userId || req.user.id;
      const { user_id } = request.params
      const { startDate, endDate } = request.query;

      // ساخت شرط فیلتر تاریخ
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          report_date: {
            [Op.between]: [startDate, endDate]
          }
        };
      } else if (startDate) {
        dateFilter = {
          report_date: {
            [Op.gte]: startDate
          }
        };
      } else if (endDate) {
        dateFilter = {
          report_date: {
            [Op.lte]: endDate
          }
        };
      }

      const reports = await DailyReport.findAll({
        where: {
          user_id,
          ...dateFilter
        },
        include: [{
          model: DailyReportLesson,
          as: "lessons"
        }],
        order: [["report_date", "DESC"]] // مرتب‌سازی بر اساس تاریخ نزولی
      });

      return response.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error get user reports",
        error: error.message
      });
    }
}

exports.getOne = async (request, response) => {
    try {
      const { id } = request.params;
      const report = await DailyReport.findByPk(id, {
        include: [{
          model: DailyReportLesson,
          as: "lessons"
        }]
      });

      if (!report)
        return response.status(404).json({
          success: false,
          message: "Report not found!"
        });

      return response.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error getting report",
        error: error.message
      });
    }
}

exports.update = async (request, response) => {
    try {
      const { id } = request.params;
      const { 
        report_date,
        sleep_time,
        wake_time,
        screen_time,
        weak_points,
        need_help,
      } = request.body;

      // یافتن گزارش
      const report = await DailyReport.findByPk(id);
      if (!report)
        return response.status(404).json({
          success: false,
          message: "Report not found!"
        });

      // بررسی دسترسی فقط ادمین بتونه فرم رو اپدیت کنه
      // if (report.user_id !== req.user.id) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'شما به این گزارش دسترسی ندارید'
      //   });
      // }

      await report.update({
        report_date: report_date || report.report_date,
        sleep_time: sleep_time || report.sleep_time,
        wake_time: wake_time || report.wake_time,
        screen_time: screen_time || report.screen_time,
        weak_points: weak_points || report.weak_points,
        need_help: need_help || report.need_help
      });

      const updatedReport = await DailyReport.findByPk(id, {
        include: [{
          model: DailyReportLesson,
          as: "lessons"
        }]
      });

      return response.status(200).json({
        success: true,
        data: updatedReport
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error updating report",
        error: error.message
      });
    }
}

exports.delete = async (request, response) => {
    try {
      const { id } = request.params;
      const report = await DailyReport.findByPk(id);
      if (!report)
        return response.status(404).json({
          success: false,
          message: "report not found!"
        });

      // بررسی دسترسی فقط ادمین
      // if (report.user_id !== req.user.id) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'شما به این گزارش دسترسی ندارید'
      //   });
      // }

      await report.destroy();

      return response.status(200).json({
        success: true,
        message: "Report deleted successfully."
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error delete report",
        error: error.message
      });
    }
}
