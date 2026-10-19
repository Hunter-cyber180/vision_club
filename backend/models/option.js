const { DataTypes, Model } = require("sequelize");

// گزینه‌های هر سوالِ آزمون
class Option extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            question_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            option_text: { type: DataTypes.TEXT, allowNull: false },
            is_correct: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
            order_number: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'Option',
            tableName: 'options',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
};

module.exports = Option;
