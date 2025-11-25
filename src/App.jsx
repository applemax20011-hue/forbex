import { useState } from "react";
import "./App.css";

const tabs = [
  { id: "home", label: "Главная", icon: "🏠" },
  { id: "trade", label: "Торговля", icon: "📈" },
  { id: "wallet", label: "Кошелёк", icon: "👛" },
  { id: "history", label: "История", icon: "🧾" },
  { id: "profile", label: "Профиль", icon: "🦊" },
];

// топ монет для главной
const popularCoins = [
  { symbol: "BTC", name: "Bitcoin", change: "+2.3%", price: "67 420 $" },
  { symbol: "ETH", name: "Ethereum", change: "+1.1%", price: "3 120 $" },
  { symbol: "SOL", name: "Solana", change: "+4.8%", price: "188 $" },
  { symbol: "XRP", name: "XRP", change: "-0.7%", price: "0.58 $" },
  { symbol: "TON", name: "Toncoin", change: "+3.2%", price: "6.42 $" },
  { symbol: "DOGE", name: "Dogecoin", change: "+0.9%", price: "0.19 $" },
  { symbol: "LTC", name: "Litecoin", change: "+0.4%", price: "89.3 $" },
  { symbol: "BNB", name: "BNB", change: "+1.6%", price: "612 $" },
  { symbol: "TRX", name: "TRON", change: "+0.3%", price: "0.12 $" },
  { symbol: "ARB", name: "Arbitrum", change: "+5.1%", price: "1.45 $" },
];

// мок-данные для стакана / ордеров
const orderBookMock = {
  bids: [
    { price: "67 420", amount: "0.145" },
    { price: "67 410", amount: "0.085" },
    { price: "67 400", amount: "0.220" },
    { price: "67 390", amount: "0.050" },
  ],
  asks: [
    { price: "67 450", amount: "0.130" },
    { price: "67 460", amount: "0.095" },
    { price: "67 470", amount: "0.180" },
    { price: "67 480", amount: "0.060" },
  ],
};

// мок-кошелёк
const walletBalances = [
  { symbol: "USDT", balance: "1 245.38", inOrder: "120.00" },
  { symbol: "BTC", balance: "0.0412", inOrder: "0.0050" },
  { symbol: "ETH", balance: "0.84", inOrder: "0.12" },
  { symbol: "TON", balance: "420.00", inOrder: "0" },
];

const txHistory = [
  { type: "Пополнение", asset: "USDT", amount: "+500.00", status: "Завершено", time: "Сегодня, 12:14" },
  { type: "Вывод", asset: "TON", amount: "-120.00", status: "В обработке", time: "Сегодня, 09:47" },
  { type: "Перевод", asset: "BTC", amount: "+0.0050", status: "Завершено", time: "Вчера, 21:05" },
];

const loginHistory = [
  { device: "iPhone 14, Telegram WebApp", ip: "91.***.***.23", time: "Сегодня, 12:03", status: "Успешно" },
  { device: "Windows, Chrome", ip: "37.***.***.10", time: "Вчера, 23:18", status: "Успешно" },
];

const dealsHistory = [
  { pair: "BTC/USDT", side: "Покупка", amount: "0.012", price: "66 980", time: "Сегодня, 11:58" },
  { pair: "TON/USDT", side: "Продажа", amount: "250", price: "6.30", time: "Сегодня, 10:21" },
];

function SectionTitle({ title, subtitle }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [activePair, setActivePair] = useState("BTC/USDT");
  const [orderSide, setOrderSide] = useState("buy");

  return (
    <div className="page-root">
      <div className="app-container fade-in-app">
        {/* Шапка */}
        <header className="header">
          <div className="brand">
            <div className="brand-logo-fox">🦊</div>
            <div className="brand-text">
              <span className="brand-title">FORBEX TRADE</span>
              <span className="brand-sub">
                кросс-платформенная биржа • WebApp Telegram
              </span>
              <span className="brand-tag">Multi-chain • Spot • P2P</span>
            </div>
          </div>
        </header>

        {/* Основной контент */}
        <main className="content">
          {activeTab === "home" && (
            <>
              {/* Герой-блок */}
              <section className="hero-block section-block fade-in delay-1">
                <div className="hero-left">
                  <div className="hero-label">Новая биржа</div>
                  <div className="hero-title">
                    Торгуй{" "}
                    <span className="hero-gradient">как лис 🦊</span> —
                    быстро и спокойно
                  </div>
                  <div className="hero-sub">
                    FORBEX TRADE — лёгкая биржа под WebApp Telegram. Без лишних
                    экранов, всё рядом: торговля, кошелёк, история и профиль.
                  </div>
                  <div className="hero-stats-row">
                    <div className="hero-stat">
                      <div className="hero-stat-label">Монет в листинге</div>
                      <div className="hero-stat-value">120+</div>
                    </div>
                    <div className="hero-stat">
                      <div className="hero-stat-label">Объём/сутки</div>
                      <div className="hero-stat-value">≈ 18.4M $</div>
                    </div>
                  </div>
                </div>
                <div className="hero-orb">
                  <div className="hero-orb-inner">
                    <span className="hero-orb-text">FX</span>
                  </div>
                  <div className="hero-orb-glow" />
                </div>
              </section>

              {/* Популярные монеты */}
              <section className="section-block fade-in delay-2">
                <SectionTitle
                  title="Популярные монеты"
                  subtitle="Топ-10 пар, которые чаще всего открывают на FORBEX."
                />
                <div className="coins-list">
                  {popularCoins.map((coin) => (
                    <div key={coin.symbol} className="coin-row hover-glow">
                      <div className="coin-main">
                        <div className="coin-avatar">
                          {coin.symbol[0]}
                        </div>
                        <div className="coin-texts">
                          <div className="coin-symbol">
                            {coin.symbol}
                          </div>
                          <div className="coin-name">{coin.name}</div>
                        </div>
                      </div>
                      <div className="coin-right">
                        <div className="coin-price">{coin.price}</div>
                        <div
                          className={
                            coin.change.startsWith("-")
                              ? "coin-change negative"
                              : "coin-change positive"
                          }
                        >
                          {coin.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Коротко о бирже */}
              <section className="section-block fade-in delay-3">
                <SectionTitle
                  title="О бирже FORBEX"
                  subtitle="Сделана под Telegram и мобильные устройства."
                />
                <ul className="bullets-list">
                  <li>Фокус на WebApp: удобный формат под телефон, планшет и ПК.</li>
                  <li>Ясный интерфейс: всё разбито по вкладкам, нет “шумных” экранов.</li>
                  <li>Ассоциация с лисом 🦊 — хитрый, быстрый и аккуратный трейдинг.</li>
                  <li>Дальше будут добавлены реальные ордера, P2P, лимитные заявки и т. д.</li>
                </ul>
              </section>
            </>
          )}

          {activeTab === "trade" && (
            <>
              {/* Выбор пары + псевдо-график */}
              <section className="section-block fade-in delay-1">
                <SectionTitle
                  title="Торговля"
                  subtitle="График и ордер-форма (пока демонстрация интерфейса)."
                />
                <div className="pair-selector-row">
                  <button
                    className={`pair-pill ${
                      activePair === "BTC/USDT" ? "active" : ""
                    }`}
                    onClick={() => setActivePair("BTC/USDT")}
                  >
                    BTC/USDT
                  </button>
                  <button
                    className={`pair-pill ${
                      activePair === "ETH/USDT" ? "active" : ""
                    }`}
                    onClick={() => setActivePair("ETH/USDT")}
                  >
                    ETH/USDT
                  </button>
                  <button
                    className={`pair-pill ${
                      activePair === "TON/USDT" ? "active" : ""
                    }`}
                    onClick={() => setActivePair("TON/USDT")}
                  >
                    TON/USDT
                  </button>
                </div>
                <div className="chart-card hover-glow">
                  <div className="chart-header">
                    <div className="chart-title">{activePair}</div>
                    <div className="chart-badge">Демо-график</div>
                  </div>
                  <div className="chart-body">
                    <div className="chart-line chart-line-1" />
                    <div className="chart-line chart-line-2" />
                    <div className="chart-line chart-line-3" />
                    <div className="chart-grid">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="chart-bar" />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Ордер-форма + стакан */}
              <section className="section-block trade-layout fade-in delay-2">
                <div className="order-card hover-glow">
                  <div className="order-switch">
                    <button
                      className={`order-side-btn ${
                        orderSide === "buy" ? "buy active" : ""
                      }`}
                      onClick={() => setOrderSide("buy")}
                    >
                      Купить
                    </button>
                    <button
                      className={`order-side-btn ${
                        orderSide === "sell" ? "sell active" : ""
                      }`}
                      onClick={() => setOrderSide("sell")}
                    >
                      Продать
                    </button>
                  </div>
                  <div className="order-field">
                    <div className="order-label">Цена</div>
                    <div className="order-input-mock">
                      <span>67 430</span>
                      <span className="order-unit">USDT</span>
                    </div>
                  </div>
                  <div className="order-field">
                    <div className="order-label">Количество</div>
                    <div className="order-input-mock">
                      <span>0.010</span>
                      <span className="order-unit">
                        {activePair.split("/")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="order-field">
                    <div className="order-label-row">
                      <span>Сумма</span>
                      <span className="order-label-extra">
                        Баланс: 1 245.38 USDT
                      </span>
                    </div>
                    <div className="order-input-mock">
                      <span>674.30</span>
                      <span className="order-unit">USDT</span>
                    </div>
                  </div>
                  <button
                    className={`order-submit-btn ${
                      orderSide === "buy" ? "buy" : "sell"
                    }`}
                  >
                    {orderSide === "buy"
                      ? "Купить (демо)"
                      : "Продать (демо)"}
                  </button>
                  <div className="order-note">
                    Реальная логика ордеров появится позже — сейчас только
                    дизайн интерфейса.
                  </div>
                </div>

                <div className="orderbook-card hover-glow">
                  <div className="orderbook-header">
                    <span>Стакан ордеров</span>
                    <span className="orderbook-pair">{activePair}</span>
                  </div>
                  <div className="orderbook-columns">
                    <span>Цена</span>
                    <span>Объём</span>
                    <span>Тип</span>
                  </div>
                  <div className="orderbook-list">
                    {orderBookMock.asks.map((row, i) => (
                      <div key={`ask-${i}`} className="orderbook-row ask">
                        <span>{row.price}</span>
                        <span>{row.amount}</span>
                        <span>Продажа</span>
                      </div>
                    ))}
                    {orderBookMock.bids.map((row, i) => (
                      <div key={`bid-${i}`} className="orderbook-row bid">
                        <span>{row.price}</span>
                        <span>{row.amount}</span>
                        <span>Покупка</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "wallet" && (
            <>
              {/* Баланс */}
              <section className="section-block fade-in delay-1">
                <SectionTitle
                  title="Кошелёк"
                  subtitle="Баланс, пополнение, вывод и история транзакций."
                />
                <div className="wallet-summary hover-glow">
                  <div className="wallet-balance-main">
                    <span className="wallet-balance-label">
                      Общая оценка портфеля
                    </span>
                    <span className="wallet-balance-value">
                      ≈ 2 840.27 $
                    </span>
                  </div>
                  <div className="wallet-balance-sub">
                    <span>Доступно: 2 530.27 $</span>
                    <span>В ордерах: 310.00 $</span>
                  </div>
                </div>
              </section>

              {/* Кнопки пополнить / вывести */}
              <section className="section-block fade-in delay-2">
                <div className="wallet-actions">
                  <button className="wallet-btn wallet-deposit">
                    Пополнить
                  </button>
                  <button className="wallet-btn wallet-withdraw">
                    Вывести
                  </button>
                </div>
                <div className="wallet-actions-note">
                  Здесь позже появятся реальные формы пополнения и вывода.
                </div>
              </section>

              {/* Список монет */}
              <section className="section-block fade-in delay-3">
                <SectionTitle
                  title="Баланс по монетам"
                  subtitle="Данные демонстрационные, только верстка."
                />
                <div className="wallet-list">
                  {walletBalances.map((item) => (
                    <div key={item.symbol} className="wallet-row hover-glow">
                      <div className="wallet-left">
                        <div className="wallet-avatar">
                          {item.symbol[0]}
                        </div>
                        <div className="wallet-texts">
                          <div className="wallet-symbol">
                            {item.symbol}
                          </div>
                          <div className="wallet-balance">
                            Баланс: {item.balance}
                          </div>
                        </div>
                      </div>
                      <div className="wallet-right">
                        <div className="wallet-inorder">
                          В ордерах: {item.inOrder}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* История транзакций */}
              <section className="section-block fade-in delay-4">
                <SectionTitle
                  title="История транзакций"
                  subtitle="Пополнения, выводы и переводы."
                />
                <div className="tx-list">
                  {txHistory.map((tx, i) => (
                    <div key={i} className="tx-row hover-glow">
                      <div className="tx-main">
                        <div className="tx-type">{tx.type}</div>
                        <div className="tx-asset">{tx.asset}</div>
                      </div>
                      <div className="tx-right">
                        <div
                          className={
                            tx.amount.startsWith("-")
                              ? "tx-amount negative"
                              : "tx-amount positive"
                          }
                        >
                          {tx.amount}
                        </div>
                        <div className="tx-meta">
                          {tx.status} • {tx.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "history" && (
            <>
              {/* История сделок */}
              <section className="section-block fade-in delay-1">
                <SectionTitle
                  title="История сделок"
                  subtitle="Последние демо-операции на бирже."
                />
                <div className="deals-list">
                  {dealsHistory.map((d, i) => (
                    <div key={i} className="deal-row hover-glow">
                      <div className="deal-main">
                        <div className="deal-pair">{d.pair}</div>
                        <div className="deal-time">{d.time}</div>
                      </div>
                      <div className="deal-right">
                        <div
                          className={
                            d.side === "Покупка"
                              ? "deal-side buy"
                              : "deal-side sell"
                          }
                        >
                          {d.side}
                        </div>
                        <div className="deal-amount">
                          {d.amount} @ {d.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* История входов */}
              <section className="section-block fade-in delay-2">
                <SectionTitle
                  title="История входов"
                  subtitle="Авторизации через Telegram и браузер."
                />
                <div className="login-list">
                  {loginHistory.map((log, i) => (
                    <div key={i} className="login-row hover-glow">
                      <div className="login-main">
                        <div className="login-device">
                          {log.device}
                        </div>
                        <div className="login-time">
                          {log.time}
                        </div>
                      </div>
                      <div className="login-right">
                        <div className="login-status">
                          {log.status}
                        </div>
                        <div className="login-ip">{log.ip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "profile" && (
            <>
              {/* Профиль и статус */}
              <section className="section-block fade-in delay-1">
                <SectionTitle
                  title="Профиль"
                  subtitle="Базовые настройки аккаунта FORBEX."
                />
                <div className="profile-card hover-glow">
                  <div className="profile-main">
                    <div className="profile-avatar">🦊</div>
                    <div className="profile-texts">
                      <div className="profile-name">
                        @forbex_user
                      </div>
                      <div className="profile-id">
                        UID: 102384726
                      </div>
                    </div>
                  </div>
                  <div className="profile-badges">
                    <span className="profile-badge orange">Forbex Level 1</span>
                    <span className="profile-badge neutral">
                      KYC: не пройден
                    </span>
                  </div>
                </div>
              </section>

              {/* Настройки/регистрация/верификация (демо) */}
              <section className="section-block fade-in delay-2">
                <div className="profile-settings">
                  <button className="profile-btn">
                    Регистрация / вход
                  </button>
                  <button className="profile-btn">
                    Настройки безопасности
                  </button>
                  <button className="profile-btn">
                    Верификация (KYC)
                  </button>
                  <button className="profile-btn">
                    Уведомления и язык
                  </button>
                </div>
                <div className="profile-note">
                  Все кнопки пока декоративные — мы сейчас строим только
                  визуальный каркас биржи FORBEX TRADE.
                </div>
              </section>
            </>
          )}
        </main>

        {/* Низовая навигация */}
        <nav className="bottom-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default App;
