const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class DailyReport extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            report_date: { type: DataTypes.DATE, allowNull: false },
            sleep_time: { type: DataTypes.TIME, allowNull: false },
            wake_time: { type: DataTypes.TIME, allowNull: false },
            screen_time: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "" },
            weak_points: { type: DataTypes.TEXT, allowNull: true },
            need_help: { type: DataTypes.TEXT, allowNull: true },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: 'DailyReport',
            tableName: 'daily_reports',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    };
};

module.exports = DailyReport;
