const { Quiz: QuizModel, Question: QuestionModel, Option: OptionModel, sequelize } = require("../models");

// لیست همه‌ی آزمون‌ها (به همراه تعداد سوالات)
exports.index = async (request, response) => {
  try {
    const quizzes = await QuizModel.findAll({
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('questions.id')), 'questions_count']
        ]
      },
      include: [{
        model: QuestionModel,
        as: 'questions',
        attributes: []
      }],
      group: ['Quiz.id'],
      order: [['scheduled_at', 'DESC']]
    });

    return response.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Error getting quizzes",
      error: error.message
    });
  }
}

/**
 * نمایش یک آزمون به همراه تمام سوالات و گزینه‌هایش
 * (پاسخ صحیح/is_correct برای دانش‌آموز نمایش داده نمی‌شود)
 */
exports.getOne = async (request, response) => {
  try {
    const { id } = request.params;

    const quiz = await QuizModel.findByPk(id, {
      include: [{
        model: QuestionModel,
        as: 'questions',
        order: [['order_number', 'ASC']],
        include: [{
          model: OptionModel,
          as: 'options',
          order: [['order_number', 'ASC']]
        }]
      }]
    });

    if (!quiz)
      return response.status(404).json({
        success: false,
        message: "Quiz not found!"
      });

    const isPrivileged = request.role === "admin" || request.role === "consultant";

    const quizData = quiz.toJSON();
    if (!isPrivileged) {
      quizData.questions = (quizData.questions || []).map(question => ({
        ...question,
        options: (question.options || []).map(({ is_correct, ...rest }) => rest)
      }));
    }

    return response.status(200).json({
      success: true,
      data: quizData
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Error getting quiz",
      error: error.message
    });
  }
}

/**
 * ساخت یک آزمون جدید (فقط خود آزمون، بدون سوالات - سوالات جدا اضافه می‌شوند)
 */
exports.create = async (request, response) => {
  try {
    const { title, description, scheduled_at, answersheet_link, time_minutes, major, grade, question_count } = request.body;

    if (!title || !scheduled_at || !time_minutes)
      return response.status(400).json({
        success: false,
        message: "عنوان، تاریخ برگزاری و مدت زمان آزمون الزامی است"
      });

    const quiz = await QuizModel.create({
      title,
      description,
      scheduled_at,
      answersheet_link,
      time_minutes,
      major,
      grade,
      question_count,
      status: "not-held"
    });

    return response.status(201).json({
      success: true,
      data: quiz
    });

  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Error creating quiz",
      error: error.message
    });
  }
}

exports.update = async (request, response) => {
  try {
    const { quizId } = request.params;
    const { title, description, scheduled_at, answersheet_link, time_minutes, major, grade, question_count, status } = request.body;
    const quiz = await QuizModel.findByPk(quizId);
    if (!quiz)
      return response.status(404).json({
        success: false,
        message: "Quiz not found!"
      });

    await quiz.update({
      title: title ?? quiz.title,
      description: description ?? quiz.description,
      scheduled_at: scheduled_at ?? quiz.scheduled_at,
      answersheet_link: answersheet_link ?? quiz.answersheet_link,
      time_minutes: time_minutes ?? quiz.time_minutes,
      major: major ?? quiz.major,
      grade: grade ?? quiz.grade,
      question_count: question_count ?? quiz.question_count,
      status: status ?? quiz.status
    })

    return response.status(200).json({
      success: true,
      message: "Quiz updated successfully.",
      data: quiz
    });

  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Error updating quiz",
      error: error.message
    });
  }
}

/**
 * حذف یک آزمون (به همراه سوالات و گزینه‌ها به صورت آبشاری)
 */
exports.delete = async (request, response) => {
  try {
    const { id } = request.params;

    const quiz = await QuizModel.findByPk(id);
    if (!quiz)
      return response.status(404).json({
        success: false,
        message: "Quiz not found!"
      });

    await quiz.destroy();

    return response.status(200).json({
      success: true,
      message: "Quiz deleted successfully."
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: "Error deleting quiz",
      error: error.message
    });
  }
}
