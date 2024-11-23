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
    A: { position: 39, name: '', hasFinished: false },
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

  // 新增状态控制跳过对话框
  const [isSkipDialogVisible, setIsSkipDialogVisible] = useState(false);
  const [skipTarget, setSkipTarget] = useState(null);
  // intro文本
  const introText = boardConfig.intro || "Welcome to the game!"; // 默认文本
  // 提示框状态
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 }); // 提示框状态
  // 显示跳过对话框
  const showSkipDialog = (position, alternateNext) => {
    const squareInfo = boardConfig[position];
    if (squareInfo) {
      setDialogContent(squareInfo.skip || 'No additional information');
    }
    setIsSkipDialogVisible(true);
    setSkipTarget(alternateNext);
  };
  
  // 确认跳过
  const handleSkipConfirm = () => {
    setPositions((prevPositions) => ({
      ...prevPositions,
      [currentPlayer]: { ...prevPositions[currentPlayer], position: skipTarget },
    }));
    setIsSkipDialogVisible(false);
    switchPlayer();
  };
  
  // 取消跳过
  const handleSkipCancel = () => {
    setIsSkipDialogVisible(false);
    switchPlayer();
  };

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
          showDialog(newPosition);
        }
      } else {
        clearInterval(interval);
        setIsMoving(false);
        checkIfPlayerFinished(newPosition);
        showDialog(newPosition); // 运行结束后显示对话框
      }
    }, 500);
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
    const squareInfo = boardConfig[index]?.description;
    if (squareInfo) {
      setDialogContent(squareInfo);
      setIsDialogVisible(true);
    }
  };

  
  // 鼠标悬停时显示提示框
  const handleMouseOver = (e, index) => {
    const squareInfo = boardConfig[index]?.description;
    if (squareInfo) {
      setTooltip({
        visible: true,
        content: squareInfo,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  // 鼠标移出时隐藏提示框
  const handleMouseOut = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  return (
    <div className="game-container">
      {/* 玩家名称输入对话框 */}
      {isNameDialogVisible && (
        <div className="name-dialog-overlay">
          <div className="name-dialog-content">
            <h3>欢迎来到情趣飞行棋</h3>
            <p>本游戏为两对男女共同游玩</p>
            <p><b>玩家AC为女性玩家，玩家BD为男性玩家</b></p>
            <p>详细规则可参考棋盘下的说明</p>
            {Object.keys(playerNames).map((player) => (
              <div key={player}>
                <label>{`玩家 ${player} :`}</label>
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

      {/* 状态栏 */}
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
      
      {/* 普通格子的对话框 */}
      {isDialogVisible && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-content">
            <p>{dialogContent}</p>
            <button onClick={closeDialog}>Close</button>
          </div>
        </div>
      )}
      {/* 提示框 */}
      {tooltip.visible && (
        <div
          className="tooltip"
          style={{ top: tooltip.y + 'px', left: tooltip.x + 'px' }}
        >
          {tooltip.content}
        </div>
      )}
      {/* 对话框 */}
            {isDialogVisible && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-content">
            <p>{dialogContent}</p>
            <button onClick={closeDialog}>Close</button>
          </div>
        </div>
      )}
      {/* 跳过的对话框 */}
      {isSkipDialogVisible && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <p>{dialogContent}</p>
            <button onClick={handleSkipConfirm}>Yes</button>
            <button onClick={handleSkipCancel}>No</button>
          </div>
        </div>
      )}
      {/* 棋盘 */}
      <div className="board">
        {Array.from({ length: size * size }, (_, index) => (
          <div
            key={index}
            className={`square ${boardConfig[index]?.type ? boardConfig[index].type : 'empty'}`} // 检查格子类型
            onMouseOver={(e) => handleMouseOver(e, index)} // 鼠标悬停显示提示框
            onMouseOut={handleMouseOut} // 鼠标移出隐藏提示框
            onClick={() => handleSquareClick(index)}>
            {Object.keys(positions).map((player) =>
              positions[player].position === index && !positions[player].hasFinished ? (
                <span
                  key={player}
                  className={`player player-${player} ${
                    currentPlayer === player ? "current" : ""
                  }`}
                >
                  {player}
                </span>
              ) : null
            )}
          </div>
        ))}
      </div>

      {/* 说明栏目 */}
      <div className="game-intro">
        <h2>多人运动飞行棋 激情脱衣版</h2>
        <h3>2男2女（2对）</h3>
        <p>1. 本飞行棋含有一些大尺度内容，若有不能完成的项目可自行变换或用喝酒代替。</p>
        <p>2.准备好酒水，套套若干。整洁干净自身，逮议啤酒或鸡尾酒，杯子大小自己选择，建议适量饮酒，娱乐为主,不要耽误后面的主要活动。</p>
        <p>3.棋盘中的很多游戏都取决于你当前身上衣服的数量，所以开始游戏前最多可以穿四件衣服，袜子不算，不可以随便增减衣服，开始游戏前请调好室内温度。</p>
        <p>4.游戏中会用到跳蛋，假JJ等道具，眼罩乳夹，情趣内衣等道具，这边推荐北美用户可以在<a href="https://www.themeowish.com" target="_blank" rel="noopener noreferrer">北美情趣第一站喵喵愿望屋</a>购买</p>
        <p>5.当属于一队的男女都到达终点游戏结束，获胜方可对对方提出任意要求！</p>
        <p>6.当棋子正好位于与棋子颜色相同的格子的时候的点的时候即可完成相应的任务飞行，飞行任务大多为尺度比较大的项目，不能完成任务则留在原地。</p>
        <p>7.当棋子进入最终冲刺阶段后（前往终点之前带颜色的格子），玩家必须骰出刚好到达终点的点数才算游戏胜利。不然要倒退回多余的点数并完成格子上的任务。</p>
      </div>
    </div>
  );
};

export default Board;