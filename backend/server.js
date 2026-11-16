require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const configs = require("./configs");
const { sequelize } = require("./models");
const { initSocket } = require("./sockets");
const { seedInitialAdmin } = require("./scripts/seedInitialAdmin");
const { initRedis } = require("./redis");

// cron-jobs
require("./jobs/quizStatusJob");
require("./jobs/tuitionPaymentJob");
require("./jobs/tuitionPaymentCheckJob");
require("./jobs/dailyReportCheckJob");
require("./jobs/analysisExamCheckJob");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://visionacademii.ir",
        credentials: true,
    },
});
initSocket(io);
app.set("io", io);

async function start() {
    try {
        await initRedis();

        await sequelize.authenticate();
        console.log("✅ Database connection established.");

        await sequelize.sync({ alter: true });
        console.log("✅ Models synced with database (alter mode).");

        await seedInitialAdmin();

        server.listen(configs.port, "0.0.0.0", () => {
            console.log(`🚀 Server running on http://api.visionacademii.ir:${configs.port}`);
        });
    } catch (error) {
        console.error("❌ Unable to start server:", error);
        process.exit(1);
    }
}

start();
