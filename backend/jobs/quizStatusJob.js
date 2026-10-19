const cron = require('node-cron');
const QuizStatusService = require('../services/quizStatusService');

// runs every minute
cron.schedule('* * * * *', async () => {
    console.log('Running quiz status update job...');
    try {
        const result = await QuizStatusService.updateQuizStatuses();
        if (result.started > 0 || result.ended > 0) {
            console.log(`Updated: ${result.started} started, ${result.ended} ended`);
        }
    } catch (error) {
        console.error('Quiz status job failed:', error);
    }
});

console.log('Quiz status cron job scheduled (runs every minute)');
