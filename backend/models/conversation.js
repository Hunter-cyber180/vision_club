const { DataTypes, Model } = require("sequelize");

class Conversation extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
            participant_one_type: { type: DataTypes.ENUM("user", "consultant", "admin"), allowNull: false },
            participant_one_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            participant_two_type: { type: DataTypes.ENUM("user", "consultant", "admin"), allowNull: false },
            participant_two_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            is_support: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // گفتگو با پشتیبانی سایت
            last_message_at: { type: DataTypes.DATE, allowNull: true },
            last_message_preview: { type: DataTypes.STRING(300), allowNull: true },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: "Conversation",
            tableName: "conversations",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                { fields: ["participant_one_type", "participant_one_id"] },
                { fields: ["participant_two_type", "participant_two_id"] },
            ]
        });
    }
}

module.exports = Conversation;
