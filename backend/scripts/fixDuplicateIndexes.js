/**
 * اسکریپت یک‌بار-مصرف برای رفع خطای ER_TOO_MANY_KEYS (errno 1069).
 *
 * علت خطا: تا قبل از این تغییر، فیلدهای unique در مدل‌ها با unique: true
 * (بدون اسم) تعریف شده بودن. روی MySQL، هر بار که sequelize.sync({alter:true})
 * اجرا می‌شه (که توی server.js هر بار ری‌استارت nodemon در dev اجرا می‌شه)،
 * Sequelize نمی‌تونه این ایندکس‌های بی‌نام رو با ایندکس از قبل موجود در
 * دیتابیس تطبیق بده، پس هر بار یک UNIQUE KEY جدید و تکراری روی همون ستون
 * اضافه می‌کنه. بعد از چندین بار ری‌استارت، تعداد کلیدهای جدول از سقف ۶۴
 * تایی MySQL رد می‌شه و کل sync با خطا متوقف می‌شه.
 *
 * توی مدل‌ها این مشکل رفع شده (حالا هر unique constraint یک اسم ثابت داره
 * تا Sequelize دیگه این اشتباه رو تکرار نکنه)، ولی این اسکریپت برای پاک‌سازی
 * کلیدهای تکراری‌ای هست که همین الان توی دیتابیس شما جمع شده.
 *
 * اجرا (فقط یک‌بار، قبل از npm run dev):
 *   node scripts/fixDuplicateIndexes.js
 */

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

        // فقط ایندکس‌های تک‌ستونیِ UNIQUE (Non_unique = 0) رو بررسی می‌کنیم،
        // PRIMARY رو دست نمی‌زنیم، و composite index ها (بیشتر از یک ستون
        // با یک اسم) رو دست نمی‌زنیم چون عمداً ترکیبی تعریف شدن.
        const byColumn = new Map();
        for (const idx of indexes) {
            if (idx.Key_name === "PRIMARY") continue;
            if (idx.Non_unique !== 0) continue;
            if (parseInt(idx.Seq_in_index) !== 1) continue; // فقط ستون اول رو می‌بینیم، composite هارو رد می‌کنیم پایین‌تر

            if (!byColumn.has(idx.Column_name)) byColumn.set(idx.Column_name, new Set());
            byColumn.get(idx.Column_name).add(idx.Key_name);
        }

        for (const [column, keyNames] of byColumn.entries()) {
            // اگر فقط یک ایندکس یونیک روی این ستون هست، مشکلی نیست.
            if (keyNames.size <= 1) continue;

            // بررسی کن که هرکدوم از این key ها واقعاً تک‌ستونی هستن (composite نباشن)
            const singleColumnKeys = [];
            for (const keyName of keyNames) {
                const cols = indexes.filter((i) => i.Key_name === keyName);
                if (cols.length === 1) singleColumnKeys.push(keyName);
            }
            if (singleColumnKeys.length <= 1) continue;

            // یکی رو نگه دار (اولی به ترتیب الفبایی)، بقیه رو حذف کن
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
