const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class WeeklySchedule extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
            consultant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            date: { type: DataTypes.DATE, allowNull: false },
            title: { type: DataTypes.STRING(50), allowNull: false },
            file_url: { type: DataTypes.STRING(500), allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'WeeklySchedule',
            tableName: 'weekly_schedules',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
};

module.exports = WeeklySchedule;
