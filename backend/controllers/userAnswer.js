const { UserAnswer: UserAnswerModel, Question: QuestionModel, Option: OptionModel, UserQuiz: UserQuizModel, sequelize } = require("../models");

/**
   * 4. ثبت پاسخ کاربر و تصحیح خودکار
   */
exports.submitAnswers = async (request, response) => {
  const transaction = await sequelize.transaction();

  try {
    const { quizId } = request.params;
    const { user_id, answers } = request.body;

    // answers می‌تواند خالی یا شامل تعدادی از سوالات باشد
    if (!answers || !Array.isArray(answers))
      return response.status(400).json({
        success: false,
        message: 'پاسخ‌ها باید به صورت آرایه ارسال شوند'
      });

    let score = 0;
    let totalQuestions = 0;
    let unansweredCount = 0;
    const results = [];

    // دریافت تمام سوالات این آزمون
    const questions = await QuestionModel.findAll({
      where: { quiz_id: quizId },
      include: [{
        model: OptionModel,
        as: 'options'
      }]
    });

    const totalQuizQuestions = questions.length;

    // حلقه روی پاسخ‌های ارسال شده
    for (const answerData of answers) {
      const { question_id, selected_option_id } = answerData;

      // پیدا کردن سوال
      const question = questions.find(q => q.id === question_id);
      if (!question)
        throw new Error(`سوال با شناسه ${question_id} در این آزمون وجود ندارد`);

      // بررسی اینکه گزینه متعلق به این سوال باشد
      const selectedOption = question.options.find(opt => opt.id === selected_option_id);
      if (!selectedOption)
        throw new Error(`گزینه ${selected_option_id} متعلق به سوال ${question_id} نیست`);

      // بررسی درستی پاسخ
      const isCorrect = selectedOption.is_correct;
      if (isCorrect) score++;

      // ذخیره پاسخ کاربر
      await UserAnswerModel.create({
        user_id,
        question_id,
        selected_option_id,
        is_correct: isCorrect
      }, { transaction });

      totalQuestions++;
      results.push({
        question_id,
        selected_option_id,
        is_correct: isCorrect,
        status: 'answered'
      });
    }

    // محاسبه تعداد سوالات بی‌پاسخ
    const answeredQuestionIds = answers.map(a => a.question_id);
    const unansweredQuestions = questions.filter(q => !answeredQuestionIds.includes(q.id));
    unansweredCount = unansweredQuestions.length;

    const scorePercentage = totalQuizQuestions > 0
      ? parseFloat(((score / totalQuizQuestions) * 100).toFixed(2))
      : 0;

    // خلاصه‌ی نتیجه در UserQuiz ذخیره/به‌روزرسانی می‌شود (برای گزارش‌ها و کارنامه)
    const [userQuiz] = await UserQuizModel.findOrCreate({
      where: { user_id, quiz_id: quizId },
      defaults: { score_percentage: scorePercentage },
      transaction
    });
    if (userQuiz.score_percentage !== scorePercentage) {
      userQuiz.score_percentage = scorePercentage;
      await userQuiz.save({ transaction });
    }

    await transaction.commit();

    return response.status(200).json({
      success: true,
      message: 'پاسخ‌ها با موفقیت ثبت شد',
      data: {
        total_questions: totalQuizQuestions,
        answered_questions: totalQuestions,
        unanswered_questions: unansweredCount,
        correct_answers: score,
        wrong_answers: totalQuestions - score,
        score_percentage: parseFloat(((score / totalQuizQuestions) * 100).toFixed(2)),
        details: results,
        unanswered_question_ids: unansweredQuestions.map(q => q.id) // لیست سوالات بی‌پاسخ
      }
    });

  } catch (error) {
    await transaction.rollback();
    return response.status(500).json({
      success: false,
      message: "Error submiting asnwers!",
      error: error.message
    });
  }
}

/**
 * دریافت کارنامه کامل یک کاربر برای یک آزمون خاص
 * شامل: پاسخ‌های درست، غلط، بی‌پاسخ و جزئیات هر سوال
 */
exports.getUserResult = async (request, response) => {
  try {
    const { quizId, userId } = request.params;

    // 1. دریافت همه سوالات آزمون به همراه گزینه‌ها
    const questions = await QuestionModel.findAll({
      where: { quiz_id: quizId },
      include: [{
        model: OptionModel,
        as: 'options'
      }],
      order: [['order_number', 'ASC']]
    });

    if (questions.length === 0)
      return response.status(404).json({
        success: false,
        message: 'آزمون مورد نظر سوالی ندارد'
      });

    // 2. دریافت پاسخ‌های ثبت شده این کاربر برای این آزمون
    const userAnswers = await UserAnswerModel.findAll({
      where: {
        user_id: userId
      },
      include: [{
        model: QuestionModel,
        as: 'question',
        where: { quiz_id: quizId },
        required: true,
        include: [{
          model: OptionModel,
          as: 'options'
        }]
      }, {
        model: OptionModel,
        as: 'selectedOption'
      }]
    });

    // 3. ایجاد لیست کامل از وضعیت هر سوال
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const questionDetails = [];

    for (const question of questions) {
      // پیدا کردن پاسخ کاربر برای این سوال
      const userAnswer = userAnswers.find(a => a.question_id === question.id);
      
      let status = 'unanswered'; // وضعیت: answered, unanswered
      let selectedOption = null;
      let isCorrect = null;
      let correctOption = null;

      // پیدا کردن گزینه صحیح (برای نمایش در کارنامه)
      const correctOptionObj = question.options.find(opt => opt.is_correct === true);
      if (correctOptionObj)
        correctOption = {
          id: correctOptionObj.id,
          text: correctOptionObj.option_text
        };

      if (userAnswer) {
        // کاربر پاسخ داده
        selectedOption = {
          id: userAnswer.selected_option_id,
          text: userAnswer.selectedOption ? userAnswer.selectedOption.option_text : null
        };
        isCorrect = userAnswer.is_correct;
        status = isCorrect ? 'correct' : 'wrong';
        
        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        // کاربر پاسخ نداده
        unansweredCount++;
      }

      // اضافه کردن جزئیات سوال به لیست
      questionDetails.push({
        question_id: question.id,
        order_number: question.order_number,
        question_text: question.question_text,
        question_type: question.question_type,
        status: status, // 'correct', 'wrong', 'unanswered'
        user_answer: selectedOption,
        correct_answer: correctOption,
        // اگر پاسخ غلط است، گزینه صحیح را هم نشان بده
        // (این کار برای یادگیری کاربر مفید است)
        options: question.options.map(opt => ({
          id: opt.id,
          text: opt.option_text,
          is_correct: opt.is_correct // برای نمایش در کارنامه مدیریت
        }))
      });
    }

    const totalQuestions = questions.length;
    const answeredCount = correctCount + wrongCount;

    // 4. برگرداندن پاسخ نهایی
    return response.status(200).json({
      success: true,
      data: {
        summary: {
          user_id: parseInt(userId),
          quiz_id: parseInt(quizId),
          total_questions: totalQuestions,
          answered_questions: answeredCount,
          unanswered_questions: unansweredCount,
          correct_answers: correctCount,
          wrong_answers: wrongCount,
          score_percentage: parseFloat(((correctCount / totalQuestions) * 100).toFixed(2))
        },
        details: questionDetails,
        // لیست سوالات بی‌پاسخ (برای نمایش جداگانه)
        unanswered_list: questionDetails
          .filter(q => q.status === 'unanswered')
          .map(q => ({
            id: q.question_id,
            order: q.order_number,
            text: q.question_text
          })),
        // لیست سوالات غلط (برای نمایش جداگانه)
        wrong_list: questionDetails
          .filter(q => q.status === 'wrong')
          .map(q => ({
            id: q.question_id,
            order: q.order_number,
            text: q.question_text,
            user_answer: q.user_answer,
            correct_answer: q.correct_answer
          }))
      }
    });

  } catch (error) {
    return response.status(500).json({
      success: false,
      message: 'خطا در دریافت کارنامه',
      error: error.message
    });
  }
}
