import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  fetchConversations, fetchMessages, sendChatMessage,
  editChatMessage, deleteChatMessage, forwardChatMessage,
} from "../../api/chat";
import { connectSocket, getSocket } from "../../api/socket";
import { uploadFile } from "../../api/upload";

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return "";
  }
}

export default function ChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const toast = useToast();
  const windowRef = useRef(null);
  const imageInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null); // پیامی که در حال فوروارد شدنه
  const [deleteTarget, setDeleteTarget] = useState(null); // پیامی که می‌خوایم حذفش کنیم (منتظر انتخاب «برای من / برای همه»)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (windowRef.current) windowRef.current.scrollTop = windowRef.current.scrollHeight;
    });
  };

  const load = () => {
    setLoading(true);
    Promise.all([fetchConversations(), fetchMessages(id)])
      .then(([convs, { messages: msgs }]) => {
        setConversations(convs);
        setConversation(convs.find((c) => c.id === Number(id)) || null);
        setMessages(msgs);
        scrollToBottom();
      })
      .catch((err) => setError(err?.response?.data?.message || "دریافت گفتگو با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    let socket = null;

    const onNewMessage = (msg) => {
      if (Number(msg.conversation_id) !== Number(id)) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      scrollToBottom();
    };
    const onMessageDeleted = ({ messageId, scope }) => {
      if (scope && scope !== "both") return;
      // حذفِ «برای هر دو طرف» پیام رو کاملاً از گفتگو محو می‌کنه، بدون
      // نمایش هیچ placeholder‌ای (نه مثل واتساپ که می‌نویسه «پیام حذف شد»).
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };
    const onMessageEdited = (msg) => {
      if (Number(msg.conversation_id) !== Number(id)) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    connectSocket().then((s) => {
      if (cancelled || !s) return;
      socket = s;
      socket.emit("joinConversation", Number(id));
      socket.on("newMessage", onNewMessage);
      socket.on("messageDeleted", onMessageDeleted);
      socket.on("messageEdited", onMessageEdited);
    });

    return () => {
      cancelled = true;
      const s = getSocket();
      if (s) {
        s.emit("leaveConversation", Number(id));
        s.off("newMessage", onNewMessage);
        s.off("messageDeleted", onMessageDeleted);
        s.off("messageEdited", onMessageEdited);
      }
    };
  }, [id]);

  const resetComposer = () => {
    setDraft("");
    setEditingId(null);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (editingId) {
        const msg = await editChatMessage(editingId, text);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        resetComposer();
      } else {
        setDraft("");
        const msg = await sendChatMessage(id, { type: "text", text });
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        scrollToBottom();
      }
    } catch (err) {
      toast(err?.response?.data?.message || (editingId ? "ویرایش پیام با خطا مواجه شد" : "ارسال پیام با خطا مواجه شد"), "error");
      if (!editingId) setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setDraft(m.text || "");
    setOpenMenuId(null);
  };

  const handleImagePick = () => imageInputRef.current?.click();

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadFile("image", file);
      const msg = await sendChatMessage(id, { type: "image", image_url: result.url });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      scrollToBottom();
    } catch (err) {
      toast(err?.response?.data?.message || "ارسال تصویر با خطا مواجه شد", "error");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (messageId, scope) => {
    setDeleteTarget(null);
    try {
      await deleteChatMessage(messageId, scope);
      // چه «فقط برای من» چه «برای هر دو طرف»، پیام از این لحظه در همین
      // صفحه دیگه دیده نمی‌شه — بدون نوشتن «این پیام حذف شد».
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      toast(err?.response?.data?.message || "حذف پیام با خطا مواجه شد", "error");
    }
  };

  const handleForwardTo = async (targetConversationId) => {
    if (!forwardTarget) return;
    try {
      await forwardChatMessage(forwardTarget.id, targetConversationId);
      toast("پیام فوروارد شد");
      setForwardTarget(null);
    } catch (err) {
      toast(err?.response?.data?.message || "فوروارد پیام با خطا مواجه شد", "error");
    }
  };

  if (loading) return <div className="wrap panel-wrap"><div className="empty-state">در حال بارگذاری...</div></div>;
  if (error) return <div className="wrap panel-wrap"><div className="empty-state">{error}</div></div>;

  const forwardCandidates = conversations.filter((c) => c.id !== Number(id));

  return (
    <>
      <div className="panel-head fade-in" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="icon-btn" onClick={() => navigate("/panel/chat")} style={{ transform: "scaleX(-1)" }}><Icon name="chev" /></button>
        <div>
          <h2 style={{ fontSize: 16 }}>{conversation?.participant?.name || "گفتگو"}</h2>
          {conversation?.participant?.role_label && (
            <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>{conversation.participant.role_label}</p>
          )}
        </div>
      </div>

      <div className="glass chat-window fade-in" ref={windowRef} id="chatWin">
        {messages.length === 0 && <div className="empty-state">هنوز پیامی ارسال نشده. اولین پیام رو بفرست.</div>}
        {messages.map((m) => {
          const isMe = m.sender_type === role;
          return (
            <div className={`msg ${isMe ? "me" : "them"}`} key={m.id} style={{ position: "relative" }}>
              {m.forwarded_from_name && (
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="forward" /> فوروارد شده از {m.forwarded_from_name}
                </div>
              )}
              {m.type === "image" ? (
                <img src={m.image_url} alt="تصویر ارسالی" style={{ maxWidth: "100%", borderRadius: 10, display: "block" }} />
              ) : (
                <span>{m.text}</span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 10.5, opacity: 0.7, justifyContent: "flex-end" }}>
                {m.is_edited && <span>ویرایش‌شده</span>}
                <span>{formatTime(m.created_at)}</span>
              </div>

              <button
                className="icon-btn"
                style={{ position: "absolute", top: -6, [isMe ? "left" : "right"]: -6, width: 26, height: 26 }}
                onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
              >
                <Icon name="more" />
              </button>

              {openMenuId === m.id && (
                <div className="glass fade-in" style={{ position: "absolute", top: 20, [isMe ? "left" : "right"]: -6, zIndex: 5, minWidth: 150, padding: 6 }}>
                  {isMe && m.type === "text" && (
                    <button className="side-link" style={{ padding: "8px 10px" }} onClick={() => startEdit(m)}>
                      <Icon name="edit" /><span>ویرایش</span>
                    </button>
                  )}
                  <button className="side-link" style={{ padding: "8px 10px" }} onClick={() => { setForwardTarget(m); setOpenMenuId(null); }}>
                    <Icon name="forward" /><span>فوروارد</span>
                  </button>
                  <button className="side-link" style={{ padding: "8px 10px", color: "var(--coral)" }} onClick={() => { setDeleteTarget(m); setOpenMenuId(null); }}>
                    <Icon name="trashBin" /><span>حذف</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingId && (
        <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontSize: 12.5, color: "var(--gold-bright)" }}>
          <span>در حال ویرایش پیام...</span>
          <button className="icon-btn" onClick={resetComposer}><Icon name="trash" /></button>
        </div>
      )}

      <div className="chat-input">
        <button className="icon-btn" style={{ width: 44, height: 44 }} disabled={uploadingImage} onClick={handleImagePick} title="ارسال عکس">
          <Icon name="image" />
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
        <input
          className="input"
          value={draft}
          placeholder={uploadingImage ? "در حال آپلود عکس..." : "پیام بنویس..."}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-gold icon-btn" style={{ width: 48, height: 48 }} disabled={sending} onClick={handleSend}>
          <Icon name={editingId ? "check" : "send"} />
        </button>
      </div>

      <Modal open={!!forwardTarget} onClose={() => setForwardTarget(null)} title="فوروارد پیام به...">
        {forwardCandidates.length ? forwardCandidates.map((c) => (
          <div key={c.id} className="glass chat-item fade-in" onClick={() => handleForwardTo(c.id)}>
            <div className="avatar">{c.participant?.name?.[0] || "؟"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 14 }}>{c.participant?.name || "کاربر"}</h3>
              <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>{c.participant?.role_label}</p>
            </div>
          </div>
        )) : <div className="empty-state">گفتگوی دیگری برای فوروارد وجود نداره.</div>}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="حذف پیام">
        {deleteTarget && (
          <>
            <p style={{ fontSize: 13.5, marginBottom: 16 }}>این پیام چطور حذف بشه؟</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="btn btn-ghost btn-block" onClick={() => handleDelete(deleteTarget.id, "me")}>فقط برای من</button>
              {deleteTarget.sender_type === role && (
                <button className="btn btn-danger btn-block" onClick={() => handleDelete(deleteTarget.id, "both")}>برای هر دو طرف</button>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
