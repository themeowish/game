import React, { useState } from 'react';
import '../styles/Board.css';
import boardConfig from '../content/feixing.json';

const Board = () => {
  const size = 13;
  const diceImages = [
    require('../content/img/Dice-1.svg').default,
    require('../content/img/Dice-2.svg').default,
    require('../content/img/Dice-3.svg').default,
    require('../content/img/Dice-4.svg').default,
    require('../content/img/Dice-5.svg').default,
    require('../content/img/Dice-6.svg').default,

  ]
  // 玩家初始位置和默认名称
  const initialPlayers = {
    A: { position: 128, name: '', hasFinished: false },
    B: { position: 9, name: '', hasFinished: false },
    C: { position: 129, name: '', hasFinished: false },
    D: { position: 159, name: '', hasFinished: false }
  };

  const [positions, setPositions] = useState(initialPlayers); // 每个玩家的位置、名字和终点状态
  const [currentPlayer, setCurrentPlayer] = useState('A'); // 当前玩家
  const [dice, setDice] = useState(0); // 骰子的点数
  const [diceImage, setDiceImage] = useState(diceImages[0]); // 当前显示的骰子图片
  const [isMoving, setIsMoving] = useState(false); // 控制棋子是否在移动中
  const [isRolling, setIsRolling] = useState(false); // 控制骰子的动画
  const [dialogContent, setDialogContent] = useState(''); // 控制对话框的内容
  const [isDialogVisible, setIsDialogVisible] = useState(false); // 控制对话框是否显示
  const [isNameDialogVisible, setIsNameDialogVisible] = useState(true); // 玩家名称输入对话框

  // 用于存储用户输入的玩家名称
  const [playerNames, setPlayerNames] = useState({
    A: '',
    B: '',
    C: '',
    D: ''
  });

  // 处理玩家名称输入
  const handleNameChange = (player, name) => {
    setPlayerNames((prevNames) => ({
      ...prevNames,
      [player]: name
    }));
  };

  // 开始游戏并设置玩家名称
  const startGame = () => {
    const updatedPositions = { ...positions };
    Object.keys(playerNames).forEach((player) => {
      updatedPositions[player].name = playerNames[player] || `Player ${player}`;
    });
    setPositions(updatedPositions);
    setIsNameDialogVisible(false);
  };

  const rollDice = () => {
    if (isMoving || positions[currentPlayer].hasFinished || isRolling) return;
    setIsRolling(true);

    let currentIndex = 0;
    const rollingInterval = setInterval(() => {
      setDiceImage(diceImages[currentIndex]);
      currentIndex = (currentIndex + 1) % diceImages.length;
    }, 100);

    setTimeout(() => {
      clearInterval(rollingInterval);
      const result = Math.floor(Math.random() * 6) + 1;
      setDice(result);
      setDiceImage(diceImages[result - 1]);
      setIsRolling(false);
      movePlayer(result);
    }, 1000); // 动画持续1秒
  };

  const movePlayer = (steps) => {
    setIsMoving(true);
    let position = positions[currentPlayer].position;
    let newPosition = position;
    const finishPosition = findFinishPosition(); // 获取终点位置
  
    const interval = setInterval(() => {
      const remainingStepsToFinish = calculateRemainingSteps(newPosition, finishPosition);
  
      if (remainingStepsToFinish === steps) {
        // 如果骰子点数刚好等于到终点的距离
        newPosition = finishPosition;
        steps = 0;
        setPositions((prevPositions) => ({
          ...prevPositions,
          [currentPlayer]: { ...prevPositions[currentPlayer], position: newPosition }
        }));
        clearInterval(interval);
        setIsMoving(false);
        checkIfPlayerFinished(newPosition);
        showDialog(newPosition); // 运行结束后显示对话框
  
      } else if (remainingStepsToFinish < steps) {
        // 如果骰子点数大于到终点的步数
        newPosition = finishPosition;
        steps -= remainingStepsToFinish;
        setPositions((prevPositions) => ({
          ...prevPositions,
          [currentPlayer]: { ...prevPositions[currentPlayer], position: newPosition }
        }));

        // 倒退逻辑
        setTimeout(() => {
          const backInterval = setInterval(() => {
            const prevPosition = getPreviousPosition(newPosition, currentPlayer);
            if (prevPosition !== undefined && steps > 0) {
              newPosition = prevPosition;
              steps -= 1;
              setPositions((prevPositions) => ({
                ...prevPositions,
                [currentPlayer]: { ...prevPositions[currentPlayer], position: newPosition }
              }));
            } else {
              clearInterval(backInterval);
              setIsMoving(false);
              switchPlayer();
              showDialog(newPosition); // 运行结束后显示对话框
            }
          }, 500);
        }, 500);
        clearInterval(interval);
  
      } else if (steps > 0) {
        // 正常前进逻辑
        const next = getNextPosition(newPosition, currentPlayer);
        if (next !== undefined) {
          newPosition = next;
          steps -= 1;
          setPositions((prevPositions) => ({
            ...prevPositions,
            [currentPlayer]: { ...prevPositions[currentPlayer], position: newPosition }
          }));

        // 检查是否停在含 `alternateNext` 的位置
        if (steps === 0 && boardConfig[newPosition]?.triggerPlayer === currentPlayer) {
          const alternateNext = boardConfig[newPosition].alternateNext;
          if (alternateNext) {
            clearInterval(interval);
            setIsMoving(false);
            showSkipDialog(newPosition, alternateNext);
          }
        }
        } else {
          clearInterval(interval);
          setIsMoving(false);
        }
      } else {
        clearInterval(interval);
        setIsMoving(false);
        checkIfPlayerFinished(newPosition);
        showDialog(newPosition); // 运行结束后显示对话框
      }
    }, 50);
  };
  
  const showSkipDialog = (position, alternateNext) => {
    const skip = window.confirm(`Do you want to skip to position ${alternateNext}?`);
  
    if (skip) {
      setPositions((prevPositions) => ({
        ...prevPositions,
        [currentPlayer]: { ...prevPositions[currentPlayer], position: alternateNext }
      }));
    }
  
    switchPlayer(); // 无论选择如何，都切换到下一玩家
  };

  // 计算当前位置到终点的步数距离
  const calculateRemainingSteps = (currentPosition, finishPosition) => {
    let count = 0;
    let position = currentPosition;
    while (position !== finishPosition) {
      position = getNextPosition(position, currentPlayer);
      if (position === undefined) break; // 避免没有下一个位置的情况
      count++;
    }
    return count;
  };
  
  const findFinishPosition = () => {
    return parseInt(Object.keys(boardConfig).find((key) => boardConfig[key].type === 'finish'), 10);
  };
  
  // 获取玩家进入终点的方向
  const getPreviousPosition = (position, player) => {
    const prev = boardConfig[position]?.prev;
    return typeof prev === 'object' ? prev[player] : prev;
  };
  const getNextPosition = (position, player) => {
    const next = boardConfig[position]?.next;
    return typeof next === 'object' ? next[player] : next;
  };

  const checkIfPlayerFinished = (position) => {
    if (boardConfig[position]?.type === 'finish') {
      setPositions((prevPositions) => ({
        ...prevPositions,
        [currentPlayer]: { ...prevPositions[currentPlayer], hasFinished: true }
      }));
    }
    switchPlayer();
  };

  const switchPlayer = () => {
    let nextPlayer = getNextPlayer(currentPlayer);
    while (positions[nextPlayer].hasFinished) {
      nextPlayer = getNextPlayer(nextPlayer);
    }
    setCurrentPlayer(nextPlayer);
  };

  const getNextPlayer = (player) => {
    return player === 'A' ? 'B' : player === 'B' ? 'C' : player === 'C' ? 'D' : 'A';
  };

  const showDialog = (position) => {
    const squareInfo = boardConfig[position];
    if (squareInfo) {
      setDialogContent(squareInfo.description || 'No additional information');
      setIsDialogVisible(true);
    }
  };

  const closeDialog = () => {
    setIsDialogVisible(false);
    setDialogContent('');
  };

  const handleSquareClick = (index) => {
    if (Object.values(positions).some(player => player.position === index)) {
      showDialog(index);
    }
  };

  return (
    <div className="game-container">
      {isNameDialogVisible && (
        <div className="name-dialog-overlay">
          <div className="name-dialog-content">
            <h3>Enter Player Names</h3>
            {Object.keys(playerNames).map((player) => (
              <div key={player}>
                <label>{`Player ${player} Name:`}</label>
                <input
                  type="text"
                  value={playerNames[player]}
                  onChange={(e) => handleNameChange(player, e.target.value)}
                />
              </div>
            ))}
            <button onClick={startGame}>Start Game</button>
          </div>
        </div>
      )}

      <div className="status-bar">
        <div className="current-player">
          <strong>Current Player:</strong> {positions[currentPlayer].name} ({currentPlayer})
        </div>
        <div className="dice-container">
          <img src={diceImage} alt="Dice" className="dice" />
        </div>
        <button className="go-button" onClick={rollDice} disabled={isMoving || positions[currentPlayer].hasFinished || isRolling}>
          GO
        </button>
      </div>

      {isDialogVisible && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-content">
            <p>{dialogContent}</p>
            <button onClick={closeDialog}>Close</button>
          </div>
        </div>
      )}

      <div className="board">
        {Array.from({ length: size * size }, (_, index) => (
          <div
          key={index}
          className={`square ${boardConfig[index]?.type ? boardConfig[index].type : 'empty'}`} // 检查格子类型
          onClick={() => handleSquareClick(index)}>
          {Object.keys(positions).map((player) =>
            positions[player].position === index && !positions[player].hasFinished ? (
              <span key={player} className={`player player-${player}`}>{player}</span>
            ) : null
          )}
        </div>
        ))}
      </div>
    </div>
  );
};

export default Board;