const { DataTypes, Model } = require("sequelize");

// سبد خرید کاربر — چون دوره و کارگاه دو جدول کاملاً جدا هستن (نه یک جدول
// مشترک "محصول")، هر آیتم سبد خرید نوعش (course/workshop) رو مشخص می‌کنه و
// item_id به رکورد همون جدول اشاره می‌کنه. برای نمایش اطلاعات (عنوان، قیمت،
// تصویر) توی کنترلر جداگانه از روی این نوع، از جدول درست واکشی می‌شه.
class CartItem extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            item_type: { type: DataTypes.ENUM("course", "workshop"), allowNull: false },
            item_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        }, {
            sequelize,
            modelName: "CartItem",
            tableName: "cart_items",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false,
            indexes: [
                { unique: true, name: "cart_items_user_item_unique", fields: ["user_id", "item_type", "item_id"] },
            ],
        });
    };
};

module.exports = CartItem;
