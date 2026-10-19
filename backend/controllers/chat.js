const { Conversation, Message, User, Consultant, Admin, Op } = require("../models");
const configs = require("../configs");

// چون Conversation/Message به‌صورت polymorphic (participant_type + participant_id) طراحی شده،
// این تابع کمکی برای هر پیام/گفتگو اطلاعات نمایشی طرف مقابل (نام و ...) رو برمی‌گردونه.
// برچسب فارسیِ نقش هر طرف گفتگو — به‌جای اینکه همیشه بنویسیم «پشتیبانی»،
// دقیقاً نقش واقعی طرف مقابل (ادمین/مشاور/دانش‌آموز/کاربر عادی) نشون داده می‌شه.
function roleLabel(type, role) {
    if (type === "admin") return "ادمین";
    if (type === "consultant") return "مشاور";
    if (type === "user") return role === "student" ? "دانش‌آموز" : "کاربر عادی";
    return "ناشناس";
}

async function loadParticipant(type, id) {
    if (type === "user") {
        const u = await User.findByPk(id, { attributes: ["id", "name", "lastname", "student_number", "role"] });
        return u
            ? { type, id: u.id, name: `${u.name} ${u.lastname}`, role: u.role, role_label: roleLabel(type, u.role) }
            : { type, id, name: "کاربر حذف‌شده", role: null, role_label: "کاربر حذف‌شده" };
    }
    if (type === "consultant") {
        const c = await Consultant.findByPk(id, { attributes: ["id", "name", "lastname"] });
        return c
            ? { type, id: c.id, name: `${c.name} ${c.lastname}`, role: "consultant", role_label: roleLabel(type) }
            : { type, id, name: "مشاور حذف‌شده", role: "consultant", role_label: "مشاور حذف‌شده" };
    }
    if (type === "admin") {
        const a = await Admin.findByPk(id, { attributes: ["id", "username"] });
        return a
            ? { type, id: a.id, name: a.username || configs.support.name, role: "admin", role_label: roleLabel(type) }
            : { type, id, name: configs.support.name, role: "admin", role_label: roleLabel(type) };
    }
    return { type, id, name: "ناشناس", role: null, role_label: "ناشناس" };
}

function otherParticipant(conversation, myType, myId) {
    if (conversation.participant_one_type === myType && conversation.participant_one_id === myId) {
        return { type: conversation.participant_two_type, id: conversation.participant_two_id };
    }
    return { type: conversation.participant_one_type, id: conversation.participant_one_id };
}

// GET /chat/conversations -> لیست گفتگوهای من (هر نقشی که باشم: user/consultant/admin)
exports.getMyConversations = async (request, response) => {
    try {
        const myType = request.role;
        const myId = request.user.id;

        const conversations = await Conversation.findAll({
            where: {
                [Op.or]: [
                    { participant_one_type: myType, participant_one_id: myId },
                    { participant_two_type: myType, participant_two_id: myId },
                ]
            },
            order: [["last_message_at", "DESC"]]
        });

        const result = await Promise.all(conversations.map(async (conv) => {
            const other = otherParticipant(conv, myType, myId);
            const otherInfo = await loadParticipant(other.type, other.id);
            const unreadCount = await Message.count({
                where: {
                    conversation_id: conv.id,
                    is_read: false,
                    sender_type: { [Op.ne]: myType },
                }
            });

            return {
                id: conv.id,
                is_support: conv.is_support,
                last_message_at: conv.last_message_at,
                last_message_preview: conv.last_message_preview,
                unread_count: unreadCount,
                participant: otherInfo,
            };
        }));

        return response.status(200).json({ success: true, data: result });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت لیست گفتگوها",
            error: error.message
        });
    }
};

// POST /chat/support -> شروع/باز کردن گفتگو با پشتیبانی سایت (برای هر نقشی)
exports.startSupportChat = async (request, response) => {
    try {
        const myType = request.role;
        const myId = request.user.id;

        // پشتیبانی سایت فقط یک ادمینه؛ اولین (و تنها) ادمین ثبت‌شده به‌عنوان پشتیبان در نظر گرفته می‌شه
        const supportAdmin = await Admin.findOne({ order: [["id", "ASC"]] });
        if (!supportAdmin)
            return response.status(503).json({ success: false, message: "پشتیبانی سایت در حال حاضر در دسترس نیست" });

        if (myType === "admin")
            return response.status(400).json({ success: false, message: "ادمین نمی‌تواند با خودش گفتگوی پشتیبانی بسازد" });

        let conversation = await Conversation.findOne({
            where: {
                is_support: true,
                [Op.or]: [
                    { participant_one_type: myType, participant_one_id: myId, participant_two_type: "admin", participant_two_id: supportAdmin.id },
                    { participant_one_type: "admin", participant_one_id: supportAdmin.id, participant_two_type: myType, participant_two_id: myId },
                ]
            }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participant_one_type: myType,
                participant_one_id: myId,
                participant_two_type: "admin",
                participant_two_id: supportAdmin.id,
                is_support: true,
            });
        }

        return response.status(200).json({ success: true, data: conversation });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در شروع گفتگو با پشتیبانی",
            error: error.message
        });
    }
};

// GET /chat/conversations/:id/messages?page=1&limit=30
exports.getMessages = async (request, response) => {
    try {
        const { id } = request.params;
        const { page = 1, limit = 30 } = request.query;
        const myType = request.role;
        const myId = request.user.id;

        const conversation = await Conversation.findByPk(id);
        if (!conversation)
            return response.status(404).json({ success: false, message: "گفتگو یافت نشد!" });

        const isParticipant =
            (conversation.participant_one_type === myType && conversation.participant_one_id === myId) ||
            (conversation.participant_two_type === myType && conversation.participant_two_id === myId);

        if (!isParticipant)
            return response.status(403).json({ success: false, message: "شما عضو این گفتگو نیستید" });

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // پیام‌های حذف‌شده (چه «برای هر دو طرف» چه «فقط برای من») کاملاً از
        // تاریخچه‌ی گفتگو حذف می‌شن، بدون هیچ placeholder‌ای (نه مثل واتساپ).
        const { rows: allMessages, count } = await Message.findAndCountAll({
            where: { conversation_id: id, is_deleted: false },
            order: [["created_at", "DESC"]],
            limit: parseInt(limit),
            offset,
        });
        const myKey = `${myType}:${myId}`;
        const messages = allMessages.filter((m) => !m.hidden_for.includes(myKey));

        // پیام‌های طرف مقابل رو خوانده‌شده علامت بزن
        await Message.update(
            { is_read: true, read_at: new Date() },
            { where: { conversation_id: id, sender_type: { [Op.ne]: myType }, is_read: false } }
        );

        return response.status(200).json({
            success: true,
            data: messages.reverse(), // قدیمی -> جدید
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در دریافت پیام‌ها",
            error: error.message
        });
    }
};

// POST /chat/conversations/:id/messages  { type: "text"|"image", text?, image_url? }
exports.sendMessage = async (request, response) => {
    try {
        const { id } = request.params;
        const { type = "text", text, image_url } = request.body;
        const myType = request.role;
        const myId = request.user.id;

        const conversation = await Conversation.findByPk(id);
        if (!conversation)
            return response.status(404).json({ success: false, message: "گفتگو یافت نشد!" });

        const isParticipant =
            (conversation.participant_one_type === myType && conversation.participant_one_id === myId) ||
            (conversation.participant_two_type === myType && conversation.participant_two_id === myId);

        if (!isParticipant)
            return response.status(403).json({ success: false, message: "شما عضو این گفتگو نیستید" });

        if (type === "text" && !text)
            return response.status(400).json({ success: false, message: "متن پیام الزامی است" });
        if (type === "image" && !image_url)
            return response.status(400).json({ success: false, message: "آدرس تصویر الزامی است" });

        const message = await Message.create({
            conversation_id: id,
            sender_type: myType,
            sender_id: myId,
            type,
            text: type === "text" ? text : null,
            image_url: type === "image" ? image_url : null,
        });

        await conversation.update({
            last_message_at: new Date(),
            last_message_preview: type === "text" ? text.slice(0, 100) : "📷 تصویر",
        });

        // ارسال real-time به طرف مقابل از طریق Socket.io (اگه سرور راه‌اندازی شده باشه)
        const io = request.app.get("io");
        if (io) {
            io.to(`conversation:${id}`).emit("newMessage", message);
            const other = otherParticipant(conversation, myType, myId);
            io.to(`${other.type}:${other.id}`).emit("newConversationActivity", { conversationId: Number(id) });
        }

        return response.status(201).json({ success: true, data: message });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ارسال پیام",
            error: error.message
        });
    }
};

// POST /chat/admin-start { participant_type: "user"|"consultant", participant_id }
// فقط ادمین می‌تونه با هرکسی (هر دانش‌آموز/کاربر یا هر مشاوری) گفتگوی جدید بسازه.
exports.startConversationAsAdmin = async (request, response) => {
    try {
        if (request.role !== "admin")
            return response.status(403).json({ success: false, message: "فقط ادمین به این قابلیت دسترسی دارد" });

        const admin = request.user;
        const { participant_type, participant_id } = request.body;

        if (!["user", "consultant"].includes(participant_type))
            return response.status(400).json({ success: false, message: "نوع طرف گفتگو نامعتبر است" });

        const other = await loadParticipant(participant_type, participant_id);
        if (!other || other.name === "کاربر حذف‌شده" || other.name === "مشاور حذف‌شده")
            return response.status(404).json({ success: false, message: "طرف گفتگو یافت نشد!" });

        let conversation = await Conversation.findOne({
            where: {
                [Op.or]: [
                    { participant_one_type: "admin", participant_one_id: admin.id, participant_two_type: participant_type, participant_two_id: participant_id },
                    { participant_one_type: participant_type, participant_one_id: participant_id, participant_two_type: "admin", participant_two_id: admin.id },
                ]
            }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participant_one_type: "admin",
                participant_one_id: admin.id,
                participant_two_type: participant_type,
                participant_two_id: participant_id,
                is_support: true, // از دید کاربر/مشاور، این همون گفتگوی پشتیبانیه
            });
        }

        return response.status(200).json({ success: true, data: conversation });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ایجاد گفتگو",
            error: error.message
        });
    }
};

// DELETE /chat/messages/:messageId  { scope: "me" | "both" }
// scope=both: پیام برای هر دو طرف حذف می‌شه (فقط فرستنده‌ی خودِ پیام می‌تونه)
// scope=me: پیام فقط از دید همین کاربر مخفی می‌شه، طرف مقابل هنوز می‌بینتش
// (هر عضو گفتگو، حتی گیرنده، می‌تونه این کار رو بکنه)
exports.deleteMessage = async (request, response) => {
    try {
        const { messageId } = request.params;
        const scope = request.body?.scope === "me" ? "me" : "both";
        const myType = request.role;
        const myId = request.user.id;

        const message = await Message.findByPk(messageId);
        if (!message)
            return response.status(404).json({ success: false, message: "پیام یافت نشد!" });

        const conversation = await Conversation.findByPk(message.conversation_id);
        const isParticipant = conversation && (
            (conversation.participant_one_type === myType && conversation.participant_one_id === myId) ||
            (conversation.participant_two_type === myType && conversation.participant_two_id === myId)
        );
        if (!isParticipant)
            return response.status(403).json({ success: false, message: "شما عضو این گفتگو نیستید" });

        if (scope === "both") {
            if (message.sender_type !== myType || message.sender_id !== myId)
                return response.status(403).json({ success: false, message: "فقط فرستنده می‌تواند پیام را برای هر دو طرف حذف کند" });

            await message.update({ is_deleted: true, text: null, image_url: null });

            const io = request.app.get("io");
            if (io) io.to(`conversation:${message.conversation_id}`).emit("messageDeleted", { messageId: message.id, scope: "both" });

            return response.status(200).json({ success: true, message: "پیام برای هر دو طرف حذف شد." });
        }

        // scope === "me"
        const myKey = `${myType}:${myId}`;
        const hidden = message.hidden_for;
        if (!hidden.includes(myKey)) {
            message.hidden_for = [...hidden, myKey];
            await message.save();
        }

        return response.status(200).json({ success: true, message: "پیام فقط برای شما حذف شد." });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در حذف پیام",
            error: error.message
        });
    }
};

// PATCH /chat/messages/:messageId  { text } -> فقط فرستنده و فقط پیام‌های متنیِ حذف‌نشده
exports.editMessage = async (request, response) => {
    try {
        const { messageId } = request.params;
        const { text } = request.body;
        const myType = request.role;
        const myId = request.user.id;

        if (!text || !text.trim())
            return response.status(400).json({ success: false, message: "متن پیام الزامی است" });

        const message = await Message.findByPk(messageId);
        if (!message)
            return response.status(404).json({ success: false, message: "پیام یافت نشد!" });

        if (message.sender_type !== myType || message.sender_id !== myId)
            return response.status(403).json({ success: false, message: "شما فقط می‌توانید پیام خودتان را ویرایش کنید" });

        if (message.is_deleted)
            return response.status(400).json({ success: false, message: "پیام حذف‌شده قابل ویرایش نیست" });

        if (message.type !== "text")
            return response.status(400).json({ success: false, message: "فقط پیام‌های متنی قابل ویرایش هستند" });

        await message.update({ text: text.trim(), is_edited: true, edited_at: new Date() });

        const io = request.app.get("io");
        if (io) io.to(`conversation:${message.conversation_id}`).emit("messageEdited", message);

        return response.status(200).json({ success: true, data: message });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در ویرایش پیام",
            error: error.message
        });
    }
};

// POST /chat/messages/:messageId/forward  { conversation_id } -> فوروارد یک پیام به گفتگوی دیگر
exports.forwardMessage = async (request, response) => {
    try {
        const { messageId } = request.params;
        const { conversation_id } = request.body;
        const myType = request.role;
        const myId = request.user.id;

        const original = await Message.findByPk(messageId);
        if (!original || original.is_deleted)
            return response.status(404).json({ success: false, message: "پیام موردنظر یافت نشد!" });

        const sourceConversation = await Conversation.findByPk(original.conversation_id);
        const isSourceParticipant = sourceConversation && (
            (sourceConversation.participant_one_type === myType && sourceConversation.participant_one_id === myId) ||
            (sourceConversation.participant_two_type === myType && sourceConversation.participant_two_id === myId)
        );
        if (!isSourceParticipant)
            return response.status(403).json({ success: false, message: "شما عضو گفتگوی مبدا نیستید" });

        const targetConversation = await Conversation.findByPk(conversation_id);
        if (!targetConversation)
            return response.status(404).json({ success: false, message: "گفتگوی مقصد یافت نشد!" });

        const isTargetParticipant =
            (targetConversation.participant_one_type === myType && targetConversation.participant_one_id === myId) ||
            (targetConversation.participant_two_type === myType && targetConversation.participant_two_id === myId);
        if (!isTargetParticipant)
            return response.status(403).json({ success: false, message: "شما عضو گفتگوی مقصد نیستید" });

        const originalSender = await loadParticipant(original.sender_type, original.sender_id);

        const forwarded = await Message.create({
            conversation_id: conversation_id,
            sender_type: myType,
            sender_id: myId,
            type: original.type,
            text: original.text,
            image_url: original.image_url,
            forwarded_from_message_id: original.id,
            forwarded_from_name: originalSender.name,
        });

        await targetConversation.update({
            last_message_at: new Date(),
            last_message_preview: original.type === "text" ? (original.text || "").slice(0, 100) : "📷 تصویر",
        });

        const io = request.app.get("io");
        if (io) {
            io.to(`conversation:${conversation_id}`).emit("newMessage", forwarded);
            const other =
                targetConversation.participant_one_type === myType && targetConversation.participant_one_id === myId
                    ? { type: targetConversation.participant_two_type, id: targetConversation.participant_two_id }
                    : { type: targetConversation.participant_one_type, id: targetConversation.participant_one_id };
            io.to(`${other.type}:${other.id}`).emit("newConversationActivity", { conversationId: Number(conversation_id) });
        }

        return response.status(201).json({ success: true, data: forwarded });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "خطا در فوروارد پیام",
            error: error.message
        });
    }
};
