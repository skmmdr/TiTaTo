/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useCallback, useEffect } from 'react'

type Player = 'X' | 'O' | null
type BoardState = Player[]

interface Scores {
  X: number
  O: number
  draws: number
}

interface Settings {
  haptics: boolean
  animations: boolean
  skin: 'neon' | 'brutalism' | 'pixel' | 'mayan' | 'samurai' | 'georgian' | 'inca' | 'gaelic'
  difficulty: 'easy' | 'medium' | 'hard'
  showTimer: boolean
}

type WinningLine = number[] | null
type GameMode = 'pvp' | 'ai' | 'timeAttack' | 'tournament' | 'reverse' | 'challenge' | 'blitz' | 'survival'
type Difficulty = 'easy' | 'medium' | 'hard'
type Screen = 'menu' | 'game' | 'settings' | 'modeSelect'
type Skin = 'neon' | 'brutalism' | 'pixel' | 'mayan' | 'samurai' | 'georgian' | 'inca' | 'gaelic'

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const DEFAULT_SETTINGS: Settings = {
  haptics: true,
  animations: true,
  skin: 'neon',
  difficulty: 'medium',
  showTimer: false,
}

function checkWinner(board: BoardState): { winner: Player; line: WinningLine } {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combination }
    }
  }
  return { winner: null, line: null }
}

function checkDraw(board: BoardState): boolean {
  return board.every((cell) => cell !== null)
}

function GlobalStyles({ skin }: { skin: Skin }) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
          html, body { overflow: hidden; height: 100%; }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { filter: drop-shadow(0 0 10px currentColor); }
            50% { filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 30px currentColor); }
          }
          
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes mayan-flicker {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 170, 0, 0.6)); }
            50% { opacity: 0.85; filter: drop-shadow(0 0 15px rgba(255, 170, 0, 0.9)); }
          }
          
          @keyframes stone-pulse {
            0%, 100% { box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3); }
            50% { box-shadow: inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -2px 6px rgba(0,0,0,0.4); }
          }
          
          ${skin === 'pixel' ? `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            .pixel-font { font-family: 'Press Start 2P', monospace !important; }
            .scanlines::before {
              content: '';
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15),
                rgba(0, 0, 0, 0.15) 1px,
                transparent 1px,
                transparent 2px
              );
              pointer-events: none;
              z-index: 100;
            }
          ` : ''}
          
          ${skin === 'mayan' ? `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
            .mayan-font { font-family: 'Cinzel', serif !important; }
            
            .mayan-pattern {
              background-image: 
                linear-gradient(45deg, transparent 45%, rgba(139, 90, 43, 0.1) 45%, rgba(139, 90, 43, 0.1) 55%, transparent 55%),
                linear-gradient(-45deg, transparent 45%, rgba(139, 90, 43, 0.1) 45%, rgba(139, 90, 43, 0.1) 55%, transparent 55%);
              background-size: 20px 20px;
            }
            
            .mayan-border {
              border-image: repeating-linear-gradient(
                90deg,
                #8b5a2b 0px, #8b5a2b 10px,
                #d4a574 10px, #d4a574 20px,
                #8b5a2b 20px, #8b5a2b 30px
              ) 4;
            }
            
            .mayan-glow-x {
              animation: mayan-flicker 2s ease-in-out infinite;
            }
            .mayan-glow-o {
              animation: mayan-flicker 2s ease-in-out infinite 0.3s;
            }
          ` : ''}
          
          ${skin === 'neon' ? `
            .neon-glow-x {
              animation: pulse-glow 2s ease-in-out infinite;
              color: #22d3ee;
            }
            .neon-glow-o {
              animation: pulse-glow 2s ease-in-out infinite;
              color: #f472b6;
            }
          ` : ''}
          
          ${skin === 'samurai' ? `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=swap');
            .samurai-font { font-family: 'Noto Serif JP', serif !important; letter-spacing: 0.05em; }
            
            @keyframes katana-shine {
              0%, 100% { 
                filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 2px rgba(200, 200, 200, 0.8)); 
                transform: scale(1);
              }
              50% { 
                filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 4px rgba(255, 255, 255, 1)); 
                transform: scale(1.02);
              }
            }
            
            @keyframes blood-pulse {
              0%, 100% { 
                filter: drop-shadow(0 0 10px rgba(200, 30, 30, 0.6)) drop-shadow(0 0 3px rgba(255, 50, 50, 0.4)); 
              }
              50% { 
                filter: drop-shadow(0 0 25px rgba(200, 30, 30, 0.9)) drop-shadow(0 0 8px rgba(255, 50, 50, 0.7)); 
              }
            }
            
            @keyframes ink-spread {
              0% { transform: scale(0.8); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes sakura-fall {
              0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(10px) rotate(180deg); opacity: 0; }
            }
            
            @keyframes brush-stroke {
              0% { background-position: 200% center; }
              100% { background-position: 0% center; }
            }
            
            .samurai-glow-x {
              animation: katana-shine 2.5s ease-in-out infinite;
            }
            .samurai-glow-o {
              animation: blood-pulse 2s ease-in-out infinite;
            }
            
            .samurai-pattern {
              background-color: #0a0a0a;
              background-image: 
                radial-gradient(circle at 25% 25%, rgba(30, 58, 95, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(139, 0, 0, 0.08) 0%, transparent 50%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c16.569 0 30 13.431 30 30 0 16.569-13.431 30-30 30C13.431 60 0 46.569 0 30 0 13.431 13.431 0 30 0zm0 5c-13.807 0-25 11.193-25 25s11.193 25 25 25 25-11.193 25-25-11.193-25-25-25z' fill='rgba(255,255,255,0.015)' fill-rule='evenodd'/%3E%3C/svg%3E");
            }
            
            .samurai-wood {
              background: linear-gradient(135deg, #1a1510 0%, #2a2015 50%, #1a1510 100%);
              background-image: 
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 90, 43, 0.05) 2px, rgba(139, 90, 43, 0.05) 4px),
                repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0, 0, 0, 0.1) 8px, rgba(0, 0, 0, 0.1) 10px);
            }
            
            .samurai-border {
              border-image: linear-gradient(180deg, #c41e3a 0%, #8b0000 50%, #c41e3a 100%) 1;
            }
            
            .torii-frame::before,
            .torii-frame::after {
              content: '';
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              width: 120%;
              height: 4px;
              background: linear-gradient(90deg, transparent, #c41e3a, transparent);
            }
            .torii-frame::before { top: 0; }
            .torii-frame::after { bottom: 0; }
            
            .samurai-cell {
              position: relative;
              overflow: hidden;
            }
            .samurai-cell::after {
              content: '';
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, transparent 70%);
              pointer-events: none;
            }
          ` : ''}

          ${skin === 'georgian' ? `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');
            .georgian-font { font-family: 'Playfair Display', serif !important; letter-spacing: 0.02em; }

            @keyframes grape-sway {
              0%, 100% { transform: rotate(-3deg); }
              50% { transform: rotate(3deg); }
            }

            @keyframes gold-shimmer {
              0%, 100% {
                filter: drop-shadow(0 0 5px rgba(218, 165, 32, 0.4));
              }
              50% {
                filter: drop-shadow(0 0 15px rgba(218, 165, 32, 0.8)) drop-shadow(0 0 25px rgba(218, 165, 32, 0.4));
              }
            }

            @keyframes cross-glow {
              0%, 100% {
                filter: drop-shadow(0 0 8px rgba(139, 69, 19, 0.5));
              }
              50% {
                filter: drop-shadow(0 0 20px rgba(139, 69, 19, 0.8)) drop-shadow(0 0 30px rgba(218, 165, 32, 0.3));
              }
            }

            .georgian-glow-x {
              animation: gold-shimmer 3s ease-in-out infinite;
            }
            .georgian-glow-o {
              animation: cross-glow 2.5s ease-in-out infinite;
            }

            .georgian-pattern {
              background-color: #1a0f0a;
              background-image:
                radial-gradient(circle at 20% 30%, rgba(139, 0, 0, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(218, 165, 32, 0.1) 0%, transparent 40%),
                url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L42 38L80 40L42 42L40 80L38 42L0 40L38 38Z' fill='rgba(218,165,32,0.04)'/%3E%3C/svg%3E");
            }

            .georgian-stone {
              background: linear-gradient(145deg, #3d2b1f 0%, #2a1f16 50%, #1f1610 100%);
              box-shadow:
                inset 0 2px 4px rgba(255,255,255,0.05),
                inset 0 -2px 4px rgba(0,0,0,0.3),
                0 4px 12px rgba(0,0,0,0.4);
            }

            .georgian-border {
              border-image: linear-gradient(180deg, #daa520 0%, #8b4513 50%, #daa520 100%) 1;
            }

            .georgian-ornament::before {
              content: '♱';
              position: absolute;
              font-size: 14px;
              color: rgba(218, 165, 32, 0.3);
            }
          ` : ''}

          ${skin === 'inca' ? `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&display=swap');
            .inca-font { font-family: 'Cinzel Decorative', serif !important; letter-spacing: 0.08em; }

            @keyframes inca-glow {
              0%, 100% { 
                filter: drop-shadow(0 0 8px rgba(255, 200, 0, 0.5)) drop-shadow(0 0 2px rgba(255, 150, 0, 0.8)); 
              }
              50% { 
                filter: drop-shadow(0 0 20px rgba(255, 200, 0, 0.8)) drop-shadow(0 0 6px rgba(255, 150, 0, 1)); 
              }
            }

            @keyframes emerald-pulse {
              0%, 100% { 
                filter: drop-shadow(0 0 10px rgba(0, 180, 100, 0.5)); 
              }
              50% { 
                filter: drop-shadow(0 0 25px rgba(0, 180, 100, 0.9)) drop-shadow(0 0 40px rgba(0, 150, 80, 0.4)); 
              }
            }

            @keyframes step-pattern {
              0% { background-position: 0 0; }
              100% { background-position: 40px 40px; }
            }

            .inca-glow-x {
              animation: inca-glow 2.5s ease-in-out infinite;
            }
            .inca-glow-o {
              animation: emerald-pulse 2s ease-in-out infinite;
            }

            .inca-pattern {
              background-color: #0d0d0d;
              background-image:
                radial-gradient(circle at 15% 25%, rgba(180, 100, 0, 0.12) 0%, transparent 35%),
                radial-gradient(circle at 85% 75%, rgba(0, 120, 80, 0.08) 0%, transparent 35%),
                url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm2 2v36h36V2H2zm4 4h28v28H6V6zm2 2v24h24V8H8zm4 4h16v16H12V12zm2 2v12h12V14H14z' fill='rgba(255,200,0,0.025)' fill-rule='evenodd'/%3E%3C/svg%3E");
            }

            .inca-stone {
              background: linear-gradient(145deg, #1f1a14 0%, #15120d 50%, #0f0d0a 100%);
              box-shadow:
                inset 0 2px 4px rgba(255, 200, 0, 0.05),
                inset 0 -2px 4px rgba(0, 0, 0, 0.4),
                0 4px 16px rgba(0, 0, 0, 0.5);
            }

            .inca-border {
              border-image: linear-gradient(180deg, #ffc800 0%, #b87800 50%, #ffc800 100%) 1;
            }

            .inca-step-border {
              border-image: repeating-linear-gradient(
                90deg,
                #ffc800 0px, #ffc800 4px,
                transparent 4px, transparent 8px,
                #00b464 8px, #00b464 12px,
                transparent 12px, transparent 16px
              ) 4;
            }
          ` : ''}

          ${skin === 'gaelic' ? `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
            .gaelic-font { font-family: 'Cinzel', serif !important; letter-spacing: 0.1em; }

            @keyframes celtic-glow {
              0%, 100% { 
                filter: drop-shadow(0 0 8px rgba(0, 150, 80, 0.6)) drop-shadow(0 0 2px rgba(255, 215, 0, 0.8)); 
              }
              50% { 
                filter: drop-shadow(0 0 20px rgba(0, 150, 80, 0.9)) drop-shadow(0 0 6px rgba(255, 215, 0, 1)); 
              }
            }

            @keyframes amber-flicker {
              0%, 100% { 
                filter: drop-shadow(0 0 10px rgba(255, 180, 0, 0.6)); 
              }
              50% { 
                filter: drop-shadow(0 0 25px rgba(255, 180, 0, 0.9)) drop-shadow(0 0 40px rgba(255, 150, 0, 0.4)); 
              }
            }

            @keyframes knot-rotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            .gaelic-glow-x {
              animation: celtic-glow 2.5s ease-in-out infinite;
            }
            .gaelic-glow-o {
              animation: amber-flicker 2s ease-in-out infinite;
            }

            .gaelic-pattern {
              background-color: #0a1a0f;
              background-image:
                radial-gradient(circle at 20% 20%, rgba(0, 100, 50, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 80% 80%, rgba(255, 180, 0, 0.08) 0%, transparent 40%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm0 8c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm0 8c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm0 8c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm0 8c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm0 8c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm-17-17c0 2 2 4 4 4s4-2 4-4-2-4-4-4-4 2-4 4zm34 0c0 2 2 4 4 4s4-2 4-4-2-4-4-4-4 2-4 4z' fill='rgba(0,150,80,0.04)' fill-rule='evenodd'/%3E%3C/svg%3E");
            }

            .gaelic-stone {
              background: linear-gradient(145deg, #1a2f1a 0%, #0f1f0f 50%, #0a150a 100%);
              box-shadow:
                inset 0 2px 4px rgba(0, 150, 80, 0.08),
                inset 0 -2px 4px rgba(0, 0, 0, 0.4),
                0 4px 16px rgba(0, 0, 0, 0.5);
            }

            .gaelic-border {
              border-image: linear-gradient(180deg, #00aa55 0%, #ffb400 50%, #00aa55 100%) 1;
            }

            .gaelic-knot::before {
              content: '❋';
              position: absolute;
              font-size: 12px;
              color: rgba(0, 150, 80, 0.35);
            }
          ` : ''}
        `
      }}
    />
  )
}

function minimax(board: BoardState, depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
  const { winner } = checkWinner(board)
  if (winner === 'O') return 10 - depth
  if (winner === 'X') return depth - 10
  if (checkDraw(board)) return 0

  if (isMaximizing) {
    let maxEval = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O'
        const evaluation = minimax(board, depth + 1, false, alpha, beta)
        board[i] = null
        maxEval = Math.max(maxEval, evaluation)
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) break
      }
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X'
        const evaluation = minimax(board, depth + 1, true, alpha, beta)
        board[i] = null
        minEval = Math.min(minEval, evaluation)
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) break
      }
    }
    return minEval
  }
}

function getBestMove(board: BoardState, difficulty: Difficulty): number {
  const availableMoves = board.map((cell, index) => (cell === null ? index : null)).filter((index): index is number => index !== null)
  if (availableMoves.length === 0) return -1
  if (difficulty === 'easy') return availableMoves[Math.floor(Math.random() * availableMoves.length)]
  if (difficulty === 'medium' && Math.random() < 0.5) return availableMoves[Math.floor(Math.random() * availableMoves.length)]

  let bestMove = availableMoves[0]
  let bestScore = -Infinity
  for (const move of availableMoves) {
    board[move] = 'O'
    const score = minimax(board, 0, false, -Infinity, Infinity)
    board[move] = null
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }
  return bestMove
}

// Theme configuration with all styling properties
function getThemeConfig(skin: Skin) {
  const themes = {
    neon: {
      name: 'Neon Glow',
      icon: '🌟',
      bg: 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950',
      text: 'text-white',
      textMuted: 'text-slate-400',
      card: 'bg-slate-900/80 border border-purple-500/30 backdrop-blur-xl',
      cardHover: 'hover:border-purple-400/50 hover:bg-slate-800/80',
      button: 'bg-slate-800 border border-purple-500/50 hover:bg-slate-700 hover:border-purple-400',
      buttonPrimary: 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25',
      xColor: 'text-cyan-400',
      xGlow: 'drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]',
      xBg: 'bg-cyan-500 shadow-lg shadow-cyan-500/50',
      oColor: 'text-pink-400',
      oGlow: 'drop-shadow-[0_0_10px_rgba(244,114,182,0.8)] drop-shadow-[0_0_20px_rgba(244,114,182,0.4)]',
      oBg: 'bg-pink-500 shadow-lg shadow-pink-500/50',
      boardBg: 'bg-slate-900/90 border border-purple-500/30 backdrop-blur-xl',
      cellBg: 'bg-slate-800/50 hover:bg-slate-700/80 border border-purple-500/20',
      cellFilled: 'bg-slate-800/80 border border-purple-500/30',
      winHighlight: 'ring-4 ring-yellow-400 border-yellow-400/50 bg-yellow-500/10',
      accentColor: 'text-amber-400',
      border: 'border-purple-500/30',
      fontClass: '',
      isPixel: false,
      isBrutalism: false,
      isMayan: false,
      isSamurai: false,
      isGeorgian: false,
      isInca: false,
      isGaelic: false,
    },
    brutalism: {
      name: 'Neo Brutalism',
      icon: '◼️',
      bg: 'bg-amber-50',
      text: 'text-black',
      textMuted: 'text-gray-600',
      card: 'bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      cardHover: 'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5',
      button: 'bg-white border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5',
      buttonPrimary: 'bg-green-400 border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black',
      xColor: 'text-blue-600',
      xGlow: '',
      xBg: 'bg-blue-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      oColor: 'text-red-500',
      oGlow: '',
      oBg: 'bg-red-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      boardBg: 'bg-yellow-300 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      cellBg: 'bg-white border-4 border-black hover:bg-gray-50',
      cellFilled: 'bg-white border-4 border-black',
      winHighlight: 'ring-4 ring-green-500 bg-green-200 border-green-500',
      accentColor: 'text-amber-600',
      border: 'border-black',
      fontClass: 'font-bold',
      isPixel: false,
      isBrutalism: true,
      isMayan: false,
      isSamurai: false,
      isGeorgian: false,
      isInca: false,
      isGaelic: false,
    },
    pixel: {
      name: 'Pixel Art',
      icon: '👾',
      bg: 'bg-[#0f0f23]',
      text: 'text-[#ccc]',
      textMuted: 'text-[#666]',
      card: 'bg-[#1a1a3e] border-4 border-[#4a4a8a]',
      cardHover: 'hover:border-[#6a6aaa]',
      button: 'bg-[#2a2a5e] border-4 border-[#4a4a8a] hover:bg-[#3a3a6e] hover:border-[#6a6aaa]',
      buttonPrimary: 'bg-[#ff6b9d] border-4 border-[#ff8fb3] text-white',
      xColor: 'text-[#00ffcc]',
      xGlow: 'drop-shadow-[0_0_8px_rgba(0,255,204,0.6)]',
      xBg: 'bg-[#00ffcc] text-[#0f0f23] border-4 border-[#00ffcc]',
      oColor: 'text-[#ff6b9d]',
      oGlow: 'drop-shadow-[0_0_8px_rgba(255,107,157,0.6)]',
      oBg: 'bg-[#ff6b9d] text-white border-4 border-[#ff6b9d]',
      boardBg: 'bg-[#1a1a3e] border-4 border-[#6a6aaa]',
      cellBg: 'bg-[#0f0f23] border-2 border-[#3a3a6a] hover:border-[#5a5a8a]',
      cellFilled: 'bg-[#0f0f23] border-2 border-[#4a4a8a]',
      winHighlight: 'border-4 border-[#ffcc00] bg-[#ffcc00]/20',
      accentColor: 'text-[#ffcc00]',
      border: 'border-[#4a4a8a]',
      fontClass: 'pixel-font',
      isPixel: true,
      isBrutalism: false,
      isMayan: false,
      isSamurai: false,
      isGeorgian: false,
      isInca: false,
      isGaelic: false,
    },
    mayan: {
      name: 'Mayan Temple',
      icon: '🏛️',
      bg: 'bg-gradient-to-b from-[#2d1810] via-[#3d2314] to-[#1a0f0a]',
      text: 'text-[#f5deb3]',
      textMuted: 'text-[#b8860b]',
      card: 'bg-[#4a3728] border-4 border-[#8b5a2b] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.3)]',
      cardHover: 'hover:border-[#d4a574] hover:bg-[#5a4738]',
      button: 'bg-[#5a4030] border-4 border-[#8b5a2b] hover:bg-[#6a5040] hover:border-[#a06830]',
      buttonPrimary: 'bg-gradient-to-r from-[#d4a574] to-[#8b5a2b] border-4 border-[#d4a574] text-[#1a0f0a] shadow-lg',
      xColor: 'text-[#ffd700]',
      xGlow: 'drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]',
      xBg: 'bg-[#ffd700] text-[#1a0f0a] border-4 border-[#daa520]',
      oColor: 'text-[#cd853f]',
      oGlow: 'drop-shadow-[0_0_8px_rgba(205,133,63,0.6)]',
      oBg: 'bg-[#cd853f] text-[#1a0f0a] border-4 border-[#8b4513]',
      boardBg: 'bg-[#3d2817] border-4 border-[#8b5a2b] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]',
      cellBg: 'bg-[#2d1810] border-2 border-[#5a3d2a] hover:border-[#8b5a2b] hover:bg-[#3d2314]',
      cellFilled: 'bg-[#2d1810] border-2 border-[#6b4a35]',
      winHighlight: 'border-4 border-[#ffd700] bg-[#ffd700]/20 shadow-[0_0_20px_rgba(255,215,0,0.3)]',
      accentColor: 'text-[#ffa500]',
      border: 'border-[#8b5a2b]',
      fontClass: 'mayan-font',
      isPixel: false,
      isBrutalism: false,
      isMayan: true,
      isSamurai: false,
      isGeorgian: false,
      isInca: false,
      isGaelic: false,
    },
    samurai: {
      name: 'Samurai',
      icon: '⚔️',
      bg: 'bg-[#0a0a0a]',
      text: 'text-[#f5f0e6]',
      textMuted: 'text-[#8a8070]',
      card: 'bg-[#1a1714] border-2 border-[#3d2b1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_4px_12px_rgba(0,0,0,0.5)]',
      cardHover: 'hover:border-[#c41e3a] hover:bg-[#252018]',
      button: 'bg-[#1a1714] border-2 border-[#3d2b1f] hover:bg-[#252018] hover:border-[#c41e3a]',
      buttonPrimary: 'bg-gradient-to-b from-[#c41e3a] to-[#8b0000] border-2 border-[#c41e3a] text-white shadow-[0_4px_12px_rgba(196,30,58,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]',
      xColor: 'text-[#f5f0e6]',
      xGlow: 'drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] drop-shadow-[0_0_3px_rgba(200,200,200,0.8)]',
      xBg: 'bg-gradient-to-b from-[#f5f0e6] to-[#d4cfc0] text-[#1a1714] border-2 border-[#f5f0e6] shadow-[0_2px_8px_rgba(255,255,255,0.2)]',
      oColor: 'text-[#c41e3a]',
      oGlow: 'drop-shadow-[0_0_15px_rgba(196,30,58,0.7)] drop-shadow-[0_0_4px_rgba(255,50,50,0.5)]',
      oBg: 'bg-gradient-to-b from-[#c41e3a] to-[#8b0000] text-white border-2 border-[#c41e3a] shadow-[0_2px_8px_rgba(196,30,58,0.4)]',
      boardBg: 'samurai-wood border-4 border-[#3d2b1f] shadow-[inset_0_0_30px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.6)]',
      cellBg: 'bg-[#1a1510]/80 border border-[#3d2b1f]/50 hover:border-[#c41e3a]/60 hover:bg-[#252015]',
      cellFilled: 'bg-[#15120d] border border-[#3d2b1f]/70',
      winHighlight: 'border-2 border-[#c41e3a] bg-[#c41e3a]/15 shadow-[0_0_20px_rgba(196,30,58,0.3)]',
      accentColor: 'text-[#c41e3a]',
      border: 'border-[#3d2b1f]',
      fontClass: 'samurai-font font-bold',
      isPixel: false,
      isBrutalism: false,
      isMayan: false,
      isSamurai: true,
      isGeorgian: false,
      isInca: false,
      isGaelic: false,
    },
    georgian: {
      name: 'Georgian',
      icon: '🍇',
      bg: 'bg-gradient-to-b from-[#1a0f0a] via-[#2d1810] to-[#1a0f0a]',
      text: 'text-[#f5e6d3]',
      textMuted: 'text-[#b8860b]',
      card: 'georgian-stone border-2 border-[#8b4513]/50',
      cardHover: 'hover:border-[#daa520] hover:bg-[#4a3528]',
      button: 'bg-[#3d2b1f] border-2 border-[#8b4513] hover:bg-[#4a3528] hover:border-[#daa520]',
      buttonPrimary: 'bg-gradient-to-b from-[#daa520] to-[#b8860b] border-2 border-[#daa520] text-[#1a0f0a] shadow-[0_4px_12px_rgba(218,165,32,0.4)]',
      xColor: 'text-[#daa520]',
      xGlow: 'drop-shadow-[0_0_12px_rgba(218,165,32,0.6)]',
      xBg: 'bg-gradient-to-b from-[#daa520] to-[#b8860b] text-[#1a0f0a] border-2 border-[#daa520] shadow-[0_2px_8px_rgba(218,165,32,0.3)]',
      oColor: 'text-[#8b0000]',
      oGlow: 'drop-shadow-[0_0_12px_rgba(139,0,0,0.6)]',
      oBg: 'bg-gradient-to-b from-[#8b0000] to-[#5c0000] text-white border-2 border-[#8b0000] shadow-[0_2px_8px_rgba(139,0,0,0.3)]',
      boardBg: 'georgian-stone border-4 border-[#8b4513]/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.5)]',
      cellBg: 'bg-[#2a1f16] border-2 border-[#5c3d2e] hover:border-[#daa520] hover:bg-[#3d2b1f]',
      cellFilled: 'bg-[#22180f] border-2 border-[#6b4a35]',
      winHighlight: 'border-2 border-[#daa520] bg-[#daa520]/15 shadow-[0_0_20px_rgba(218,165,32,0.4)]',
      accentColor: 'text-[#daa520]',
      border: 'border-[#8b4513]',
      fontClass: 'georgian-font',
      isPixel: false,
      isBrutalism: false,
      isMayan: false,
      isSamurai: false,
      isGeorgian: true,
      isInca: false,
      isGaelic: false,
    },
    inca: {
      name: 'Inca Empire',
      icon: '🗿',
      bg: 'bg-gradient-to-b from-[#0d0d0d] via-[#1a1510] to-[#0d0d0d]',
      text: 'text-[#f0e6d3]',
      textMuted: 'text-[#b87800]',
      card: 'inca-stone border-2 border-[#b87800]/40',
      cardHover: 'hover:border-[#ffc800] hover:bg-[#2a2318]',
      button: 'bg-[#1a1510] border-2 border-[#b87800]/60 hover:bg-[#252015] hover:border-[#ffc800]',
      buttonPrimary: 'bg-gradient-to-b from-[#ffc800] to-[#b87800] border-2 border-[#ffc800] text-[#0d0d0d] shadow-[0_4px_16px_rgba(255,200,0,0.35)]',
      xColor: 'text-[#ffc800]',
      xGlow: 'drop-shadow-[0_0_15px_rgba(255,200,0,0.7)] drop-shadow-[0_0_4px_rgba(255,150,0,1)]',
      xBg: 'bg-gradient-to-b from-[#ffc800] to-[#cc9900] text-[#0d0d0d] border-2 border-[#ffc800] shadow-[0_2px_10px_rgba(255,200,0,0.4)]',
      oColor: 'text-[#00b464]',
      oGlow: 'drop-shadow-[0_0_15px_rgba(0,180,100,0.7)] drop-shadow-[0_0_4px_rgba(0,150,80,1)]',
      oBg: 'bg-gradient-to-b from-[#00b464] to-[#008050] text-white border-2 border-[#00b464] shadow-[0_2px_10px_rgba(0,180,100,0.4)]',
      boardBg: 'inca-stone border-4 border-[#b87800]/50 shadow-[inset_0_0_25px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.6)]',
      cellBg: 'bg-[#15120d] border-2 border-[#3d3528] hover:border-[#ffc800] hover:bg-[#1f1a14]',
      cellFilled: 'bg-[#110f0a] border-2 border-[#4a4035]',
      winHighlight: 'border-2 border-[#ffc800] bg-[#ffc800]/15 shadow-[0_0_25px_rgba(255,200,0,0.5)]',
      accentColor: 'text-[#ffc800]',
      border: 'border-[#b87800]',
      fontClass: 'inca-font',
      isPixel: false,
      isBrutalism: false,
      isMayan: false,
      isSamurai: false,
      isGeorgian: false,
      isInca: true,
      isGaelic: false,
    },
    gaelic: {
      name: 'Gaelic',
      icon: '☘️',
      bg: 'bg-gradient-to-b from-[#0a1a0f] via-[#0f2515] to-[#0a1a0f]',
      text: 'text-[#e8f5e0]',
      textMuted: 'text-[#4a8c4a]',
      card: 'gaelic-stone border-2 border-[#00aa55]/40',
      cardHover: 'hover:border-[#ffb400] hover:bg-[#1a3520]',
      button: 'bg-[#0f1f0f] border-2 border-[#00aa55]/60 hover:bg-[#152815] hover:border-[#ffb400]',
      buttonPrimary: 'bg-gradient-to-b from-[#00aa55] to-[#006633] border-2 border-[#00aa55] text-white shadow-[0_4px_16px_rgba(0,170,85,0.35)]',
      xColor: 'text-[#00cc66]',
      xGlow: 'drop-shadow-[0_0_15px_rgba(0,150,80,0.7)] drop-shadow-[0_0_4px_rgba(255,215,0,1)]',
      xBg: 'bg-gradient-to-b from-[#00cc66] to-[#009944] text-white border-2 border-[#00cc66] shadow-[0_2px_10px_rgba(0,200,100,0.4)]',
      oColor: 'text-[#ffb400]',
      oGlow: 'drop-shadow-[0_0_15px_rgba(255,180,0,0.7)] drop-shadow-[0_0_4px_rgba(255,150,0,1)]',
      oBg: 'bg-gradient-to-b from-[#ffb400] to-[#cc8800] text-[#0a1a0f] border-2 border-[#ffb400] shadow-[0_2px_10px_rgba(255,180,0,0.4)]',
      boardBg: 'gaelic-stone border-4 border-[#00aa55]/50 shadow-[inset_0_0_25px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.6)]',
      cellBg: 'bg-[#0a150a] border-2 border-[#1a3a1a] hover:border-[#00aa55] hover:bg-[#0f200f]',
      cellFilled: 'bg-[#080f08] border-2 border-[#1a3a1a]',
      winHighlight: 'border-2 border-[#ffb400] bg-[#ffb400]/15 shadow-[0_0_25px_rgba(255,180,0,0.5)]',
      accentColor: 'text-[#ffb400]',
      border: 'border-[#00aa55]',
      fontClass: 'gaelic-font',
      isPixel: false,
      isBrutalism: false,
      isMayan: false,
      isSamurai: false,
      isGeorgian: false,
      isInca: false,
      isGaelic: true,
    },
  }
  return themes[skin]
}

// Mayan decorative pattern component
function MayanDecoration({ className = '' }: { className?: string }) {
  return (
    <div className={`mayan-pattern ${className}`} />
  )
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X')
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Player>(null)
  const [winningLine, setWinningLine] = useState<WinningLine>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [animatingCell, setAnimatingCell] = useState<number | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>('pvp')
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [menuAnimation, setMenuAnimation] = useState(false)

  // Time Attack mode
  const [timeLeft, setTimeLeft] = useState(10)
  const [timerActive, setTimerActive] = useState(false)

  // Tournament mode
  const [tournamentRound, setTournamentRound] = useState(1)
  const [tournamentMaxRounds] = useState(5)
  const [tournamentScores, setTournamentScores] = useState({ X: 0, O: 0 })

  // Challenge mode - pre-filled cells
  const [challengeSetup, setChallengeSetup] = useState<Player[]>(Array(9).fill(null))

  // Blitz mode - best of 3 with timer
  const [blitzRound, setBlitzRound] = useState(1)
  const [blitzScores, setBlitzScores] = useState({ X: 0, O: 0 })
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(5)

  // Survival mode - win streak with increasing difficulty
  const [survivalStreak, setSurvivalStreak] = useState(0)
  const [survivalDifficulty, setSurvivalDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [survivalHighScore, setSurvivalHighScore] = useState(() => {
    if (typeof window === 'undefined') return 0
    try {
      const saved = localStorage.getItem('titato-survival')
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  })
  
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
      const saved = localStorage.getItem('titato-settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const [totalScores, setTotalScores] = useState<Scores>(() => {
    if (typeof window === 'undefined') return { X: 0, O: 0, draws: 0 }
    try {
      const saved = localStorage.getItem('titato-scores')
      return saved ? JSON.parse(saved) : { X: 0, O: 0, draws: 0 }
    } catch {
      return { X: 0, O: 0, draws: 0 }
    }
  })

  const [previousScreen, setPreviousScreen] = useState<'menu' | 'game'>('menu')

  const skin = settings.skin
  const theme = getThemeConfig(skin)
  const difficulty = settings.difficulty

  useEffect(() => {
    localStorage.setItem('titato-settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('titato-scores', JSON.stringify(totalScores))
  }, [totalScores])

  // Challenge mode presets
  const CHALLENGE_PRESETS: { name: string; board: Player[]; description: string }[] = [
    { name: 'Corner Trap', board: [null, 'O', null, null, 'X', null, null, null, 'O'], description: 'X starts, avoid the trap!' },
    { name: 'Center Control', board: ['O', null, null, null, 'X', null, null, null, 'O'], description: 'X in center, O in corners' },
    { name: 'Edge Battle', board: [null, 'X', null, 'O', null, 'O', null, 'X', null], description: 'Complex mid-game position' },
    { name: 'Final Move', board: ['X', 'O', 'X', 'O', 'O', null, null, 'X', 'O'], description: 'Find the winning move!' },
    { name: 'Double Threat', board: ['X', null, 'O', null, 'X', null, 'O', null, null], description: 'Block and counter!' },
  ]

  const vibrate = useCallback((pattern: number | number[]) => {
    if (settings.haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }, [settings.haptics])

  // Time Attack timer
  useEffect(() => {
    if (!timerActive || gameOver || gameMode !== 'timeAttack') return
    if (timeLeft <= 0) {
      // Timer ran out - player loses
      const timeoutWinner = currentPlayer === 'X' ? 'O' : 'X'
      setTimerActive(false)
      setGameOver(true)
      setWinner(timeoutWinner)
      vibrate([100, 50, 100, 50, 100])
      const modalTimer = setTimeout(() => setShowModal(true), 300)
      return () => clearTimeout(modalTimer)
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timerActive, timeLeft, gameOver, gameMode, currentPlayer, vibrate])

  // Blitz mode timer
  useEffect(() => {
    if (!timerActive || gameOver || gameMode !== 'blitz') return
    if (blitzTimeLeft <= 0) {
      // Timer ran out - player loses
      const timeoutWinner = currentPlayer === 'X' ? 'O' : 'X'
      setTimerActive(false)
      setGameOver(true)
      setWinner(timeoutWinner)
      vibrate([100, 50, 100, 50, 100])
      const modalTimer = setTimeout(() => setShowModal(true), 300)
      return () => clearTimeout(modalTimer)
    }
    const timer = setTimeout(() => setBlitzTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timerActive, blitzTimeLeft, gameOver, gameMode, currentPlayer, vibrate])

  const makeAiMove = useCallback((currentBoard: BoardState) => {
    setIsAiThinking(true)
    setTimeout(() => {
      // Use survival difficulty for survival mode, otherwise use settings difficulty
      const aiDifficulty = gameMode === 'survival' ? survivalDifficulty : difficulty
      const aiMove = getBestMove(currentBoard, aiDifficulty)
      if (aiMove === -1) {
        setIsAiThinking(false)
        return
      }
      vibrate(10)
      if (settings.animations) setAnimatingCell(aiMove)
      const newBoard = [...currentBoard]
      newBoard[aiMove] = 'O'
      setBoard(newBoard)
      const { winner: gameWinner, line } = checkWinner(newBoard)

      // Reverse mode: O winning means O gets three in a row, which is BAD for O
      if (gameWinner && gameMode === 'reverse') {
        // In reverse mode, getting 3 in a row means you LOSE
        setWinner('X') // X wins because O made 3 in a row
        setWinningLine(line)
        setGameOver(true)
        setScores((prev) => ({ ...prev, X: prev.X + 1 }))
        setTotalScores((prev) => ({ ...prev, X: prev.X + 1 }))
        setTimeout(() => vibrate([50, 50, 50, 50, 100]), 300)
        setTimeout(() => setShowModal(true), 500)
        setIsAiThinking(false)
        return
      }

      if (gameWinner) {
        setWinner(gameWinner)
        setWinningLine(line)
        setGameOver(true)
        setScores((prev) => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))
        setTotalScores((prev) => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))

        // Survival mode: AI wins = game over
        if (gameMode === 'survival') {
          if (survivalStreak > survivalHighScore) {
            setSurvivalHighScore(survivalStreak)
            localStorage.setItem('titato-survival', String(survivalStreak))
          }
        }

        // Tournament mode
        if (gameMode === 'tournament') {
          setTournamentScores(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))
        }

        // Blitz mode
        if (gameMode === 'blitz') {
          setBlitzScores(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))
        }

        setTimeout(() => vibrate([50, 50, 50, 50, 100]), 300)
        setTimeout(() => setShowModal(true), 500)
        setIsAiThinking(false)
        return
      }
      if (checkDraw(newBoard)) {
        setIsDraw(true)
        setGameOver(true)
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }))
        setTotalScores((prev) => ({ ...prev, draws: prev.draws + 1 }))

        if (gameMode === 'tournament') {
          setTournamentScores(prev => ({ ...prev, X: prev.X + 0.5, O: prev.O + 0.5 }))
        }

        setTimeout(() => vibrate([100, 50, 100]), 300)
        setTimeout(() => setShowModal(true), 500)
        setIsAiThinking(false)
        return
      }
      setCurrentPlayer('X')
      setTimerActive(true)
      if (gameMode === 'timeAttack') setTimeLeft(10)
      if (gameMode === 'blitz') setBlitzTimeLeft(5)
      setIsAiThinking(false)
      setTimeout(() => setAnimatingCell(null), 300)
    }, 500)
  }, [difficulty, survivalDifficulty, gameMode, vibrate, settings.animations, survivalStreak, survivalHighScore])

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || gameOver || isAiThinking) return
    if ((gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'reverse' || gameMode === 'challenge' || gameMode === 'blitz') && currentPlayer === 'O') return
    vibrate(10)
    if (settings.animations) setAnimatingCell(index)
    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)
    const { winner: gameWinner, line } = checkWinner(newBoard)

    // Reverse mode: getting 3 in a row means you LOSE
    if (gameWinner && gameMode === 'reverse') {
      setWinner('O') // O wins because X made 3 in a row
      setWinningLine(line)
      setGameOver(true)
      setScores((prev) => ({ ...prev, O: prev.O + 1 }))
      setTotalScores((prev) => ({ ...prev, O: prev.O + 1 }))
      setTimeout(() => vibrate([50, 50, 50, 50, 100]), 300)
      setTimeout(() => setShowModal(true), 500)
      return
    }

    if (gameWinner) {
      setWinner(gameWinner)
      setWinningLine(line)
      setGameOver(true)
      setScores((prev) => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))
      setTotalScores((prev) => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))

      // Survival mode: player wins = increase streak
      if (gameMode === 'survival' && gameWinner === 'X') {
        const newStreak = survivalStreak + 1
        setSurvivalStreak(newStreak)
        if (newStreak % 3 === 0) {
          // Increase difficulty every 3 wins
          const nextDiff = survivalDifficulty === 'easy' ? 'medium' : 'hard'
          setSurvivalDifficulty(nextDiff)
        }
      }

      // Tournament mode
      if (gameMode === 'tournament') {
        setTournamentScores(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))
      }

      // Blitz mode
      if (gameMode === 'blitz') {
        setBlitzScores(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))
      }

      setTimeout(() => vibrate([50, 50, 50, 50, 100]), 300)
      setTimeout(() => setShowModal(true), 500)
      return
    }
    if (checkDraw(newBoard)) {
      setIsDraw(true)
      setGameOver(true)
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }))
      setTotalScores((prev) => ({ ...prev, draws: prev.draws + 1 }))

      if (gameMode === 'tournament') {
        setTournamentScores(prev => ({ ...prev, X: prev.X + 0.5, O: prev.O + 0.5 }))
      }

      setTimeout(() => vibrate([100, 50, 100]), 300)
      setTimeout(() => setShowModal(true), 500)
      return
    }
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X'
    setCurrentPlayer(nextPlayer)
    setTimeout(() => setAnimatingCell(null), 300)
    setTimerActive(false)

    // AI modes
    if ((gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'reverse' || gameMode === 'challenge' || gameMode === 'blitz') && nextPlayer === 'O') {
      setTimeout(() => makeAiMove(newBoard), 100)
    }
  }, [board, currentPlayer, gameOver, gameMode, isAiThinking, makeAiMove, vibrate, settings.animations, survivalStreak, survivalDifficulty])

  const startGame = useCallback((mode: GameMode) => {
    setGameMode(mode)
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setGameOver(false)
    setWinner(null)
    setWinningLine(null)
    setIsDraw(false)
    setShowModal(false)
    setAnimatingCell(null)
    setIsAiThinking(false)
    setScores({ X: 0, O: 0, draws: 0 })
    setTimerActive(false)

    // Mode-specific initialization
    if (mode === 'timeAttack') {
      setTimeLeft(10)
      setTimerActive(true)
    }
    if (mode === 'tournament') {
      setTournamentRound(1)
      setTournamentScores({ X: 0, O: 0 })
    }
    if (mode === 'blitz') {
      setBlitzRound(1)
      setBlitzScores({ X: 0, O: 0 })
      setBlitzTimeLeft(5)
      setTimerActive(true)
    }
    if (mode === 'survival') {
      setSurvivalStreak(0)
      setSurvivalDifficulty('easy')
    }
    if (mode === 'challenge') {
      const preset = CHALLENGE_PRESETS[Math.floor(Math.random() * CHALLENGE_PRESETS.length)]
      setBoard(preset.board)
      setChallengeSetup(preset.board)
    }

    vibrate(30)
    setMenuAnimation(true)
    setTimeout(() => {
      setScreen('game')
      setMenuAnimation(false)
    }, 300)
  }, [vibrate])

  const goToMenu = useCallback(() => {
    vibrate(20)
    setMenuAnimation(true)
    setTimeout(() => {
      setScreen('menu')
      setMenuAnimation(false)
    }, 300)
  }, [vibrate])

  const goToSettings = useCallback((from: 'menu' | 'game') => {
    vibrate(20)
    setPreviousScreen(from)
    setMenuAnimation(true)
    setTimeout(() => {
      setScreen('settings')
      setMenuAnimation(false)
    }, 300)
  }, [vibrate])

  const goBack = useCallback(() => {
    vibrate(20)
    setMenuAnimation(true)
    setTimeout(() => {
      setScreen(previousScreen)
      setMenuAnimation(false)
    }, 300)
  }, [vibrate, previousScreen])

  const resetGame = useCallback(() => {
    // Tournament mode: advance to next round or end
    if (gameMode === 'tournament' && !gameOver) {
      // Normal reset during game
    } else if (gameMode === 'tournament' && gameOver) {
      const totalGames = tournamentScores.X + tournamentScores.O
      if (tournamentRound < tournamentMaxRounds) {
        setTournamentRound(r => r + 1)
      }
    }

    // Blitz mode: check for best of 3 winner
    if (gameMode === 'blitz' && gameOver) {
      if (blitzScores.X >= 2 || blitzScores.O >= 2) {
        // Series over, reset scores
        setBlitzRound(1)
        setBlitzScores({ X: 0, O: 0 })
      } else {
        setBlitzRound(r => r + 1)
      }
    }

    // Survival mode: reset streak if AI won, continue if player won
    if (gameMode === 'survival' && gameOver && winner === 'O') {
      if (survivalStreak > survivalHighScore) {
        setSurvivalHighScore(survivalStreak)
        localStorage.setItem('titato-survival', String(survivalStreak))
      }
      setSurvivalStreak(0)
      setSurvivalDifficulty('easy')
    }

    // Challenge mode: new random preset
    if (gameMode === 'challenge') {
      const preset = CHALLENGE_PRESETS[Math.floor(Math.random() * CHALLENGE_PRESETS.length)]
      setBoard(preset.board)
      setChallengeSetup(preset.board)
    } else {
      setBoard(Array(9).fill(null))
    }

    setCurrentPlayer('X')
    setGameOver(false)
    setWinner(null)
    setWinningLine(null)
    setIsDraw(false)
    setShowModal(false)
    setAnimatingCell(null)
    setIsAiThinking(false)

    // Reset timers
    if (gameMode === 'timeAttack') {
      setTimeLeft(10)
      setTimerActive(true)
    }
    if (gameMode === 'blitz') {
      setBlitzTimeLeft(5)
      setTimerActive(true)
    }

    vibrate(20)
  }, [vibrate, gameMode, gameOver, tournamentRound, tournamentScores, tournamentMaxRounds, blitzScores, survivalStreak, survivalHighScore, winner, survivalDifficulty])

  const resetScores = useCallback(() => {
    setScores({ X: 0, O: 0, draws: 0 })
    setTotalScores({ X: 0, O: 0, draws: 0 })
    localStorage.removeItem('titato-scores')
    vibrate([20, 20, 20])
  }, [vibrate])

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    vibrate(10)
  }, [vibrate])

  const closeModal = useCallback(() => setShowModal(false), [])
  const handlePlayAgain = useCallback(() => resetGame(), [resetGame])
  const isWinningCell = (index: number) => winningLine?.includes(index) || false

  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    document.addEventListener('touchstart', preventZoom, { passive: false })
    return () => document.removeEventListener('touchstart', preventZoom)
  }, [])

  // Settings Screen
  if (screen === 'settings') {
    return (
      <div className={`h-dvh w-full overflow-hidden flex flex-col p-3 sm:p-4 select-none touch-manipulation transition-opacity duration-300 ${menuAnimation ? 'opacity-0' : 'opacity-100'} ${theme.bg} ${theme.isPixel ? 'scanlines' : ''} ${theme.isMayan ? 'mayan-pattern' : ''} ${theme.isSamurai ? 'samurai-pattern' : ''} ${theme.isGeorgian ? 'georgian-pattern' : ''} ${theme.isInca ? 'inca-pattern' : ''} ${theme.isGaelic ? 'gaelic-pattern' : ''}`}>
        <GlobalStyles skin={skin} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className={`p-2.5 rounded-lg transition-all active:scale-95 ${theme.button} ${theme.text}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-xl sm:text-2xl ${theme.text} ${theme.fontClass} ${theme.isPixel ? 'text-base' : theme.isMayan ? 'text-lg' : 'font-bold'}`}>⚙️ Settings</h1>
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-auto space-y-4 max-w-md mx-auto w-full">
          {/* Theme Selection */}
          <div className={`p-4 rounded-xl ${theme.card}`}>
            <h2 className={`font-bold mb-4 text-sm uppercase tracking-wider ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[10px]' : theme.isMayan ? 'text-xs' : ''}`}>🎨 Theme</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['neon', 'brutalism', 'pixel', 'mayan', 'samurai', 'georgian', 'inca', 'gaelic'] as Skin[]).map((s) => {
                const t = getThemeConfig(s)
                return (
                  <button
                    key={s}
                    onClick={() => updateSetting('skin', s)}
                    className={`p-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                      settings.skin === s
                        ? s === 'neon' ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-purple-400'
                        : s === 'brutalism' ? 'bg-blue-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : s === 'pixel' ? 'bg-[#ff6b9d]/20 border-2 border-[#ff6b9d]'
                        : s === 'mayan' ? 'bg-[#d4a574]/20 border-2 border-[#d4a574]'
                        : s === 'samurai' ? 'bg-[#dc2626]/20 border-2 border-[#dc2626]'
                        : s === 'georgian' ? 'bg-[#daa520]/20 border-2 border-[#daa520]'
                        : s === 'inca' ? 'bg-[#ffc800]/20 border-2 border-[#ffc800]'
                        : 'bg-[#00aa55]/20 border-2 border-[#00aa55]'
                        : theme.button + ' ' + theme.cardHover
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className={`font-bold text-sm ${settings.skin === s ? (s === 'brutalism' ? 'text-black' : 'text-white') : theme.text} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>
                      {t.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Game Settings */}
          <div className={`p-4 rounded-xl ${theme.card}`}>
            <h2 className={`font-bold mb-4 text-sm uppercase tracking-wider ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[10px]' : theme.isMayan ? 'text-xs' : ''}`}>🎮 Game</h2>
            <div>
              <div className={`font-medium text-sm mb-2 ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : ''}`}>AI Difficulty</div>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                  <button 
                    key={level} 
                    onClick={() => updateSetting('difficulty', level)} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      settings.difficulty === level 
                        ? theme.buttonPrimary 
                        : theme.button + ' ' + theme.text
                    } ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className={`p-4 rounded-xl ${theme.card}`}>
            <h2 className={`font-bold mb-4 text-sm uppercase tracking-wider ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[10px]' : theme.isMayan ? 'text-xs' : ''}`}>📳 Feedback</h2>
            <div className="space-y-4">
              {[
                { key: 'haptics', label: 'Haptic Feedback', desc: 'Vibration on moves' },
                { key: 'animations', label: 'Animations', desc: 'Visual effects' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium text-sm ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : ''}`}>{label}</div>
                    <div className={`text-xs ${theme.textMuted}`}>{desc}</div>
                  </div>
                  <button 
                    onClick={() => updateSetting(key as keyof Settings, !settings[key as keyof Settings])} 
                    className={`w-14 h-8 rounded-full transition-all relative ${
                      settings[key as keyof Settings] 
                        ? theme.isBrutalism ? 'bg-green-400 border-4 border-black' : theme.isPixel ? 'bg-[#ff6b9d]' : theme.isMayan ? 'bg-[#d4a574]' : theme.isSamurai ? 'bg-[#dc2626]' : theme.isInca ? 'bg-[#ffc800]' : theme.isGaelic ? 'bg-[#00aa55]' : 'bg-cyan-500' 
                        : theme.isBrutalism ? 'bg-gray-300 border-4 border-black' : theme.isPixel ? 'bg-[#2a2a5e]' : theme.isMayan ? 'bg-[#3d2314]' : theme.isSamurai ? 'bg-[#222]' : theme.isInca ? 'bg-[#1a1510]' : theme.isGaelic ? 'bg-[#0a1a0f]' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-200 ${
                      settings[key as keyof Settings] ? 'left-7' : 'left-1'
                    } ${theme.isBrutalism ? 'bg-white border-2 border-black' : theme.isMayan ? 'bg-[#f5deb3]' : 'bg-white'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Data */}
          <div className={`p-4 rounded-xl ${theme.card}`}>
            <h2 className={`font-bold mb-4 text-sm uppercase tracking-wider ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[10px]' : theme.isMayan ? 'text-xs' : ''}`}>📊 Data</h2>
            <button 
              onClick={resetScores} 
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all active:scale-95 ${
                theme.isBrutalism 
                  ? 'bg-red-400 text-black border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : theme.isPixel 
                    ? 'bg-[#ff4444] text-white border-2 border-[#ff4444] pixel-font text-[10px]' 
                    : theme.isMayan
                      ? 'bg-[#8b4513] text-[#f5deb3] border-4 border-[#5a3d2a]'
                      : theme.isSamurai
                        ? 'bg-[#450a0a] text-[#dc2626] border-2 border-[#dc2626]/50'
                        : theme.isInca
                          ? 'bg-[#1a1510] text-[#ffc800] border-2 border-[#ffc800]/50'
                          : theme.isGaelic
                            ? 'bg-[#0a150a] text-[#00aa55] border-2 border-[#00aa55]/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              🗑️ Reset All Statistics
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mode Select Screen (Special Modes Submenu)
  if (screen === 'modeSelect') {
    return (
      <div className={`h-dvh w-full overflow-hidden flex flex-col p-3 sm:p-4 select-none touch-manipulation transition-opacity duration-300 ${menuAnimation ? 'opacity-0' : 'opacity-100'} ${theme.bg} ${theme.isPixel ? 'scanlines' : ''} ${theme.isSamurai ? 'samurai-pattern' : ''} ${theme.isGeorgian ? 'georgian-pattern' : ''} ${theme.isInca ? 'inca-pattern' : ''} ${theme.isGaelic ? 'gaelic-pattern' : ''}`}>
        <GlobalStyles skin={skin} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { vibrate(20); setScreen('menu') }} className={`p-2.5 rounded-lg transition-all active:scale-95 ${theme.button} ${theme.text}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-xl sm:text-2xl ${theme.text} ${theme.fontClass} ${theme.isPixel ? 'text-base' : 'font-bold'}`}>🎮 Special Modes</h1>
        </div>

        {/* Mode List */}
        <div className="flex-1 overflow-auto space-y-2 max-w-md mx-auto w-full pb-4">
          {/* Time Attack */}
          <button onClick={() => startGame('timeAttack')} className="w-full group">
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                theme.isBrutalism ? 'bg-yellow-400 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#ffcc00] border-2 border-[#ffcc00]'
                : theme.isMayan ? 'bg-[#ffa500] border-2 border-[#ff8c00]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#ffd700] to-[#ff8c00] border border-[#ffd700]'
                : theme.isInca ? 'bg-gradient-to-b from-[#ffc800] to-[#b87800] border border-[#ffc800]'
                : 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30'
              }`}>⏱️</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : 'text-base'}`}>Time Attack</h3>
                <p className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>10 seconds per move!</p>
              </div>
              <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Blitz */}
          <button onClick={() => startGame('blitz')} className="w-full group">
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                theme.isBrutalism ? 'bg-green-400 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#00ff88] border-2 border-[#00ff88]'
                : theme.isMayan ? 'bg-[#228b22] border-2 border-[#2e8b57]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#32cd32] to-[#228b22] border border-[#32cd32]'
                : theme.isInca ? 'bg-gradient-to-b from-[#00b464] to-[#008050] border border-[#00b464]'
                : 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30'
              }`}>⚡</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : 'text-base'}`}>Blitz</h3>
                <p className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Best of 3, 5s per move</p>
              </div>
              <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Survival */}
          <button onClick={() => startGame('survival')} className="w-full group">
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                theme.isBrutalism ? 'bg-orange-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#ff6600] border-2 border-[#ff6600]'
                : theme.isMayan ? 'bg-[#b8860b] border-2 border-[#daa520]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#ff4500] to-[#dc143c] border border-[#ff4500]'
                : theme.isInca ? 'bg-gradient-to-b from-[#ff6600] to-[#cc3300] border border-[#ff6600]'
                : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30'
              }`}>🔥</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : 'text-base'}`}>Survival</h3>
                <p className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Win streak • AI gets harder</p>
              </div>
              {survivalHighScore > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${theme.isBrutalism ? 'bg-yellow-300 text-black border-2 border-black' : 'bg-amber-500/20 text-amber-400'}`}>Best: {survivalHighScore}</span>
              )}
            </div>
          </button>

          {/* Tournament */}
          <button onClick={() => startGame('tournament')} className="w-full group">
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                theme.isBrutalism ? 'bg-purple-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#aa55ff] border-2 border-[#aa55ff]'
                : theme.isMayan ? 'bg-[#9400d3] border-2 border-[#8b008b]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#9370db] to-[#4b0082] border border-[#9370db]'
                : theme.isInca ? 'bg-gradient-to-b from-[#ffc800] to-[#00b464] border border-[#ffc800]'
                : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30'
              }`}>🏆</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : 'text-base'}`}>Tournament</h3>
                <p className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Best of 5 championship</p>
              </div>
              <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Challenge */}
          <button onClick={() => startGame('challenge')} className="w-full group">
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                theme.isBrutalism ? 'bg-teal-400 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#00cccc] border-2 border-[#00cccc]'
                : theme.isMayan ? 'bg-[#20b2aa] border-2 border-[#008b8b]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#00ced1] to-[#008b8b] border border-[#00ced1]'
                : theme.isInca ? 'bg-gradient-to-b from-[#00ced1] to-[#008b8b] border border-[#00ced1]'
                : 'bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/30'
              }`}>🧩</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : 'text-base'}`}>Challenge</h3>
                <p className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Solve puzzle positions</p>
              </div>
              <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Reverse */}
          <button onClick={() => startGame('reverse')} className="w-full group">
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                theme.isBrutalism ? 'bg-indigo-400 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#6666ff] border-2 border-[#6666ff]'
                : theme.isMayan ? 'bg-[#483d8b] border-2 border-[#6a5acd]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#6a5acd] to-[#483d8b] border border-[#6a5acd]'
                : theme.isInca ? 'bg-gradient-to-b from-[#9370db] to-[#4b0082] border border-[#9370db]'
                : 'bg-gradient-to-br from-indigo-400 to-violet-600 shadow-lg shadow-indigo-500/30'
              }`}>🔄</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : 'text-base'}`}>Reverse</h3>
                <p className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Get 3 in a row to LOSE!</p>
              </div>
              <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <p className={`text-xs text-center pt-2 ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>
          6 exciting game modes to challenge you!
        </p>
      </div>
    )
  }

  // Main Menu Screen
  if (screen === 'menu') {
    return (
      <div className={`h-dvh w-full overflow-hidden flex flex-col items-center justify-center p-4 select-none touch-manipulation transition-opacity duration-300 ${menuAnimation ? 'opacity-0' : 'opacity-100'} ${theme.bg} ${theme.isPixel ? 'scanlines' : ''} ${theme.isSamurai ? 'samurai-pattern' : ''} ${theme.isGeorgian ? 'georgian-pattern' : ''} ${theme.isInca ? 'inca-pattern' : ''} ${theme.isGaelic ? 'gaelic-pattern' : ''}`}>
        <GlobalStyles skin={skin} />

        {/* Mayan decorative corners */}
        {theme.isMayan && (
          <>
            <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-[#8b5a2b] rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-[#8b5a2b] rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-[#8b5a2b] rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-[#8b5a2b] rounded-br-3xl" />
          </>
        )}

        {/* Samurai decorative corners */}
        {theme.isSamurai && (
          <>
            {/* Torii-inspired top frame */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent opacity-60" />
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent opacity-40" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent opacity-60" />
            <div className="absolute bottom-3 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent opacity-40" />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-[#c41e3a]/40" />
            <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-[#c41e3a]/40" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-[#c41e3a]/40" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-[#c41e3a]/40" />
            {/* Side lines */}
            <div className="absolute top-1/2 left-0 w-0.5 h-24 -translate-y-1/2 bg-gradient-to-b from-transparent via-[#c41e3a]/50 to-transparent" />
            <div className="absolute top-1/2 right-0 w-0.5 h-24 -translate-y-1/2 bg-gradient-to-b from-transparent via-[#c41e3a]/50 to-transparent" />
          </>
        )}

        {/* Georgian decorative elements */}
        {theme.isGeorgian && (
          <>
            {/* Cross-inspired frame */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#daa520] to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#daa520] to-transparent opacity-50" />
            {/* Corner crosses */}
            <div className="absolute top-3 left-3 text-2xl opacity-30 text-[#daa520]">♱</div>
            <div className="absolute top-3 right-3 text-2xl opacity-30 text-[#daa520]">♱</div>
            <div className="absolute bottom-3 left-3 text-2xl opacity-30 text-[#daa520]">♱</div>
            <div className="absolute bottom-3 right-3 text-2xl opacity-30 text-[#daa520]">♱</div>
          </>
        )}

        {/* Inca decorative elements */}
        {theme.isInca && (
          <>
            {/* Step-pattern frame */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffc800] to-transparent opacity-60" />
            <div className="absolute top-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00b464] to-transparent opacity-40" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ffc800] to-transparent opacity-60" />
            <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00b464] to-transparent opacity-40" />
            {/* Corner stepped patterns */}
            <div className="absolute top-3 left-3 text-2xl opacity-40 text-[#ffc800]">⬛</div>
            <div className="absolute top-3 right-3 text-2xl opacity-40 text-[#ffc800]">⬛</div>
            <div className="absolute bottom-3 left-3 text-2xl opacity-40 text-[#ffc800]">⬛</div>
            <div className="absolute bottom-3 right-3 text-2xl opacity-40 text-[#ffc800]">⬛</div>
          </>
        )}

        {/* Gaelic decorative elements */}
        {theme.isGaelic && (
          <>
            {/* Celtic knot-inspired frame */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00aa55] to-transparent opacity-60" />
            <div className="absolute top-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ffb400] to-transparent opacity-40" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00aa55] to-transparent opacity-60" />
            <div className="absolute bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ffb400] to-transparent opacity-40" />
            {/* Corner Celtic knots */}
            <div className="absolute top-3 left-3 text-2xl opacity-40 text-[#00aa55]">❋</div>
            <div className="absolute top-3 right-3 text-2xl opacity-40 text-[#00aa55]">❋</div>
            <div className="absolute bottom-3 left-3 text-2xl opacity-40 text-[#00aa55]">❋</div>
            <div className="absolute bottom-3 right-3 text-2xl opacity-40 text-[#00aa55]">❋</div>
          </>
        )}

        {/* Settings Button */}
        <button onClick={() => goToSettings('menu')} className={`absolute top-4 right-4 p-2.5 rounded-lg transition-all active:scale-95 ${theme.button}`}>
          <svg className={`w-5 h-5 ${theme.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Floating Background Decorations */}
        {settings.animations && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-[12%] left-[8%] text-6xl sm:text-7xl opacity-20 ${theme.xColor} ${skin === 'neon' ? theme.xGlow : ''} ${skin === 'mayan' ? 'mayan-glow-x' : ''} ${skin === 'samurai' ? 'samurai-glow-x' : ''} ${skin === 'georgian' ? 'georgian-glow-x' : ''} ${skin === 'gaelic' ? 'gaelic-glow-x' : ''}`} style={{animation: 'float 4s ease-in-out infinite'}}>✕</div>
            <div className={`absolute top-[25%] right-[8%] text-6xl sm:text-7xl opacity-20 ${theme.oColor} ${skin === 'neon' ? theme.oGlow : ''} ${skin === 'mayan' ? 'mayan-glow-o' : ''} ${skin === 'samurai' ? 'samurai-glow-o' : ''} ${skin === 'georgian' ? 'georgian-glow-o' : ''} ${skin === 'gaelic' ? 'gaelic-glow-o' : ''}`} style={{animation: 'float 5s ease-in-out infinite 0.5s'}}>○</div>
            <div className={`absolute bottom-[30%] left-[12%] text-6xl sm:text-7xl opacity-20 ${theme.xColor} ${skin === 'neon' ? theme.xGlow : ''} ${skin === 'mayan' ? 'mayan-glow-x' : ''} ${skin === 'samurai' ? 'samurai-glow-x' : ''} ${skin === 'georgian' ? 'georgian-glow-x' : ''} ${skin === 'gaelic' ? 'gaelic-glow-x' : ''}`} style={{animation: 'float 4.5s ease-in-out infinite 1s'}}>✕</div>
            <div className={`absolute bottom-[12%] right-[12%] text-6xl sm:text-7xl opacity-20 ${theme.oColor} ${skin === 'neon' ? theme.oGlow : ''} ${skin === 'mayan' ? 'mayan-glow-o' : ''} ${skin === 'samurai' ? 'samurai-glow-o' : ''} ${skin === 'georgian' ? 'georgian-glow-o' : ''} ${skin === 'gaelic' ? 'gaelic-glow-o' : ''}`} style={{animation: 'float 5.5s ease-in-out infinite 1.5s'}}>○</div>
            {theme.isMayan && (
              <>
                <div className="absolute top-[40%] left-[5%] text-4xl opacity-30" style={{animation: 'float 6s ease-in-out infinite'}}>🗿</div>
                <div className="absolute top-[60%] right-[5%] text-4xl opacity-30" style={{animation: 'float 5s ease-in-out infinite 0.8s'}}>🏆</div>
              </>
            )}
            {theme.isSamurai && (
              <>
                <div className="absolute top-[18%] left-[4%] text-3xl opacity-30" style={{animation: 'float 6s ease-in-out infinite'}}>⚔️</div>
                <div className="absolute top-[50%] right-[4%] text-3xl opacity-30" style={{animation: 'float 5s ease-in-out infinite 0.7s'}}>🏯</div>
                <div className="absolute bottom-[28%] left-[6%] text-2xl opacity-25" style={{animation: 'float 7s ease-in-out infinite 0.3s'}}>🎴</div>
                <div className="absolute top-[70%] left-[3%] text-xl opacity-20" style={{animation: 'sakura-fall 8s ease-in-out infinite'}}>🌸</div>
                <div className="absolute top-[25%] right-[5%] text-xl opacity-20" style={{animation: 'sakura-fall 9s ease-in-out infinite 2s'}}>🌸</div>
                <div className="absolute bottom-[40%] right-[2%] text-2xl opacity-25" style={{animation: 'float 6s ease-in-out infinite 1.5s'}}>🎐</div>
              </>
            )}
            {theme.isGeorgian && (
              <>
                <div className="absolute top-[15%] left-[5%] text-3xl opacity-30" style={{animation: 'float 7s ease-in-out infinite'}}>🍇</div>
                <div className="absolute top-[45%] right-[5%] text-3xl opacity-30" style={{animation: 'float 6s ease-in-out infinite 0.5s'}}>🍷</div>
                <div className="absolute bottom-[35%] left-[4%] text-2xl opacity-25" style={{animation: 'float 8s ease-in-out infinite 0.8s'}}>⛪</div>
                <div className="absolute top-[65%] right-[4%] text-2xl opacity-25" style={{animation: 'float 7s ease-in-out infinite 1.2s'}}>🍇</div>
              </>
            )}
            {theme.isInca && (
              <>
                <div className="absolute top-[15%] left-[5%] text-3xl opacity-35" style={{animation: 'float 6s ease-in-out infinite'}}>🗿</div>
                <div className="absolute top-[45%] right-[5%] text-3xl opacity-35" style={{animation: 'float 7s ease-in-out infinite 0.5s'}}>🦙</div>
                <div className="absolute bottom-[30%] left-[4%] text-2xl opacity-30" style={{animation: 'float 8s ease-in-out infinite 0.8s'}}>🏔️</div>
                <div className="absolute top-[60%] right-[4%] text-2xl opacity-30" style={{animation: 'float 7s ease-in-out infinite 1.2s'}}>☀️</div>
                <div className="absolute bottom-[20%] right-[8%] text-2xl opacity-25" style={{animation: 'float 9s ease-in-out infinite 1.5s'}}>💎</div>
              </>
            )}
            {theme.isGaelic && (
              <>
                <div className="absolute top-[12%] left-[5%] text-3xl opacity-35" style={{animation: 'float 7s ease-in-out infinite'}}>☘️</div>
                <div className="absolute top-[40%] right-[5%] text-3xl opacity-35" style={{animation: 'float 6s ease-in-out infinite 0.5s'}}>🎵</div>
                <div className="absolute bottom-[32%] left-[4%] text-2xl opacity-30" style={{animation: 'float 8s ease-in-out infinite 0.8s'}}>🏰</div>
                <div className="absolute top-[58%] right-[4%] text-2xl opacity-30" style={{animation: 'float 7s ease-in-out infinite 1.2s'}}>🍀</div>
                <div className="absolute bottom-[18%] right-[6%] text-2xl opacity-25" style={{animation: 'float 9s ease-in-out infinite 1.5s'}}>🌟</div>
              </>
            )}
          </div>
        )}

        {/* Logo */}
        <div className="relative mb-6">
          {skin === 'neon' && <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-purple-500/40 blur-3xl rounded-full scale-150" />}
          {skin === 'mayan' && <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/30 to-[#8b5a2b]/30 blur-3xl rounded-full scale-150" />}
          {skin === 'samurai' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#c41e3a]/25 via-[#8b0000]/15 to-transparent blur-3xl rounded-full scale-150" />
              <div className="absolute inset-4 bg-gradient-to-tr from-[#f5f0e6]/10 to-transparent blur-2xl rounded-full scale-125" />
            </>
          )}
          {skin === 'georgian' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#daa520]/25 via-[#8b4513]/15 to-transparent blur-3xl rounded-full scale-150" />
              <div className="absolute inset-4 bg-gradient-to-tr from-[#daa520]/10 to-transparent blur-2xl rounded-full scale-125" />
            </>
          )}
          {skin === 'inca' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffc800]/25 via-[#00b464]/15 to-transparent blur-3xl rounded-full scale-150" />
              <div className="absolute inset-4 bg-gradient-to-tr from-[#ffc800]/10 to-transparent blur-2xl rounded-full scale-125" />
            </>
          )}
          {skin === 'gaelic' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#00aa55]/25 via-[#ffb400]/15 to-transparent blur-3xl rounded-full scale-150" />
              <div className="absolute inset-4 bg-gradient-to-tr from-[#00aa55]/10 to-transparent blur-2xl rounded-full scale-125" />
            </>
          )}
          <div className="relative flex items-center justify-center gap-3 sm:gap-5">
            <span className={`text-6xl sm:text-8xl font-bold ${theme.xColor} ${skin === 'neon' ? 'neon-glow-x' : ''} ${skin === 'mayan' ? 'mayan-glow-x' : ''} ${skin === 'samurai' ? 'samurai-glow-x' : ''} ${skin === 'georgian' ? 'georgian-glow-x' : ''} ${skin === 'inca' ? 'inca-glow-x' : ''} ${skin === 'gaelic' ? 'gaelic-glow-x' : ''} ${theme.fontClass}`} style={settings.animations ? {animation: 'float 3s ease-in-out infinite'} : {}}>✕</span>
            <span className={`text-4xl sm:text-6xl ${theme.textMuted}`}>/</span>
            <span className={`text-6xl sm:text-8xl font-bold ${theme.oColor} ${skin === 'neon' ? 'neon-glow-o' : ''} ${skin === 'mayan' ? 'mayan-glow-o' : ''} ${skin === 'samurai' ? 'samurai-glow-o' : ''} ${skin === 'georgian' ? 'georgian-glow-o' : ''} ${skin === 'inca' ? 'inca-glow-o' : ''} ${skin === 'gaelic' ? 'gaelic-glow-o' : ''} ${theme.fontClass}`} style={settings.animations ? {animation: 'float 3s ease-in-out infinite 0.5s'} : {}}>○</span>
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-3xl sm:text-4xl font-bold mb-2 tracking-tight text-center ${theme.text} ${theme.isPixel ? 'pixel-font text-lg sm:text-xl' : theme.isMayan ? 'text-2xl sm:text-3xl' : theme.isSamurai ? 'text-2xl sm:text-3xl' : theme.isGeorgian ? 'text-2xl sm:text-3xl' : theme.isInca ? 'text-2xl sm:text-3xl' : theme.isGaelic ? 'text-2xl sm:text-3xl' : ''}`}>
          {theme.isMayan ? '🏛️ TiTaTo 🏛️' : theme.isSamurai ? '刀 TiTaTo 刀' : theme.isGeorgian ? '🍇 TiTaTo 🍇' : theme.isInca ? '🗿 TiTaTo 🗿' : theme.isGaelic ? '☘️ TiTaTo ☘️' : 'TiTaTo'}
        </h1>
        <p className={`text-sm sm:text-base mb-6 ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[10px]' : ''} ${theme.isSamurai ? 'tracking-widest' : ''}`}>
          {theme.isSamurai ? '将棋 — The Way of Strategy' : theme.isGeorgian ? 'საქართველო — Land of Wine' : theme.isInca ? 'Tawantinsuyu — Empire of the Sun' : theme.isGaelic ? 'Éire — Land of Legends' : 'Choose your game mode'}
        </p>

        {/* Game Mode Buttons */}
        <div className="w-full max-w-xs space-y-3 mb-6">
          {/* Classic Modes */}
          <button onClick={() => startGame('pvp')} className="w-full group">
            <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                theme.isBrutalism ? 'bg-blue-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#00ffcc] border-4 border-[#00ffcc]'
                : theme.isMayan ? 'bg-[#d4a574] border-4 border-[#8b5a2b]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#f5f0e6] to-[#d4cfc0] border-2 border-[#f5f0e6] shadow-[0_2px_8px_rgba(255,255,255,0.1)]'
                : theme.isInca ? 'bg-gradient-to-b from-[#ffc800] to-[#b87800] border-2 border-[#ffc800] shadow-[0_2px_10px_rgba(255,200,0,0.3)]'
                : theme.isGaelic ? 'bg-gradient-to-b from-[#00aa55] to-[#006633] border-2 border-[#00aa55] shadow-[0_2px_10px_rgba(0,170,85,0.3)]'
                : 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30'
              }`}>👥</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold text-lg ${theme.text} ${theme.isPixel ? 'pixel-font text-xs' : ''}`}>2 Players</h3>
                <p className={`text-sm ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Play locally with a friend</p>
              </div>
              <svg className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button onClick={() => startGame('ai')} className="w-full group">
            <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                theme.isBrutalism ? 'bg-red-500 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#ff6b9d] border-4 border-[#ff6b9d]'
                : theme.isMayan ? 'bg-[#8b4513] border-4 border-[#cd853f]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#c41e3a] to-[#8b0000] border-2 border-[#c41e3a] shadow-[0_2px_8px_rgba(196,30,58,0.3)]'
                : theme.isInca ? 'bg-gradient-to-b from-[#00b464] to-[#008050] border-2 border-[#00b464] shadow-[0_2px_10px_rgba(0,180,100,0.3)]'
                : theme.isGaelic ? 'bg-gradient-to-b from-[#ffb400] to-[#cc8800] border-2 border-[#ffb400] shadow-[0_2px_10px_rgba(255,180,0,0.3)]'
                : 'bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg shadow-pink-500/30'
              }`}>🤖</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold text-lg ${theme.text} ${theme.isPixel ? 'pixel-font text-xs' : ''}`}>vs AI</h3>
                <p className={`text-sm ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Challenge the computer ({difficulty})</p>
              </div>
              <svg className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Special Modes Button */}
          <button onClick={() => { vibrate(20); setScreen('modeSelect') }} className="w-full group">
            <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 active:scale-[0.98] ${theme.card} ${theme.cardHover}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                theme.isBrutalism ? 'bg-gradient-to-br from-purple-400 to-pink-400 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : theme.isPixel ? 'bg-[#aa55ff] border-4 border-[#aa55ff]'
                : theme.isMayan ? 'bg-gradient-to-br from-[#ffd700] to-[#ff8c00] border-4 border-[#d4a574]'
                : theme.isSamurai ? 'bg-gradient-to-b from-[#9370db] to-[#4b0082] border-2 border-[#9370db] shadow-[0_2px_8px_rgba(147,112,219,0.3)]'
                : theme.isInca ? 'bg-gradient-to-br from-[#ffc800] to-[#00b464] border-2 border-[#ffc800] shadow-[0_2px_10px_rgba(255,200,0,0.2)]'
                : theme.isGaelic ? 'bg-gradient-to-br from-[#00aa55] to-[#ffb400] border-2 border-[#00aa55] shadow-[0_2px_10px_rgba(0,170,85,0.2)]'
                : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30'
              }`}>🎮</div>
              <div className="flex-1 text-left">
                <h3 className={`font-bold text-lg ${theme.text} ${theme.isPixel ? 'pixel-font text-xs' : ''}`}>Special Modes</h3>
                <p className={`text-sm ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Time Attack, Survival, Tournament...</p>
              </div>
              <svg className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className={`h-px flex-1 ${theme.isBrutalism ? 'bg-black/30' : theme.isPixel ? 'bg-[#4a4a8a]' : theme.isMayan ? 'bg-[#8b5a2b]' : theme.isSamurai ? 'bg-[#dc2626]/30' : theme.isInca ? 'bg-[#ffc800]/30' : theme.isGaelic ? 'bg-[#00aa55]/30' : 'bg-slate-700'}`} />
            <span className={`text-xs uppercase tracking-wider ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Statistics</span>
            <div className={`h-px flex-1 ${theme.isBrutalism ? 'bg-black/30' : theme.isPixel ? 'bg-[#4a4a8a]' : theme.isMayan ? 'bg-[#8b5a2b]' : theme.isSamurai ? 'bg-[#dc2626]/30' : theme.isInca ? 'bg-[#ffc800]/30' : theme.isGaelic ? 'bg-[#00aa55]/30' : 'bg-slate-700'}`} />
          </div>
          <div className="flex gap-2">
            <div className={`flex-1 rounded-xl py-3 text-center ${theme.card}`}>
              <div className={`font-bold text-2xl ${theme.xColor} ${theme.isPixel ? 'pixel-font text-base' : ''}`}>{totalScores.X}</div>
              <div className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>X Wins</div>
            </div>
            <div className={`flex-1 rounded-xl py-3 text-center ${theme.card}`}>
              <div className={`font-bold text-2xl ${theme.accentColor} ${theme.isPixel ? 'pixel-font text-base' : ''}`}>{totalScores.draws}</div>
              <div className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Draws</div>
            </div>
            <div className={`flex-1 rounded-xl py-3 text-center ${theme.card}`}>
              <div className={`font-bold text-2xl ${theme.oColor} ${theme.isPixel ? 'pixel-font text-base' : ''}`}>{totalScores.O}</div>
              <div className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>O Wins</div>
            </div>
          </div>
        </div>

        <p className={`text-xs mt-auto pt-4 ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>
          Tap to play • {theme.icon} {theme.name}
        </p>
      </div>
    )
  }

  // Game Screen
  return (
    <div className={`h-dvh w-full overflow-hidden flex flex-col items-center justify-center p-3 sm:p-4 select-none touch-manipulation transition-opacity duration-300 ${menuAnimation ? 'opacity-0' : 'opacity-100'} ${theme.bg} ${theme.isPixel ? 'scanlines' : ''} ${theme.isSamurai ? 'samurai-pattern' : ''} ${theme.isGeorgian ? 'georgian-pattern' : ''} ${theme.isInca ? 'inca-pattern' : ''} ${theme.isGaelic ? 'gaelic-pattern' : ''}`}>
      <GlobalStyles skin={skin} />

      {/* Mayan decorative corners */}
      {theme.isMayan && (
        <>
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#8b5a2b] rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#8b5a2b] rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#8b5a2b] rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#8b5a2b] rounded-br-2xl" />
        </>
      )}

      {/* Samurai decorative corners */}
      {theme.isSamurai && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent opacity-50" />
          <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-[#c41e3a]/30" />
          <div className="absolute top-0 right-0 w-10 h-10 border-r-2 border-t-2 border-[#c41e3a]/30" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-l-2 border-b-2 border-[#c41e3a]/30" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-[#c41e3a]/30" />
        </>
      )}

      {/* Georgian decorative corners */}
      {theme.isGeorgian && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#daa520] to-transparent opacity-40" />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#daa520] to-transparent opacity-40" />
          <div className="absolute top-2 left-2 text-lg opacity-25 text-[#daa520]">♱</div>
          <div className="absolute top-2 right-2 text-lg opacity-25 text-[#daa520]">♱</div>
          <div className="absolute bottom-2 left-2 text-lg opacity-25 text-[#daa520]">♱</div>
          <div className="absolute bottom-2 right-2 text-lg opacity-25 text-[#daa520]">♱</div>
        </>
      )}

      {/* Inca decorative corners */}
      {theme.isInca && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ffc800] to-transparent opacity-50" />
          <div className="absolute top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00b464] to-transparent opacity-30" />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ffc800] to-transparent opacity-50" />
          <div className="absolute bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00b464] to-transparent opacity-30" />
          <div className="absolute top-2 left-2 text-lg opacity-35 text-[#ffc800]">⬛</div>
          <div className="absolute top-2 right-2 text-lg opacity-35 text-[#ffc800]">⬛</div>
          <div className="absolute bottom-2 left-2 text-lg opacity-35 text-[#ffc800]">⬛</div>
          <div className="absolute bottom-2 right-2 text-lg opacity-35 text-[#ffc800]">⬛</div>
        </>
      )}

      {/* Gaelic decorative corners */}
      {theme.isGaelic && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00aa55] to-transparent opacity-50" />
          <div className="absolute top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ffb400] to-transparent opacity-30" />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00aa55] to-transparent opacity-50" />
          <div className="absolute bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ffb400] to-transparent opacity-30" />
          <div className="absolute top-2 left-2 text-lg opacity-35 text-[#00aa55]">❋</div>
          <div className="absolute top-2 right-2 text-lg opacity-35 text-[#00aa55]">❋</div>
          <div className="absolute bottom-2 left-2 text-lg opacity-35 text-[#00aa55]">❋</div>
          <div className="absolute bottom-2 right-2 text-lg opacity-35 text-[#00aa55]">❋</div>
        </>
      )}

      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-2">
        <button onClick={goToMenu} className={`flex items-center gap-1.5 transition-colors active:scale-95 ${theme.textMuted}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className={`text-sm ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Menu</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => goToSettings('game')} className={`p-2 rounded-lg transition-colors ${theme.button}`}>⚙️</button>
          <div className={`flex items-center gap-2 text-sm ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>
            {/* Mode icons */}
            {gameMode === 'pvp' && <span>👥</span>}
            {gameMode === 'ai' && <span>🤖</span>}
            {gameMode === 'timeAttack' && <span>⏱️</span>}
            {gameMode === 'blitz' && <span>⚡</span>}
            {gameMode === 'survival' && <span>🔥</span>}
            {gameMode === 'tournament' && <span>🏆</span>}
            {gameMode === 'challenge' && <span>🧩</span>}
            {gameMode === 'reverse' && <span>🔄</span>}

            {/* Difficulty badges */}
            {(gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'challenge' || gameMode === 'reverse') && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                theme.isBrutalism
                  ? 'border-2 border-black ' + (difficulty === 'easy' ? 'bg-green-400 text-black' : difficulty === 'medium' ? 'bg-yellow-400 text-black' : 'bg-red-400 text-black')
                  : theme.isPixel
                    ? 'bg-[#ff6b9d] text-white'
                    : theme.isMayan
                      ? 'bg-[#8b5a2b] text-[#f5deb3] border-2 border-[#d4a574]'
                      : 'bg-slate-700 text-slate-300'
              }`}>
                {difficulty.charAt(0).toUpperCase()}
              </span>
            )}

            {/* Survival difficulty */}
            {gameMode === 'survival' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                survivalDifficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                survivalDifficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {survivalDifficulty.toUpperCase()}
              </span>
            )}

            {/* Tournament round */}
            {gameMode === 'tournament' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${theme.isBrutalism ? 'bg-purple-400 text-black border-2 border-black' : 'bg-purple-500/20 text-purple-400'}`}>
                R{tournamentRound}/{tournamentMaxRounds}
              </span>
            )}

            {/* Blitz round */}
            {gameMode === 'blitz' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${theme.isBrutalism ? 'bg-green-400 text-black border-2 border-black' : 'bg-green-500/20 text-green-400'}`}>
                G{blitzRound}/3
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timer Display for Time Attack / Blitz */}
      {(gameMode === 'timeAttack' || gameMode === 'blitz') && !gameOver && (
        <div className={`w-full max-w-xs mb-2`}>
          <div className={`relative h-2 rounded-full overflow-hidden ${theme.isBrutalism ? 'bg-gray-200 border-2 border-black' : 'bg-slate-700/50'}`}>
            <div
              className={`absolute left-0 top-0 h-full transition-all duration-1000 ${
                (gameMode === 'timeAttack' ? timeLeft : blitzTimeLeft) <= 3
                  ? 'bg-red-500 animate-pulse'
                  : (gameMode === 'timeAttack' ? timeLeft : blitzTimeLeft) <= 6
                    ? 'bg-yellow-500'
                    : theme.isBrutalism ? 'bg-green-400' : 'bg-cyan-500'
              }`}
              style={{ width: `${((gameMode === 'timeAttack' ? timeLeft : blitzTimeLeft) / (gameMode === 'timeAttack' ? 10 : 5)) * 100}%` }}
            />
          </div>
          <div className={`text-center mt-1 font-bold ${gameMode === 'timeAttack' ? 'text-lg' : 'text-base'} ${
            (gameMode === 'timeAttack' ? timeLeft : blitzTimeLeft) <= 3 ? 'text-red-400 animate-pulse' : theme.accentColor
          } ${theme.isPixel ? 'pixel-font text-xs' : ''}`}>
            ⏱️ {gameMode === 'timeAttack' ? timeLeft : blitzTimeLeft}s
          </div>
        </div>
      )}

      {/* Survival Streak */}
      {gameMode === 'survival' && (
        <div className={`w-full max-w-xs mb-2 flex items-center justify-center gap-3`}>
          <div className={`px-4 py-1.5 rounded-full font-bold ${theme.isBrutalism ? 'bg-orange-400 text-black border-4 border-black' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
            🔥 Streak: {survivalStreak}
          </div>
          {survivalHighScore > 0 && (
            <div className={`px-3 py-1.5 rounded-full text-sm ${theme.isBrutalism ? 'bg-yellow-300 text-black border-2 border-black' : 'bg-amber-500/20 text-amber-400'}`}>
              Best: {survivalHighScore}
            </div>
          )}
        </div>
      )}

      {/* Tournament Progress */}
      {gameMode === 'tournament' && (
        <div className={`w-full max-w-xs mb-2`}>
          <div className="flex justify-center gap-1">
            {Array.from({ length: tournamentMaxRounds }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < tournamentRound
                    ? i < tournamentScores.X
                      ? theme.isBrutalism ? 'bg-cyan-400 text-black border-2 border-black' : 'bg-cyan-500 text-white'
                      : i < tournamentScores.X + tournamentScores.O
                        ? theme.isBrutalism ? 'bg-red-400 text-black border-2 border-black' : 'bg-red-500 text-white'
                        : theme.isBrutalism ? 'bg-gray-300 text-black border-2 border-black' : 'bg-slate-600 text-white'
                    : theme.isBrutalism ? 'bg-gray-100 text-black border-2 border-black' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-1">
            <span className={`text-sm ${theme.xColor}`}>You: {Math.floor(tournamentScores.X)}</span>
            <span className={`text-sm ${theme.oColor}`}>AI: {Math.floor(tournamentScores.O)}</span>
          </div>
        </div>
      )}

      {/* Blitz Series */}
      {gameMode === 'blitz' && (
        <div className={`w-full max-w-xs mb-2`}>
          <div className="flex justify-center gap-4">
            <div className={`px-4 py-1.5 rounded-full font-bold ${theme.xColor} ${theme.isBrutalism ? 'bg-cyan-200 border-4 border-black' : 'bg-cyan-500/20'}`}>
              You: {blitzScores.X}
            </div>
            <div className={`px-4 py-1.5 rounded-full font-bold ${theme.oColor} ${theme.isBrutalism ? 'bg-red-200 border-4 border-black' : 'bg-red-500/20'}`}>
              AI: {blitzScores.O}
            </div>
          </div>
          <div className={`text-center text-xs mt-1 ${theme.textMuted}`}>First to 2 wins!</div>
        </div>
      )}

      {/* Reverse mode hint */}
      {gameMode === 'reverse' && !gameOver && (
        <div className={`w-full max-w-xs mb-2 text-center`}>
          <span className={`text-sm ${theme.isBrutalism ? 'bg-indigo-300 text-black px-3 py-1 rounded-full border-2 border-black' : 'bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full'}`}>
            🔄 Avoid getting 3 in a row!
          </span>
        </div>
      )}

      {/* Turn Indicator */}
      <div className="mb-3 flex items-center gap-3">
        <div className={`px-4 py-2 rounded-full font-bold transition-all duration-300 ${
          currentPlayer === 'X' && !gameOver
            ? `${theme.xBg} ${theme.isPixel ? 'pixel-font text-xs' : ''}`
            : `${theme.card} ${theme.xColor} ${theme.isPixel ? 'pixel-font text-xs' : ''}`
        }`}>
          X{(gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') && <span className="text-[10px] ml-1 opacity-75">(You)</span>}
        </div>
        <span className={`text-xl font-medium ${theme.textMuted}`}>
          {!gameOver ? (isAiThinking ? '🤔' : 'vs') : 'End'}
        </span>
        <div className={`px-4 py-2 rounded-full font-bold transition-all duration-300 ${
          currentPlayer === 'O' && !gameOver
            ? `${theme.oBg} ${theme.isPixel ? 'pixel-font text-xs' : ''}`
            : `${theme.card} ${theme.oColor} ${theme.isPixel ? 'pixel-font text-xs' : ''}`
        }`}>
          O{(gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') && <span className="text-[10px] ml-1 opacity-75">(AI)</span>}
        </div>
      </div>

      {/* Score Board */}
      <div className="flex gap-3 mb-4 w-full max-w-xs">
        {[{ score: scores.X, label: (gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') ? 'You' : 'X', color: theme.xColor }, { score: scores.draws, label: 'Draws', color: theme.accentColor }, { score: scores.O, label: (gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') ? 'AI' : 'O', color: theme.oColor }].map(({ score, label, color }) => (
          <div key={label} className={`flex-1 rounded-xl py-2.5 text-center ${theme.card}`}>
            <div className={`font-bold text-xl ${color} ${theme.isPixel ? 'pixel-font text-sm' : ''}`}>{score}</div>
            <div className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Game Board */}
      <div className="relative mb-4">
        {skin === 'neon' && <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-2xl rounded-3xl" />}
        {skin === 'mayan' && <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/20 to-[#8b5a2b]/20 blur-2xl rounded-3xl" />}
        <div className={`relative grid grid-cols-3 gap-2 p-3 rounded-2xl ${theme.boardBg}`}>
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameOver || isAiThinking || ((gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') && currentPlayer === 'O')}
              className={`aspect-square w-[min(22vw,85px)] sm:w-24 rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-bold transition-all duration-200 active:scale-90 disabled:cursor-not-allowed ${cell === null ? theme.cellBg : theme.cellFilled} ${isWinningCell(index) ? theme.winHighlight : ''} ${animatingCell === index ? 'scale-90 opacity-70' : ''} ${isAiThinking ? 'opacity-50' : ''}`}
            >
              {cell === 'X' && (
                <span className={`${theme.xColor} ${skin === 'neon' ? 'neon-glow-x' : ''} ${skin === 'mayan' ? 'mayan-glow-x' : ''} ${skin === 'samurai' ? 'samurai-glow-x' : ''} ${animatingCell === index && settings.animations ? 'animate-bounce' : ''} ${isWinningCell(index) ? (theme.isPixel ? 'text-[#ffcc00]' : theme.isMayan ? 'text-[#ffd700]' : 'text-yellow-300') : ''} ${theme.isPixel ? 'pixel-font text-3xl sm:text-4xl' : ''}`}>
                  ✕
                </span>
              )}
              {cell === 'O' && (
                <span className={`${theme.oColor} ${skin === 'neon' ? 'neon-glow-o' : ''} ${skin === 'mayan' ? 'mayan-glow-o' : ''} ${skin === 'samurai' ? 'samurai-glow-o' : ''} ${animatingCell === index && settings.animations ? 'animate-bounce' : ''} ${isWinningCell(index) ? (theme.isPixel ? 'text-[#ffcc00]' : theme.isMayan ? 'text-[#ffd700]' : 'text-yellow-300') : ''} ${theme.isPixel ? 'pixel-font text-3xl sm:text-4xl' : ''}`}>
                  ○
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-3">
        <button onClick={resetGame} className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 ${theme.buttonPrimary} ${theme.isPixel ? 'pixel-font text-[10px]' : ''}`}>
          {gameMode === 'survival' && gameOver && winner === 'O' ? 'Try Again' : gameMode === 'survival' ? 'Continue' : 'New Game'}
        </button>
        <button onClick={goToMenu} className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 ${theme.button} ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : ''}`}>
          Menu
        </button>
      </div>

      {/* Current Turn Message */}
      {!gameOver && (
        <p className={`text-sm ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>
          {isAiThinking
            ? <span className={`${theme.oColor}`}>AI thinking...</span>
            : <><span className={currentPlayer === 'X' ? theme.xColor : theme.oColor}>{(gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') ? (currentPlayer === 'X' ? 'Your' : "AI's") : currentPlayer}</span>&apos;s turn</>
          }
        </p>
      )}

      {/* Game Over Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className={`rounded-2xl p-6 max-w-xs w-full shadow-2xl transform transition-all ${theme.card}`} onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              {isDraw ? (
                <>
                  <div className="text-6xl mb-4">🤝</div>
                  <h2 className={`text-2xl font-bold ${theme.accentColor} ${theme.isPixel ? 'pixel-font text-sm' : ''}`}>It&apos;s a Draw!</h2>
                  {gameMode === 'reverse' && <p className={`text-sm mt-2 ${theme.textMuted}`}>Avoid three in a row to win!</p>}
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">
                    {gameMode === 'reverse' ? (winner === 'X' ? '😅' : '😭') :
                     gameMode === 'survival' ? (winner === 'X' ? '🔥' : '💀') :
                     gameMode === 'tournament' ? (winner === 'X' ? '🏆' : '😔') :
                     gameMode === 'blitz' ? (winner === 'X' ? '⚡' : '🤖') :
                     gameMode === 'challenge' ? (winner === 'X' ? '🧩' : '🤔') :
                     (gameMode === 'ai' || gameMode === 'timeAttack') ? (winner === 'X' ? '🎉' : '🤖') :
                     '🏆'}
                  </div>
                  <h2 className={`text-2xl font-bold ${winner === 'X' ? theme.xColor : theme.oColor} ${theme.isPixel ? 'pixel-font text-sm' : ''}`}>
                    {gameMode === 'reverse' ? (winner === 'X' ? 'You Survived!' : 'You Got 3 in a Row!') :
                     gameMode === 'survival' ? (winner === 'X' ? `Streak: ${survivalStreak}!` : 'Game Over!') :
                     gameMode === 'tournament' ? (winner === 'X' ? 'Champion!' : 'Tournament Over') :
                     gameMode === 'blitz' ? (winner === 'X' ? 'Blitz Master!' : 'AI Wins Series') :
                     gameMode === 'challenge' ? (winner === 'X' ? 'Puzzle Solved!' : 'Try Again') :
                     (gameMode === 'ai' || gameMode === 'timeAttack') ? (winner === 'X' ? 'You Win!' : 'AI Wins!') :
                     `${winner} Wins!`}
                  </h2>
                  {gameMode === 'survival' && winner === 'X' && (
                    <p className={`text-sm mt-2 ${theme.textMuted}`}>Difficulty increasing...</p>
                  )}
                </>
              )}
            </div>

            <div className={`flex justify-center gap-6 mb-6 py-4 rounded-xl ${theme.isBrutalism ? 'bg-gray-100' : theme.isPixel ? 'bg-[#0f0f23]' : theme.isMayan ? 'bg-[#2d1810]' : theme.isSamurai ? 'bg-[#1a1714]' : 'bg-slate-900/50'}`}>
              <div className="text-center"><div className={`font-bold text-xl ${theme.xColor} ${theme.isPixel ? 'pixel-font text-sm' : ''}`}>{scores.X}</div><div className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>{(gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') ? 'You' : 'X'}</div></div>
              <div className="text-center"><div className={`font-bold text-xl ${theme.accentColor} ${theme.isPixel ? 'pixel-font text-sm' : ''}`}>{scores.draws}</div><div className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>Draws</div></div>
              <div className="text-center"><div className={`font-bold text-xl ${theme.oColor} ${theme.isPixel ? 'pixel-font text-sm' : ''}`}>{scores.O}</div><div className={`text-xs ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>{(gameMode === 'ai' || gameMode === 'timeAttack' || gameMode === 'survival' || gameMode === 'challenge' || gameMode === 'blitz' || gameMode === 'reverse') ? 'AI' : 'O'}</div></div>
            </div>

            <div className="flex gap-3">
              <button onClick={closeModal} className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all active:scale-95 ${theme.button} ${theme.text} ${theme.isPixel ? 'pixel-font text-[10px]' : ''}`}>Close</button>
              <button onClick={handlePlayAgain} className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all active:scale-95 ${theme.buttonPrimary} ${theme.isPixel ? 'pixel-font text-[10px]' : ''}`}>
                {gameMode === 'survival' ? (winner === 'O' ? 'Try Again' : 'Continue') : 'Play Again'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className={`text-xs mt-auto pt-2 ${theme.textMuted} ${theme.isPixel ? 'pixel-font text-[8px]' : ''}`}>
        {gameMode === 'pvp' && 'Tap to play'}
        {gameMode === 'ai' && `vs AI (${difficulty})`}
        {gameMode === 'timeAttack' && '⏱️ Time Attack - Beat the clock!'}
        {gameMode === 'blitz' && '⚡ Blitz - Fast & furious!'}
        {gameMode === 'survival' && `🔥 Survival - Streak: ${survivalStreak}`}
        {gameMode === 'tournament' && `🏆 Tournament - Round ${tournamentRound}`}
        {gameMode === 'challenge' && '🧩 Challenge - Solve the puzzle!'}
        {gameMode === 'reverse' && '🔄 Reverse - Avoid winning!'}
      </p>
    </div>
  )
}
