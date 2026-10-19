const { DataTypes, Model } = require("sequelize");

class Workshop extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
            title: { type: DataTypes.STRING(100), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: false },
            duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
            instructor_name: { type: DataTypes.STRING(100), allowNull: false },
            video_url: { type: DataTypes.STRING(500), allowNull: false },
            // تصویر بندانگشتی توی فرم افزودن/ویرایش کارگاه اختیاریه (اگه آپلود
            // نشه، پخش‌کننده از یه تصویر پیش‌فرض تولیدی استفاده می‌کنه)، پس این
            // ستون هم باید بتونه خالی باشه؛ قبلاً allowNull:false بود که هر بار
            // کارگاهی بدون تصویر بندانگشتی ساخته می‌شد با خطای دیتابیس رد می‌شد.
            video_thumbnail: { type: DataTypes.STRING(500), allowNull: true },
            // مشاوری که این کارگاه رو ساخته (اگه ادمین ساخته باشه، خالی می‌مونه).
            // با این فیلد، خودِ مشاور بدون ثبت‌نام/پرداخت به کارگاه خودش دسترسی داره
            // — دقیقاً مثل consultant_id روی دوره‌ها.
            consultant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
            price: { type: DataTypes.BIGINT, defaultValue: 0 },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
            // دقیقاً مثل approval_status روی دوره‌ها: کارگاهی که یک مشاور می‌سازه
            // تا وقتی ادمین تاییدش نکنه توی سایت عمومی دیده نمی‌شه (pending)؛
            // کارگاهی که خودِ ادمین می‌سازه مستقیم approved ثبت می‌شه.
            approval_status: { type: DataTypes.ENUM("pending", "approved", "rejected"), defaultValue: "pending", allowNull: false },
            category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: "Workshop",
            tableName: "workshops",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
        });
    };
};

module.exports = Workshop;
