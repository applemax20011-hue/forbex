import { useEffect, useState } from "react";
import "./App.css";

// ===== Константы / демо-данные =====

const TABS = [
  { id: 1, label: "Главная", icon: "🏠" },
  { id: 2, label: "Торговля", icon: "📈" },
  { id: 3, label: "Кошелёк", icon: "👛" },
  { id: 4, label: "История", icon: "📜" },
  { id: 5, label: "Профиль", icon: "👤" },
];

const popularCoins = [
  { symbol: "BTC", name: "Bitcoin", price: 97320, change: "+3.2%", volume: "34.1B" },
  { symbol: "ETH", name: "Ethereum", price: 3270, change: "+1.8%", volume: "18.4B" },
  { symbol: "SOL", name: "Solana", price: 192, change: "-0.7%", volume: "4.2B" },
  { symbol: "BNB", name: "BNB", price: 612, change: "+0.4%", volume: "2.9B" },
  { symbol: "XRP", name: "XRP", price: 0.81, change: "+0.9%", volume: "1.7B" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.18, change: "-1.1%", volume: "890M" },
  { symbol: "TON", name: "Toncoin", price: 6.25, change: "+4.5%", volume: "520M" },
  { symbol: "TRX", name: "TRON", price: 0.14, change: "+0.2%", volume: "730M" },
  { symbol: "LTC", name: "Litecoin", price: 84, change: "-0.3%", volume: "410M" },
  { symbol: "LINK", name: "Chainlink", price: 19.4, change: "+2.1%", volume: "360M" },
];

const STORAGE_KEYS = {
  user: "forbex_user",
  password: "forbex_password",
  remember: "forbex_remember",
  balance: "forbex_balance",
  walletHistory: "forbex_wallet_history",
  loginHistory: "forbex_login_history",
};

// ===== Вспомогательные функции =====

function formatDateTime(ts) {
  try {
    return new Date(ts).toLocaleString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ===== Компоненты =====

function Loader() {
  return (
    <div className="boot-loader">
      <div className="fox-orbit">
        <div className="fox-core">🦊</div>
        <div className="orbit-ring orbit-ring-1" />
        <div className="orbit-ring orbit-ring-2" />
        <div className="orbit-dot orbit-dot-1" />
        <div className="orbit-dot orbit-dot-2" />
      </div>
      <div className="boot-title">FORBEX TRADE</div>
      <div className="boot-sub">загрузка торгового терминала…</div>
    </div>
  );
}

function App() {
  // auth
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("register"); // "login" | "register"
  const [authForm, setAuthForm] = useState({
    login: "",
    email: "",
    password: "",
    remember: true,
  });
  const [authError, setAuthError] = useState("");

  // ui-state
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState(1);

  // wallet
  const [balance, setBalance] = useState(0);
  const [walletModal, setWalletModal] = useState(null); // "deposit" | "withdraw" | null
  const [walletForm, setWalletForm] = useState({
    amount: "",
    method: "card", // card | usdt | paypal
  });

  // history
  const [walletHistory, setWalletHistory] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  // fake internal state (например, текущая монета для "торговли")
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");

  // ===== Инициализация из localStorage =====
  useEffect(() => {
    const bootTimer = setTimeout(() => setBooting(false), 1300);

    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.user);
      const savedPass = localStorage.getItem(STORAGE_KEYS.password);
      const savedRemember = localStorage.getItem(STORAGE_KEYS.remember);
      const savedBalance = localStorage.getItem(STORAGE_KEYS.balance);
      const savedWalletHistory = localStorage.getItem(
        STORAGE_KEYS.walletHistory
      );
      const savedLoginHistory = localStorage.getItem(
        STORAGE_KEYS.loginHistory
      );

      if (savedWalletHistory) {
        setWalletHistory(JSON.parse(savedWalletHistory));
      }
      if (savedLoginHistory) {
        setLoginHistory(JSON.parse(savedLoginHistory));
      }
      if (savedBalance) {
        const num = parseFloat(savedBalance);
        if (!Number.isNaN(num)) setBalance(num);
      }

      const rememberFlag = savedRemember === "true";
      if (savedUser && savedPass && rememberFlag) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setAuthForm((prev) => ({
          ...prev,
          login: parsedUser.login || "",
          email: parsedUser.email || "",
          password: savedPass || "",
          remember: rememberFlag,
        }));
      } else if (savedUser && savedPass) {
        // есть сохранённый аккаунт, но без автологина
        const parsedUser = JSON.parse(savedUser);
        setAuthForm((prev) => ({
          ...prev,
          login: parsedUser.login || "",
          email: parsedUser.email || "",
          password: savedPass || "",
          remember: rememberFlag,
        }));
      }
    } catch {
      // ignore
    }

    return () => clearTimeout(bootTimer);
  }, []);

  // ===== Сохранение в localStorage =====
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.balance, String(balance));
      localStorage.setItem(
        STORAGE_KEYS.walletHistory,
        JSON.stringify(walletHistory)
      );
      localStorage.setItem(
        STORAGE_KEYS.loginHistory,
        JSON.stringify(loginHistory)
      );
    } catch {
      // ignore
    }
  }, [balance, walletHistory, loginHistory]);

  const handleAuthInput = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    setAuthError("");
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = () => {
    const { login, email, password, remember } = authForm;

    if (!login.trim() || !email.trim() || !password.trim()) {
      setAuthError("Заполните все поля.");
      return;
    }
    if (login.trim().length < 3) {
      setAuthError("Логин должен быть от 3 символов.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setAuthError("Введите корректный email (с @ и доменом).");
      return;
    }
    if (password.length < 4) {
      setAuthError("Пароль должен быть от 4 символов.");
      return;
    }

    const newUser = {
      login: login.trim(),
      email: email.trim(),
      createdAt: Date.now(),
    };

    setUser(newUser);

    try {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEYS.password, password);
      localStorage.setItem(STORAGE_KEYS.remember, String(remember));
    } catch {
      // ignore
    }

    const entry = {
      id: Date.now(),
      type: "register",
      login: newUser.login,
      email: newUser.email,
      ts: Date.now(),
    };
    setLoginHistory((prev) => [entry, ...prev]);
  };

  const handleLogin = () => {
    const { login, email, password, remember } = authForm;

    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEYS.user);
      const savedPass = localStorage.getItem(STORAGE_KEYS.password);

      if (!savedUserStr || !savedPass) {
        setAuthError("Аккаунт не найден. Сначала зарегистрируйтесь.");
        return;
      }

      const savedUser = JSON.parse(savedUserStr);
      const loginOrEmail = login.trim() || email.trim();

      if (
        loginOrEmail !== savedUser.login &&
        loginOrEmail !== savedUser.email
      ) {
        setAuthError("Неверный логин или email.");
        return;
      }

      if (password !== savedPass) {
        setAuthError("Неверный пароль.");
        return;
      }

      setUser(savedUser);
      localStorage.setItem(STORAGE_KEYS.remember, String(remember));

      const entry = {
        id: Date.now(),
        type: "login",
        login: savedUser.login,
        email: savedUser.email,
        ts: Date.now(),
      };
      setLoginHistory((prev) => [entry, ...prev]);
    } catch {
      setAuthError("Ошибка входа. Попробуйте ещё раз.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab(1);
  };

  const handleWalletConfirm = (mode) => {
    const amountNum = parseFloat(walletForm.amount.replace(",", "."));
    if (Number.isNaN(amountNum) || amountNum <= 0) return;

    const now = Date.now();

    if (mode === "deposit") {
      setBalance((prev) => prev + amountNum);
    } else if (mode === "withdraw") {
      setBalance((prev) => Math.max(0, prev - amountNum));
    }

    const entry = {
      id: now,
      type: mode,
      amount: amountNum,
      method: walletForm.method,
      ts: now,
    };
    setWalletHistory((prev) => [entry, ...prev]);

    setWalletModal(null);
    setWalletForm({ amount: "", method: walletForm.method });
  };

  // ===== Рендеры вкладок =====

  const renderHome = () => (
    <>
      <section className="section-block fade-in delay-1">
        <div className="home-hero">
          <div className="home-badge">🔥 Новая торговая платформа</div>
          <h1 className="home-title">FORBEX TRADE</h1>
          <p className="home-sub">
            Биржа в тёплых лисих тонах: быстрый спот, удобный кошелёк и
            аккуратная история операций. Всё в одном Telegram WebApp.
          </p>
          <div className="home-stats-row">
            <div className="home-stat-card">
              <div className="home-stat-label">Активных пользователей</div>
              <div className="home-stat-value">24 580+</div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-label">Сделок за 24ч</div>
              <div className="home-stat-value">312 400+</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>Популярные монеты</h2>
          <p>Топ-10 активов, за которыми следят прямо сейчас.</p>
        </div>
        <div className="coins-list">
          {popularCoins.map((c) => (
            <div
              key={c.symbol}
              className="coin-row hover-glow"
              onClick={() => setSelectedSymbol(c.symbol)}
            >
              <div className="coin-left">
                <div className="coin-symbol">{c.symbol}</div>
                <div className="coin-name">{c.name}</div>
              </div>
              <div className="coin-center">
                <div className="coin-price">
                  {c.price.toLocaleString("ru-RU", {
                    minimumFractionDigits: c.price < 1 ? 2 : 0,
                  })}{" "}
                  $
                </div>
                <div
                  className={
                    "coin-change " +
                    (c.change.startsWith("-") ? "negative" : "positive")
                  }
                >
                  {c.change}
                </div>
              </div>
              <div className="coin-right">
                <div className="coin-volume-label">Объём 24ч</div>
                <div className="coin-volume-value">{c.volume}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderTrade = () => {
    const currentCoin =
      popularCoins.find((c) => c.symbol === selectedSymbol) || popularCoins[0];

    return (
      <>
        <section className="section-block fade-in delay-1">
          <div className="section-title">
            <h2>Торговля (демо)</h2>
            <p>Фейковый график через TradingView-заглушку, без реальных ордеров.</p>
          </div>
          <div className="trade-layout">
            <div className="trade-chart-card">
              <div className="trade-chart-header">
                <div className="trade-pair">
                  {currentCoin.symbol}/USDT
                  <span className="pair-tag">Demo</span>
                </div>
                <div className="trade-price">
                  {currentCoin.price.toLocaleString("ru-RU", {
                    minimumFractionDigits: currentCoin.price < 1 ? 2 : 0,
                  })}{" "}
                  $
                </div>
              </div>
              <div className="fake-chart">
                <div className="fake-chart-layer layer-1" />
                <div className="fake-chart-layer layer-2" />
                <div className="fake-chart-grid" />
                <div className="fake-chart-label">TradingView DEMO</div>
              </div>
              <div className="trade-timeframe-row">
                {["1М", "15М", "1Ч", "4Ч", "1Д"].map((tf, i) => (
                  <button
                    key={tf}
                    className={
                      "tf-pill " + (i === 3 ? "tf-pill-active" : "")
                    }
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="trade-side">
              <div className="trade-tabs">
                <button className="trade-tab active">Купить</button>
                <button className="trade-tab">Продать</button>
              </div>
              <div className="trade-info-text">
                Здесь позже будут настоящие ордера. Сейчас это демо-интерфейс
                без реальной торговли.
              </div>
              <div className="trade-input-row">
                <div className="trade-input-label">Цена</div>
                <div className="trade-input-fake">
                  {currentCoin.price.toLocaleString("ru-RU", {
                    minimumFractionDigits: currentCoin.price < 1 ? 2 : 0,
                  })}{" "}
                  USDT
                </div>
              </div>
              <div className="trade-input-row">
                <div className="trade-input-label">Количество</div>
                <div className="trade-input-fake">0.0000</div>
              </div>
              <button className="trade-button-disabled">
                Торговля будет позже
              </button>
            </div>
          </div>
        </section>
      </>
    );
  };

  const renderWallet = () => {
    const formatBalance = balance.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const methodLabel = (m) => {
      if (m === "card") return "Банковская карта";
      if (m === "usdt") return "USDT TRC-20";
      if (m === "paypal") return "PayPal";
      return m;
    };

    return (
      <>
        <section className="section-block fade-in delay-1">
          <div className="section-title">
            <h2>Кошелёк</h2>
            <p>Управляйте балансом Forbex: пополнения и выводы.</p>
          </div>
          <div className="wallet-balance-card">
            <div className="wallet-badge">Основной баланс</div>
            <div className="wallet-amount">{formatBalance} USDT</div>
            <div className="wallet-sub">
              Демонстрационный баланс. Реальных денег здесь нет.
            </div>
            <div className="wallet-actions-row">
              <button
                className="wallet-action-btn primary"
                onClick={() => setWalletModal("deposit")}
              >
                Пополнить
              </button>
              <button
                className="wallet-action-btn secondary"
                onClick={() => setWalletModal("withdraw")}
              >
                Вывести
              </button>
            </div>
          </div>
        </section>

        <section className="section-block fade-in delay-2">
          <div className="section-title">
            <h2>Последние операции кошелька</h2>
            <p>Короткий список последних пополнений и выводов.</p>
          </div>
          <div className="wallet-history-short">
            {walletHistory.length === 0 && (
              <div className="wallet-empty">Операций ещё не было.</div>
            )}
            {walletHistory.slice(0, 5).map((e) => (
              <div key={e.id} className="wallet-history-row">
                <div className="wallet-history-main">
                  <div className="wallet-history-type">
                    {e.type === "deposit" ? "Пополнение" : "Вывод"} —{" "}
                    {methodLabel(e.method)}
                  </div>
                  <div className="wallet-history-time">
                    {formatDateTime(e.ts)}
                  </div>
                </div>
                <div
                  className={
                    "wallet-history-amount " +
                    (e.type === "deposit" ? "positive" : "negative")
                  }
                >
                  {e.type === "deposit" ? "+" : "-"}
                  {e.amount.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDT
                </div>
              </div>
            ))}
          </div>
        </section>

        {walletModal && (
          <div className="wallet-modal-backdrop" onClick={() => setWalletModal(null)}>
            <div
              className="wallet-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wallet-modal-title">
                {walletModal === "deposit" ? "Пополнить баланс" : "Вывести средства"}
              </div>
              <div className="wallet-modal-sub">
                Выберите метод и укажите сумму в USDT.
              </div>

              <div className="wallet-methods">
                <button
                  className={
                    "wallet-method-card " +
                    (walletForm.method === "card" ? "active" : "")
                  }
                  onClick={() =>
                    setWalletForm((prev) => ({ ...prev, method: "card" }))
                  }
                >
                  <div className="wallet-method-title">Банковская карта</div>
                  <div className="wallet-method-sub">Приоритетный метод</div>
                  <div className="wallet-method-extra">
                    {/* Поменяешь реквизиты под себя */}
                    № 5559 88•• ••77 1234 — Иван Иванов
                  </div>
                </button>

                <button
                  className={
                    "wallet-method-card " +
                    (walletForm.method === "usdt" ? "active" : "")
                  }
                  onClick={() =>
                    setWalletForm((prev) => ({ ...prev, method: "usdt" }))
                  }
                >
                  <div className="wallet-method-title">USDT TRC-20</div>
                  <div className="wallet-method-sub">
                    Сеть TRON, минимум 10 USDT
                  </div>
                  <div className="wallet-method-extra">
                    Txxxxxx... (заменишь на свой TRC-кошелёк)
                  </div>
                </button>

                <button
                  className={
                    "wallet-method-card " +
                    (walletForm.method === "paypal" ? "active" : "")
                  }
                  onClick={() =>
                    setWalletForm((prev) => ({ ...prev, method: "paypal" }))
                  }
                >
                  <div className="wallet-method-title">PayPal</div>
                  <div className="wallet-method-sub">Международные платежи</div>
                  <div className="wallet-method-extra">
                    mail@example.com (заменишь на свой PayPal)
                  </div>
                </button>
              </div>

              <div className="wallet-modal-input-group">
                <label>Сумма (USDT)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={walletForm.amount}
                  onChange={(e) =>
                    setWalletForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="Например, 150.00"
                />
              </div>

              {walletModal === "withdraw" && (
                <div className="wallet-modal-note">
                  Вывод сверх демо-баланса будет просто записан в историю, без
                  ошибок по лимитам.
                </div>
              )}

              <div className="wallet-modal-actions">
                <button
                  className="wallet-modal-btn secondary"
                  onClick={() => setWalletModal(null)}
                >
                  Отмена
                </button>
                <button
                  className="wallet-modal-btn primary"
                  onClick={() => handleWalletConfirm(walletModal)}
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderHistory = () => {
    const methodLabel = (m) => {
      if (m === "card") return "Банковская карта";
      if (m === "usdt") return "USDT TRC-20";
      if (m === "paypal") return "PayPal";
      return m;
    };

    return (
      <>
        <section className="section-block fade-in delay-1">
          <div className="section-title">
            <h2>История входов</h2>
            <p>Когда и с каким аккаунтом заходили в Forbex.</p>
          </div>
          <div className="history-block">
            {loginHistory.length === 0 && (
              <div className="history-empty">
                Входов пока не зафиксировано.
              </div>
            )}
            {loginHistory.map((e) => (
              <div key={e.id} className="history-row">
                <div className="history-main">
                  <div className="history-type">
                    {e.type === "register" ? "Регистрация" : "Вход"}
                  </div>
                  <div className="history-sub">
                    {e.login} · {e.email}
                  </div>
                </div>
                <div className="history-time">{formatDateTime(e.ts)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block fade-in delay-2">
          <div className="section-title">
            <h2>История кошелька</h2>
            <p>Пополнения и выводы, сохранённые в демо-базу.</p>
          </div>
          <div className="history-block">
            {walletHistory.length === 0 && (
              <div className="history-empty">
                Операций по кошельку ещё не было.
              </div>
            )}
            {walletHistory.map((e) => (
              <div key={e.id} className="history-row">
                <div className="history-main">
                  <div className="history-type">
                    {e.type === "deposit" ? "Пополнение" : "Вывод"}
                  </div>
                  <div className="history-sub">{methodLabel(e.method)}</div>
                </div>
                <div className="history-right">
                  <div
                    className={
                      "history-amount " +
                      (e.type === "deposit" ? "positive" : "negative")
                    }
                  >
                    {e.type === "deposit" ? "+" : "-"}
                    {e.amount.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USDT
                  </div>
                  <div className="history-time">{formatDateTime(e.ts)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };

  const renderProfile = () => {
    if (!user) return null;

    return (
      <>
        <section className="section-block fade-in delay-1">
          <div className="profile-card">
            <div className="profile-avatar">🦊</div>
            <div className="profile-main">
              <div className="profile-login">{user.login}</div>
              <div className="profile-email">{user.email}</div>
              <div className="profile-created">
                На Forbex с {formatDateTime(user.createdAt)}
              </div>
            </div>
          </div>
        </section>

        <section className="section-block fade-in delay-2">
          <div className="section-title">
            <h2>Настройки аккаунта</h2>
            <p>Простые действия с демо-профилем.</p>
          </div>
          <div className="profile-actions">
            <button className="profile-btn logout" onClick={handleLogout}>
              Выйти из аккаунта
            </button>
            <button
              className="profile-btn danger"
              onClick={() => {
                // Полный сброс демо-данных
                setBalance(0);
                setWalletHistory([]);
                setLoginHistory([]);
                try {
                  localStorage.removeItem(STORAGE_KEYS.balance);
                  localStorage.removeItem(STORAGE_KEYS.walletHistory);
                  localStorage.removeItem(STORAGE_KEYS.loginHistory);
                } catch {
                  // ignore
                }
              }}
            >
              Сбросить демо-данные кошелька
            </button>
          </div>
        </section>
      </>
    );
  };

  // ===== Рендер AUTH (когда нет user) =====

  const renderAuth = () => (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-fox">🦊</div>
        <div className="auth-title">Forbex Trade</div>
        <div className="auth-sub">
          Создайте демо-аккаунт, чтобы получить доступ к бирже.
        </div>

        <div className="auth-tabs">
          <button
            className={
              "auth-tab " + (authMode === "register" ? "active" : "")
            }
            onClick={() => {
              setAuthMode("register");
              setAuthError("");
            }}
          >
            Регистрация
          </button>
          <button
            className={"auth-tab " + (authMode === "login" ? "active" : "")}
            onClick={() => {
              setAuthMode("login");
              setAuthError("");
            }}
          >
            Вход
          </button>
        </div>

        <div className="auth-form">
          <label>
            Логин / никнейм
            <input
              type="text"
              value={authForm.login}
              onChange={(e) => handleAuthInput("login", e.target.value)}
              placeholder="Например, fox_trader"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => handleAuthInput("email", e.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => handleAuthInput("password", e.target.value)}
              placeholder="Не менее 4 символов"
            />
          </label>

          <label className="auth-remember">
            <input
              type="checkbox"
              checked={authForm.remember}
              onChange={(e) =>
                handleAuthInput("remember", e.target.checked)
              }
            />
            <span>Запомнить меня</span>
          </label>

          {authError && <div className="auth-error">{authError}</div>}

          <button
            className="auth-submit"
            onClick={authMode === "register" ? handleRegister : handleLogin}
          >
            {authMode === "register" ? "Зарегистрироваться" : "Войти"}
          </button>
        </div>

        <div className="auth-note">
          Это демо-версия. Данные хранятся локально в вашем браузере и не
          используются как настоящая биржа.
        </div>
      </div>
    </div>
  );

  // ===== Основной JSX =====

  if (booting) {
    return (
      <div className="page-root">
        <div className="app-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-root">
        <div className="app-container">
          {renderAuth()}
        </div>
      </div>
    );
  }

  return (
    <div className="page-root">
      <div className="app-container">
        {/* Шапка */}
        <header className="header">
          <div className="brand">
            <div className="brand-logo">🦊</div>
            <div className="brand-text">
              <span className="brand-title">Forbex Trade</span>
              <span className="brand-sub">
                демо-биржа с тёплым лисьим интерфейсом
              </span>
            </div>
          </div>
        </header>

        {/* Контент */}
        <main className="content">
          {activeTab === 1 && renderHome()}
          {activeTab === 2 && renderTrade()}
          {activeTab === 3 && renderWallet()}
          {activeTab === 4 && renderHistory()}
          {activeTab === 5 && renderProfile()}
        </main>

        {/* Нижняя навигация (фиксированная, поверх контента) */}
        <nav className="bottom-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={
                "nav-tab " + (activeTab === tab.id ? "nav-tab-active" : "")
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default App;
