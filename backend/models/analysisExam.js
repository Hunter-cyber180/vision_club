const { DataTypes, Model } = require("sequelize");

// فرم «تحلیل آزمون» که دانش‌آموز بعد از هر آزمون ماهانه پر می‌کند
class AnalysisExam extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            consultant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
            exam_schedule_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // اگه مربوط به آزمون سراسری ماهانه‌ی تعیین‌شده توسط ادمین باشه
            name: { type: DataTypes.STRING(50), allowNull: false },
            organizer: { type: DataTypes.STRING(50), allowNull: false },
            test_date: { type: DataTypes.DATEONLY, allowNull: false },
            rank: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
            standard_score: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
            weak_points: { type: DataTypes.STRING(200), allowNull: true },
            notes: { type: DataTypes.TEXT, allowNull: true },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'AnalysisExam',
            tableName: 'analysis_exams',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
};

module.exports = AnalysisExam;
