import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Bird {
  x: number;
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  id: number;
  passed: boolean;
}

const BIRD_SIZE = 24;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.4;
const JUMP_FORCE = -8;
const PIPE_SPEED = 2;
const GROUND_HEIGHT = 60;

const FlappyBird = () => {
  const [bird, setBird] = useState<Bird>({ x: 100, y: 250, velocity: 0 });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameHeight] = useState(500);
  const [gameWidth] = useState(800);
  const [isFlapping, setIsFlapping] = useState(false);

  const jump = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    if (gameOver) return;
    
    setBird(prev => ({ ...prev, velocity: JUMP_FORCE }));
    setIsFlapping(true);
    setTimeout(() => setIsFlapping(false), 150);
  }, [gameStarted, gameOver]);

  const resetGame = () => {
    setBird({ x: 100, y: 250, velocity: 0 });
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
  };

  // Generate new pipe
  const generatePipe = useCallback((x: number) => {
    const minHeight = 50;
    const maxHeight = gameHeight - GROUND_HEIGHT - PIPE_GAP - 50;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    const bottomHeight = gameHeight - GROUND_HEIGHT - topHeight - PIPE_GAP;
    
    return {
      x,
      topHeight,
      bottomHeight,
      id: Date.now(),
      passed: false,
    };
  }, [gameHeight]);

  // Game physics and collision detection
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setBird(prev => {
        let newY = prev.y + prev.velocity;
        let newVelocity = prev.velocity + GRAVITY;

        // Ground collision
        if (newY > gameHeight - GROUND_HEIGHT - BIRD_SIZE) {
          setGameOver(true);
          return prev;
        }

        // Ceiling collision
        if (newY < 0) {
          newY = 0;
          newVelocity = 0;
        }

        return { ...prev, y: newY, velocity: newVelocity };
      });

      setPipes(prev => {
        let newPipes = prev.map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED,
        }));

        // Remove pipes that are off screen
        newPipes = newPipes.filter(pipe => pipe.x > -PIPE_WIDTH);

        // Add new pipe if needed
        if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < gameWidth - 300) {
          newPipes.push(generatePipe(gameWidth));
        }

        // Check for scoring and collisions
        newPipes.forEach(pipe => {
          const birdLeft = bird.x;
          const birdRight = bird.x + BIRD_SIZE;
          const birdTop = bird.y;
          const birdBottom = bird.y + BIRD_SIZE;

          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + PIPE_WIDTH;

          // Score when bird passes pipe
          if (!pipe.passed && birdLeft > pipeRight) {
            pipe.passed = true;
            setScore(s => s + 1);
          }

          // Check collision
          if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check if bird hits top or bottom pipe
            if (birdTop < pipe.topHeight || birdBottom > gameHeight - GROUND_HEIGHT - pipe.bottomHeight) {
              setGameOver(true);
            }
          }
        });

        return newPipes;
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, bird.x, bird.y, gameHeight, gameWidth, generatePipe]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-start to-game-sky-end p-4">
      <div className="relative mb-4">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Flappy Bird</h1>
        <div className="text-2xl font-semibold text-white drop-shadow-md text-center">
          Score: {score}
        </div>
      </div>

      <div 
        className="relative border-4 border-game-ground overflow-hidden rounded-lg shadow-2xl bg-gradient-to-b from-game-sky-start to-game-sky-end cursor-pointer"
        style={{ width: gameWidth, height: gameHeight }}
        onClick={jump}
        onTouchStart={(e) => {
          e.preventDefault();
          jump();
        }}
      >
        {/* Bird */}
        <div
          className={`absolute rounded-full bg-game-bird border-2 border-game-bird-shadow transition-transform ${isFlapping ? 'animate-bird-flap' : ''}`}
          style={{
            width: BIRD_SIZE,
            height: BIRD_SIZE,
            left: bird.x,
            top: bird.y,
            transform: `rotate(${Math.min(Math.max(bird.velocity * 3, -30), 90)}deg)`,
          }}
        >
          {/* Bird eye */}
          <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full">
            <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-black rounded-full"></div>
          </div>
        </div>

        {/* Pipes */}
        {pipes.map(pipe => (
          <div key={pipe.id}>
            {/* Top pipe */}
            <div
              className="absolute bg-game-pipe border-2 border-game-ground"
              style={{
                left: pipe.x,
                top: 0,
                width: PIPE_WIDTH,
                height: pipe.topHeight,
              }}
            />
            {/* Bottom pipe */}
            <div
              className="absolute bg-game-pipe border-2 border-game-ground"
              style={{
                left: pipe.x,
                bottom: GROUND_HEIGHT,
                width: PIPE_WIDTH,
                height: pipe.bottomHeight,
              }}
            />
          </div>
        ))}

        {/* Ground */}
        <div 
          className="absolute bottom-0 w-full bg-game-ground border-t-4 border-game-pipe"
          style={{ height: GROUND_HEIGHT }}
        />

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg text-center shadow-xl">
              <h2 className="text-3xl font-bold mb-4 text-game-pipe">Game Over!</h2>
              <p className="text-xl mb-2 text-gray-700">Final Score: {score}</p>
              <Button 
                onClick={resetGame}
                className="mt-4 bg-game-bird hover:bg-game-bird-shadow text-white font-bold py-2 px-6 rounded-lg transform hover:scale-105 transition-all"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}

        {/* Start Screen */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-4 drop-shadow-lg">Click or Press Space to Start!</h2>
              <p className="text-lg drop-shadow-md">Avoid the pipes and try to get a high score</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-white drop-shadow-md max-w-md">
        <p className="text-sm">
          <strong>Controls:</strong> Click, tap, or press spacebar to make the bird jump!
        </p>
      </div>
    </div>
  );
};

export default FlappyBird;