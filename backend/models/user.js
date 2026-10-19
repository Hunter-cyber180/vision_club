const { Model, DataTypes } = require("sequelize");

class User extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
                name: { type: DataTypes.STRING(100), allowNull: false },
                lastname: { type: DataTypes.STRING(100), allowNull: false },
                user_password: { type: DataTypes.STRING(255), allowNull: false }, // هش bcrypt
                email: { type: DataTypes.STRING(100), allowNull: false, unique: 'users_email_unique' },
                birthday: { type: DataTypes.DATEONLY, allowNull: false },
                gender: { type: DataTypes.ENUM("male", "female"), allowNull: false },
                charge_amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
                // "user" یعنی کاربر عادی سایت (تازه ثبت‌نام‌کرده) - "student" یعنی دانش‌آموزی که
                // یک مشاور به‌صورت دستی پذیرشش کرده و پنل دانش‌آموزی براش باز می‌شه.
                role: { type: DataTypes.ENUM("user", "student"), allowNull: false, defaultValue: "user" },
                consultant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
                // مبلغ شهریه‌ی ماهانه‌ای که مشاور برای این دانش‌آموز مشخص کرده (تومان).
                // تا وقتی مشاور تعیینش نکرده null هست و دانش‌آموز نمی‌تونه از کیف پول شهریه پرداخت کنه.
                tuition_amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
                city: { type: DataTypes.STRING(100), allowNull: false },
                student_number: { type: DataTypes.STRING(50), allowNull: false, unique: 'users_student_number_unique' },
                father_number: { type: DataTypes.STRING(15), allowNull: false },
                mother_number: { type: DataTypes.STRING(15), allowNull: true, defaultValue: null },
                telegram_id: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
                degree: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
                grade_10_gpa: { type: DataTypes.DECIMAL(4, 2), allowNull: true, defaultValue: null,
                    validate: { min: 0, max: 20 }
                },
                grade_11_gpa: { type: DataTypes.DECIMAL(4, 2), allowNull: true, defaultValue: null,
                    validate: { min: 0, max: 20 }
                },
                grade_12_gpa: { type: DataTypes.DECIMAL(4, 2), allowNull: true, defaultValue: null,
                    validate: { min: 0, max: 20 }
                },
                is_retaker: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
                entrance_exam_attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
                prev_national_rank: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
                preferred_major: { type: DataTypes.STRING(200), allowNull: true, defaultValue: null },
                preferred_universities: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
                notes: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
                created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            },
            {
                sequelize,
                modelName: 'User',
                tableName: 'users',
                timestamps: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
                engine: 'InnoDB',
                defaultScope: {
                    attributes: { exclude: ["user_password"] }
                },
                scopes: {
                    withPassword: { attributes: {} }
                }
            }
        );
    }
}

module.exports = User;
