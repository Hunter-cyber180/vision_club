const { DataTypes, Model } = require("sequelize");

// ریز نمرات هر درس در فرم تحلیل آزمون
class AnalysisExamLesson extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
            analysis_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            subject: { type: DataTypes.STRING(50), allowNull: false },
            test_count: { type: DataTypes.SMALLINT, defaultValue: 0, allowNull: false },
            correct_count: { type: DataTypes.SMALLINT, defaultValue: 0, allowNull: false },
            wrong_minutes: { type: DataTypes.SMALLINT, defaultValue: 0, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: 'AnalysisExamLesson',
            tableName: 'analysis_exam_lessons',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    };
};

module.exports = AnalysisExamLesson;
