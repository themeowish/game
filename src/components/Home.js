import React from 'react';
import { useNavigate } from 'react-router-dom'; // 使用 React Router 的导航功能
import '../styles/Home.css';

const HomePage = () => {
  const navigate = useNavigate(); // 初始化导航

  return (
    <div className="home-container">
      {/* 标题部分 */}
      <header className="home-header">
        <h1 className="home-title">喵喵愿望屋的游戏室！</h1>
        <p className="home-subtitle">
          欢迎来到喵喵愿望屋的游戏室，我们提供各种不同的破冰小游戏！
        </p>
      </header>

      {/* 游戏介绍部分 */}
      <section className="home-intro">
        <p>
          我们致力于打造丰富、有趣、带点暧昧的破冰游戏，让每一次活动都能快乐的进行！
          请根据活动的人数来选择合适的游戏，游戏中会用到各类道具，北美用户欢迎到<a href="https://www.themeowish.com" target="_blank" rel="noopener noreferrer">喵喵愿望屋</a>购买！
        </p>
      </section>

      {/* 游戏列表部分 */}
      <section className="game-list">
        <h2 className="game-list-title">游戏列表</h2>
        <ul className="game-cards">
          <li className="game-card">
            <div className="game-thumbnail">
              <h3>激情脱衣</h3>
            </div>
            <div className="game-info">
              <h3>飞行棋</h3>
              <p>参与人数：4</p>
              <p>2对（2男2女）</p>
              <p>尺度：交换，插入，口交</p>
              <button
                className="game-button"
                onClick={() => navigate('/flying-chess')} 
              >
                进入游戏
              </button>
            </div>
          </li>
          <li className="game-card">
            <div className="game-thumbnail">
              <h3>三人成行</h3>
            </div>
            <div className="game-info">
              <h3>三人热场游戏</h3>
              <p>参与人数：3</p>
              <p>1女2男）</p>
              <p>尺度：插入，口交</p>
              <button
                className="game-button"
                onClick={() => navigate('/sanrenxing')} 
              >
                进入游戏
              </button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default HomePage;