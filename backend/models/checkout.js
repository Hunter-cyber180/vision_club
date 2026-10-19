const { DataTypes, Model, Op } = require("sequelize");

// سبد پرداخت موقت که تا لحظه‌ی تایید زرین‌پال زنده می‌ماند (بعدش پاک/تبدیل به Charge می‌شود)
class Checkout extends Model {
    static init(sequelize) {
        const model = super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            authority: { type: DataTypes.STRING(100), unique: 'checkouts_authority_unique', allowNull: true },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: () => new Date(Date.now() + 60 * 60 * 1000) // 1 Hour
            },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            modelName: 'Checkout',
            tableName: 'checkouts',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        }
        );

        // پاکسازی دوره‌ای سبدهای منقضی‌شده (هر ساعت)
        setInterval(async () => {
            try {
                await Checkout.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });
            } catch (e) {
                console.error("Checkout cleanup error:", e.message);
            }
        }, 60 * 60 * 1000).unref?.();

        return model;
    };
};

module.exports = Checkout;
