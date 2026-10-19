const jwt = require("jsonwebtoken");
const configs = require("../configs");
const { Conversation } = require("../models");

function initSocket(io) {
    // احراز هویت سوکت: توکن باید توی handshake.auth.token فرستاده بشه
    // مثال فرانت: io(URL, { auth: { token: accessToken } })
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("توکن ارسال نشده است"));

            const payload = jwt.verify(token, configs.auth.accessTokenSecretKey);
            socket.user = payload; // { id, role }
            next();
        } catch (error) {
            next(new Error("توکن نامعتبر یا منقضی شده است"));
        }
    });

    io.on("connection", (socket) => {
        const { id, role } = socket.user;

        // اتاق شخصی برای نوتیفیکیشن‌های عمومی (مثل «گفتگوی جدید»)
        socket.join(`${role}:${id}`);

        // عضویت در اتاق یک گفتگوی خاص (بعد از تایید عضویت واقعی کاربر در اون گفتگو)
        socket.on("joinConversation", async (conversationId) => {
            try {
                const conversation = await Conversation.findByPk(conversationId);
                if (!conversation) return;

                const isParticipant =
                    (conversation.participant_one_type === role && conversation.participant_one_id === id) ||
                    (conversation.participant_two_type === role && conversation.participant_two_id === id);

                if (isParticipant) socket.join(`conversation:${conversationId}`);
            } catch (error) {
                console.error("joinConversation error:", error.message);
            }
        });

        socket.on("leaveConversation", (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // نشانگر «در حال تایپ...»
        socket.on("typing", ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit("typing", { conversationId, from: { id, role } });
        });

        socket.on("disconnect", () => {
            // چیز خاصی لازم نیست؛ socket.io خودش اتاق‌ها رو پاک می‌کنه
        });
    });
}

module.exports = { initSocket };
