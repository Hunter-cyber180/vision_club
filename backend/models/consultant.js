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
                // توجه: قبلاً DataTypes.SET('انسانی','ریاضی','تجربی') بود، ولی این تایپ
                // مخصوص MySQL/MariaDB هست و بسته به نسخه‌ی sequelize/درایورِ نصب‌شده
                // می‌تونه با خطای «DataTypes.SET is not a function» کرش کنه. چون این
                // فیلد همه‌جای پروژه به‌صورت یک آرایه‌ی جاوااسکریپتی استفاده می‌شه (نه
                // چیز خاصِ SET)، به JSON تغییر کرد که روی همه‌ی دیالکت‌ها و نسخه‌ها
                // بدون مشکل کار می‌کنه و دقیقاً همون رفتار (آرایه‌ی رشته) رو می‌ده.
                //
                // نکته‌ی مهم: مشاورهایی که قبل از این تغییر (وقتی ستون هنوز SET بود)
                // ساخته شدن، توی دیتابیس مقدارشون هنوز به‌شکل رشته‌ی قدیمیِ SET
                // ذخیره‌ست (مثلاً "تجربی,ریاضی")، نه یک آرایه‌ی JSON واقعی. برای اینکه
                // این دیتای قدیمی باعث کرش نشه (روی .join روی یک رشته)، یک getter
                // گذاشتیم که هر بار این فیلد خونده می‌شه، مستقل از فرمت واقعی ذخیره‌شده
                // در دیتابیس، همیشه یک آرایه‌ی جاوااسکریپتی معتبر برگردونه.
                type: DataTypes.JSON,
                allowNull: false,
                get() {
                    const raw = this.getDataValue("counseling_fields");
                    if (Array.isArray(raw)) return raw;
                    if (typeof raw === "string" && raw.length) {
                        // اگه ستون واقعی توی دیتابیس هنوز JSON native نشده باشه (مثلاً
                        // هنوز VARCHAR/TEXT قدیمیه)، مقداری که ذخیره شده یک رشته‌ی
                        // JSON.stringify شده‌ست، نه آرایه‌ی واقعی — مثل '["انسانی"]'.
                        // اگه این حالت رو با split(",") معمولی پردازش کنیم، به‌جای
                        // آرایه‌ی درست، یک آیتم غلط شامل کل رشته با آکولاد/کوتیشن
                        // برمی‌گرده. برای همین اول تلاش می‌کنیم به‌عنوان JSON پارسش کنیم.
                        const trimmed = raw.trim();
                        if (trimmed.startsWith("[")) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                if (Array.isArray(parsed)) return parsed;
                            } catch (_) {
                                // پارس نشد؛ می‌ریم سراغ فرمت قدیمی‌تر (comma-separated)
                            }
                        }
                        return raw.split(",").map((s) => s.trim()).filter(Boolean);
                    }
                    return [];
                },
                // این setter دقیقاً همون منطق get() رو موقع نوشتن هم اجرا می‌کنه، تا اگه
                // یک‌بار (به هر دلیلی، حتی روی دیتای قدیمیِ‌ خراب) این فیلد به‌شکل رشته‌ی
                // JSON.stringify شده یا comma-separated به‌جای آرایه ذخیره بشه، دفعه‌ی
                // بعد که رکورد ذخیره می‌شه (مثلاً موقع ویرایش)، خودش تمیز بشه.
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
