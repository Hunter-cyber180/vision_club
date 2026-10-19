const { DataTypes, Model } = require("sequelize");

// نتیجه‌ی نهایی هر دانش‌آموز در هر آزمون (خلاصه‌ی UserAnswer ها)
class UserQuiz extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            quiz_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            score_percentage: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'UserQuiz',
            tableName: 'user_quizzes',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            indexes: [{ unique: true, fields: ['user_id', 'quiz_id'] }]
        }
        );
    };
};

module.exports = UserQuiz;
