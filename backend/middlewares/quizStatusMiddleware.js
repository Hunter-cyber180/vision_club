const QuizStatusService = require('../services/quizStatusService');

async function checkQuizStatus(req, res, next) {
    try {
        // Checking the status of tests before each request
        await QuizStatusService.updateQuizStatuses();
        next();
    } catch (error) {
        console.error('Middleware error:', error);
        next();
    }
}

module.exports = checkQuizStatus;
