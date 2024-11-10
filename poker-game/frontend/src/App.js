import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

function App() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [pot, setPot] = useState(0);
  const [winningHand, setWinningHand] = useState('');
  const [winners, setWinners] = useState([]);
  const [hand, setHand] = useState([]); // Карты игрока

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 7);
    setRoomId(newRoomId);
    socket.emit('createRoom', newRoomId);
  };

  const joinRoom = () => {
    socket.emit('joinRoom', roomId, playerName);
  };

  const placeBet = (betAmount) => {
    socket.emit('placeBet', roomId, betAmount);
  };

  const fold = () => {
    socket.emit('fold', roomId);
  };

  const startRound = () => {
    socket.emit('startRound', roomId);
  };

  useEffect(() => {
    socket.on('updatePlayers', (players) => setPlayers(Object.values(players)));
    socket.on('updatePot', (pot) => setPot(pot));
    socket.on('roundEnd', ({ winners, winningHand, pot }) => {
      setWinners(winners);
      setWinningHand(winningHand);
      alert(`Победители: ${winners.join(', ')} с комбинацией ${winningHand}`);
    });
    socket.on('gameEnd', ({ winner }) => {
      alert(`Игра завершена! Победитель: ${winner}`);
    });
    socket.on('receiveCards', (hand) => {
      setHand(hand);
    });
  }, []);

  return (
    <div>
      <h1>Poker Game</h1>
      <button onClick={createRoom}>Create Room</button>
      <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Enter room ID" />
      <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Enter your name" />
      <button onClick={joinRoom}>Join Room</button>
      <button onClick={startRound}>Start Round</button>
      <button onClick={() => placeBet(100)}>Place Bet</button>
      <button onClick={fold}>Fold</button>
      <h2>Your Hand:</h2>
      <div>
        {hand.length > 0 ? (
          hand.map((card, index) => (
            <span key={index} style={{ marginRight: '10px', fontWeight: 'bold' }}>
              {card}
            </span>
          ))
        ) : (
          <p>No cards dealt yet</p>
        )}
      </div>
      <h2>Pot: {pot}</h2>
      <ul>
        {players.map((player) => (
          <li key={player.name}>{player.name}: {player.chips} chips</li>
        ))}
      </ul>
    </div>
  );
}

export default App;

