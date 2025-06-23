import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// ✅ Use environment variable for backend URL
const API_URL = import.meta.env.VITE_API_URL;
const socket: Socket = io(API_URL); // <-- dynamic backend URL

interface RoomState {
  board: (string | null)[];
  players: string[];
  turn: 'X' | 'O';
  winnerLine?: number[];
}

const Cell: React.FC<{ value: string | null; onClick: () => void; highlight: boolean }> = ({ value, onClick, highlight }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`w-24 h-24 flex items-center justify-center text-3xl font-extrabold rounded-lg shadow-md
      ${highlight ? 'bg-indigo-200' : 'bg-white'}
      hover:shadow-lg transition-shadow duration-200`}
  >
    {value}
  </motion.button>
);

const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [symbol, setSymbol] = useState<'X' | 'O' | null>(null);
  const [state, setState] = useState<RoomState>({ board: Array(9).fill(null), players: [], turn: 'X' });
  const [status, setStatus] = useState<string>('Waiting for players...');

  useEffect(() => {
    socket.on('joined', (data: { symbol: 'X' | 'O' }) => {
      setSymbol(data.symbol);
      setJoined(true);
      setStatus(`Joined as ${data.symbol}`);
    });
    socket.on('full', () => setStatus('Room is full'));
    socket.on('state', (room: RoomState) => {
      setState(room);
      setStatus(room.turn === symbol ? 'Your turn' : "Opponent's turn");
    });
    socket.on('gameOver', (data: { winner: 'X' | 'O' | null; disconnected: boolean }) => {
      if (data.disconnected) setStatus('Opponent disconnected');
      else if (data.winner === null) setStatus('Draw!');
      else setStatus(data.winner === symbol ? 'You win!' : 'You lose.');
    });
    return () => { socket.off(); };
  }, [symbol]);

  const joinRoom = () => {
    if (roomId.trim()) socket.emit('join', roomId);
  };

  const play = useCallback((idx: number) => {
    if (!joined || state.board[idx] || state.turn !== symbol) return;
    socket.emit('play', { roomId, index: idx, symbol });
  }, [joined, state.board, state.turn, symbol, roomId]);

  const reset = () => {
    socket.emit('reset', roomId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mb-6">Tic‑Tac‑Toe</h1>
        {!joined ? (
          <div className="space-y-4">
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={joinRoom}
              className="w-full py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
            >
              Join Game
            </button>
            <p className="text-center text-gray-600">{status}</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-center mb-4 text-gray-700">{status}</h2>
              <div className="grid grid-cols-3 gap-3">
                {state.board.map((cell, i) => (
                  <Cell
                    key={i}
                    value={cell}
                    onClick={() => play(i)}
                    highlight={state.winnerLine?.includes(i) ?? false}
                  />
                ))}
              </div>
              <AnimatePresence>
                {status.includes('win') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 text-center text-green-600 font-bold"
                  >
                    Game Over
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={reset}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                <RefreshCw className="mr-2" /> Reset
              </button>
            </div>
            <div className="w-full md:w-1/3 bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Players</h3>
              <ul className="space-y-2">
                {state.players.map((p, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <span
                      className={`w-4 h-4 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-pink-500'}`}
                    />
                    <span className="text-gray-800">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
