const { DataTypes, Model } = require("sequelize");

// دانش‌آموزهایی که روز بعد از آزمون ماهانه، فرم تحلیل آزمون را نفرستاده‌اند
class MissedAnalysisExam extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            exam_schedule_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            is_resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            resolved_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: "MissedAnalysisExam",
            tableName: "missed_analysis_exams",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [{ unique: true, fields: ["user_id", "exam_schedule_id"] }]
        });
    }
}

module.exports = MissedAnalysisExam;
