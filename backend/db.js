const { Sequelize } = require("sequelize");
const configs = require("./configs");

// فقط ساخت instance سکوئلایز. مقداردهی اولیه‌ی مدل‌ها و تعریف روابط
// در models/index.js انجام می‌شه (اونجا مرکز واحد مدل‌هاست).
const sequelize = new Sequelize(
  configs.db.name,
  configs.db.user,
  configs.db.password,
  {
    host: configs.db.host,
    port: configs.db.port,
    dialect: configs.db.dialect,
    logging: false,
    pool: {
      max: configs.db.poolSize,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = { sequelize };
