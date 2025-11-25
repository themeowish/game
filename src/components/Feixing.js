import React, { useState } from 'react';
import '../styles/Feixing.css';
import boardConfig from '../content/feixing.json';
import { Link } from 'react-router-dom';

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
  // 提示框状态
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 }); // 提示框状态
  
  // 替换文本中的玩家标识为实际名字
  const replacePlayerNames = (text) => {
    if (!text) return text;
    let result = text;
    // 替换玩家A、玩家B、玩家C、玩家D
    ['A', 'B', 'C', 'D'].forEach((player) => {
      const playerName = positions[player]?.name || `玩家${player}`;
      // 替换各种可能的格式
      const patterns = [
        new RegExp(`玩家${player}`, 'g'),
        new RegExp(`玩家 ${player}`, 'g'),
        new RegExp(`${player}玩家`, 'g'),
        new RegExp(`${player} 玩家`, 'g'),
        new RegExp(`Player${player}`, 'gi'),
        new RegExp(`Player ${player}`, 'gi'),
        new RegExp(`player${player}`, 'gi'),
        new RegExp(`player ${player}`, 'gi'),
        new RegExp(`${player.toLowerCase()}玩家`, 'g'),
        new RegExp(`玩家${player.toLowerCase()}`, 'g'),
      ];
      
      patterns.forEach(pattern => {
        result = result.replace(pattern, playerName);
      });
    });
    return result;
  };
  
  // 显示跳过对话框
  const showSkipDialog = (position, alternateNext) => {
    const squareInfo = boardConfig[position];
    if (squareInfo) {
      const content = squareInfo.skip || 'No additional information';
      setDialogContent(replacePlayerNames(content));
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
          }, 250);
        }, 250);
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
    }, 250);
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
      const content = squareInfo.description || 'No additional information';
      setDialogContent(replacePlayerNames(content));
      setIsDialogVisible(true);
    }
  };

  const closeDialog = () => {
    setIsDialogVisible(false);
    setDialogContent('');
  };

  const handleSquareClick = (index) => {
    // 只允许点击 boardConfig 中定义的格子
    if (!boardConfig[index]) {
      return;
    }
    const squareInfo = boardConfig[index]?.description;
    if (squareInfo) {
      setDialogContent(replacePlayerNames(squareInfo));
      setIsDialogVisible(true);
    }
  };

  
  // 鼠标悬停时显示提示框
  const handleMouseOver = (e, index) => {
    // 只允许悬停显示 boardConfig 中定义的格子
    if (!boardConfig[index]) {
      return;
    }
    const squareInfo = boardConfig[index]?.description;
    if (squareInfo) {
      const rect = e.currentTarget.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = 300; // 提示框预估宽度
      
      // 计算最佳水平位置
      let x = rect.left + rect.width / 2;
      if (x - tooltipWidth / 2 < 10) {
        x = tooltipWidth / 2 + 10; // 左侧边界
      } else if (x + tooltipWidth / 2 > viewportWidth - 10) {
        x = viewportWidth - tooltipWidth / 2 - 10; // 右侧边界
      }
      
      setTooltip({
        visible: true,
        content: replacePlayerNames(squareInfo),
        x: x,
        y: rect.top,
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
            <p>准备好开始一场刺激的冒险了吗？</p>
            <p>本游戏为两对男女共同游玩</p>
            <p>详细规则可参考棋盘下的说明</p>
            
            {/* 第一对：玩家A和B */}
            <div className="player-pair-box">
              <h4 className="pair-title">第一对</h4>
              <div className="player-input-group">
                <div className="player-input-item">
                  <label>
                    玩家 A
                    <span className="gender-tag gender-female">女生</span>
                  </label>
                  <input
                    type="text"
                    placeholder="玩家A昵称"
                    value={playerNames.A}
                    onChange={(e) => handleNameChange('A', e.target.value)}
                  />
                </div>
                <div className="player-input-item">
                  <label>
                    玩家 B
                    <span className="gender-tag gender-male">男生</span>
                  </label>
                  <input
                    type="text"
                    placeholder="玩家B昵称"
                    value={playerNames.B}
                    onChange={(e) => handleNameChange('B', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 第二对：玩家C和D */}
            <div className="player-pair-box">
              <h4 className="pair-title">第二对</h4>
              <div className="player-input-group">
                <div className="player-input-item">
                  <label>
                    玩家 C
                    <span className="gender-tag gender-female">女生</span>
                  </label>
                  <input
                    type="text"
                    placeholder="玩家C昵称"
                    value={playerNames.C}
                    onChange={(e) => handleNameChange('C', e.target.value)}
                  />
                </div>
                <div className="player-input-item">
                  <label>
                    玩家 D
                    <span className="gender-tag gender-male">男生</span>
                  </label>
                  <input
                    type="text"
                    placeholder="玩家D昵称"
                    value={playerNames.D}
                    onChange={(e) => handleNameChange('D', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button onClick={startGame}>开始游戏</button>
          </div>
        </div>
      )}

      {/* 状态栏 */}
      <div className="status-wrapper">

        <div className="back-button">
          <Link to="/" className="back-link">←主页</Link>
        </div>
        <div className="status-bar">

          <div className="current-player">
            <strong>当前玩家</strong>
            <span>{positions[currentPlayer].name || `玩家 ${currentPlayer}`}</span>
          </div>
          <div className={`dice-container ${isRolling ? 'rolling' : ''}`}>
            <img src={diceImage} alt="Dice" className={`dice ${isRolling ? 'rolling' : ''}`} />
          </div>
          <button className="go-button" onClick={rollDice} disabled={isMoving || positions[currentPlayer].hasFinished || isRolling}>
            {isRolling ? '摇骰中...' : '摇骰子'}
          </button>
        </div>
      </div>
      
      {/* 普通格子的对话框 */}
      {isDialogVisible && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">任务内容</h3>
            <p>{dialogContent}</p>
            <button onClick={closeDialog}>我知道了</button>
          </div>
        </div>
      )}
      {/* 提示框 */}
      {tooltip.visible && (
        <div
          className="tooltip"
          style={{ 
            top: (tooltip.y - 8) + 'px', 
            left: tooltip.x + 'px',
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
      {/* 跳过的对话框 */}
      {isSkipDialogVisible && (
        <div className="dialog-overlay">
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">特殊任务</h3>
            <p>{dialogContent}</p>
            <div className="dialog-buttons">
              <button onClick={handleSkipConfirm} className="confirm-button">接受挑战</button>
              <button onClick={handleSkipCancel} className="cancel-button">跳过</button>
            </div>
          </div>
        </div>
      )}
      {/* 棋盘 */}
      <div className="board-container">
      <div className="board">
        {Array.from({ length: size * size }, (_, index) => (
          <div
            key={index}
            className={`square ${boardConfig[index]?.type ? boardConfig[index].type : 'empty'} ${!boardConfig[index] ? 'unclickable' : ''}`} // 检查格子类型，未定义的格子添加 unclickable 类
            onMouseOver={(e) => handleMouseOver(e, index)} // 鼠标悬停显示提示框
            onMouseOut={handleMouseOut} // 鼠标移出隐藏提示框
            onClick={() => handleSquareClick(index)}
            style={{ cursor: boardConfig[index] ? 'pointer' : 'default' }}>
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
      </div>

      {/* 说明栏目 */}
      <div className="game-intro">
        <h2>多人运动飞行棋 脱衣版</h2>
        <h3>2男2女（2对）</h3>
        <p>1. 本飞行棋含有一些大尺度内容，若有不能完成的项目可自行变换或用喝酒代替。</p>
        <p>2.准备好酒水，套套若干。整洁干净自身，啤酒或鸡尾酒，杯子大小自己选择，建议适量饮酒，娱乐为主,不要耽误后面的主要活动。</p>
        <p>3.棋盘中的很多游戏都取决于你当前身上衣服的数量，所以开始游戏前最多可以穿四件衣服，袜子不算，不可以随便增减衣服，开始游戏前请调好室内温度。</p>
        <p>4.当属于一队的男女都到达终点游戏结束，获胜方可对对方提出任意要求！</p>
        <p>5.当棋子正好位于与棋子颜色相同的格子的时候的点的时候即可完成相应的任务飞行，飞行任务大多为尺度比较大的项目，不能完成任务则留在原地。</p>
        <p>6.当棋子进入最终冲刺阶段后（前往终点之前带颜色的格子），玩家必须骰出刚好到达终点的点数才算游戏胜利。不然要倒退回多余的点数并完成格子上的任务。</p>
        <p>游戏作者：<a href="https://twitter.com/bugmaker000" target="_blank" rel="noopener noreferrer" className="game-intro-link">
          <svg className="x-logo" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          @bugmaker000
        </a></p>
      </div>
    </div>
  );
};

export default Board;