const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../db");

class UserAnswer extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            question_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            selected_option_id : { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            is_correct: { type: DataTypes.BOOLEAN, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'UserAnswer',
            tableName: 'user_answers',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        }
        );
    };
};

module.exports = UserAnswer;
