const { DataTypes, Model } = require("sequelize");

// بازخورد مشاور/ادمین روی یک «گزارش کار روزانه» یا «تحلیل آزمون» دانش‌آموز.
// رابطه‌ی چندریختی (polymorphic) است: target_type مشخص می‌کنه target_id به کدوم جدول اشاره می‌کنه،
// برای همین foreign key واقعی ندارد.
class ReportFeedback extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
            target_type: { type: DataTypes.ENUM("daily_report", "analysis_exam"), allowNull: false },
            target_id: { type: DataTypes.BIGINT, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // دانش‌آموزی که گزارش/تحلیل مال اونه
            author_role: { type: DataTypes.ENUM("consultant", "admin"), allowNull: false },
            author_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            author_name: { type: DataTypes.STRING(150), allowNull: false },
            text: { type: DataTypes.TEXT, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        }, {
            sequelize,
            modelName: "ReportFeedback",
            tableName: "report_feedbacks",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
            indexes: [{ fields: ["target_type", "target_id"] }, { fields: ["user_id"] }],
        });
    }
}

module.exports = ReportFeedback;
