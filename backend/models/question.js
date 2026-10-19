const { DataTypes, Model } = require("sequelize");

// سوالات یک آزمون (Quiz). هر سوال چند گزینه (Option) دارد.
class Question extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
            quiz_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            question_text: { type: DataTypes.TEXT, allowNull: false },
            image_url: { type: DataTypes.STRING(500), allowNull: true },
            order_number: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1, allowNull: false },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        },
        {
            sequelize,
            modelName: 'Question',
            tableName: 'questions',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        });
    };
};

module.exports = Question;
