const canvasRouter = require('express').Router();
const authController = require('../controllers/authController');

canvasRouter.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
      msg = JSON.parse(msg)
      switch (msg.method) {
          case "connection":
              connectionHandler(ws, msg)
              break
          case "draw":
              broadcastConnection(ws, msg)
              break
      }
  })
})

module.exports = canvasRouter;