const { DataTypes, Model } = require("sequelize");

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
