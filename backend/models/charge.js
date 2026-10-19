const { DataTypes, Model } = require("sequelize");

// شارژهای موفقِ کیف پول کاربر (بعد از تایید پرداخت زرین‌پال)
class Charge extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            charge_amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            authority: { type: DataTypes.STRING(100), unique: 'charges_authority_unique', allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        },
        {
            sequelize,
            modelName: 'Charge',
            tableName: 'charges',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        }
        );
    };
};

module.exports = Charge;
