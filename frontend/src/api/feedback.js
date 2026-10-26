import api from "./client";

// ---- بازخورد مشاور/ادمین روی گزارش کار و تحلیل آزمون ----
// targetType: "daily_report" | "analysis_exam"
export async function createFeedback(targetType, targetId, text) {
  const { data } = await api.post("/feedbacks", { target_type: targetType, target_id: targetId, text });
  return data.data;
}

export async function updateFeedback(id, text) {
  const { data } = await api.put(`/feedbacks/${id}`, { text });
  return data.data;
}

export async function deleteFeedback(id) {
  const { data } = await api.delete(`/feedbacks/${id}`);
  return data;
}
