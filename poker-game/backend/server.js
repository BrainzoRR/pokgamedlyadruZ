const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameLogic = require('./gameLogic');

socket.on('startRound', (roomId) => {
  gameLogic.dealCards(rooms[roomId].players);
  for (const playerId in rooms[roomId].players) {
    const player = rooms[roomId].players[playerId];
    io.to(playerId).emit('receiveCards', player.hand);
  }
  console.log('Карты розданы игрокам.');
});


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (roomId) => {
    rooms[roomId] = {
      players: {},
      smallBlind: 100,
      bigBlind: 200,
      pot: 0,
      timer: null,
      dealer: null,
    };
    socket.join(roomId);
    console.log(`Room created: ${roomId}`);
  });

  socket.on('joinRoom', (roomId, playerName) => {
    if (rooms[roomId] && Object.keys(rooms[roomId].players).length < 6) {
      rooms[roomId].players[socket.id] = {
        name: playerName,
        chips: 10000,
        isFolded: false,
        bet: 0,
      };
      socket.join(roomId);
      io.to(roomId).emit('updatePlayers', rooms[roomId].players);

      if (!rooms[roomId].timer) {
        startBlindsTimer(roomId);
      }
    }
  });

  socket.on('placeBet', (roomId, betAmount) => {
    const player = rooms[roomId].players[socket.id];
    if (player.chips >= betAmount) {
      player.chips -= betAmount;
      player.bet += betAmount;
      rooms[roomId].pot += betAmount;
      io.to(roomId).emit('updatePlayers', rooms[roomId].players);
      io.to(roomId).emit('updatePot', rooms[roomId].pot);
    }
  });

  socket.on('fold', (roomId) => {
    rooms[roomId].players[socket.id].isFolded = true;
    io.to(roomId).emit('updatePlayers', rooms[roomId].players);
  });

  socket.on('endRound', (roomId, communityCards) => {
    const winners = gameLogic.determineWinner(rooms[roomId].players, communityCards);
    if (winners.length > 0) {
      gameLogic.splitPot(winners, rooms[roomId].pot);
      io.to(roomId).emit('roundEnd', {
        winners: winners.map(player => player.name),
        winningHand: winners[0].hand,
        pot: rooms[roomId].pot,
      });
      rooms[roomId].pot = 0;
      io.to(roomId).emit('updatePlayers', rooms[roomId].players);
    }
    checkGameEnd(roomId);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit('updatePlayers', rooms[roomId].players);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

function startBlindsTimer(roomId) {
  rooms[roomId].timer = setInterval(() => {
    rooms[roomId].smallBlind *= 2;
    rooms[roomId].bigBlind *= 2;
    io.to(roomId).emit('updateBlinds', {
      smallBlind: rooms[roomId].smallBlind,
      bigBlind: rooms[roomId].bigBlind,
    });
  }, 300000);
}

function checkGameEnd(roomId) {
  const players = rooms[roomId].players;
  const activePlayers = Object.values(players).filter(player => player.chips > 0);

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    io.to(roomId).emit('gameEnd', { winner: winner.name });
    console.log(`Игра завершена! Победитель: ${winner.name}`);
    clearInterval(rooms[roomId].timer);
    delete rooms[roomId];
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

