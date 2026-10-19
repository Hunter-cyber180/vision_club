const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class Category extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    autoIncrement: true,
                    primaryKey: true,
                },
                name: { type: DataTypes.STRING(100), allowNull: false },
                is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
                created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
            },
            {
                sequelize,
                modelName: 'Category',
                tableName: 'categories',
                timestamps: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
            }
        );
    }
}

module.exports = Category;
