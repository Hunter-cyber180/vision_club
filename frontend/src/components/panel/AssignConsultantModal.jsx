import { useState } from "react";
import Icon from "../Icon";
import { useToast } from "../../context/ToastContext";
import { setUserRole } from "../../api/admin";

// فرم تخصیص یک کاربر عادی به مشاور (داخل <Modal> استفاده می‌شه)
export default function AssignConsultantModal({ student, consultants, onClose, onAssigned }) {
  const toast = useToast();
  const [consultantId, setConsultantId] = useState(consultants[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!consultantId) { toast("لطفاً یک مشاور انتخاب کن", "error"); return; }
    setSaving(true);
    try {
      await setUserRole(student.id, { role: "student", consultant_id: Number(consultantId) });
      toast(`${student.name} ${student.lastname} به مشاور تخصیص داده شد`);
      onAssigned();
    } catch (err) {
      toast(err?.response?.data?.message || "تخصیص با خطا مواجه شد", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="field">
        <label>انتخاب مشاور</label>
        <select className="input" style={{ minWidth: 0 }} value={consultantId} onChange={(e) => setConsultantId(e.target.value)}>
          {consultants.map((c) => <option key={c.id} value={c.id}>{c.name} {c.lastname}</option>)}
        </select>
      </div>
      <div className="modal-foot ws-form-foot" style={{ padding: 0, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onClose}>انصراف</button>
        <button className="btn btn-gold" disabled={saving} onClick={submit}><Icon name="check" /> {saving ? "در حال ثبت..." : "تخصیص بده"}</button>
      </div>
    </>
  );
}
