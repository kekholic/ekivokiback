const questionRouter = require('express').Router();
const questionControllers = require('../controllers/questionControllers');

questionRouter.post('/', questionControllers.getQuestion);

module.exports = questionRouter;
