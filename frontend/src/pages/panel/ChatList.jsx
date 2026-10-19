import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchConversations, startSupportChat } from "../../api/chat";
import { connectSocket, getSocket } from "../../api/socket";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "الان";
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.round(hours / 24);
  return `${days} روز پیش`;
}

export default function ChatList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [startingSupport, setStartingSupport] = useState(false);

  const load = () => {
    setLoading(true);
    fetchConversations()
      .then(setConversations)
      .catch((err) => setError(err?.response?.data?.message || "دریافت لیست گفتگوها با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    let cancelled = false;
    let socket = null;
    connectSocket().then((s) => {
      if (cancelled || !s) return;
      socket = s;
      socket.on("newConversationActivity", load);
    });
    return () => {
      cancelled = true;
      const s = getSocket();
      if (s) s.off("newConversationActivity", load);
    };
  }, []);

  const handleSupportChat = async () => {
    setStartingSupport(true);
    try {
      const conv = await startSupportChat();
      navigate(`/panel/chat/${conv.id}`);
    } catch (err) {
      toast(err?.response?.data?.message || "شروع گفتگو با پشتیبانی با خطا مواجه شد", "error");
    } finally {
      setStartingSupport(false);
    }
  };

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="chat" /> چت</h2><p>گفتگو با مشاور، دانش‌آموز و پشتیبانی</p></div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        {role !== "admin" && (
          <button className="btn btn-ghost btn-block" style={{ marginBottom: 14 }} disabled={startingSupport} onClick={handleSupportChat}>
            <Icon name="chat" /> {startingSupport ? "در حال باز کردن..." : "شروع گفتگو با پشتیبانی"}
          </button>
        )}

        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          conversations.length ? (
            <div className="chat-list" style={{ padding: 0 }}>
              {conversations.map((c) => (
                <div className="glass chat-item fade-in" key={c.id} onClick={() => navigate(`/panel/chat/${c.id}`)}>
                  <div className="avatar">{c.participant?.name?.[0] || "؟"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      {c.participant?.name || "کاربر"}
                      {c.participant?.role_label && <span className="badge badge-violet" style={{ fontSize: 10 }}>{c.participant.role_label}</span>}
                    </h3>
                    <p style={{ fontSize: 12.5, color: "var(--ink-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.last_message_preview || "هنوز پیامی ارسال نشده"}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <small>{timeAgo(c.last_message_at)}</small>
                    {c.unread_count > 0 && <span className="badge badge-gold" style={{ fontSize: 10 }}>{c.unread_count}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">هنوز گفتگویی نداری.</div>
        )}
      </div>
    </>
  );
}
