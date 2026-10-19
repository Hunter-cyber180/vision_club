const { DataTypes, Model } = require("sequelize");

class Message extends Model {
    static init(sequelize) {
        return super.init({
            id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
            conversation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            sender_type: { type: DataTypes.ENUM("user", "consultant", "admin"), allowNull: false },
            sender_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
            type: { type: DataTypes.ENUM("text", "image"), allowNull: false, defaultValue: "text" },
            text: { type: DataTypes.TEXT, allowNull: true },
            image_url: { type: DataTypes.STRING(500), allowNull: true },
            is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            is_edited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            edited_at: { type: DataTypes.DATE, allowNull: true },
            // آرایه‌ای از "type:id" (مثلاً "user:12") که پیام برای اون‌ها با
            // «حذف فقط برای من» مخفی شده — برخلاف is_deleted که پیام رو برای
            // هر دو طرف گفتگو حذف می‌کنه.
            hidden_for: {
                type: DataTypes.TEXT,
                allowNull: true,
                get() {
                    const raw = this.getDataValue("hidden_for");
                    if (!raw) return [];
                    try {
                        const parsed = JSON.parse(raw);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (_) {
                        return [];
                    }
                },
                set(value) {
                    this.setDataValue("hidden_for", JSON.stringify(Array.isArray(value) ? value : []));
                },
            },
            forwarded_from_message_id: { type: DataTypes.BIGINT, allowNull: true },
            forwarded_from_name: { type: DataTypes.STRING(150), allowNull: true },
            is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            read_at: { type: DataTypes.DATE, allowNull: true },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: "Message",
            tableName: "messages",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [{ fields: ["conversation_id", "created_at"] }]
        });
    }
}

module.exports = Message;
