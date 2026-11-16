const { sequelize } = require("../db");

async function run() {
    await sequelize.authenticate();
    console.log("✅ به دیتابیس وصل شد.\n");

    const [tables] = await sequelize.query("SHOW TABLES");
    const dbNameKey = Object.keys(tables[0] || {})[0];

    let totalDropped = 0;

    for (const row of tables) {
        const tableName = row[dbNameKey];
        const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);

        const byColumn = new Map();
        for (const idx of indexes) {
            if (idx.Key_name === "PRIMARY") continue;
            if (idx.Non_unique !== 0) continue;
            if (parseInt(idx.Seq_in_index) !== 1) continue;

            if (!byColumn.has(idx.Column_name)) byColumn.set(idx.Column_name, new Set());
            byColumn.get(idx.Column_name).add(idx.Key_name);
        }

        for (const [column, keyNames] of byColumn.entries()) {
            if (keyNames.size <= 1) continue;

            const singleColumnKeys = [];
            for (const keyName of keyNames) {
                const cols = indexes.filter((i) => i.Key_name === keyName);
                if (cols.length === 1) singleColumnKeys.push(keyName);
            }
            if (singleColumnKeys.length <= 1) continue;

            const sorted = singleColumnKeys.sort();
            const keep = sorted[0];
            const drop = sorted.slice(1);

            console.log(`جدول "${tableName}" ستون "${column}": نگه‌داشتن "${keep}"، حذف [${drop.join(", ")}]`);
            for (const keyName of drop) {
                await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${keyName}\``);
                totalDropped++;
            }
        }
    }

    console.log(`\n✅ تمام شد. ${totalDropped} ایندکس تکراری حذف شد.`);
    console.log("حالا می‌تونید با خیال راحت npm run dev رو اجرا کنید.");
    process.exit(0);
}

run().catch((error) => {
    console.error("❌ خطا در حین پاک‌سازی ایندکس‌ها:", error);
    process.exit(1);
});
