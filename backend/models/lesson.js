const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class Lesson extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            title: { type: DataTypes.STRING(100), allowNull: false },
            order_index: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1, allowNull: false },
            duration_seconds: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            video_url: { type: DataTypes.STRING(500), allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'Lesson',
            tableName: 'lessons',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
};

module.exports = Lesson;
