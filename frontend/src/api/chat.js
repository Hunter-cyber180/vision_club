import api from "./client";

// لیست گفتگوهای من (هر نقشی: user/consultant/admin)
export async function fetchConversations() {
  const { data } = await api.get("/chat/conversations");
  return data.data || [];
}

export async function fetchMessages(conversationId, params = {}) {
  const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
  return { messages: data.data || [], pagination: data.pagination };
}

export async function sendChatMessage(conversationId, payload) {
  const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
  return data.data;
}

// scope: "me" (فقط برای خودم) یا "both" (برای هر دو طرف — فقط فرستنده مجازه)
export async function deleteChatMessage(messageId, scope = "both") {
  const { data } = await api.delete(`/chat/messages/${messageId}`, { data: { scope } });
  return data;
}

export async function editChatMessage(messageId, text) {
  const { data } = await api.patch(`/chat/messages/${messageId}`, { text });
  return data.data;
}

export async function forwardChatMessage(messageId, conversationId) {
  const { data } = await api.post(`/chat/messages/${messageId}/forward`, { conversation_id: conversationId });
  return data.data;
}

// شروع/بازکردن گفتگو با پشتیبانی سایت (برای هر نقشی)
export async function startSupportChat() {
  const { data } = await api.post("/chat/support");
  return data.data;
}

// فقط ادمین: شروع گفتگوی جدید با یک کاربر/دانش‌آموز یا مشاور
export async function startConversationAsAdmin(participant_type, participant_id) {
  const { data } = await api.post("/chat/admin-start", { participant_type, participant_id });
  return data.data;
}

// فقط مشاور: شروع/بازکردن گفتگو با یکی از دانش‌آموزهای خودش
export async function startChatWithStudent(userId) {
  const { data } = await api.post(`/consultant/students/${userId}/chat`);
  return data.data;
}
