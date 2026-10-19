const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

// جزوه/فایل پیوست‌شده به یک دوره (مثلاً جزوه جمع‌بندی PDF).
// چون سیستم آپلود فایل نداریم، فایل با لینک URL ثبت می‌شه.
class CourseNote extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            title: { type: DataTypes.STRING(150), allowNull: false },
            file_url: { type: DataTypes.STRING(500), allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'CourseNote',
            tableName: 'course_notes',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
};

module.exports = CourseNote;
