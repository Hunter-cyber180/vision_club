const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class UserCourses extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            last_lesson_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            status: { type: DataTypes.ENUM("in-progress", "completed"), defaultValue: "in-progress", allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'UserCourses',
            tableName: 'user_courses',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
}

module.exports = UserCourses;
