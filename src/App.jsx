import { useEffect, useState } from "react";
import "./App.css";

// ===== Константы =====

const TABS = [
  { id: 1, labelRu: "Главная", labelEn: "Home", icon: "🏠" },
  { id: 2, labelRu: "Торговля", labelEn: "Trade", icon: "📈" },
  { id: 3, labelRu: "Кошелёк", labelEn: "Wallet", icon: "👛" },
  { id: 4, labelRu: "История", labelEn: "History", icon: "📜" },
  { id: 5, labelRu: "Профиль", labelEn: "Profile", icon: "👤" },
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
  settings: "forbex_settings",
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

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ===== Лоадер =====

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

// ===== Приложение =====

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

  // доп. шаг после регистрации (выбор языка/валюты)
  const [pendingUser, setPendingUser] = useState(null);
  const [postRegisterStep, setPostRegisterStep] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    language: "ru",
    currency: "RUB",
  });

  // настройки
  const [settings, setSettings] = useState({
    language: "ru",
    currency: "RUB", // "RUB" | "USD"
  });

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

  // flow пополнения
  const [depositStep, setDepositStep] = useState(1); // 1 = сумма, 2 = реквизиты
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 минут

  // history
  const [walletHistory, setWalletHistory] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  // trade
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");

  // смена пароля
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const isEN = settings.language === "en";
  const currencySymbol = settings.currency === "RUB" ? "₽" : "USD";

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
      const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);

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
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore
        }
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
      localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(settings)
      );
    } catch {
      // ignore
    }
  }, [balance, walletHistory, loginHistory, settings]);

  // таймер 15 минут на оплату
  useEffect(() => {
    if (walletModal === "deposit" && depositStep === 2) {
      setPaymentTimer(900);
      const interval = setInterval(() => {
        setPaymentTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [walletModal, depositStep]);

  // ===== helpers =====

  const updateSettings = (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleAuthInput = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    setAuthError("");
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

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

    setPendingUser(newUser);
    setPostRegisterStep(true);
    setTempSettings({
      language: "ru",
      currency: "RUB",
    });

    // remember-флаг и пароль просто остаются в authForm, используем в completeRegistration
  };

  const completeRegistration = () => {
    if (!pendingUser) return;
    const { password, remember } = authForm;

    const finalSettings = { ...settings, ...tempSettings };
    setSettings(finalSettings);

    setUser(pendingUser);

    try {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(pendingUser));
      localStorage.setItem(STORAGE_KEYS.password, password);
      localStorage.setItem(STORAGE_KEYS.remember, String(remember));
      localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(finalSettings)
      );
    } catch {
      // ignore
    }

    const entry = {
      id: Date.now(),
      type: "register",
      login: pendingUser.login,
      email: pendingUser.email,
      ts: Date.now(),
    };
    setLoginHistory((prev) => [entry, ...prev]);

    setPendingUser(null);
    setPostRegisterStep(false);
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

  // смена пароля
  const handlePasswordInput = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handlePasswordChange = () => {
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    try {
      const savedPass = localStorage.getItem(STORAGE_KEYS.password);
      if (!savedPass) {
        setPasswordError("Пароль не найден. Попробуйте выйти и войти заново.");
        return;
      }
      if (oldPassword !== savedPass) {
        setPasswordError("Старый пароль указан неверно.");
        return;
      }
      if (newPassword.length < 4) {
        setPasswordError("Новый пароль должен быть от 4 символов.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("Пароли не совпадают.");
        return;
      }

      localStorage.setItem(STORAGE_KEYS.password, newPassword);
      setPasswordSuccess("Пароль успешно изменён.");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      setPasswordError("Не удалось изменить пароль.");
    }
  };

  // кошелёк: депозит / вывод

  const handleWalletConfirmWithdraw = () => {
    const amountNum = parseFloat(walletForm.amount.replace(",", "."));
    if (Number.isNaN(amountNum) || amountNum <= 0) return;

    const now = Date.now();

    setBalance((prev) => Math.max(0, prev - amountNum));
    const entry = {
      id: now,
      type: "withdraw",
      amount: amountNum,
      method: walletForm.method,
      ts: now,
    };
    setWalletHistory((prev) => [entry, ...prev]);

    setWalletModal(null);
    setWalletForm({ amount: "", method: walletForm.method });
  };

  const resetDepositFlow = () => {
    setDepositStep(1);
    setDepositAmount("");
    setDepositError("");
    setReceiptFileName("");
  };

  const handleDepositNext = () => {
    const minAmount = settings.currency === "RUB" ? 1000 : 10;
    const raw = depositAmount.toString().replace(",", ".");
    const amountNum = parseFloat(raw);

    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setDepositError(
        settings.currency === "RUB"
          ? "Введите сумму пополнения в рублях."
          : "Введите сумму пополнения в USD."
      );
      return;
    }

    if (amountNum < minAmount) {
      setDepositError(
        settings.currency === "RUB"
          ? `Минимальная сумма пополнения — ${minAmount} ₽`
          : `Minimum deposit is ${minAmount} USD`
      );
      return;
    }

    setDepositError("");
    setDepositAmount(amountNum);
    setDepositStep(2);
  };

  const handleDepositSendReceipt = () => {
    if (!depositAmount || Number.isNaN(depositAmount)) return;

    const now = Date.now();
    setBalance((prev) => prev + depositAmount);

    const entry = {
      id: now,
      type: "deposit",
      amount: depositAmount,
      method: "card",
      ts: now,
    };
    setWalletHistory((prev) => [entry, ...prev]);

    setWalletModal(null);
    resetDepositFlow();
  };

  // ===== Рендеры вкладок =====

  const renderHome = () => (
    <>
      <section className="section-block fade-in delay-1">
        <div className="home-hero">
          <div className="home-badge">
            {isEN ? "🔥 New trading platform" : "🔥 Новая торговая платформа"}
          </div>
          <h1 className="home-title">FORBEX TRADE</h1>
          <p className="home-sub">
            {isEN
              ? "Exchange in warm fox colors: quick spot, convenient wallet and detailed history in one WebApp."
              : "Биржа в тёплых лисьих тонах: быстрый спот, удобный кошелёк и аккуратная история операций в одном WebApp."}
          </p>
          <div className="home-stats-row">
            <div className="home-stat-card">
              <div className="home-stat-label">
                {isEN ? "Active users" : "Активных пользователей"}
              </div>
              <div className="home-stat-value">24 580+</div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-label">
                {isEN ? "Trades / 24h" : "Сделок за 24ч"}
              </div>
              <div className="home-stat-value">312 400+</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>{isEN ? "Popular coins" : "Популярные монеты"}</h2>
          <p>
            {isEN
              ? "Top-10 assets that traders watch right now."
              : "Топ-10 активов, за которыми следят прямо сейчас."}
          </p>
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
                <div className="coin-volume-label">
                  {isEN ? "Volume 24h" : "Объём 24ч"}
                </div>
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
            <h2>{isEN ? "Trading" : "Торговля"}</h2>
            <p>
              {isEN
                ? "Interface with mock chart. Later you can connect real orders and TradingView widget."
                : "Интерфейс с фейковым графиком. Позже сюда можно прикрутить реальные ордера и виджет TradingView."}
            </p>
          </div>
          <div className="trade-layout">
            <div className="trade-chart-card">
              <div className="trade-chart-header">
                <div className="trade-pair">
                  {currentCoin.symbol}/USDT
                  <span className="pair-tag">
                    {isEN ? "Mock" : "Макет"}
                  </span>
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
                <div className="fake-chart-label">
                  TradingView mock
                </div>
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
                <button className="trade-tab active">
                  {isEN ? "Buy" : "Купить"}
                </button>
                <button className="trade-tab">
                  {isEN ? "Sell" : "Продать"}
                </button>
              </div>
              <div className="trade-info-text">
                {isEN
                  ? "Later you can add real order logic here. Now it is just a visual layout."
                  : "Позже сюда можно добавить логику реальных ордеров. Сейчас это просто визуальный макет."}
              </div>
              <div className="trade-input-row">
                <div className="trade-input-label">
                  {isEN ? "Price" : "Цена"}
                </div>
                <div className="trade-input-fake">
                  {currentCoin.price.toLocaleString("ru-RU", {
                    minimumFractionDigits: currentCoin.price < 1 ? 2 : 0,
                  })}{" "}
                  USDT
                </div>
              </div>
              <div className="trade-input-row">
                <div className="trade-input-label">
                  {isEN ? "Amount" : "Количество"}
                </div>
                <div className="trade-input-fake">0.0000</div>
              </div>
              <button className="trade-button-disabled">
                {isEN
                  ? "Trading logic will be added later"
                  : "Торговая логика будет добавлена позже"}
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
      if (m === "card")
        return isEN ? "Bank card" : "Банковская карта";
      if (m === "usdt") return "USDT TRC-20";
      if (m === "paypal") return "PayPal";
      return m;
    };

    const minAmount = settings.currency === "RUB" ? 1000 : 10;

    return (
      <>
        <section className="section-block fade-in delay-1">
          <div className="section-title">
            <h2>{isEN ? "Wallet" : "Кошелёк"}</h2>
            <p>
              {isEN
                ? "Manage your Forbex balance: deposits and withdrawals."
                : "Управляйте балансом Forbex: пополнения и выводы."}
            </p>
          </div>
          <div className="wallet-balance-card">
            <div className="wallet-badge">
              {isEN ? "Main balance" : "Основной баланс"}
            </div>
            <div className="wallet-amount">
              {formatBalance} {currencySymbol}
            </div>
            <div className="wallet-sub">
              {isEN
                ? "Interface for your future logic of balances and payments."
                : "Интерфейс под твою будущую логику балансов и платежей."}
            </div>
            <div className="wallet-actions-row">
              <button
                className="wallet-action-btn primary"
                onClick={() => {
                  setWalletModal("deposit");
                  resetDepositFlow();
                }}
              >
                {isEN ? "Deposit" : "Пополнить"}
              </button>
              <button
                className="wallet-action-btn secondary"
                onClick={() => {
                  setWalletModal("withdraw");
                  setWalletForm((prev) => ({
                    ...prev,
                    amount: "",
                  }));
                }}
              >
                {isEN ? "Withdraw" : "Вывести"}
              </button>
            </div>
          </div>
          <div className="wallet-min-info">
            {isEN
              ? `Minimum deposit: ${minAmount} ${
                  settings.currency === "RUB" ? "RUB" : "USD"
                }`
              : `Минимальное пополнение: ${minAmount} ${
                  settings.currency === "RUB" ? "₽" : "USD"
                }`}
          </div>
        </section>

        <section className="section-block fade-in delay-2">
          <div className="section-title">
            <h2>
              {isEN ? "Recent wallet operations" : "Последние операции кошелька"}
            </h2>
            <p>
              {isEN
                ? "Short list of the last deposits and withdrawals."
                : "Короткий список последних пополнений и выводов."}
            </p>
          </div>
          <div className="wallet-history-short">
            {walletHistory.length === 0 && (
              <div className="wallet-empty">
                {isEN ? "No operations yet." : "Операций ещё не было."}
              </div>
            )}
            {walletHistory.slice(0, 5).map((e) => (
              <div key={e.id} className="wallet-history-row">
                <div className="wallet-history-main">
                  <div className="wallet-history-type">
                    {e.type === "deposit"
                      ? isEN
                        ? "Deposit"
                        : "Пополнение"
                      : isEN
                      ? "Withdrawal"
                      : "Вывод"}{" "}
                    — {methodLabel(e.method)}
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
                  {currencySymbol}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Модалка пополнения / вывода */}
        {walletModal && (
          <div
            className="wallet-modal-backdrop"
            onClick={() => {
              setWalletModal(null);
              resetDepositFlow();
            }}
          >
            <div
              className="wallet-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {walletModal === "deposit" && depositStep === 1 && (
                <>
                  <div className="wallet-modal-title">
                    {isEN
                      ? "Deposit to balance"
                      : "Пополнить баланс"}
                  </div>
                  <div className="wallet-modal-sub">
                    {isEN
                      ? "Enter the deposit amount."
                      : "Введите сумму пополнения."}
                  </div>

                  <div className="wallet-modal-input-group">
                    <label>
                      {isEN
                        ? `Amount (${settings.currency === "RUB" ? "RUB" : "USD"})`
                        : `Сумма пополнения (${
                            settings.currency === "RUB" ? "₽" : "USD"
                          })`}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        setDepositError("");
                      }}
                      placeholder={
                        settings.currency === "RUB"
                          ? "Например, 1000"
                          : "For example, 20"
                      }
                    />
                  </div>

                  {depositError && (
                    <div className="wallet-modal-note error">
                      {depositError}
                    </div>
                  )}

                  <div className="wallet-modal-actions">
                    <button
                      className="wallet-modal-btn secondary"
                      onClick={() => {
                        setWalletModal(null);
                        resetDepositFlow();
                      }}
                    >
                      {isEN ? "Cancel" : "Отмена"}
                    </button>
                    <button
                      className="wallet-modal-btn primary"
                      onClick={handleDepositNext}
                    >
                      {isEN ? "Next" : "Далее"}
                    </button>
                  </div>
                </>
              )}

              {walletModal === "deposit" && depositStep === 2 && (
                <>
                  <div className="wallet-modal-title">
                    {isEN
                      ? "Payment details"
                      : "Реквизиты для оплаты"}
                  </div>
                  <div className="wallet-modal-sub">
                    {isEN
                      ? "Pay using the details below and upload the receipt."
                      : "Оплатите по реквизитам ниже и загрузите чек."}
                  </div>

                  <div className="payment-details">
                    <div className="payment-row">
                      <div className="payment-label">
                        {isEN ? "Amount" : "Сумма к оплате"}
                      </div>
                      <div className="payment-value">
                        {depositAmount.toLocaleString("ru-RU", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {settings.currency === "RUB" ? "RUB" : "USD"}
                      </div>
                    </div>

                    <div className="payment-row">
                      <div className="payment-label">
                        {isEN ? "Card number" : "Номер карты"}
                      </div>
                      <div className="payment-value payment-card-row">
                        <span>5559 88•• ••77 1234</span>
                        <button
                          className="copy-btn"
                          type="button"
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText("5559887771234")
                              .catch(() => {});
                          }}
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    <div className="payment-row">
                      <div className="payment-label">ФИО</div>
                      <div className="payment-value">
                        Иванов Иван Иванович
                      </div>
                    </div>

                    <div className="payment-row">
                      <div className="payment-label">
                        {isEN ? "Bank" : "Банк"}
                      </div>
                      <div className="payment-value">
                        Tinkoff Bank
                      </div>
                    </div>

                    <div className="payment-row">
                      <div className="payment-label">
                        {isEN ? "Time to pay" : "Время на оплату"}
                      </div>
                      <div className="payment-value payment-timer">
                        {formatTimer(paymentTimer)}
                      </div>
                    </div>

                    <div className="payment-upload">
                      <div className="payment-label">
                        {isEN ? "Upload receipt" : "Загрузить чек"}
                      </div>
                      <label className="upload-btn">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setReceiptFileName(file.name);
                            } else {
                              setReceiptFileName("");
                            }
                          }}
                        />
                        <span>
                          {isEN
                            ? "Choose file"
                            : "Выбрать файл"}
                        </span>
                      </label>
                      {receiptFileName && (
                        <div className="upload-filename">
                          {receiptFileName}
                        </div>
                      )}
                    </div>

                    <a
                      href="https://t.me/forbex_support"
                      target="_blank"
                      rel="noreferrer"
                      className="support-link"
                    >
                      {isEN
                        ? "Support in Telegram"
                        : "Техподдержка в Telegram"}
                    </a>
                  </div>

                  <div className="wallet-modal-actions">
                    <button
                      className="wallet-modal-btn secondary"
                      onClick={() => {
                        setWalletModal(null);
                        resetDepositFlow();
                      }}
                    >
                      {isEN ? "Cancel" : "Отмена"}
                    </button>
                    <button
                      className="wallet-modal-btn primary"
                      onClick={handleDepositSendReceipt}
                    >
                      {isEN
                        ? "Send receipt"
                        : "Отправить чек"}
                    </button>
                  </div>
                </>
              )}

              {walletModal === "withdraw" && (
                <>
                  <div className="wallet-modal-title">
                    {isEN ? "Withdraw funds" : "Вывести средства"}
                  </div>
                  <div className="wallet-modal-sub">
                    {isEN
                      ? "Choose method and enter withdrawal amount."
                      : "Выберите метод и укажите сумму вывода."}
                  </div>

                  <div className="wallet-methods">
                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "card" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((prev) => ({
                          ...prev,
                          method: "card",
                        }))
                      }
                    >
                      <div className="wallet-method-title">
                        {isEN ? "Bank card" : "Банковская карта"}
                      </div>
                      <div className="wallet-method-sub">
                        {isEN
                          ? "Main withdrawal method"
                          : "Основной метод вывода"}
                      </div>
                    </button>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "usdt" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((prev) => ({
                          ...prev,
                          method: "usdt",
                        }))
                      }
                    >
                      <div className="wallet-method-title">
                        USDT TRC-20
                      </div>
                      <div className="wallet-method-sub">
                        {isEN
                          ? "Network TRON"
                          : "Сеть TRON"}
                      </div>
                    </button>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "paypal" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((prev) => ({
                          ...prev,
                          method: "paypal",
                        }))
                      }
                    >
                      <div className="wallet-method-title">
                        PayPal
                      </div>
                      <div className="wallet-method-sub">
                        {isEN
                          ? "International withdrawals"
                          : "Международные выводы"}
                      </div>
                    </button>
                  </div>

                  <div className="wallet-modal-input-group">
                    <label>
                      {isEN ? "Amount" : "Сумма"}
                    </label>
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
                      placeholder={
                        settings.currency === "RUB"
                          ? "Например, 1500"
                          : "For example, 30"
                      }
                    />
                  </div>

                  <div className="wallet-modal-actions">
                    <button
                      className="wallet-modal-btn secondary"
                      onClick={() => setWalletModal(null)}
                    >
                      {isEN ? "Cancel" : "Отмена"}
                    </button>
                    <button
                      className="wallet-modal-btn primary"
                      onClick={handleWalletConfirmWithdraw}
                    >
                      {isEN ? "Confirm" : "Подтвердить"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderHistory = () => {
    const methodLabel = (m) => {
      if (m === "card")
        return isEN ? "Bank card" : "Банковская карта";
      if (m === "usdt") return "USDT TRC-20";
      if (m === "paypal") return "PayPal";
      return m;
    };

    return (
      <>
        <section className="section-block fade-in delay-1">
          <div className="section-title">
            <h2>
              {isEN ? "Login history" : "История входов"}
            </h2>
            <p>
              {isEN
                ? "When and with which account you logged in to Forbex."
                : "Когда и с каким аккаунтом заходили в Forbex."}
            </p>
          </div>
          <div className="history-block">
            {loginHistory.length === 0 && (
              <div className="history-empty">
                {isEN
                  ? "No logins recorded yet."
                  : "Входов пока не зафиксировано."}
              </div>
            )}
            {loginHistory.map((e) => (
              <div key={e.id} className="history-row">
                <div className="history-main">
                  <div className="history-type">
                    {e.type === "register"
                      ? isEN
                        ? "Registration"
                        : "Регистрация"
                      : isEN
                      ? "Login"
                      : "Вход"}
                  </div>
                  <div className="history-sub">
                    {e.login} · {e.email}
                  </div>
                </div>
                <div className="history-time">
                  {formatDateTime(e.ts)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block fade-in delay-2">
          <div className="section-title">
            <h2>
              {isEN ? "Wallet history" : "История кошелька"}
            </h2>
            <p>
              {isEN
                ? "Deposits and withdrawals saved in the local storage."
                : "Пополнения и выводы, сохранённые в локальное хранилище."}
            </p>
          </div>
          <div className="history-block">
            {walletHistory.length === 0 && (
              <div className="history-empty">
                {isEN
                  ? "No wallet operations yet."
                  : "Операций по кошельку ещё не было."}
              </div>
            )}
            {walletHistory.map((e) => (
              <div key={e.id} className="history-row">
                <div className="history-main">
                  <div className="history-type">
                    {e.type === "deposit"
                      ? isEN
                        ? "Deposit"
                        : "Пополнение"
                      : isEN
                      ? "Withdrawal"
                      : "Вывод"}
                  </div>
                  <div className="history-sub">
                    {methodLabel(e.method)}
                  </div>
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
                    {currencySymbol}
                  </div>
                  <div className="history-time">
                    {formatDateTime(e.ts)}
                  </div>
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
                {isEN
                  ? `On Forbex since ${formatDateTime(user.createdAt)}`
                  : `На Forbex с ${formatDateTime(user.createdAt)}`}
              </div>
            </div>
          </div>
        </section>

        <section className="section-block fade-in delay-2">
          <div className="section-title">
            <h2>
              {isEN ? "Account data" : "Данные аккаунта"}
            </h2>
            <p>
              {isEN
                ? "Registration, password and verification settings."
                : "Регистрация, пароль и верификация."}
            </p>
          </div>
          <div className="profile-actions">
            <button
              className="profile-btn"
              onClick={() => setPasswordModalOpen(true)}
            >
              {isEN ? "Change password" : "Сменить пароль"}
            </button>

            <button className="profile-btn">
              {isEN
                ? "Verification (coming soon)"
                : "Верификация (скоро)"}
            </button>
          </div>
        </section>

        <section className="section-block fade-in delay-3">
          <div className="section-title">
            <h2>{isEN ? "Settings" : "Настройки"}</h2>
            <p>
              {isEN
                ? "Language and currency for the interface."
                : "Язык и валюта интерфейса."}
            </p>
          </div>

          <div className="settings-block">
            <div className="settings-row">
              <div className="settings-label">
                {isEN ? "Interface language" : "Язык интерфейса"}
              </div>
              <div className="settings-chips">
                <button
                  className={
                    "settings-chip " +
                    (settings.language === "ru" ? "active" : "")
                  }
                  onClick={() => updateSettings({ language: "ru" })}
                >
                  🇷🇺 Русский
                </button>
                <button
                  className={
                    "settings-chip " +
                    (settings.language === "en" ? "active" : "")
                  }
                  onClick={() => updateSettings({ language: "en" })}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-label">
                {isEN ? "Currency" : "Валюта"}
              </div>
              <div className="settings-chips">
                <button
                  className={
                    "settings-chip " +
                    (settings.currency === "RUB" ? "active" : "")
                  }
                  onClick={() => updateSettings({ currency: "RUB" })}
                >
                  ₽ RUB
                </button>
                <button
                  className={
                    "settings-chip " +
                    (settings.currency === "USD" ? "active" : "")
                  }
                  onClick={() => updateSettings({ currency: "USD" })}
                >
                  $ USD
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block fade-in delay-4">
          <div className="profile-actions">
            <button className="profile-btn logout" onClick={handleLogout}>
              {isEN ? "Log out" : "Выйти из аккаунта"}
            </button>
          </div>
        </section>

        {passwordModalOpen && (
          <div
            className="wallet-modal-backdrop"
            onClick={() => {
              setPasswordModalOpen(false);
              setPasswordForm({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setPasswordError("");
              setPasswordSuccess("");
            }}
          >
            <div
              className="wallet-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wallet-modal-title">
                {isEN ? "Change password" : "Смена пароля"}
              </div>
              <div className="wallet-modal-sub">
                {isEN
                  ? "Enter your current and new password."
                  : "Введите текущий и новый пароль."}
              </div>

              <div className="wallet-modal-input-group">
                <label>
                  {isEN ? "Current password" : "Текущий пароль"}
                </label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    handlePasswordInput("oldPassword", e.target.value)
                  }
                />
              </div>

              <div className="wallet-modal-input-group">
                <label>
                  {isEN ? "New password" : "Новый пароль"}
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    handlePasswordInput("newPassword", e.target.value)
                  }
                />
              </div>

              <div className="wallet-modal-input-group">
                <label>
                  {isEN
                    ? "Repeat new password"
                    : "Повторите новый пароль"}
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    handlePasswordInput("confirmPassword", e.target.value)
                  }
                />
              </div>

              {passwordError && (
                <div className="wallet-modal-note error">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="wallet-modal-note success">
                  {passwordSuccess}
                </div>
              )}

              <div className="wallet-modal-actions">
                <button
                  className="wallet-modal-btn secondary"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordForm({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                >
                  {isEN ? "Close" : "Закрыть"}
                </button>
                <button
                  className="wallet-modal-btn primary"
                  onClick={handlePasswordChange}
                >
                  {isEN ? "Save" : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // ===== Рендер AUTH (когда нет user) =====

  const renderAuth = () => (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-fox">🦊</div>
        <div className="auth-title">Forbex Trade</div>
        {!postRegisterStep && (
          <div className="auth-sub">
            Биржевой интерфейс под Telegram WebApp. Создайте аккаунт, чтобы
            продолжить.
          </div>
        )}

        {postRegisterStep && pendingUser ? (
          <div className="post-register">
            <div className="post-register-title">
              ✅ Успешно зарегистрированы
            </div>
            <div className="post-register-sub">
              Аккаунт: <b>{pendingUser.login}</b> · {pendingUser.email}
            </div>

            <div className="settings-block">
              <div className="settings-row">
                <div className="settings-label">Выберите язык</div>
                <div className="settings-chips">
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.language === "ru" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        language: "ru",
                      }))
                    }
                  >
                    🇷🇺 Русский
                  </button>
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.language === "en" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        language: "en",
                      }))
                    }
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-label">
                  Выберите валюту баланса
                </div>
                <div className="settings-chips">
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.currency === "RUB" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        currency: "RUB",
                      }))
                    }
                  >
                    ₽ RUB
                  </button>
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.currency === "USD" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        currency: "USD",
                      }))
                    }
                  >
                    $ USD
                  </button>
                </div>
              </div>
            </div>

            <button
              className="auth-submit"
              onClick={completeRegistration}
            >
              Продолжить
            </button>

            <div className="auth-note">
              Выбор языка и валюты можно потом поменять в профиле.
            </div>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={
                  "auth-tab " +
                  (authMode === "register" ? "active" : "")
                }
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
              >
                Регистрация
              </button>
              <button
                className={
                  "auth-tab " + (authMode === "login" ? "active" : "")
                }
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
                  onChange={(e) =>
                    handleAuthInput("login", e.target.value)
                  }
                  placeholder="Например, fox_trader"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    handleAuthInput("email", e.target.value)
                  }
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Пароль
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    handleAuthInput("password", e.target.value)
                  }
                  placeholder="Не менее 4 символов"
                />
              </label>

              <div
                className="auth-remember"
                onClick={() =>
                  handleAuthInput("remember", !authForm.remember)
                }
              >
                <div
                  className={
                    "remember-toggle " +
                    (authForm.remember ? "on" : "")
                  }
                >
                  <div className="remember-thumb" />
                </div>
                <span>Запомнить меня</span>
              </div>

              {authError && (
                <div className="auth-error">{authError}</div>
              )}

              <button
                className="auth-submit"
                onClick={
                  authMode === "register"
                    ? handleRegister
                    : handleLogin
                }
              >
                {authMode === "register"
                  ? "Зарегистрироваться"
                  : "Войти"}
              </button>
            </div>

            <div className="auth-note">
              Интерфейс сейчас работает как тестовая оболочка. Данные
              хранятся только в вашем браузере и не отправляются на
              сервер.
            </div>
          </>
        )}
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
        <div className="app-container">{renderAuth()}</div>
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
                {isEN
                  ? "crypto platform in fox style"
                  : "криптоплатформа в лисьем стиле"}
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

        {/* Нижняя навигация */}
        <nav className="bottom-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={
                "nav-tab " +
                (activeTab === tab.id ? "nav-tab-active" : "")
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">
                {isEN ? tab.labelEn : tab.labelRu}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default App;
