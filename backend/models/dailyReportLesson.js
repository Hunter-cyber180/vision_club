const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class DailyReportLessons extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
            report_id: { type: DataTypes.BIGINT, allowNull: false },
            subject: { type: DataTypes.STRING(50), allowNull: false },
            test_count: { type: DataTypes.SMALLINT, defaultValue: 0, allowNull: false },
            essay_count: { type: DataTypes.SMALLINT, defaultValue: 0, allowNull: false },
            study_minutes: { type: DataTypes.SMALLINT, defaultValue: 0, allowNull: false },
            activity_type: { type: DataTypes.ENUM("review_cycle","practice_review","new_topic","not_done"), allowNull: false, defaultValue: "not_done" },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: 'DailyReportLessons',
            tableName: 'daily_report_lessons',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    };
};

module.exports = DailyReportLessons;
