const { DataTypes, Model } = require("sequelize");

class Admin extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            username: { type: DataTypes.STRING(100), allowNull: false },
            email: { type: DataTypes.STRING(100), allowNull: false, unique: 'admins_email_unique' },
            password: { type: DataTypes.STRING(255), allowNull: false }, // هش bcrypt
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'Admin',
            tableName: 'admins',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            defaultScope: { attributes: { exclude: ["password"] } },
            scopes: { withPassword: { attributes: {} } }
        });
    };
};

module.exports = Admin;
