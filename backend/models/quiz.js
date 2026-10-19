const { DataTypes, Model } = require("sequelize");

class Quiz extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            title: { type: DataTypes.STRING(100), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            status: {
                type: DataTypes.ENUM("not-held", "held", "ongoing"),
                defaultValue: "not-held",
                allowNull: false
            },
            scheduled_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            answersheet_link: { type: DataTypes.STRING(500), allowNull: true },
            time_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            major: { type: DataTypes.STRING(20), allowNull: true },
            grade: { type: DataTypes.STRING(20), allowNull: true },
            question_count: { type: DataTypes.INTEGER, allowNull: true },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'Quiz',
            tableName: 'quizzes',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
};

module.exports = Quiz;
