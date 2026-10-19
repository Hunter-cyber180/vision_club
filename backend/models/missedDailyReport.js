const { DataTypes, Model } = require("sequelize");

class MissedDailyReport extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            // روزی که دانش‌آموز گزارش کارش را نفرستاده (بدون ساعت)
            report_date: { type: DataTypes.DATEONLY, allowNull: false },
            // آیا مشاور/ادمین این مورد را در پنل دیده و رسیدگی کرده یا نه
            is_resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            resolved_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: "MissedDailyReport",
            tableName: "missed_daily_reports",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                // هر دانش‌آموز برای هر روز فقط یک رکورد "گزارش نفرستاده" دارد
                { unique: true, fields: ["user_id", "report_date"] }
            ]
        });
    }
}

module.exports = MissedDailyReport;
