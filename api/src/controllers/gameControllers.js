/* eslint-disable class-methods-use-this */
const { PrismaClient } = require('@prisma/client');
const GAME_STATUS = require('../actions/gameStatus');
const gameService = require('../service/gameService');

const prisma = new PrismaClient();

class GameController {
  async createGame(req, res, next) {
    const {
      title, password, maxPlayers, countPlayers, id, username,
    } = req.body;

    try {
      const response = await gameService.createGame(
        title,
        password,
        maxPlayers,
        countPlayers,
        id,
        username,
      );
      response.status = GAME_STATUS.IN_LOBBY;

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async searchGame(req, res, next) {
    try {
      const allGame = await gameService.searchGame();

      res.json(allGame);
    } catch (error) {
      next(error);
    }
  }

  async connectionGame(req, res, next) {
    const { id, user } = req.body;
    try {
      const response = await gameService.connectionGame(id, user);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async addGame(req, res, next) {
    const { id, userId, username } = req.body;

    try {
      const response = await gameService.addGame(id, userId, username);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async checkStatusGame(req, res, next) {
    const { id } = req.body;
    try {
      const status = await gameService.checkStatusGame(id);
      res.json({ status });
    } catch (error) {
      next(error);
    }
  }

  async endGame(req, res, next) { }

  async startGame(req, res, next) {
    const { id, status } = req.body;
    try {
      await gameService.startGame(id, status);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }

  async start(ws, req) {
    ws.on('message', (msg) => {
      const mesg = JSON.parse(msg);
      switch (mesg.method) {
        case 'connection':
          gameService.gameConnections(ws, mesg);
          break;
        case 'draw':
          // broadcastConnection(ws, mesg);
          break;

        default:
          break;
      }
    });
  }
}

module.exports = new GameController();
