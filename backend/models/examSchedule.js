const { DataTypes, Model } = require("sequelize");

// تاریخ برگزاری آزمون ماهانه که ادمین تعیین می‌کند.
// روز بعد از این تاریخ، سیستم چک می‌کند کدام دانش‌آموزها فرم "تحلیل آزمون" را نفرستاده‌اند.
class ExamSchedule extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
            title: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "آزمون ماهانه" },
            exam_date: { type: DataTypes.DATEONLY, allowNull: false },
            jalali_year: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
            jalali_month: { type: DataTypes.SMALLINT, allowNull: true },
            set_by_admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: 'ExamSchedule',
            tableName: 'exam_schedules',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        });
    };
};

module.exports = ExamSchedule;
