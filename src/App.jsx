import React, { useState, useEffect, useRef } from 'react';
import { Button, Space } from 'antd';
import { PlayCircleOutlined, PauseOutlined, ReloadOutlined } from '@ant-design/icons';
import './App.less';

const App = () => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused, gameOver
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [marioPosition, setMarioPosition] = useState({ x: 50, y: 300 });
  const [enemies, setEnemies] = useState([
    { id: 1, x: 400, y: 320, direction: -1 },
    { id: 2, x: 700, y: 320, direction: 1 }
  ]);
  const [platforms] = useState([
    { x: 0, y: 350, width: 800, height: 50 },
    { x: 200, y: 280, width: 100, height: 20 },
    { x: 400, y: 250, width: 100, height: 20 },
    { x: 600, y: 220, width: 100, height: 20 }
  ]);
  const [coins, setCoins] = useState([
    { id: 1, x: 250, y: 250, collected: false },
    { id: 2, x: 450, y: 220, collected: false },
    { id: 3, x: 650, y: 190, collected: false }
  ]);
  
  const gameRef = useRef(null);
  const keysPressed = useRef({});
  const gravity = useRef(0.5);
  const velocity = useRef({ x: 0, y: 0 });
  const jumpForce = useRef(-12);
  const moveSpeed = useRef(5);
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // 游戏主循环
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const gameLoop = () => {
      // 移动马里奥
      handleMovement();
      
      // 更新敌人位置
      updateEnemies();
      
      // 检测碰撞
      checkCollisions();
      
      // 继续游戏循环
      gameRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameRef.current) {
        cancelAnimationFrame(gameRef.current);
      }
    };
  }, [gameState, enemies, coins]);
  
  const handleMovement = () => {
    const newVelocity = { ...velocity.current };
    
    // 水平移动
    if (keysPressed.current['ArrowRight']) {
      newVelocity.x = moveSpeed.current;
    } else if (keysPressed.current['ArrowLeft']) {
      newVelocity.x = -moveSpeed.current;
    } else {
      newVelocity.x = 0;
    }
    
    // 跳跃
    if (keysPressed.current[' '] && isOnGround()) {
      newVelocity.y = jumpForce.current;
    }
    
    // 应用重力
    newVelocity.y += gravity.current;
    
    // 更新位置
    const newPosition = {
      x: marioPosition.x + newVelocity.x,
      y: marioPosition.y + newVelocity.y
    };
    
    // 边界检查
    if (newPosition.x < 0) newPosition.x = 0;
    if (newPosition.x > 750) newPosition.x = 750;
    if (newPosition.y > 350) {
      newPosition.y = 350;
      newVelocity.y = 0;
    }
    
    // 平台碰撞检测
    let onGround = false;
    for (const platform of platforms) {
      if (
        newPosition.x + 50 > platform.x &&
        newPosition.x < platform.x + platform.width &&
        marioPosition.y + 50 <= platform.y &&
        newPosition.y + 50 >= platform.y
      ) {
        newPosition.y = platform.y - 50;
        newVelocity.y = 0;
        onGround = true;
        break;
      }
    }
    
    // 更新状态
    setMarioPosition(newPosition);
    velocity.current = newVelocity;
  };
  
  const isOnGround = () => {
    return marioPosition.y >= 350;
  };
  
  const updateEnemies = () => {
    setEnemies(prev => prev.map(enemy => {
      let newX = enemy.x + (2 * enemy.direction);
      
      // 边界检测
      if (newX < 0 || newX > 750) {
        return { ...enemy, direction: -enemy.direction };
      }
      
      return { ...enemy, x: newX };
    }));
  };
  
  const checkCollisions = () => {
    // 敌人碰撞检测
    for (const enemy of enemies) {
      if (
        marioPosition.x + 40 > enemy.x &&
        marioPosition.x < enemy.x + 30 &&
        marioPosition.y + 40 > enemy.y &&
        marioPosition.y < enemy.y + 30
      ) {
        // 从上方踩敌人
        if (velocity.current.y > 0 && marioPosition.y + 40 < enemy.y + 15) {
          setScore(prev => prev + 100);
          setEnemies(prev => prev.filter(e => e.id !== enemy.id));
          velocity.current.y = jumpForce.current / 2;
        } else {
          // 被敌人碰到
          handleMarioHit();
        }
        break;
      }
    }
    
    // 金币收集
    setCoins(prev => prev.map(coin => {
      if (
        !coin.collected &&
        marioPosition.x + 30 > coin.x &&
        marioPosition.x < coin.x + 20 &&
        marioPosition.y + 40 > coin.y &&
        marioPosition.y < coin.y + 20
      ) {
        setScore(prev => prev + 50);
        return { ...coin, collected: true };
      }
      return coin;
    }));
  };
  
  const handleMarioHit = () => {
    setLives(prev => {
      if (prev <= 1) {
        setGameState('gameOver');
        return 0;
      }
      return prev - 1;
    });
    
    // 重置位置
    setMarioPosition({ x: 50, y: 300 });
    velocity.current = { x: 0, y: 0 };
  };
  
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setMarioPosition({ x: 50, y: 300 });
    setEnemies([
      { id: 1, x: 400, y: 320, direction: -1 },
      { id: 2, x: 700, y: 320, direction: 1 }
    ]);
    setCoins([
      { id: 1, x: 250, y: 250, collected: false },
      { id: 2, x: 450, y: 220, collected: false },
      { id: 3, x: 650, y: 190, collected: false }
    ]);
  };
  
  const togglePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };
  
  return (
    <div className="game-container">
      <div className="game-header">
        <Space>
          <span>分数: {score}</span>
          <span>生命: {lives}</span>
        </Space>
        
        <Space>
          {gameState === 'ready' || gameState === 'gameOver' ? (
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={startGame}
            >
              {gameState === 'gameOver' ? '重新开始' : '开始游戏'}
            </Button>
          ) : (
            <Button 
              icon={gameState === 'paused' ? <PlayCircleOutlined /> : <PauseOutlined />}
              onClick={togglePause}
            >
              {gameState === 'paused' ? '继续' : '暂停'}
            </Button>
          )}
        </Space>
      </div>
      
      <div className="game-screen">
        {/* 游戏背景 */}
        <div className="sky"></div>
        
        {/* 平台 */}
        {platforms.map((platform, index) => (
          <div 
            key={index}
            className="platform"
            style={{
              left: platform.x,
              top: platform.y,
              width: platform.width,
              height: platform.height
            }}
          ></div>
        ))}
        
        {/* 金币 */}
        {coins.map(coin => !coin.collected && (
          <div 
            key={coin.id}
            className="coin"
            style={{
              left: coin.x,
              top: coin.y
            }}
          ></div>
        ))}
        
        {/* 敌人 */}
        {enemies.map(enemy => (
          <div 
            key={enemy.id}
            className="enemy"
            style={{
              left: enemy.x,
              top: enemy.y
            }}
          ></div>
        ))}
        
        {/* 马里奥 */}
        <div 
          className={`mario ${velocity.current.x > 0 ? 'facing-right' : velocity.current.x < 0 ? 'facing-left' : ''}`}
          style={{
            left: marioPosition.x,
            top: marioPosition.y
          }}
        ></div>
        
        {/* 游戏状态提示 */}
        {gameState === 'ready' && (
          <div className="game-message">
            <h2>超级玛丽小游戏</h2>
            <p>使用方向键移动，空格键跳跃</p>
            <Button 
              type="primary" 
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={startGame}
            >
              开始游戏
            </Button>
          </div>
        )}
        
        {gameState === 'paused' && (
          <div className="game-message">
            <h2>游戏暂停</h2>
            <Button 
              type="primary" 
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={togglePause}
            >
              继续游戏
            </Button>
          </div>
        )}
        
        {gameState === 'gameOver' && (
          <div className="game-message">
            <h2>游戏结束</h2>
            <p>最终得分: {score}</p>
            <Button 
              type="primary" 
              size="large"
              icon={<ReloadOutlined />}
              onClick={startGame}
            >
              再玩一次
            </Button>
          </div>
        )}
      </div>
      
      <div className="game-controls">
        <p>控制说明: ← → 移动 | 空格键跳跃</p>
      </div>
    </div>
  );
};

export default App;
