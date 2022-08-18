/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
require('dotenv').config(); // подключение переменных env

const express = require('express'); // подключение  express
const morgan = require('morgan'); // подключение  morgan
const path = require('path');
const cookieParser = require('cookie-parser');

const cors = require('cors');

const app = express(); // создание версии сервера express'a

const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'https://ekivokifront.vercel.app',
    credentials: true,
  },
});

const { prisma } = require('@prisma/client');
const errorMiddleware = require('./src/middlewares/error-middleware');

const { PORT } = process.env; // получение переменных env

const corsOptions = {
  origin: [process.env.CLIENT_URL],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
};

app.use(cors(corsOptions));

app.use(cookieParser());

const authRouter = require('./src/routes/authRouter');
const gameRouter = require('./src/routes/gameRouter');
const ACTIONS = require('./src/actions/wsActions');
const gameControllers = require('./src/controllers/gameControllers');
const gameService = require('./src/service/gameService');
const questionRouter = require('./src/routes/questionRouter');
const GAME_STATUS = require('./src/actions/gameStatus');

// const authMiddleware = require('./src/middlewares/authMiddleware');

app.use(express.static(path.join(__dirname, 'public'))); // подключение  public директории

app.use(morgan('dev')); // добавление настроек и инициализация morgan

app.use(express.urlencoded({ extended: true })); // добавление отлова post запросов.
app.use(express.json()); // парсинг post запросов в json.

app.use('/auth', authRouter);
app.use('/game', gameRouter);
app.use('/question', questionRouter);

// app.ws('/game/:id', GameController.start);

// app.ws('/canvas', (ws, reNumber(rooms)(ws, mesg);
//         break;
//       case 'draw':
//         broadcastConnection(ws, mesg);
//         break;

//       default:
//         break;
//     }
//   });
// });
// const connectionHandler = (ws, msg) => {
//   ws.id = msg.id;
//   broadcastConnection(ws, msg);
// };

// const broadcastConnection = (ws, msg) => {
//   aWss.clients.forEach((client) => {
//     client.send(JSON.stringify(msg));
//     if (client.id === msg.id) {
//     }
//   });
// };
// io.on('connection', (socket) => {
//   // console.log('socket connection', socket.id);
//   socket.on('join_room', (msg) => {
//     // console.log(msg);
//     socket.join(msg.id);
//     socket.to(msg.id).emit('resive_message', msg);
//   });
//   socket.on('send_message', (msg) => {
//     socket.to(msg.id).emit('resive_message', msg);
//   });
//   // const message = JSON.parse(msg);
//   /* switch (message.method) {
//       case 'connection':
//         gameService.gameConnections(ws, mesg);
//         break;
//       case 'draw':
//         // broadcastConnection(ws, mesg);
//         break;

//       default:
//         break;
//     } */
//   // socket.broadcast.emit('resive_message', msg);
// });

// const connectionHandler = (ws, msg) => {
//   ws.id = msg.id;
//   broadcastConnection(ws, msg);
// };

// const broadcastConnection = (ws, msg) => {
//   aWss.clients.forEach((client) => {
//     client.send(JSON.stringify(msg));
//     if (client.id === msg.id) {
//     }
//   });
// };

// удаляет раз в пол часа все нестартовавшие игры в статусе created
async function clearVoidRooms() {
  const clearInterval = setInterval(async () => {
    const dateNow = new Date();
    await gameService.deletGamesOnDate(dateNow);
    // // console.log('udalil');
  }, 60 * 30 * 1000);
}
clearVoidRooms();

async function getClientRooms() {
  const { rooms } = io.sockets.adapter;

  const allgamePading = await gameService.searchGame();
  const arrGame = Array.from(rooms.keys());

  const newarrGame = allgamePading.filter((game) => arrGame.includes(String(game.id)));

  return newarrGame;
}

async function shareRoomsInfo() {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: await getClientRooms(),
  });
}

io.on('connection', (socket) => {
  shareRoomsInfo();
  // // console.log('socket connection');
  socket.on(ACTIONS.SHARE_ROOMS, () => {
    shareRoomsInfo();
  });

  socket.on(ACTIONS.JOIN, (config) => {
    const { room: roomID } = config;
    // // console.log('roomID', roomID);
    const { rooms: joinedRooms } = socket;

    if (!Number.isNaN(Number(roomID))) {
      gameService.changePlayersCount(Number(roomID), 'increment');
    }
    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

    clients.forEach((clientID) => {
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false,
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    socket.join(roomID);
    gameService.changeStatusGame(Number(roomID), GAME_STATUS.IN_LOBBY);
    shareRoomsInfo();
  });

  // вход игрока в существующую игру:
  socket.on('playerJoined', (msg) => {
    // // console.log('playerJoined', msg.roomID);
    msg.user.socket = socket.id;
    io.to(msg.roomID).emit('playerJoined', msg.user);
  });
  socket.on('sendNewGameState', (msg) => {
    setTimeout(() => {
      socket.to(msg.roomID).emit('sendNewGameStateBack', msg);
    }, 2000);
  });

  socket.on('modalAnswer', (msg) => {
    socket.to(msg.roomID).emit('modalAnswerOpen', msg);
  });

  socket.on('modalClose', (msg) => {
    socket.to(msg.roomID).emit('modalCloseFromBack', '');
  });

  socket.on('draw_server', (msg) => {
    socket.to(msg.roomID).emit('draw', msg);
  });

  socket.on('boardVisible', (msg) => {
    // // console.log('boardVisible.roomID: ', msg.roomID);
    io.to(msg.roomID).emit('OpenBoard', msg);
  });

  socket.on('exit_game_host', (msg) => {
    // // console.log('exit_game_host.roomID: ', msg.roomID);
    io.to(msg.roomID).emit('exit_game_host', msg);
  });

  socket.on('exit_game', (msg) => {
    // // console.log('exit_game.roomID: ', msg.roomID);
    io.to(msg.roomID).emit('exit_game', msg);
  });
  socket.on('endGame', (msg) => {
    // // console.log('msgendGame: ', msg);
    socket.to(msg.roomID).emit('EndGame', msg);
    gameService.finishGame(msg);
  });

  socket.on('f5', (msg) => {
    msg.user.socket = socket.id;
    // // console.log('Принял сообщение что кто то слетел', msg);
    socket.to(msg.roomID).timeout(2000).emit('f5', msg);
  });

  socket.on('disconnect', () => {
    // // console.log('zashel v disconect ***************');
    leaveRoom();
  });

  function leaveRoom() {
    const { rooms } = socket;
    // // console.log('zashwl v liv', rooms);
    Array.from(rooms).forEach((roomID) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
      // // console.log('clients', clients);
      clients.forEach((clientID) => {
        io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
          peerID: socket.id,
        });

        socket.emit(ACTIONS.REMOVE_PEER, {
          peerID: clientID,
        });
      });
      // // console.log(Number(roomID));
      if (!Number.isNaN(Number(roomID))) {
        gameService.changePlayersCount(Number(roomID), 'decrement');
      }
      // // console.log('zashwl posle lib liv', rooms);
      socket.leave(roomID);
    });
    shareRoomsInfo();
  }

  socket.on(ACTIONS.LEAVE, () => {
    leaveRoom();
  });
  socket.on('disconnecting', () => {
    // // console.log('zashel v disconect');
    leaveRoom();
  });

  socket.on(ACTIONS.RELAY_SDP, ({ peerID, sessionDescription }) => {
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription,
    });
  });

  socket.on(ACTIONS.RELAY_ICE, ({ peerID, iceCandidate }) => {
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate,
    });
  });
});

app.use(errorMiddleware);
server.listen(PORT, async () => {
  console.log(`Сервер запущен на порте ${PORT}! `);
});
