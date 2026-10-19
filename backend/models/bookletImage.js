const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class BookletImage extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            bookletId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            url: { type: DataTypes.STRING(500), allowNull: false },
            order: { type: DataTypes.INTEGER, defaultValue: 0 }, // images order
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'BookletImage',
            tableName: 'booklet_images',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci', 
        });
    };
};

module.exports = BookletImage;
