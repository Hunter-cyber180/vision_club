const { Model, DataTypes } = require('sequelize');

class Consultant extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            name: { type: DataTypes.STRING(100), allowNull: false,
                validate: { notEmpty: true, len: [2, 100] }
            },
            lastname: { type: DataTypes.STRING(100), allowNull: false,
                validate: { notEmpty: true, len: [2, 100] }
            },
            email: { type: DataTypes.STRING(255), allowNull: false, unique: 'consultants_email_unique',
                validate: { isEmail: true, notEmpty: true }
            },
            consultant_password: { type: DataTypes.STRING(255), allowNull: false,
                validate: { notEmpty: true }
            },
            phone_number: { type: DataTypes.STRING(15), allowNull: false, unique: 'consultants_phone_number_unique',
                validate: { notEmpty: true, is: /^[0-9]{10,15}$/ }
            },
            telegram_id: { type: DataTypes.STRING(100), allowNull: true },
            profile_image: { type: DataTypes.STRING(500), allowNull: true },
            counseling_fields: {
                type: DataTypes.JSON,
                allowNull: false,
                get() {
                    const raw = this.getDataValue("counseling_fields");
                    if (Array.isArray(raw)) return raw;
                    if (typeof raw === "string" && raw.length) {
                        const trimmed = raw.trim();
                        if (trimmed.startsWith("[")) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                if (Array.isArray(parsed)) return parsed;
                            } catch (_) {
                                // پارس نشد؛ (comma-separated)
                            }
                        }
                        return raw.split(",").map((s) => s.trim()).filter(Boolean);
                    }
                    return [];
                },
                set(value) {
                    if (Array.isArray(value)) {
                        this.setDataValue("counseling_fields", value);
                        return;
                    }
                    if (typeof value === "string" && value.length) {
                        const trimmed = value.trim();
                        if (trimmed.startsWith("[")) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                if (Array.isArray(parsed)) {
                                    this.setDataValue("counseling_fields", parsed);
                                    return;
                                }
                            } catch (_) { /* fall through */ }
                        }
                        this.setDataValue("counseling_fields", trimmed.split(",").map((s) => s.trim()).filter(Boolean));
                        return;
                    }
                    this.setDataValue("counseling_fields", value);
                },
                validate: {
                    isValidFields(value) {
                        if (!value || !Array.isArray(value) || value.length === 0)
                            throw new Error("هر مشاور باید حداقل یک رشته‌ی تحت مشاوره داشته باشد");
                        const allowed = ["انسانی", "ریاضی", "تجربی"];
                        if (value.some((v) => !allowed.includes(v)))
                            throw new Error("رشته‌ی تحت مشاوره نامعتبر است");
                    }
                },
            },
            consultation_type: {
                type: DataTypes.ENUM('individual', 'group', 'both'),
                allowNull: false,
                defaultValue: 'both',
            },
            experience_years: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            education: { type: DataTypes.TEXT, allowNull: true },
            skills: { type: DataTypes.TEXT, allowNull: true },
            bio: { type: DataTypes.TEXT, allowNull: true },
            is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: 'Consultant',
            tableName: 'consultants',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            defaultScope: { attributes: { exclude: ["consultant_password"] } },
            scopes: { withPassword: { attributes: {} } }
        });
    }
}

module.exports = Consultant;
