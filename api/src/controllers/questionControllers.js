/* eslint-disable class-methods-use-this */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class QuestionController {
  async getQuestion(req, res, next) {
    const { id } = req.body;
    try {
      const question = await prisma.card.findUnique({ where: { id } });
      // // console.log('question: ', question);
      res.json(question);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuestionController();
