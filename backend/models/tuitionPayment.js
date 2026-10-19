const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class tuitionPayment extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            consultant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            jalali_year: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // example: 1405
            jalali_month: { type: DataTypes.SMALLINT, allowNull: false }, // 1 - 12
            status: { type: DataTypes.ENUM("paid", "unpaid"), defaultValue: "unpaid", allowNull: false },
            amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // null until paid
            paid_at: { type: DataTypes.DATE, allowNull: true }, // null until paid
            source: { type: DataTypes.ENUM("gateway", "admin_manual", "wallet"), allowNull: true }, // null until paid
            set_by_admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // If it was a manual, which admin did it?
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: "TuitionPayment",
            tableName: "tuition_payments",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            charset: "utf8mb4",
            collate: "utf8mb4_unicode_ci",
        });
    };
};

module.exports = tuitionPayment;
