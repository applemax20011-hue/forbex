import { useEffect, useState, useRef, useMemo } from "react";
import "./App.css";

// ===== Константы =====

const TABS = [
  { id: 1, labelRu: "Главная", labelEn: "Home", icon: "🏠" },
  { id: 2, labelRu: "Торговля", labelEn: "Trade", icon: "📈" },
  { id: 3, labelRu: "Кошелёк", labelEn: "Wallet", icon: "👛" },
  { id: 4, labelRu: "История", labelEn: "History", icon: "📜" },
  { id: 5, labelRu: "Профиль", labelEn: "Profile", icon: "👤" },
];

const INITIAL_COINS = [
  { symbol: "BTC", name: "Bitcoin", price: 97320, change: "+3.2%", volume: "34.1B" },
  { symbol: "ETH", name: "Ethereum", price: 3270, change: "+1.8%", volume: "18.4B" },
  { symbol: "LTC", name: "Litecoin", price: 84, change: "-0.3%", volume: "410M" },
  { symbol: "ADA", name: "Cardano", price: 0.52, change: "+0.7%", volume: "980M" },
  { symbol: "DOT", name: "Polkadot", price: 7.4, change: "+1.1%", volume: "610M" },
  { symbol: "MATIC", name: "Polygon", price: 0.89, change: "-0.5%", volume: "520M" },
  { symbol: "AVAX", name: "Avalanche", price: 29.1, change: "+2.4%", volume: "430M" },
  { symbol: "UNI", name: "Uniswap", price: 11.2, change: "+0.3%", volume: "210M" },
  { symbol: "XRP", name: "XRP", price: 0.81, change: "+0.9%", volume: "1.7B" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.18, change: "-1.1%", volume: "890M" },
  { symbol: "SHIB", name: "Shiba Inu", price: 0.000029, change: "+4.5%", volume: "390M" },
  { symbol: "TON", name: "Toncoin", price: 6.25, change: "+4.5%", volume: "520M" },
  { symbol: "BNB", name: "BNB", price: 612, change: "+0.4%", volume: "2.9B" },
  { symbol: "TRX", name: "TRON", price: 0.14, change: "+0.2%", volume: "730M" },
  { symbol: "SOL", name: "Solana", price: 192, change: "-0.7%", volume: "4.2B" },
  { symbol: "LINK", name: "Chainlink", price: 19.4, change: "+2.1%", volume: "360M" },
];

const COIN_API_MAP = {
  BTC: "bitcoin",
  ETH: "ethereum",
  LTC: "litecoin",
  ADA: "cardano",
  DOT: "polkadot",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  UNI: "uniswap",
  XRP: "ripple",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  TON: "toncoin",
  BNB: "binancecoin",
  TRX: "tron",
  SOL: "solana",
  LINK: "chainlink",
};

const STORAGE_KEYS = {
  user: "forbex_user",
  password: "forbex_password",
  remember: "forbex_remember",
  balance: "forbex_balance",
  walletHistory: "forbex_wallet_history",
  loginHistory: "forbex_login_history",
  settings: "forbex_settings",
  tradeHistory: "forbex_trade_history",
  registrationTs: "forbex_registration_ts",   // ← добавили
};

const TV_SYMBOLS = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  LTC: "BINANCE:LTCUSDT",
  ADA: "BINANCE:ADAUSDT",
  DOT: "BINANCE:DOTUSDT",
  MATIC: "BINANCE:MATICUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  UNI: "BINANCE:UNIUSDT",
  XRP: "BINANCE:XRPUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  SHIB: "BINANCE:SHIBUSDT",
  TON: "BYBIT:TONUSDT",
  BNB: "BINANCE:BNBUSDT",
  TRX: "BINANCE:TRXUSDT",
  SOL: "BINANCE:SOLUSDT",
  LINK: "BINANCE:LINKUSDT",
};

function ScenarioLightweightChart({ points, scenario, progress }) {
  const svgRef = useRef(null);

  // считаем, какие точки показывать с учётом progress
  const processed = useMemo(() => {
    if (!Array.isArray(points) || points.length === 0) return null;

    const ratio = progress == null ? 1 : progress;
    const visibleCount = Math.max(2, Math.floor(points.length * ratio));
    const data = points.slice(0, visibleCount);

    const values = data.map((p) => p.value);
    const times = data.map((p) => p.time);

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);

    const vRange = maxV - minV || 1;
    const tRange = maxT - minT || 1;

    const width = 100;
    const height = 100;

    const path = data
      .map((p) => {
        const x = ((p.time - minT) / tRange) * width;
        const y = height - ((p.value - minV) / vRange) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    return { path, width, height };
  }, [points, progress]);

  if (!processed) {
    return (
      <div
        className="lw-chart"
        style={{ width: "100%", height: "260px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}
      >
        нет данных для графика
      </div>
    );
  }

  const { path, width, height } = processed;
  const color =
    scenario && scenario.endsWith("win") ? "#22c55e" : "#f97316";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="lw-chart-svg"
      style={{ width: "100%", height: "260px" }}
    >
      {/* фон-сетка (просто декоративная) */}
      <defs>
        <pattern
          id="grid"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="#111827"
            strokeWidth="0.3"
          />
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="url(#grid)"
      />

      {/* линия цены */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={path}
      />
    </svg>
  );
}

// генерим "будущее" от реальной цены
function generateScenarioPoints(scenario, startPoint) {
  const steps = 40;      // сколько точек в будущем
  const stepSec = 15;    // шаг по времени в секундах

  const base = startPoint?.value || 100;
  const startTime = startPoint?.time || Math.floor(Date.now() / 1000);

  const maxChange = 0.03;   // до 3% вверх/вниз
  const noiseLevel = 0.003; // до 0.3% шум

  const points = [];

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;

    let dir = 0;
    if (scenario === "up-win" || scenario === "down-lose") dir = 1;
    else if (scenario === "down-win" || scenario === "up-lose") dir = -1;
    else dir = 0; // flat-сценарии

    const trend = base * maxChange * dir * t;
    const noise = base * noiseLevel * (Math.random() - 0.5);

    points.push({
      time: startTime + i * stepSec,
      value: base + trend + noise,
    });
  }

  return points;
}

function TradingViewChart({ symbol }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const tvSymbol = TV_SYMBOLS[symbol] || "BINANCE:BTCUSDT";

    function createWidget() {
      if (!window.TradingView || !containerRef.current) return;

      // очищаем контейнер перед созданием нового виджета
      containerRef.current.innerHTML = "";

      new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0f172a",
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        container_id: containerRef.current.id,
      });
    }

    // подключаем скрипт, если его ещё нет на странице
    if (!document.getElementById("tradingview-widget-script")) {
      const script = document.createElement("script");
      script.id = "tradingview-widget-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = createWidget;
      document.body.appendChild(script);
    } else {
      createWidget();
    }
  }, [symbol]);

  return (
    <div
      id={`tv_chart_${symbol}`}
      ref={containerRef}
      style={{ width: "100%", height: "160px" }}
    />
  );
}

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

function Loader({ title, subtitle }) {
  return (
    <div className="boot-loader">
      <div className="fox-orbit">
        <div className="fox-core">🦊</div>
        <div className="orbit-ring orbit-ring-1" />
        <div className="orbit-ring orbit-ring-2" />
        <div className="orbit-dot orbit-dot-1" />
        <div className="orbit-dot orbit-dot-2" />
      </div>
      <div className="boot-title">{title || "FORBEX TRADE"}</div>
      <div className="boot-sub">
        {subtitle || "загрузка торгового терминала…"}
      </div>
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
  
  const [coins, setCoins] = useState(INITIAL_COINS);

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
    method: "card", // card | usdt | paypal | support
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
  const [chartDirection, setChartDirection] = useState("idle");
  const [chartScenario, setChartScenario] = useState("idle");

// база = реальная история, chartPoints = база + сценарий
  const [baseChartPoints, setBaseChartPoints] = useState([]);
  const [chartPoints, setChartPoints] = useState([]);
  const [chartProgress, setChartProgress] = useState(1); // 0..1, сколько линии уже прорисовано
  const [tradeForm, setTradeForm] = useState({
    amount: "",
    direction: "up",
    multiplier: 2,
    duration: 10,
  });

  const [tradeError, setTradeError] = useState("");
  const [activeTrade, setActiveTrade] = useState(null);
  const [tradeCountdown, setTradeCountdown] = useState(0);
  const [lastTradeResult, setLastTradeResult] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // отдельная функция, которую вызывает useEffect с таймером
const finishTrade = (trade) => {
  const win = trade.resultDirection === trade.direction; // up / down / flat
  const profit = win
    ? trade.amount * (trade.multiplier - 1)
    : -trade.amount;

  if (win) {
    setBalance((prev) => prev + trade.amount * trade.multiplier);
  }

  const finished = {
    ...trade,
    finishedAt: Date.now(),
    status: win ? "win" : "lose",
    profit,
  };

  setTradeHistory((prev) => [finished, ...prev]);
  setActiveTrade(null);
  setLastTradeResult({
      status: win ? "win" : "lose",
      chartDirection: trade.resultDirection,
      message: win
        ? isEN
          ? "Congratulations! The asset price moved in your direction."
          : "Поздравляем! Стоимость актива пошла в вашу сторону."
        : isEN
        ? "The asset price moved against your forecast. The investment failed."
        : "Стоимость актива пошла против вашего прогноза. Инвестиция не удалась.",
  });

  setChartDirection(trade.resultDirection);
};

  // смена пароля
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // глобальная загрузка между шагами
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [overlayText, setOverlayText] = useState({
    title: "",
    subtitle: "",
  });
  
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
      const savedTradeHistory = localStorage.getItem(
        STORAGE_KEYS.tradeHistory
      );
      const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);

      if (savedWalletHistory) {
        setWalletHistory(JSON.parse(savedWalletHistory));
      }
      if (savedLoginHistory) {
        setLoginHistory(JSON.parse(savedLoginHistory));
      }
      if (savedTradeHistory) {
        setTradeHistory(JSON.parse(savedTradeHistory));
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
      localStorage.setItem(
        STORAGE_KEYS.tradeHistory,
        JSON.stringify(tradeHistory)
      );
    } catch {
      // ignore
    }
  }, [balance, walletHistory, loginHistory, settings, tradeHistory]);

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
  
  // отсчёт по сделке
  // отсчёт по сделке + прогресс для графика
  useEffect(() => {
    if (!activeTrade) return;

    setTradeCountdown(activeTrade.duration);
    setLastTradeResult(null);
    setChartProgress(0);

    const total = activeTrade.duration;

    const timerId = setInterval(() => {
      setTradeCountdown((prev) => {
        if (prev <= 1) {
          setChartProgress(1); // дорисовали линию до конца
          clearInterval(timerId);
          finishTrade(activeTrade);
          return 0;
        }

        const next = prev - 1;
        const elapsed = total - next;
        setChartProgress(Math.min(1, elapsed / total));
        return next;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeTrade]);
  
function formatVolume(num) {
  if (typeof num !== "number" || Number.isNaN(num)) return "";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toFixed(0);
}
  
// подгружаем реальные цены монет (CoinGecko)
// подгружаем реальные цены монет (CoinGecko: price + 24h change + volume)
useEffect(() => {
  async function fetchCoinPrices() {
    try {
      const ids = Object.values(COIN_API_MAP).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`
      );
      if (!res.ok) return;

      const data = await res.json();
      const byId = {};
      data.forEach((item) => {
        byId[item.id] = item;
      });

      setCoins((prev) =>
        prev.map((coin) => {
          const apiId = COIN_API_MAP[coin.symbol];
          const apiData = apiId ? byId[apiId] : null;
          if (!apiData) return coin;

          const price = apiData.current_price;
          const changeNum = apiData.price_change_percentage_24h;
          const volumeNum = apiData.total_volume;

          if (typeof price !== "number" || Number.isNaN(price)) {
            return coin;
          }

          let changeStr = coin.change;
          if (typeof changeNum === "number" && !Number.isNaN(changeNum)) {
            changeStr =
              (changeNum >= 0 ? "+" : "") + changeNum.toFixed(2) + "%";
          }

          let volumeStr = coin.volume;
          if (typeof volumeNum === "number" && !Number.isNaN(volumeNum)) {
            volumeStr = formatVolume(volumeNum);
          }

          return {
            ...coin,
            price,
            change: changeStr,
            volume: volumeStr,
          };
        })
      );
    } catch (e) {
      console.error("Failed to load coin prices", e);
    }
  }

  fetchCoinPrices();                  // первый раз
  const id = setInterval(fetchCoinPrices, 15000); // обновление
  return () => clearInterval(id);
}, []);

  // проста фейковая история, если CoinGecko не ответил
  const buildFallbackHistory = () => {
    const now = Math.floor(Date.now() / 1000);
    const basePrice =
      (coins.find((c) => c.symbol === selectedSymbol)?.price) || 100;

    const arr = [];
    let price = basePrice;
    for (let i = 59; i >= 0; i--) {
      // лёгкий рандомный шаг
      const noise = basePrice * 0.002 * (Math.random() - 0.5); // ±0.2%
      price += noise;
      arr.push({
        time: now - i * 60,
        value: price,
      });
    }
    return arr;
  };

useEffect(() => {
  async function fetchHistory() {
    const apiId = COIN_API_MAP[selectedSymbol];
    if (!apiId) return;

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${apiId}/market_chart?vs_currency=usd&days=1&interval=minute`
      );

      if (!res.ok) {
        console.warn("market_chart not ok, use fallback");
        const fallback = buildFallbackHistory();
        setBaseChartPoints(fallback);
        setChartScenario("idle");
        setChartProgress(1);
        setChartPoints(fallback);
        return;
      }

      const data = await res.json();
      const prices = data.prices || [];

      let last = prices.slice(-60).map(([ts, price]) => ({
        time: Math.floor(ts / 1000),
        value: price,
      }));

      if (!last.length) {
        console.warn("no prices, use fallback");
        last = buildFallbackHistory();
      }

      setBaseChartPoints(last);
      setChartScenario("idle");
      setChartProgress(1);
      setChartPoints(last);
    } catch (e) {
      console.error("Failed to load history for chart", e);
      const fallback = buildFallbackHistory();
      setBaseChartPoints(fallback);
      setChartScenario("idle");
      setChartProgress(1);
      setChartPoints(fallback);
    }
  }

  fetchHistory();
}, [selectedSymbol, coins]); // добавь сюда coins

  // ===== helpers =====
  const showOverlay = (title, subtitle, callback, delay = 1100) => {
    setOverlayText({
      title: title || "FORBEX TRADE",
      subtitle: subtitle || "",
    });
    setOverlayLoading(true);

    setTimeout(() => {
      if (callback) {
        callback();
      }
      setOverlayLoading(false);
    }, delay);
  };

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
    if (login.trim().length < 4) {
      setAuthError("Логин должен быть от 4 символов.");
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

    showOverlay(
      "FORBEX TRADE",
      "Регистрация…",
      () => {
      setPendingUser(newUser);
      setPostRegisterStep(true);
      setTempSettings({
        language: "ru",
        currency: "RUB",
      });
    }
  );
};

  const completeRegistration = () => {
    if (!pendingUser) return;
    const { password, remember } = authForm;

    const finalSettings = { ...settings, ...tempSettings };

    showOverlay(
      "FORBEX TRADE",
      "загрузка торгового терминала…",
      () => {
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
		
		if (!localStorage.getItem(STORAGE_KEYS.registrationTs)) {
        localStorage.setItem(
          STORAGE_KEYS.registrationTs,
          String(pendingUser.createdAt)
        );
       }

        const entry = {
          id: Date.now(),
          type: "register",
          login: pendingUser.login,
          email: pendingUser.email,
          ts: Date.now(),
          device: navigator.userAgent || "",
        };
        setLoginHistory((prev) => [entry, ...prev]);

        setPendingUser(null);
        setPostRegisterStep(false);
      }
    );
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

    // постоянная дата регистрации
    const savedRegTs = localStorage.getItem(STORAGE_KEYS.registrationTs);
    const createdAt =
      savedRegTs ? Number(savedRegTs) : savedUser.createdAt || Date.now();

    const userWithCreatedAt = { ...savedUser, createdAt };

    setUser(userWithCreatedAt);
    localStorage.setItem(STORAGE_KEYS.remember, String(remember));
    localStorage.setItem(
      STORAGE_KEYS.user,
      JSON.stringify(userWithCreatedAt)
    );

    const entry = {
      id: Date.now(),
      type: "login",
      login: savedUser.login,
      email: savedUser.email,
      ts: Date.now(),
      device: navigator.userAgent || "",
    };
    setLoginHistory((prev) => [entry, ...prev]);
  } catch {
    setAuthError("Ошибка входа. Попробуйте ещё раз.");
  }
};

  const handleLogout = () => {
    if (user) {
      const entry = {
        id: Date.now(),
        type: "logout",
        login: user.login,
        email: user.email,
        ts: Date.now(),
        device: navigator.userAgent || "",
      };
      setLoginHistory((prev) => [entry, ...prev]);
    }
    setUser(null);
    setActiveTab(1);
  };

  // смена пароля
  const handlePasswordInput = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleTradeInput = (field, value) => {
    setTradeForm((prev) => ({ ...prev, [field]: value }));
    setTradeError("");
  };

  const handleStartTrade = () => {
    const raw = tradeForm.amount.toString().replace(",", ".");
    const amountNum = parseFloat(raw);
    const minInvest = settings.currency === "RUB" ? 100 : 5;

    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setTradeError(
        isEN
          ? "Enter the amount you want to invest."
          : "Введите сумму, которую хотите инвестировать."
      );
      return;
    }

    if (amountNum < minInvest) {
      setTradeError(
        isEN
          ? `Minimum investment is ${minInvest} ${
              settings.currency === "RUB" ? "RUB" : "USD"
            }.`
          : `Минимальная сумма инвестиций — ${minInvest} ${
              settings.currency === "RUB" ? "₽" : "USD"
            }.`
      );
      return;
    }

    if (amountNum > balance) {
      setTradeError(
        isEN
          ? "Not enough funds on balance."
          : "Недостаточно средств на балансе."
      );
      return;
    }

    if (activeTrade) return; // уже идёт сделка

    const possibleDirections = ["up", "down", "flat"];
    const resultDirection =
      possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

    const trade = {
      id: Date.now(),
      symbol: selectedSymbol,
      amount: amountNum,
      direction: tradeForm.direction, // выбор пользователя
      resultDirection, // как реально пойдёт график
      multiplier: tradeForm.multiplier,
      duration: tradeForm.duration,
      startedAt: Date.now(),
    };

    // определяем, выиграет ли сделка
    const willWin = resultDirection === tradeForm.direction;

    // выбираем сценарий анимации графика
    let scenario = "idle";

    if (tradeForm.direction === "up") {
      scenario = willWin ? "up-win" : "up-lose";
    } else if (tradeForm.direction === "down") {
      scenario = willWin ? "down-win" : "down-lose";
    } else {
      // flat
      scenario = willWin ? "flat-win" : "flat-lose";
    }

setChartScenario(scenario);

// берём последнюю реальную точку (текущую цену)
const lastBasePoint =
  baseChartPoints.length > 0
    ? baseChartPoints[baseChartPoints.length - 1]
    : null;

// генерим "будущее" от неё
const future = generateScenarioPoints(scenario, lastBasePoint);

// для красоты берём хвост истории + будущее
const historyTail = baseChartPoints.slice(-40);
setChartPoints([...historyTail, ...future]);

setChartProgress(0); // линия будет прорисовываться по таймеру
                           // начинаем с нуля

    // блокируем сумму и запускаем сделку
    setBalance((prev) => prev - amountNum);
    setChartDirection(resultDirection);
    setActiveTrade(trade);
  }; // ← ВОТ ЭТА СТРОКА НУЖНА

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

// кошелёк: депозит / вывод
const handleWalletConfirmWithdraw = () => {
  const raw = walletForm.amount.toString().replace(",", ".");
  const amountNum = parseFloat(raw);

  if (Number.isNaN(amountNum) || amountNum <= 0) return;

  const now = Date.now();

  // реально выводим не больше, чем есть
  const actualAmount = Math.min(amountNum, balance);
  if (actualAmount <= 0) return;

  setBalance((prev) => Math.max(0, prev - actualAmount));

  const entry = {
    id: now,
    type: "withdraw",
    amount: actualAmount,
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
  setWalletForm((prev) => ({
    ...prev,
    amount: "",
    method: "card",
  }));
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

  if (!receiptFileName) {
    setDepositError(
      isEN
        ? "You did not attach a receipt."
        : "Вы не прикрепили чек."
    );
    return;
  }

  const now = Date.now();

  showOverlay(
    "FORBEX TRADE",
    isEN ? "Checking payment…" : "Проверка платежа…",
    () => {
      setBalance((prev) => prev + depositAmount);

      const entry = {
        id: now,
        type: "deposit",
        amount: depositAmount,
        method: walletForm.method || "card",
        ts: now,
        status: "checked",
      };
      setWalletHistory((prev) => [entry, ...prev]);

      setWalletModal(null);
      resetDepositFlow();
    }
  );
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
          {coins.map((c) => (
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
                    (c.change.toString().startsWith("-")
                      ? "negative"
                      : "positive")
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
    coins.find((c) => c.symbol === selectedSymbol) || coins[0];

  const scenario = chartScenario || "idle";

  const minInvest = settings.currency === "RUB" ? 100 : 5;
  const multipliers = [2, 5, 10];
  const durations = [10, 30, 60];

  // подпись под графиком — можно оставить, но основное теперь линия
  const chartLabel =
    scenario === "idle"
      ? isEN
        ? "Waiting for trade…"
        : "Ожидаем сделку…"
      : scenario.startsWith("up") && scenario.endsWith("win")
      ? isEN
        ? "Price goes up"
        : "Курс растёт"
      : scenario.startsWith("up") && scenario.endsWith("lose")
      ? isEN
        ? "Price goes down"
        : "Курс падает"
      : scenario.startsWith("down") && scenario.endsWith("win")
      ? isEN
        ? "Price goes down"
        : "Курс падает"
      : scenario.startsWith("down") && scenario.endsWith("lose")
      ? isEN
        ? "Price goes up"
        : "Курс растёт"
      : scenario.startsWith("flat") && scenario.endsWith("win")
      ? isEN
        ? "Almost no change"
        : "Почти без изменений"
      : scenario.startsWith("flat") && scenario.endsWith("lose")
      ? isEN
        ? "Small volatility"
        : "Небольшая волатильность"
      : isEN
      ? "Almost no change"
      : "Почти без изменений";

  return (
    <>
      <section className="section-block fade-in delay-1">
        <div className="section-title">
          <h2>{isEN ? "Trading" : "Торговля"}</h2>
          <p>
            {isEN
              ? "Choose a coin, set amount, direction and time — the result will be calculated automatically."
              : "Выберите монету, задайте сумму, направление и время — результат сделки посчитается автоматически."}
          </p>
        </div>
        <div className="trade-layout">
          {/* Левая часть: наш фейковый график */}
<div className="trade-chart-card">
  <div className="trade-chart-header">
    <div className="trade-pair">
      {currentCoin.symbol}/USDT
      <span className="pair-tag">
        {isEN ? "Chart" : "График"}
      </span>
    </div>
    <div className="trade-price">
      {currentCoin.price.toLocaleString("ru-RU", {
        minimumFractionDigits: currentCoin.price < 1 ? 2 : 0,
      })}{" "}
      $
    </div>
  </div>

  {/* наш рисованный график */}
  <div className={`fake-chart chart-${scenario}`}>
    <ScenarioLightweightChart
      points={chartPoints}
      scenario={scenario}
      progress={activeTrade ? chartProgress : 1}
    />
    <div className="fake-chart-grid" />
    <div className="fake-chart-label">{chartLabel}</div>
  </div>

  <div className="trade-timeframe-row">
    {["1М", "15М", "1Ч", "4Ч", "1Д"].map((tf, i) => (
      <button
        key={tf}
        className={"tf-pill " + (i === 3 ? "tf-pill-active" : "")}
        type="button"
      >
        {tf}
      </button>
    ))}
  </div>
</div>
            {/* Правая часть: форма сделки */}
            <div className="trade-side">
              {/* выбор монеты */}
              <div className="trade-param-row">
                <div className="trade-input-label">
                  {isEN ? "Asset" : "Актив для торговли"}
                </div>
                <div className="trade-coin-buttons">
                  {coins.slice(0, 10).map((coin) => (
                    <button
                      key={coin.symbol}
                      type="button"
                      className={
                        "trade-coin-btn " +
                        (selectedSymbol === coin.symbol ? "active" : "")
                      }
                      onClick={() => setSelectedSymbol(coin.symbol)}
                    >
                      {coin.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* сумма инвестиций */}
              <div className="trade-param-row">
                <div className="trade-input-label">
                  {isEN
                    ? "Investment amount"
                    : "Сумма инвестиций"}
                </div>
                <div className="trade-input-with-suffix">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tradeForm.amount}
                    onChange={(e) =>
                      handleTradeInput("amount", e.target.value)
                    }
                    placeholder={
                      settings.currency === "RUB"
                        ? "Например, 1000"
                        : "For example, 20"
                    }
                  />
                  <span className="trade-input-suffix">
                    {settings.currency === "RUB" ? "₽" : "USD"}
                  </span>
                </div>
                <div className="trade-hint">
                  {isEN
                    ? `Minimum investment — ${minInvest} ${
                        settings.currency === "RUB" ? "RUB" : "USD"
                      }.`
                    : `Минимальная сумма инвестиций — ${minInvest} ${
                        settings.currency === "RUB" ? "₽" : "USD"
                      }.`}
                </div>
              </div>

              {/* направление */}
              <div className="trade-param-row">
                <div className="trade-input-label">
                  {isEN
                    ? "Where will the price go?"
                    : "Куда пойдёт курс актива?"}
                </div>
                <div className="trade-direction-row">
                  <button
                    type="button"
                    className={
                      "trade-direction-btn " +
                      (tradeForm.direction === "up" ? "active" : "")
                    }
                    onClick={() => handleTradeInput("direction", "up")}
                  >
                    ⬆{" "}
                    {isEN
                      ? "Up (LONG)"
                      : "Вверх (покупка)"}
                  </button>
                  <button
                    type="button"
                    className={
                      "trade-direction-btn " +
                      (tradeForm.direction === "flat" ? "active" : "")
                    }
                    onClick={() => handleTradeInput("direction", "flat")}
                  >
                    ↔{" "}
                    {isEN
                      ? "No change"
                      : "Не изменится"}
                  </button>
                  <button
                    type="button"
                    className={
                      "trade-direction-btn " +
                      (tradeForm.direction === "down" ? "active" : "")
                    }
                    onClick={() => handleTradeInput("direction", "down")}
                  >
                    ⬇{" "}
                    {isEN
                      ? "Down (SHORT)"
                      : "Вниз (продажа)"}
                  </button>
                </div>
                <div className="trade-hint">
                  {isEN
                    ? "If you choose “no change”, you win when the chart stays almost on the same level."
                    : "Если выберете «Не изменится», вы выигрываете, если график остаётся примерно на одном уровне."}
                </div>
              </div>

              {/* коэффициент */}
              <div className="trade-param-row">
                <div className="trade-input-label">
                  {isEN
                    ? "Multiplier"
                    : "Коэффициент (x)"}
                </div>
                <div className="trade-multiplier-row">
                  {multipliers.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={
                        "trade-mult-btn " +
                        (tradeForm.multiplier === m ? "active" : "")
                      }
                      onClick={() => handleTradeInput("multiplier", m)}
                    >
                      x{m}
                    </button>
                  ))}
                </div>
              </div>

              {/* время ожидания */}
              <div className="trade-param-row">
                <div className="trade-input-label">
                  {isEN
                    ? "Waiting time"
                    : "Время ожидания"}
                </div>
                <div className="trade-duration-row">
                  {durations.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={
                        "trade-duration-btn " +
                        (tradeForm.duration === sec ? "active" : "")
                      }
                      onClick={() => handleTradeInput("duration", sec)}
                    >
                      {sec}{" "}
                      {isEN ? "sec" : "сек"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ошибка валидации */}
              {tradeError && (
                <div className="trade-error">{tradeError}</div>
              )}

              {/* активная сделка / кнопка открыть */}
              {activeTrade ? (
                <div className="trade-active-panel">
                  <div className="trade-active-title">
                    {isEN
                      ? "Trade in progress"
                      : "Сделка в процессе"}
                  </div>
                  <div className="trade-active-row">
                    <span>
                      {currentCoin.symbol}/USDT ·{" "}
                      {activeTrade.direction === "up"
                        ? isEN
                          ? "Up"
                          : "Вверх"
                        : activeTrade.direction === "down"
                        ? isEN
                          ? "Down"
                          : "Вниз"
                        : isEN
                        ? "No change"
                        : "Не изменится"}{" "}
                      · x{activeTrade.multiplier}
                    </span>
                    <span className="trade-active-countdown">
                      {formatTimer(tradeCountdown)}
                    </span>
                  </div>
                  <div className="trade-hint">
                    {isEN
                      ? "When the timer ends, the platform will calculate the result automatically."
                      : "Когда таймер дойдёт до нуля, платформа автоматически посчитает результат сделки."}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="trade-start-btn"
                  onClick={handleStartTrade}
                >
                  {isEN ? "Open trade" : "Открыть сделку"}
                </button>
              )}

              {/* результат последней сделки */}
              {lastTradeResult && !activeTrade && (
                <div
                  className={
                    "trade-result " +
                    (lastTradeResult.status === "win"
                      ? "win"
                      : "lose")
                  }
                >
                  {lastTradeResult.message}
                </div>
              )}
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
    if (m === "card") return isEN ? "Bank card" : "Банковская карта";
    if (m === "usdt") return "USDT TRC-20";
    if (m === "paypal") return "PayPal";
    if (m === "support") return isEN ? "Via support" : "Через поддержку";
    return m;
  };

  const currentMethod = walletForm.method || "card";
  const isCard = currentMethod === "card";
  const isUsdt = currentMethod === "usdt";
  const isPaypal = currentMethod === "paypal";
  const isSupport = currentMethod === "support";

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
                  method: "card",
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
            {isEN
              ? "Recent wallet operations"
              : "Последние операции кошелька"}
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
            {/* ===== ПОПОЛНЕНИЕ: ШАГ 1 — метод + сумма ===== */}
            {walletModal === "deposit" && depositStep === 1 && (
              <>
                <div className="wallet-modal-title">
                  {isEN ? "Deposit to balance" : "Пополнить баланс"}
                </div>
                <div className="wallet-modal-sub">
                  {isEN
                    ? "Choose the method and enter the amount you want to deposit."
                    : "Выберите способ и введите сумму, которую хотите пополнить."}
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
                    type="button"
                  >
                    <div className="wallet-method-title">
                      {isEN ? "Bank card" : "Банковская карта"}
                    </div>
                    <div className="wallet-method-sub">
                      {isEN
                        ? "Standard deposit to card."
                        : "Обычное пополнение по номеру карты."}
                    </div>
                    <div className="wallet-method-extra">
                      VISA / MasterCard / МИР
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
                    type="button"
                  >
                    <div className="wallet-method-title">USDT TRC-20</div>
                    <div className="wallet-method-sub">
                      {isEN
                        ? "Crypto deposit in TRON network."
                        : "Крипто-пополнение в сети TRON."}
                    </div>
                    <div className="wallet-method-extra">TRC-20</div>
                  </button>

                  <button
                    className={
                      "wallet-method-card " +
                      (walletForm.method === "paypal" ? "active" : "")
                    }
                    onClick={() =>
                      setWalletForm((prev) => ({ ...prev, method: "paypal" }))
                    }
                    type="button"
                  >
                    <div className="wallet-method-title">PayPal</div>
                    <div className="wallet-method-sub">
                      {isEN
                        ? "International deposit via PayPal."
                        : "Международное пополнение через PayPal."}
                    </div>
                    <div className="wallet-method-extra">Global</div>
                  </button>

                  <button
                    className={
                      "wallet-method-card " +
                      (walletForm.method === "support" ? "active" : "")
                    }
                    onClick={() =>
                      setWalletForm((prev) => ({
                        ...prev,
                        method: "support",
                      }))
                    }
                    type="button"
                  >
                    <div className="wallet-method-title">
                      {isEN
                        ? "Deposit via support"
                        : "Пополнение через поддержку"}
                    </div>
                    <div className="wallet-method-sub">
                      {isEN
                        ? "Manager will help you with payment."
                        : "Менеджер поможет провести платёж."}
                    </div>
                    <div className="wallet-method-extra">Telegram · OKEX</div>
                  </button>
                </div>

                <div className="wallet-modal-input-group">
                  <label>
                    {isEN
                      ? `Amount (${
                          settings.currency === "RUB" ? "RUB" : "USD"
                        })`
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
                    type="button"
                    onClick={() => {
                      setWalletModal(null);
                      resetDepositFlow();
                    }}
                  >
                    {isEN ? "Cancel" : "Отмена"}
                  </button>
                  <button
                    className="wallet-modal-btn primary"
                    type="button"
                    onClick={handleDepositNext}
                  >
                    {isEN ? "Next" : "Далее"}
                  </button>
                </div>
              </>
            )}

            {/* ===== ПОПОЛНЕНИЕ: ШАГ 2 — реквизиты + чек ===== */}
            {walletModal === "deposit" && depositStep === 2 && (
              <>
                <div className="wallet-modal-title">
                  {isEN ? "Payment details" : "Реквизиты для оплаты"}
                </div>
                <div className="wallet-modal-sub">
                  {isEN
                    ? "Pay using the details below and upload the receipt."
                    : "Оплатите по реквизитам ниже и загрузите чек."}
                </div>

                <div className="payment-details">
                  <div className="payment-row">
                    <div className="payment-label">
                      {isEN ? "Method" : "Способ оплаты"}
                    </div>
                    <div className="payment-value">
                      {methodLabel(currentMethod)}
                    </div>
                  </div>

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

                  {/* Реквизиты зависят от метода */}
                  {isCard && (
                    <>
                      <div className="payment-row">
                        <div className="payment-label">
                          {isEN ? "Card number" : "Номер карты"}
                        </div>
                        <div className="payment-value payment-card-row">
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() =>
                              navigator.clipboard
                                ?.writeText("5559 8877 0011 1234")
                                .catch(() => {})
                            }
                          >
                            5559 8877 0011 1234
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
                        <div className="payment-value">Tinkoff Bank</div>
                      </div>
                    </>
                  )}

                  {isUsdt && (
                    <>
                      <div className="payment-row">
                        <div className="payment-label">
                          {isEN ? "USDT address" : "Адрес USDT TRC-20"}
                        </div>
                        <div className="payment-value payment-card-row">
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() =>
                              navigator.clipboard
                                ?.writeText(
                                  "TTu8Zk7sR1ExampleTRC20Address"
                                )
                                .catch(() => {})
                            }
                          >
                            TTu8Zk7sR1…TRC20
                          </button>
                        </div>
                      </div>
                      <div className="payment-row">
                        <div className="payment-label">
                          {isEN ? "Network" : "Сеть"}
                        </div>
                        <div className="payment-value">
                          TRON (TRC-20)
                        </div>
                      </div>
                    </>
                  )}

                  {isPaypal && (
                    <>
                      <div className="payment-row">
                        <div className="payment-label">PayPal</div>
                        <div className="payment-value payment-card-row">
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() =>
                              navigator.clipboard
                                ?.writeText("okex-payments@example.com")
                                .catch(() => {})
                            }
                          >
                            okex-payments@example.com
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {isSupport && (
                    <div className="payment-row">
                      <div className="payment-label">
                        {isEN ? "How to pay" : "Как оплатить"}
                      </div>
                      <div className="payment-value">
                        {isEN
                          ? "Write to support in Telegram and send the receipt there."
                          : "Напишите в техподдержку Telegram и отправьте чек туда."}
                      </div>
                    </div>
                  )}

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
                            setDepositError("");
                          } else {
                            setReceiptFileName("");
                          }
                        }}
                      />
                      <span>
                        {isEN ? "Choose file" : "Выбрать файл"}
                      </span>
                    </label>
                    {receiptFileName && (
                      <div className="upload-filename">
                        {receiptFileName}
                      </div>
                    )}
                  </div>

                  {/* Красивая кнопка техподдержки с самолётиком */}
                  <a
                    href="https://t.me/okex_official_support"
                    target="_blank"
                    rel="noreferrer"
                    className="support-link"
                  >
                    <div className="support-link-main">
                      <div className="support-link-title">
                        {isEN
                          ? "Support in Telegram"
                          : "Техподдержка Telegram"}
                      </div>
                      <div className="support-link-sub">
                        @OKEX ·{" "}
                        {isEN
                          ? "Official support"
                          : "официальная поддержка"}
                      </div>
                    </div>
                    <div className="support-link-icon">✈️</div>
                  </a>
                </div>

                {depositError && (
                  <div className="wallet-modal-note error">
                    {depositError}
                  </div>
                )}

                <div className="wallet-modal-actions">
                  <button
                    className="wallet-modal-btn secondary"
                    type="button"
                    onClick={() => {
                      setWalletModal(null);
                      resetDepositFlow();
                    }}
                  >
                    {isEN ? "Cancel" : "Отмена"}
                  </button>
                  <button
                    type="button"
                    className={
                      "wallet-modal-btn primary " +
                      (!receiptFileName
                        ? "wallet-modal-btn-disabled"
                        : "")
                    }
                    disabled={!receiptFileName}
                    onClick={
                      receiptFileName
                        ? handleDepositSendReceipt
                        : undefined
                    }
                  >
                    {isEN ? "Send receipt" : "Отправить чек"}
                  </button>
                </div>
              </>
            )}

            {/* ===== ВЫВОД СРЕДСТВ ===== */}
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
                    type="button"
                    onClick={() =>
                      setWalletForm((prev) => ({ ...prev, method: "card" }))
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
                    type="button"
                    onClick={() =>
                      setWalletForm((prev) => ({ ...prev, method: "usdt" }))
                    }
                  >
                    <div className="wallet-method-title">USDT TRC-20</div>
                    <div className="wallet-method-sub">
                      {isEN ? "TRON network" : "Сеть TRON"}
                    </div>
                  </button>

                  <button
                    className={
                      "wallet-method-card " +
                      (walletForm.method === "paypal" ? "active" : "")
                    }
                    type="button"
                    onClick={() =>
                      setWalletForm((prev) => ({
                        ...prev,
                        method: "paypal",
                      }))
                    }
                  >
                    <div className="wallet-method-title">PayPal</div>
                    <div className="wallet-method-sub">
                      {isEN
                        ? "International withdrawals"
                        : "Международные выводы"}
                    </div>
                  </button>
                </div>

                <div className="wallet-modal-input-group">
                  <label>{isEN ? "Amount" : "Сумма"}</label>
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
                    type="button"
                    onClick={() => setWalletModal(null)}
                  >
                    {isEN ? "Cancel" : "Отмена"}
                  </button>
                  <button
                    className="wallet-modal-btn primary"
                    type="button"
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
  if (m === "card") return isEN ? "Bank card" : "Банковская карта";
  if (m === "usdt") return "USDT TRC-20";
  if (m === "paypal") return "PayPal";
  if (m === "support") return isEN ? "Via support" : "Через поддержку";
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

        <section className="section-block fade-in delay-3">
          <div className="section-title">
            <h2>
              {isEN ? "Trade history" : "История сделок"}
            </h2>
            <p>
              {isEN
                ? "All your opened trades: direction, amount, multiplier and result."
                : "Все ваши открытые сделки: направление, сумма, коэффициент и результат."}
            </p>
          </div>
          <div className="history-block">
            {tradeHistory.length === 0 && (
              <div className="history-empty">
                {isEN
                  ? "No trades yet."
                  : "Сделок ещё не было."}
              </div>
            )}
            {tradeHistory.map((t) => (
              <div key={t.id} className="history-row">
                <div className="history-main">
                  <div className="history-type">
                    {t.symbol}/USDT ·{" "}
                    {t.direction === "up"
                      ? (isEN ? "Up" : "Вверх")
					  : t.direction === "down"
                      ? (isEN ? "Down" : "Вниз")
                      : isEN
					  ? "No change"
                      : "Не изменится"}{" "}
                    · x{t.multiplier}
                  </div>
                  <div className="history-sub">
                    {isEN ? "Amount" : "Сумма"}:{" "}
                    {t.amount.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencySymbol}
                  </div>
                </div>
                <div className="history-right">
                  <div
                    className={
                      "history-amount " +
                      (t.status === "win" ? "positive" : "negative")
                    }
                  >
                    {t.profit > 0 ? "+" : ""}
                    {t.profit.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencySymbol}
                  </div>
                  <div className="history-time">
                    {formatDateTime(t.finishedAt)}
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
  {authMode === "register" ? (
    <>
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
    </>
  ) : (
    <>
      <label>
        Логин или email
        <input
          type="text"
          value={authForm.login}
          onChange={(e) =>
            handleAuthInput("login", e.target.value)
          }
          placeholder="Введите логин или email"
        />
      </label>
    </>
  )}

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
        <div className="app-container">
          {overlayLoading && (
            <div className="boot-loader">
              <div className="fox-orbit">
                <div className="fox-core">🦊</div>
                <div className="orbit-ring orbit-ring-1" />
                <div className="orbit-ring orbit-ring-2" />
                <div className="orbit-dot orbit-dot-1" />
                <div className="orbit-dot orbit-dot-2" />
              </div>
              <div className="boot-title">
                {overlayText.title || "FORBEX TRADE"}
              </div>
              <div className="boot-sub">
                {overlayText.subtitle ||
                  (isEN
                    ? "Please, wait…"
                    : "Пожалуйста, подождите…")}
              </div>
            </div>
          )}

          {renderAuth()}
        </div>
      </div>
    );
  }

  return (
    <div className="page-root">
      <div className="app-container">
        {overlayLoading && (
          <div className="boot-loader">
            <div className="fox-orbit">
              <div className="fox-core">🦊</div>
              <div className="orbit-ring orbit-ring-1" />
              <div className="orbit-ring orbit-ring-2" />
              <div className="orbit-dot orbit-dot-1" />
              <div className="orbit-dot orbit-dot-2" />
            </div>
            <div className="boot-title">
              {overlayText.title || "FORBEX TRADE"}
            </div>
            <div className="boot-sub">
              {overlayText.subtitle ||
                (isEN
                  ? "Please, wait…"
                  : "Пожалуйста, подождите…")}
            </div>
          </div>
        )}

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
