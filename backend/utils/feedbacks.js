const { ReportFeedback } = require("../models");

exports.attachFeedbacks = async (items, type) => {
    const plain = (items || []).map((i) => (typeof i.toJSON === "function" ? i.toJSON() : i));
    if (!plain.length) return plain;

    const rows = await ReportFeedback.findAll({
        where: { target_type: type, target_id: plain.map((i) => i.id) },
        order: [["created_at", "ASC"]],
    });

    const byTarget = new Map();
    rows.forEach((r) => {
        const key = String(r.target_id);
        if (!byTarget.has(key)) byTarget.set(key, []);
        byTarget.get(key).push(r.toJSON());
    });

    return plain.map((i) => ({ ...i, feedbacks: byTarget.get(String(i.id)) || [] }));
};
