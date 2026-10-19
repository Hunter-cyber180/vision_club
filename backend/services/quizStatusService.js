// services/quizStatusService.js
const { Quiz, sequelize } = require("../models");
const { Op } = require("sequelize");

class QuizStatusService {
    static async updateQuizStatuses() {
        try {
            const now = new Date();
            
            // 1. به‌روزرسانی آزمون‌هایی که زمان شروعشان رسیده
            const quizzesToStart = await Quiz.findAll({
                where: {
                    status: "not-held",
                    scheduled_at: {
                        [Op.lte]: now // زمان برگزاری <= الان
                    }
                }
            });

            for (const quiz of quizzesToStart) {
                await quiz.update({ status: "ongoing" });
                console.log(`✅ Quiz "${quiz.title}" started at ${now}`);
            }

            // 2. به‌روزرسانی آزمون‌هایی که زمان پایانشان رسیده
            const quizzesToEnd = await Quiz.findAll({
                where: {
                    status: "ongoing",
                    [Op.and]: [
                        {
                            scheduled_at: {
                                [Op.lte]: now
                            }
                        },
                        {
                            // scheduled_at + time_minutes <= now
                            [Op.and]: [
                                sequelize.literal(
                                    `DATE_ADD(scheduled_at, INTERVAL time_minutes MINUTE) <= NOW()`
                                )
                            ]
                        }
                    ]
                }
            });

            for (const quiz of quizzesToEnd) {
                await quiz.update({ status: "held" });
                console.log(`✅ Quiz "${quiz.title}" finished at ${now}`);
            }

            return {
                started: quizzesToStart.length,
                ended: quizzesToEnd.length
            };
        } catch (error) {
            console.error("Error updating quiz statuses:", error);
            throw error;
        }
    }
}

module.exports = QuizStatusService;
