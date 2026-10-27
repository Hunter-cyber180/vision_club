const { DataTypes, Model } = require("sequelize");

class Course extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            title: { type: DataTypes.STRING(100), allowNull: false },
            price: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
            consultant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
            thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
            status: { type: DataTypes.ENUM("in-progress", "finished"), defaultValue: "in-progress", allowNull: false },
            // وضعیت تاییدِ ادمین: کلاسی که مشاور می‌سازه اول pending می‌مونه و
            // توی سایت عمومی نشون داده نمی‌شه تا ادمین تاییدش کنه. کلاسی که خودِ
            // ادمین می‌سازه، چون نیازی به تایید خودش نداره، مستقیم approved می‌شه.
            approval_status: { type: DataTypes.ENUM("pending", "approved", "rejected"), defaultValue: "pending", allowNull: false },
            grade: { type: DataTypes.ENUM("10th", "11th", "12th"), allowNull: false },
            major: { type: DataTypes.ENUM("math", "experimental", "humanities"), allowNull: false },
            course_lesson_name: {
                type: DataTypes.ENUM(
                    "Mathematics",
                    "Geometry",
                    "Discrete",
                    "Statistics",
                    "Calculus",
                    "Physics",
                    "Chemistry",
                    "Biology",
                    "Geology",
                    "Arabic",
                    "Persian",
                    "Religious",
                    "ScienceTechnology",
                    "Sociology",
                    "History",
                    "Geography",
                    "Language",
                    "Philosophy",
                    "Logic",
                ),
                allowNull: false
            },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: "Course",
            tableName: "courses",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
        }
        );
    }
}

module.exports = Course;
