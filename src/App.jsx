import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

// ===== Константы =====
// где-то рядом с импортами

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

const COIN_ICONS = {
  BTC: "₿",
  ETH: "Ξ",
  LTC: "Ł",
  ADA: "A",
  DOT: "•",
  MATIC: "M",
  AVAX: "A",
  UNI: "U",
  XRP: "✕",
  DOGE: "Ð",
  SHIB: "🐶",
  TON: "TON",
  BNB: "BNB",
  TRX: "T",
  SOL: "S",
  LINK: "🔗",
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
  registrationTs: "forbex_registration_ts",
  stats: "forbex_stats",            // для активных юзеров и сделок
};

// Курс для отображения баланса. Поставь свой.
const USD_RATE = 100; // 1 USD = 100 RUB

// ===== Supabase (frontend) =====
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const MAIN_ADMIN_TG_ID = Number(import.meta.env.VITE_MAIN_ADMIN_ID || "0");

function toDisplayCurrency(amountRub, currency) {
  if (typeof amountRub !== "number" || Number.isNaN(amountRub)) return 0;

  if (currency === "USD") {
    return amountRub / USD_RATE; // было 500 000 RUB → 5 000 USD (если курс 100)
  }
  // по умолчанию RUB
  return amountRub;
}

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
    const [stats, setStats] = useState({
    activeUsers: 24580,
    trades24h: 312400,
    lastReset: Date.now(),
  });
  
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: "" });
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [settingsMsg, setSettingsMsg] = useState("");


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
  const [isSendingReceipt, setIsSendingReceipt] = useState(false); // <--- НОВОЕ
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 минут
    // Telegram WebApp
  const [telegramId, setTelegramId] = useState(null);
  const [telegramError, setTelegramError] = useState("");

  // файл чека (не только имя)
    // файл чека (не только имя)
  const [receiptFile, setReceiptFile] = useState(null);
  const [toast, setToast] = useState(null); // <<< НОВЫЙ СТЕЙТ ДЛЯ 
  // Добавь это к остальным useState
  const [userAvatarUrl, setUserAvatarUrl] = useState(null); // Аватарка
  const [withdrawStep, setWithdrawStep] = useState(1); // Шаги вывода
  const [withdrawDetails, setWithdrawDetails] = useState(""); // Реквизиты вывода
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
// отдельная функция, которую вызывает useEffect с таймером
const finishTrade = (trade) => {
  const win = trade.resultDirection === trade.direction; // up / down / flat
  const profit = win
    ? trade.amount * (trade.multiplier - 1)
    : -trade.amount;

  if (win) {
    setBalance((prev) => prev + trade.amount * trade.multiplier);
  }

  const finishedAt = Date.now();

  const finished = {
    ...trade,
    finishedAt,
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

  // сохраняем сделку в Supabase
  (async () => {
    try {
      if (!user) return;

      await supabase.from("trade_history").insert({
        user_id: user.id,
        symbol: trade.symbol,
        amount: trade.amount,
        direction: trade.direction,
        // в таблице trade_history НЕТ result_direction, поэтому не пишем его
        multiplier: trade.multiplier,
        duration: trade.duration,
        status: win ? "win" : "lose",
        profit,
        started_at: new Date(trade.startedAt).toISOString(),
        finished_at: new Date(finishedAt).toISOString(),
      });
    } catch (e) {
      console.error("trade_history insert error:", e);
    }
  })();
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
  const currencyCode = settings.currency === "RUB" ? "RUB" : "USD";
  
// Загружаем историю логинов и сделок из Supabase
// Загружаем историю логинов и сделок из Supabase
useEffect(() => {
  if (!user) return;

  async function loadUserHistoriesFromSupabase() {
    try {
      const [loginsRes, tradesRes] = await Promise.all([
        supabase
          .from("login_history")
          .select("id, event_type, login, email, device, ts")
          .eq("user_id", user.id)
          .order("ts", { ascending: false })
          .limit(100),
        supabase
          .from("trade_history")
          .select(
            "id, symbol, amount, direction, multiplier, duration, status, profit, started_at, finished_at"
          )
          .eq("user_id", user.id)
          .order("finished_at", { ascending: false })
          .limit(100),
      ]);

      if (!loginsRes.error) {
        const loginRows = (loginsRes.data || []).map((row) => ({
          id: row.id,
          type: row.event_type,
          login: row.login,
          email: row.email,
          device: row.device,
          ts: row.ts ? new Date(row.ts).getTime() : Date.now(),
        }));
        setLoginHistory(loginRows);
      } else {
        console.error("loadUserHistories logins error:", loginsRes.error);
      }

      if (!tradesRes.error) {
        const tradeRows = (tradesRes.data || []).map((row) => ({
          id: row.id,
          symbol: row.symbol,
          amount: Number(row.amount || 0),
          direction: row.direction,
          resultDirection: row.result_direction, // в таблице нет — будет undefined, но логика не ломается
          multiplier: row.multiplier,
          duration: row.duration,
          profit: Number(row.profit || 0),
          status: row.status,
          startedAt: row.started_at
            ? new Date(row.started_at).getTime()
            : undefined,
          finishedAt: row.finished_at
            ? new Date(row.finished_at).getTime()
            : undefined,
        }));
        setTradeHistory(tradeRows);
      } else {
        console.error("loadUserHistories trades error:", tradesRes.error);
      }
    } catch (e) {
      console.error("loadUserHistoriesFromSupabase exception", e);
    }
  }

  loadUserHistoriesFromSupabase();
}, [user]);

// ===== Инициализация из localStorage =====
useEffect(() => {
  const bootTimer = setTimeout(() => setBooting(false), 1300);

  try {
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);
    const savedPass = localStorage.getItem(STORAGE_KEYS.password);
    const savedRemember = localStorage.getItem(STORAGE_KEYS.remember);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);

    // настройки языка/валюты
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }

    const rememberFlag = savedRemember === "true";

    // автологин
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
  
// Забираем Telegram ID и Фото
  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) return;
      tg.ready();
      tg.expand(); // На всякий случай развернем
      
      const u = tg.initDataUnsafe?.user;
      if (u) {
        if (u.id) setTelegramId(u.id);
        if (u.photo_url) setUserAvatarUrl(u.photo_url); // <--- Сохраняем фото
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

// ===== Сохранение настроек в localStorage =====
useEffect(() => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify(settings)
    );
  } catch {
    // ignore
  }
}, [settings]);
  
  // симуляция активности: активные юзеры и сделки за 24ч
  // симуляция активности: активные юзеры и сделки за 24ч
  useEffect(() => {
    const MIN_USERS = 2000;
    const MAX_USERS = 50000;
    const MIN_TRADES = 300000;
    const MAX_TRADES = 1000000;

    const tick = () => {
      const now = Date.now();

      // начало сегодняшнего дня (00:00:00)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startTs = startOfToday.getTime();

      setStats((prev) => {
        const needReset = !prev.lastReset || prev.lastReset < startTs;

        const baseUsers = needReset
          ? MIN_USERS + Math.floor(Math.random() * 3000)
          : prev.activeUsers;

        const baseTrades = needReset
          ? MIN_TRADES + Math.floor(Math.random() * 50000)
          : prev.trades24h;

        const lastReset = needReset
          ? startTs
          : prev.lastReset || startTs;

        // небольшой прирост каждые 30 секунд
        const nextUsers = Math.min(
          MAX_USERS,
          baseUsers + Math.floor(Math.random() * 120 + 20)
        );
        const nextTrades = Math.min(
          MAX_TRADES,
          baseTrades + Math.floor(Math.random() * 4000 + 500)
        );

        // если упёрлись в верхний лимит — начинаем новый цикл от минимума
        if (nextUsers >= MAX_USERS || nextTrades >= MAX_TRADES) {
          return {
            activeUsers:
              MIN_USERS + Math.floor(Math.random() * 3000),
            trades24h:
              MIN_TRADES + Math.floor(Math.random() * 50000),
            lastReset: startTs,
          };
        }

        return {
          activeUsers: nextUsers,
          trades24h: nextTrades,
          lastReset,
        };
      });
    };

    // первый запуск
    tick();
    const id = setInterval(tick, 30_000); // каждые 30 секунд
    return () => clearInterval(id);
  }, []);

  // таймер 15 минут на оплату
  useEffect(() => {
    if (walletModal === "deposit" && depositStep === 3) {
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
// подгружаем реальные цены монет (CoinMarketCap: price + 24h change + volume)
useEffect(() => {
  async function fetchCoinPrices() {
    try {
      // список символов для запроса
      const symbols = coins.map((c) => c.symbol).join(",");

      const res = await fetch(
        `/cmc-api/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": import.meta.env.VITE_CMC_API_KEY,
          },
        }
      );

      if (!res.ok) {
        console.warn("CMC quotes not ok", res.status);
        return;
      }

      const json = await res.json();
      const data = json.data || {};

      setCoins((prev) =>
        prev.map((coin) => {
          const info = data[coin.symbol];
          const usd = info?.quote?.USD;

          if (!usd) return coin;

          const price = usd.price;
          const changeNum = usd.percent_change_24h;
          const volumeNum = usd.volume_24h;

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
      console.error("Failed to load coin prices (CMC)", e);
    }
  }

  fetchCoinPrices(); // первый раз
  const id = setInterval(fetchCoinPrices, 15000); // обновление каждые 15 сек
  return () => clearInterval(id);
}, [coins.length]);

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

// подгружаем историю цены для графика (CoinGecko)
// подгружаем историю цены для графика (CoinMarketCap)
// подгружаем историю цены для графика (CoinMarketCap)
// пока НЕТ активной сделки — график реальный.
// когда сделка идёт (activeTrade != null) — график не трогаем.
useEffect(() => {
  // если есть активная сделка — не перезаписываем график из API
  if (activeTrade) {
    return;
  }

  async function fetchHistoryCMC() {
    const symbol = selectedSymbol; // BTC / ETH / ...

    try {
      const now = Math.floor(Date.now() / 1000);
      const hourAgo = now - 60 * 60;

      const res = await fetch(
        `/cmc-api/v1/cryptocurrency/ohlcv/historical?symbol=${symbol}` +
          `&convert=USD&time_start=${hourAgo}&time_end=${now}&time_period=hourly&interval=5m`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": import.meta.env.VITE_CMC_API_KEY,
          },
        }
      );

      if (!res.ok) {
        console.warn("CMC market_chart not ok:", res.status);
        throw new Error("Bad status " + res.status);
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        console.warn("CMC history: not JSON:", ct);
        throw new Error("Not JSON");
      }

      const json = await res.json();
      const quotes = json.data?.quotes || [];

      let last = quotes.slice(-60).map((q) => ({
        time: Math.floor(new Date(q.time_close).getTime() / 1000),
        value: q.quote?.USD?.close ?? 0,
      }));

      if (!last.length || !last.some((p) => p.value)) {
        console.warn("CMC history: no points, using fallback");
        last = buildFallbackHistory();
      }

      // здесь мы обновляем базовую реальную историю и текущий график
      setBaseChartPoints(last);
      setChartScenario("idle");
      setChartProgress(1);
      setChartPoints(last);
    } catch (e) {
      console.warn("Failed to load history for chart from CMC, fallback:", e);
      const fallback = buildFallbackHistory();
      setBaseChartPoints(fallback);
      setChartScenario("idle");
      setChartProgress(1);
      setChartPoints(fallback);
    }
  }

  fetchHistoryCMC();
}, [selectedSymbol, activeTrade]);

useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000); // <--- 5 секунд
    return () => clearTimeout(id);
  }, [toast]);

// Грузим баланс и историю кошелька из Supabase
// Грузим баланс и историю кошелька из Supabase
const loadWalletDataFromSupabase = useCallback(async () => {
  if (!telegramId) return;

  try {
    const [topupsRes, withdrawsRes] = await Promise.all([
      supabase
        .from("topups")
        .select("id, amount, status, created_at")
        .eq("user_tg_id", telegramId)
        .order("created_at", { ascending: false }),
      supabase
        .from("wallet_withdrawals")
        .select("id, amount, method, status, ts")
        .eq("user_tg_id", telegramId)
        .order("ts", { ascending: false }),
    ]);

    if (topupsRes.error) {
      console.error("loadWalletData topups error:", topupsRes.error);
    }
    if (withdrawsRes.error) {
      console.error(
        "loadWalletData withdrawals error:",
        withdrawsRes.error
      );
    }

    const topups = topupsRes.data || [];
    const withdrawals = withdrawsRes.data || [];

    const normalizeStatus = (s) => (s || "").toLowerCase();

    // учитываем только approved-пополнения
    const approvedDepositSum = topups
      .filter((t) => normalizeStatus(t.status) === "approved")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

const withdrawSum = withdrawals
  .filter((w) => {
    const st = normalizeStatus(w.status);
    // pending и done держат/списывают деньги,
    // rejected — деньги возвращаем
    return st === "pending" || st === "done";
  })
  .reduce((acc, w) => acc + Number(w.amount || 0), 0);

    setBalance(Math.max(0, approvedDepositSum - withdrawSum));

    const history = [];

    // пополнения
    topups.forEach((row) => {
      const status = normalizeStatus(row.status) || "pending";

      history.push({
        id: `topup-${row.id}`,
        topupId: row.id,
        type: "deposit",
        amount: Number(row.amount || 0),
        method: row.method || "card",
        ts: row.created_at
          ? new Date(row.created_at).getTime()
          : Date.now(),
        status, // always "pending" / "approved" / "rejected"
      });
    });

    // выводы
    withdrawals.forEach((row) => {
      history.push({
        id: `wd-${row.id}`,
        type: "withdraw",
        amount: Number(row.amount || 0),
        method: row.method || "card",
        ts: row.ts ? new Date(row.ts).getTime() : Date.now(),
        status: normalizeStatus(row.status),
      });
    });

    history.sort((a, b) => b.ts - a.ts);
    setWalletHistory(history);
  } catch (e) {
    console.error("loadWalletDataFromSupabase exception", e);
  }
}, [telegramId]);

useEffect(() => {
  loadWalletDataFromSupabase();
}, [loadWalletDataFromSupabase]);

// Реaltime: слушаем изменения по topups для этого Telegram ID
// Реaltime: слушаем изменения по topups для этого Telegram ID
// Realtime: слушаем изменения по topups
// Realtime для Topups и Withdrawals
useEffect(() => {
  if (!telegramId) return;

  const channel = supabase
    .channel("wallet-updates")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "topups" },
      async (payload) => {
        const row = payload.new;
        if (!row || row.user_tg_id !== telegramId) return;

        await loadWalletDataFromSupabase();

        const currency = settings.currency === "RUB" ? "RUB" : "USD";
        const amountStr = Number(row.amount).toLocaleString("ru-RU");

        if (row.status === "approved") {
          setToast({
            type: "success",
            text: isEN
              ? `Balance successfully topped up by ${amountStr} ${currency}`
              : `Ваш баланс был успешно пополнен на ${amountStr} ${currency}`,
          });
        } else if (row.status === "rejected") {
          setToast({
            type: "error",
            text: isEN
              ? "Deposit request rejected. Contact support."
              : "Ваша заявка на пополнение отклонена. Свяжитесь с тех.поддержкой.",
          });
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "wallet_withdrawals" },
      async (payload) => {
        const row = payload.new;
        if (!row || row.user_tg_id !== telegramId) return;

        await loadWalletDataFromSupabase();

        if (row.status === "done") {
          setToast({
            type: "success",
            text: isEN
              ? "Funds successfully withdrawn to your details."
              : "Средства были успешно выведены на ваши реквизиты.",
          });
        } else if (row.status === "rejected") {
          setToast({
            type: "error",
            text: isEN
              ? "Withdrawal request was rejected."
              : "Ваша заявка на вывод была отклонена.",
          });
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [telegramId, isEN, settings.currency, loadWalletDataFromSupabase]);

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

    // сохраняем в localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
    } catch (e) {
      console.warn("localStorage settings update error:", e);
    }

    // пишем настройки в Supabase (таблица user_settings)
    if (user && user.id) {
      (async () => {
        try {
          await supabase
            .from("user_settings")
            .upsert({
              user_id: user.id,
              language: next.language,
              currency: next.currency,
            });
        } catch (err) {
          console.error("user_settings upsert error:", err);
        }
      })();
    }

    return next;
  });
};

  const handleAuthInput = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    setAuthError("");
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

// РЕГИСТРАЦИЯ ЧЕРЕЗ SUPABASE
const handleRegister = async () => {
  const { login, email, password, remember } = authForm;

  // базовая валидация как раньше
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

  const trimmedLogin = login.trim();
  const trimmedEmail = email.trim().toLowerCase();

  setAuthError("");
  setOverlayText({
    title: "FORBEX TRADE",
    subtitle: "Создаём аккаунт…",
  });
  setOverlayLoading(true);

  try {
    // 1. Проверяем, есть ли уже такой логин или email
    const { data: existingRows, error: existingError } = await supabase
      .from("app_users") // <<< ЕСЛИ ТАБЛИЦА НАЗЫВАЕТСЯ ИНАЧЕ — ПОМЕНЯЙ ЗДЕСЬ
      .select("id, login, email")
      .or(`login.eq.${trimmedLogin},email.eq.${trimmedEmail}`)
      .limit(1);

    if (existingError) {
      console.error("handleRegister check existing error:", existingError);
      setAuthError("Ошибка при проверке аккаунта. Попробуйте ещё раз.");
      return;
    }

    const existing = existingRows?.[0];

    if (existing) {
      if (existing.login === trimmedLogin) {
        setAuthError("Такой логин уже зарегистрирован.");
      } else {
        setAuthError("Этот email уже используется. Попробуйте войти.");
      }
      return;
    }

    // 2. Хэшируем пароль (SHA-256)
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const hashArray = Array.from(new Uint8Array(buf));
    const passwordHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const createdAtIso = new Date().toISOString();

    // 3. Создаём пользователя в Supabase
    const { data: insertedRows, error: insertError } = await supabase
      .from("app_users") // <<< имя таблицы
      .insert({
        login: trimmedLogin,
        email: trimmedEmail,
        password_hash: passwordHash, // колонка password_hash
        created_at: createdAtIso,    // колонка created_at / CreatedAt
      })
      .select()
      .limit(1);

    if (insertError) {
      console.error("handleRegister insert error:", insertError);
      setAuthError("Не удалось создать аккаунт. Попробуйте ещё раз.");
      return;
    }

    const inserted = insertedRows?.[0];
    const createdAtTs = inserted?.created_at
      ? new Date(inserted.created_at).getTime()
      : Date.now();

    // пользователь, который пойдёт в pendingUser
    const newUser = {
      id: inserted?.id,
      login: inserted?.login ?? trimmedLogin,
      email: inserted?.email ?? trimmedEmail,
      createdAt: createdAtTs,
    };

    // шаг выбора языка/валюты — оставляем твою логику
    setPendingUser(newUser);
    setPostRegisterStep(true);
    setTempSettings({
      language: "ru",
      currency: "RUB",
    });

    // сохраним пароль/remember и timestamp, чтобы completeRegistration мог это доиспользовать
    try {
      localStorage.setItem(STORAGE_KEYS.password, password);
      localStorage.setItem(STORAGE_KEYS.remember, String(remember));
      localStorage.setItem(
        STORAGE_KEYS.registrationTs,
        String(createdAtTs)
      );
    } catch (e) {
      console.warn("localStorage error (register):", e);
    }
  } catch (e) {
    console.error("handleRegister error:", e);
    setAuthError("Неожиданная ошибка. Попробуйте ещё раз.");
  } finally {
    setOverlayLoading(false);
  }
};

const completeRegistration = () => {
  if (!pendingUser) return;

  const { password, remember } = authForm;
  const finalSettings = { ...settings, ...tempSettings };
  const nowIso = new Date().toISOString();
  const nowTs = Date.now();

  showOverlay(
    "FORBEX TRADE",
    "загрузка торгового терминала…",
    () => {
      // применяем настройки локально
      setSettings(finalSettings);
      setUser(pendingUser);

      // localStorage
      try {
        localStorage.setItem(
          STORAGE_KEYS.user,
          JSON.stringify(pendingUser)
        );
        localStorage.setItem(STORAGE_KEYS.password, password);
        localStorage.setItem(STORAGE_KEYS.remember, String(remember));
        localStorage.setItem(
          STORAGE_KEYS.settings,
          JSON.stringify(finalSettings)
        );
        if (!localStorage.getItem(STORAGE_KEYS.registrationTs)) {
          localStorage.setItem(
            STORAGE_KEYS.registrationTs,
            String(pendingUser.createdAt || nowTs)
          );
        }
      } catch (e) {
        console.warn("localStorage error (completeRegistration):", e);
      }

      // пишем в локальную историю входов
      const entry = {
        id: nowTs,
        type: "register",
        login: pendingUser.login,
        email: pendingUser.email,
        ts: nowTs,
        device: navigator.userAgent || "",
      };
      setLoginHistory((prev) => [entry, ...prev]);

      // сохраняем настройки и лог регистрации в Supabase
      (async () => {
        try {
          if (pendingUser.id) {
            // user_settings
            await supabase.from("user_settings").upsert({
              user_id: pendingUser.id,
              language: finalSettings.language,
              currency: finalSettings.currency,
            });

            // login_history (подправь названия колонок, если у тебя другие)
            await supabase.from("login_history").insert({
              user_id: pendingUser.id,
              event_type: "register",   // если колонка называется type – поменяй на type
              login: pendingUser.login,
              email: pendingUser.email,
              ts: nowIso,               // если колонка created_at – поставь created_at: nowIso
              device: navigator.userAgent || "",
            });
          }
        } catch (e) {
          console.error("supabase completeRegistration error:", e);
        }
      })();

      setPendingUser(null);
      setPostRegisterStep(false);
    }
  );
};

// ЛОГИН ЧЕРЕЗ SUPABASE
// ЛОГИН ЧЕРЕЗ SUPABASE
const handleLogin = async () => {
  const { login, email, password, remember } = authForm;
  const loginOrEmail = (login || email || "").trim();

  if (!loginOrEmail || !password.trim()) {
    setAuthError("Введите логин/email и пароль.");
    return;
  }

  setAuthError("");
  setOverlayText({
    title: "FORBEX TRADE",
    subtitle: "Проверяем данные…",
  });
  setOverlayLoading(true);

  try {
    const lowered = loginOrEmail.toLowerCase();

    // ищем по логину ИЛИ email
    const { data: rows, error } = await supabase
      .from("app_users")
      .select("id, login, email, password_hash, created_at")
      .or(`login.eq.${loginOrEmail.trim()},email.eq.${lowered}`)
      .limit(1);

    if (error) {
      console.error("handleLogin select error:", error);
      setAuthError("Ошибка при обращении к серверу. Попробуйте ещё раз.");
      return;
    }

    const row = rows?.[0];
    if (!row) {
      setAuthError("Аккаунт с таким логином или email не найден.");
      return;
    }

    // проверяем пароль (SHA-256)
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const hashArray = Array.from(new Uint8Array(buf));
    const passwordHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (row.password_hash !== passwordHash) {
      setAuthError("Неверный пароль.");
      return;
    }

    const createdAtTs = row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now();

    const userWithCreatedAt = {
      id: row.id,
      login: row.login,
      email: row.email,
      createdAt: createdAtTs,
    };

    // грузим настройки пользователя из user_settings
    let loadedSettings = null;
    try {
      const { data: sRow, error: sErr } = await supabase
        .from("user_settings")
        .select("language, currency")
        .eq("user_id", row.id)
        .maybeSingle(); // если нет строки — вернётся null

      if (!sErr && sRow) {
        loadedSettings = {
          language: sRow.language || "ru",
          currency: sRow.currency || "RUB",
        };
      }
    } catch (e) {
      console.error("load user_settings error:", e);
    }

    const finalSettings = {
      language: loadedSettings?.language || "ru",
      currency: loadedSettings?.currency || "RUB",
    };

    setUser(userWithCreatedAt);
    setSettings((prev) => ({ ...prev, ...finalSettings }));

    // localStorage
    try {
      localStorage.setItem(
        STORAGE_KEYS.user,
        JSON.stringify(userWithCreatedAt)
      );
      localStorage.setItem(STORAGE_KEYS.password, password);
      localStorage.setItem(STORAGE_KEYS.remember, String(remember));
      localStorage.setItem(
        STORAGE_KEYS.registrationTs,
        String(createdAtTs)
      );
      localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(finalSettings)
      );
    } catch (e) {
      console.warn("localStorage error (login):", e);
    }

    // локальная история логинов
    const nowTs = Date.now();
    const entry = {
      id: nowTs,
      type: "login",
      login: row.login,
      email: row.email,
      ts: nowTs,
      device: navigator.userAgent || "",
    };
    setLoginHistory((prev) => [entry, ...prev]);

    // лог в Supabase
    try {
      const nowIso = new Date().toISOString();
      await supabase.from("login_history").insert({
        user_id: row.id,
        event_type: "login",   // если колонка называется type – поменяй
        login: row.login,
        email: row.email,
        ts: nowIso,            // если колонка created_at – поменяй
        device: navigator.userAgent || "",
      });
    } catch (e) {
      console.error("supabase login_history login error:", e);
    }
  } catch (e) {
    console.error("handleLogin error:", e);
    setAuthError("Неожиданная ошибка. Попробуйте ещё раз.");
  } finally {
    setOverlayLoading(false);
  }
};

const handleLogout = async () => {
  if (user) {
    const now = Date.now();

    const entry = {
      id: now,
      type: "logout",
      login: user.login,
      email: user.email,
      ts: now,
      device: navigator.userAgent || "",
    };
    setLoginHistory((prev) => [entry, ...prev]);

    try {
      await supabase.from("login_history").insert({
        user_id: user.id,
        event_type: "logout",
        login: user.login,
        email: user.email,
        ts: new Date(now).toISOString(),
        device: navigator.userAgent || "",
      });
    } catch (e) {
      console.error(e);
    }
  }

  // сбрасываем локальное состояние
  setUser(null);
  setActiveTab(1);
  setWalletHistory([]);
  setLoginHistory([]);
  setTradeHistory([]);
  setBalance(0);
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
        : `Минимальная сумма инвестиций — ${minInvest} ${currencyCode}.`
    );
    return;
  }

  // баланс у нас хранится в базовой валюте (RUB),
  // а сумма ввода — в текущей валюте, надо привести к RUB
  const amountRub =
    settings.currency === "USD" ? amountNum * USD_RATE : amountNum;

  if (amountRub > balance) {
    setTradeError(
      isEN
        ? "Not enough funds on balance."
        : "Недостаточно средств на балансе."
    );
    return;
  }

  if (activeTrade) return; // уже идёт сделка

  // СПИСЫВАЕМ СТАВКУ С БАЛАНСА СРАЗУ
  setBalance((prev) => Math.max(0, prev - amountRub));

  const possibleDirections = ["up", "down", "flat"];
  const resultDirection =
    possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

  const trade = {
    id: Date.now(),
    symbol: selectedSymbol,
    amount: amountRub,          // храним в RUB (базовая)
    direction: tradeForm.direction,
    resultDirection,
    multiplier: tradeForm.multiplier,
    duration: tradeForm.duration,
    startedAt: Date.now(),
  };

  const willWin = resultDirection === tradeForm.direction;

  let scenario = "idle";
  if (tradeForm.direction === "up") {
    scenario = willWin ? "up-win" : "up-lose";
  } else if (tradeForm.direction === "down") {
    scenario = willWin ? "down-win" : "down-lose";
  } else {
    scenario = willWin ? "flat-win" : "flat-lose";
  }

  setChartScenario(scenario);

  const lastBasePoint =
    baseChartPoints.length > 0
      ? baseChartPoints[baseChartPoints.length - 1]
      : null;

  const future = generateScenarioPoints(scenario, lastBasePoint);
  const historyTail = baseChartPoints.slice(-40);

  setChartPoints([...historyTail, ...future]);
  setChartProgress(0);
  setActiveTrade(trade);
};

const handlePasswordChange = async () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm;

  if (!user) {
    setPasswordError("Пользователь не найден.");
    return;
  }

  if (!oldPassword || !newPassword || !confirmPassword) {
    setPasswordError("Заполните все поля.");
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

  try {
    // 1. Берём текущий хэш из Supabase
    const { data, error } = await supabase
      .from("app_users")
      .select("password_hash")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      console.error("password select error:", error);
      setPasswordError("Не удалось проверить текущий пароль.");
      return;
    }

    // 2. Хэшируем oldPassword и сравниваем
    const encOld = new TextEncoder().encode(oldPassword);
    const bufOld = await crypto.subtle.digest("SHA-256", encOld);
    const oldHash = Array.from(new Uint8Array(bufOld))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (oldHash !== data.password_hash) {
      setPasswordError("Старый пароль указан неверно.");
      return;
    }

    // 3. Хэшируем новый пароль
    const encNew = new TextEncoder().encode(newPassword);
    const bufNew = await crypto.subtle.digest("SHA-256", encNew);
    const newHash = Array.from(new Uint8Array(bufNew))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 4. Обновляем Supabase
    const { error: updateError } = await supabase
      .from("app_users")
      .update({ password_hash: newHash })
      .eq("id", user.id);

    if (updateError) {
      console.error("password update error:", updateError);
      setPasswordError("Не удалось изменить пароль.");
      return;
    }

    // 5. Обновляем localStorage (для автологина)
    try {
      localStorage.setItem(STORAGE_KEYS.password, newPassword);
    } catch (e) {
      console.warn("localStorage password update error:", e);
    }

    setPasswordSuccess("Пароль успешно изменён.");
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  } catch (e) {
    console.error("handlePasswordChange error:", e);
    setPasswordError("Не удалось изменить пароль.");
  }
};

  const handleLoginChange = async () => {
    if (!user) return;

    const newLogin = (loginForm.login || "").trim();
    if (newLogin.length < 4) {
      setSettingsMsg(
        isEN
          ? "Login must be at least 4 characters."
          : "Логин должен быть от 4 символов."
      );
      return;
    }

    try {
      // проверяем, занят ли логин
      const { data: rows, error } = await supabase
        .from("app_users")
        .select("id")
        .eq("login", newLogin)
        .limit(1);

      if (error) {
        console.error("handleLoginChange select error:", error);
        setSettingsMsg(
          isEN
            ? "Error while checking login. Try again."
            : "Ошибка при проверке логина. Попробуйте ещё раз."
        );
        return;
      }

      if (rows && rows.length > 0 && rows[0].id !== user.id) {
        setSettingsMsg(
          isEN
            ? "This login is already taken."
            : "Такой логин уже занят."
        );
        return;
      }

      const { error: updErr } = await supabase
        .from("app_users")
        .update({ login: newLogin })
        .eq("id", user.id);

      if (updErr) {
        console.error("handleLoginChange update error:", updErr);
        setSettingsMsg(
          isEN
            ? "Failed to change login."
            : "Не удалось сменить логин."
        );
        return;
      }

      const updatedUser = { ...user, login: newLogin };
      setUser(updatedUser);

      try {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
      } catch (e) {
        console.warn("localStorage update login error:", e);
      }

      setSettingsMsg(
        isEN
          ? "Login successfully changed."
          : "Логин успешно изменён."
      );
    } catch (e) {
      console.error("handleLoginChange error:", e);
      setSettingsMsg(
        isEN
          ? "Failed to change login."
          : "Не удалось сменить логин."
      );
    }
  };

  const handleEmailChange = async () => {
    if (!user) return;

    const newEmail = (emailForm.email || "").trim().toLowerCase();
    if (!validateEmail(newEmail)) {
      setSettingsMsg(
        isEN
          ? "Enter a valid email."
          : "Введите корректный email."
      );
      return;
    }

    try {
      // проверяем, занят ли email
      const { data: rows, error } = await supabase
        .from("app_users")
        .select("id")
        .eq("email", newEmail)
        .limit(1);

      if (error) {
        console.error("handleEmailChange select error:", error);
        setSettingsMsg(
          isEN
            ? "Error while checking email. Try again."
            : "Ошибка при проверке email. Попробуйте ещё раз."
        );
        return;
      }

      if (rows && rows.length > 0 && rows[0].id !== user.id) {
        setSettingsMsg(
          isEN
            ? "This email is already used."
            : "Этот email уже используется."
        );
        return;
      }

      const { error: updErr } = await supabase
        .from("app_users")
        .update({ email: newEmail })
        .eq("id", user.id);

      if (updErr) {
        console.error("handleEmailChange update error:", updErr);
        setSettingsMsg(
          isEN
            ? "Failed to change email."
            : "Не удалось сменить email."
        );
        return;
      }

      const updatedUser = { ...user, email: newEmail };
      setUser(updatedUser);

      try {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
      } catch (e) {
        console.warn("localStorage update email error:", e);
      }

      setSettingsMsg(
        isEN
          ? "Email successfully changed."
          : "Email успешно изменён."
      );
    } catch (e) {
      console.error("handleEmailChange error:", e);
      setSettingsMsg(
        isEN
          ? "Failed to change email."
          : "Не удалось сменить email."
      );
    }
  };

  // кошелёк: депозит / вывод

// кошелёк: депозит / вывод
// кошелёк: депозит / вывод
const handleWalletConfirmWithdraw = async () => {
  const raw = walletForm.amount.toString().replace(",", ".");
  const amountNum = parseFloat(raw);

  if (Number.isNaN(amountNum) || amountNum <= 0) return;

  const now = Date.now();

  // реально выводим не больше, чем есть
  const actualAmount = Math.min(amountNum, balance);
  if (actualAmount <= 0) return;

  // оптимистично обновляем локальный баланс
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

  // сохраняем вывод в Supabase
  if (!telegramId) return;

  try {
    await supabase.from("wallet_withdrawals").insert({
      user_tg_id: telegramId,
      amount: actualAmount,
      method: walletForm.method,
      status: "done",
    });
  } catch (e) {
    console.error("wallet_withdrawals insert error:", e);
  }
};

const handleCancelWithdrawal = async (id, dbId) => {
  // Оптимистично удаляем из списка
  setWalletHistory(prev => prev.filter(item => item.id !== id));
  
  // Возвращаем деньги на баланс (визуально) - найди сумму в истории перед удалением если хочешь, 
  // но лучше просто перезапросить базу. Для простоты пока просто удаляем.
  
  try {
    await supabase.from("wallet_withdrawals").delete().eq("id", dbId);
    // Перезагружаем кошелек, чтобы вернуть баланс
    loadWalletDataFromSupabase();
    setToast({ type: "success", text: isEN ? "Request cancelled" : "Заявка отменена" });
  } catch (e) {
    console.error(e);
  }
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
          ? `Минимальная сумма пополнения — ${minAmount} RUB`
          : `Minimum deposit is ${minAmount} USD`
      );
      return;
    }

    setDepositError("");
    setDepositAmount(amountNum);
    setDepositStep(2);
  };

const handleDepositSendReceipt = async () => {
  const amountNum = Number(depositAmount);

  // если уже отправляем — игнорим повторные клики
  if (isSendingReceipt) return;
  setIsSendingReceipt(true);

  try {
    // 1. Telegram ID обязателен
    if (!telegramId) {
      setDepositError(
        isEN
          ? "Telegram ID not found. Open this page from the bot button."
          : "Не найден Telegram ID. Откройте страницу через кнопку в боте."
      );
      return;
    }

    // 2. Проверяем сумму
    if (!amountNum || Number.isNaN(amountNum)) {
      setDepositError(
        isEN
          ? "Deposit amount is not set. Go back and enter the amount."
          : "Сумма пополнения не указана. Вернитесь назад и введите сумму."
      );
      return;
    }

    // 3. Обязателен чек / файл
    if (!receiptFile) {
      setDepositError(
        isEN
          ? "You did not attach a receipt or screenshot."
          : "Вы не прикрепили чек или скриншот оплаты."
      );
      return;          // <--- ВАЖНО: дальше не идём, topups НЕ создаём
    }

    // 4. Проверяем, нет ли уже pending-заявки
    const { data: existingPending, error: pendingErr } = await supabase
      .from("topups")
      .select("id,status")
      .eq("user_tg_id", telegramId)
      .eq("status", "pending")
      .limit(1);

    if (!pendingErr && existingPending && existingPending.length > 0) {
      setDepositError(
        isEN
          ? "You already have a deposit on review. Wait for a decision."
          : "У вас уже есть пополнение на проверке. Дождитесь решения."
      );
      return;
    }
    // 4. Выбираем approver_tg_id
    let approverTgId = MAIN_ADMIN_TG_ID;

    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("referred_by")
      .eq("tg_id", telegramId)
      .single();

    if (!userErr && userRow?.referred_by) {
      approverTgId = userRow.referred_by;
    }

    // 5. Загрузка файла в storage
    const filePath = `${telegramId}/${Date.now()}_${receiptFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, receiptFile);

    if (uploadError) {
      console.error("uploadError:", uploadError);
      setDepositError(
        isEN
          ? "Failed to upload receipt. Try again."
          : "Не удалось загрузить чек. Попробуйте ещё раз."
      );
      return;
    }

    // 6. Публичный URL
    const { data: publicData } = supabase.storage
      .from("receipts")
      .getPublicUrl(filePath);

    const receiptUrl = publicData?.publicUrl;
    if (!receiptUrl) {
      setDepositError(
        isEN
          ? "Failed to get public URL of receipt."
          : "Не удалось получить публичную ссылку на чек."
      );
      return;
    }

    const now = Date.now();

    // 7. Создаём запись в topups
    const { data: inserted, error: insertError } = await supabase
      .from("topups")
      .insert({
        user_tg_id: telegramId,
        approver_tg_id: approverTgId,
        amount: amountNum,
        receipt_url: receiptUrl,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("insertError:", insertError);
      setDepositError(
        isEN
          ? "Failed to create topup request."
          : "Не удалось создать заявку на пополнение."
      );
      return;
    }

    const topupId = inserted?.id;

    // 8. Локальная история
    const entry = {
      id: now,
      topupId,
      type: "deposit",
      amount: amountNum,
      method: walletForm.method || "card",
      ts: now,
      status: "pending",
    };
    setWalletHistory((prev) => [entry, ...prev]);

    // 9. Оверлей
    showOverlay(
      "FORBEX TRADE",
      isEN ? "Payment sent for review…" : "Платёж отправлен на проверку…",
      () => {
        setWalletModal(null);
        resetDepositFlow();
      }
    );
  } catch (e) {
    console.error("handleDepositSendReceipt error:", e);
    setDepositError(
      isEN
        ? "Unexpected error. Try again."
        : "Неожиданная ошибка. Попробуйте ещё раз."
    );
  } finally {
    setIsSendingReceipt(false);
  }
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
            <div className="home-stat-value">
              {stats.activeUsers.toLocaleString("ru-RU")}+
            </div>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-label">
              {isEN ? "Trades / 24h" : "Сделок за 24ч"}
            </div>
            <div className="home-stat-value">
              {stats.trades24h.toLocaleString("ru-RU")}+
            </div>
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
              <div className="coin-logo">
                {COIN_ICONS[c.symbol] || c.symbol[0]}
              </div>
              <div className="coin-text">
                <div className="coin-symbol">{c.symbol}</div>
                <div className="coin-name">{c.name}</div>
              </div>
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
  {currencyCode}
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
  const displayBalance = toDisplayCurrency(balance, settings.currency);
  const formatBalance = displayBalance.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const currentMethod = walletForm.method || null;
  const isCard = currentMethod === "card";
  const isUSDT = currentMethod === "usdt";
  const isPaypal = currentMethod === "paypal";
  const isSupport = currentMethod === "support";

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({
        type: "success",
        text: isEN ? "Copied to clipboard" : "Скопировано в буфер",
      });
    } catch {
      setToast({
        type: "error",
        text: isEN ? "Copy failed" : "Не удалось скопировать",
      });
    }
  };

  // локальный helper, чтобы не было "methodLabel is not defined"
  const methodLabel = (m) => {
    if (m === "card") return isEN ? "Bank card" : "Банковская карта";
    if (m === "usdt") return "USDT TRC-20";
    if (m === "paypal") return "PayPal";
    if (m === "support") return isEN ? "Via support" : "Через поддержку";
    return m;
  };

  // шаги пополнения
  const handleDepositStep = () => {
    if (depositStep === 1) {
      if (!walletForm.method) return;
      setDepositStep(2);
      return;
    }
    if (depositStep === 2) {
      const minAmount = settings.currency === "RUB" ? 1000 : 10;
      const raw = depositAmount?.toString().replace(",", ".") ?? "";
      const amountNum = parseFloat(raw);
      if (!amountNum || amountNum < minAmount) {
        setDepositError(
          isEN ? `Min amount ${minAmount}` : `Минимум ${minAmount}`
        );
        return;
      }
      setDepositError("");
      setDepositStep(3);
      return;
    }
  };

  // вывод
const handleWithdrawSubmit = async () => {
    if (!telegramId) return;
    const raw = walletForm.amount?.toString().replace(",", ".") || "";
    const amountNum = parseFloat(raw);

    if (!amountNum || amountNum <= 0) {
      setDepositError(
        isEN ? "Enter withdrawal amount." : "Введите сумму вывода."
      );
      return;
    }

    // баланс в RUB, сумма ввода в текущей валюте
    const maxDisplay = toDisplayCurrency(balance, settings.currency);
    if (amountNum > maxDisplay) {
      setDepositError(
        isEN
          ? "Not enough funds on balance."
          : "Недостаточно средств на балансе."
      );
      return;
    }

    if (!walletForm.method) {
      setDepositError(
        isEN ? "Choose withdrawal method." : "Выберите способ вывода."
      );
      return;
    }

    if (!withdrawDetails.trim()) {
      setDepositError(
        isEN
          ? "Enter payout details (card / wallet / email)."
          : "Введите реквизиты для вывода (карта / кошелёк / email)."
      );
      return;
    }

    // приводим к базовой валюте RUB
    const amountRub =
      settings.currency === "USD" ? amountNum * USD_RATE : amountNum;

    try {
      // определяем, кто будет одобрять заявку
      let approverTgId = MAIN_ADMIN_TG_ID;

      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("referred_by")
        .eq("tg_id", telegramId)
        .maybeSingle();

      if (!userErr && userRow?.referred_by) {
        approverTgId = userRow.referred_by;
      }

      const { error } = await supabase.from("wallet_withdrawals").insert({
        user_tg_id: telegramId,
        approver_tg_id: approverTgId,
        amount: amountRub,
        method: walletForm.method || "card",
        details: withdrawDetails.trim(),
        status: "pending", // ждём подтверждения
        ts: new Date().toISOString(),
      });

      if (error) {
        console.error("wallet_withdrawals insert error:", error);
        setDepositError(
          isEN
            ? "Failed to create withdrawal request."
            : "Не удалось создать заявку на вывод."
        );
        return;
      }

      // перезагружаем кошелёк (баланс уменьшится за счёт pending-заявки)
      await loadWalletDataFromSupabase();

      setWalletModal(null);
      setWithdrawStep(1);
      setWithdrawDetails("");
      setWalletForm({ amount: "", method: "card" });
      setDepositError("");

      setToast({
        type: "success",
        text: isEN
          ? "Withdrawal request successfully created."
          : "Заявка на вывод средств успешно создана.",
      });
    } catch (e) {
      console.error("handleWithdrawSubmit error:", e);
      setDepositError(
        isEN
          ? "Unexpected error. Try again."
          : "Неожиданная ошибка. Попробуйте ещё раз."
      );
    }
  };

  return (
    <>
      {/* Баланс */}
      <section className="section-block fade-in delay-1">
        <div className="section-title">
          <h2>{isEN ? "Wallet" : "Кошелёк"}</h2>
        </div>
        <div className="wallet-balance-card">
          <div className="wallet-badge">
            {isEN ? "Main balance" : "Основной баланс"}
          </div>
          <div className="wallet-amount">
            {formatBalance} {currencyCode}
          </div>
          <div className="wallet-actions-row">
            <button
              className="wallet-action-btn primary"
              onClick={() => {
                setWalletModal("deposit");
                setDepositStep(1);
                setDepositAmount("");
                setDepositError("");
                setReceiptFile(null);
                setReceiptFileName("");
                setWalletForm((p) => ({ ...p, method: null }));
              }}
            >
              {isEN ? "Deposit" : "Пополнить"}
            </button>
            <button
              className="wallet-action-btn secondary"
              onClick={() => {
                setWalletModal("withdraw");
                setWithdrawStep(1);
                setWalletForm({ ...walletForm, amount: "" });
              }}
            >
              {isEN ? "Withdraw" : "Вывести"}
            </button>
          </div>
        </div>
      </section>

      {/* История (короткий список) */}
      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>{isEN ? "Recent operations" : "Последние операции кошелька"}</h2>
        </div>

        {/* ВАЖНО: обёртка history-block */}
        <div className="history-block">
          {walletHistory.map((e) => {
            const displayAmount = toDisplayCurrency(
              e.amount,
              settings.currency
            );

            const isWithdraw = e.type === "withdraw";
            const isDeposit = e.type === "deposit";

            const isPending = e.status === "pending";
            const isRejected = e.status === "rejected";
            const isApproved = e.status === "approved";
            const isDone = e.status === "done";

            const pendingWithdraw =
              isWithdraw && (!e.status || e.status === "pending");

            const rowClass =
              "history-row " +
              (isPending ? "is-pending " : "") +
              (isRejected ? "is-rejected " : "");

            let sign = isWithdraw ? "-" : "+";
            let amountClass = "history-amount ";

            if (pendingWithdraw) {
              // вывод в обработке — оранжевая сумма без знака
              sign = "";
              amountClass += "pending";
            } else if (isWithdraw) {
              amountClass += "negative";
            } else {
              if (isRejected) {
                sign = "×";
                amountClass += "rejected";
              } else if (isPending) {
                amountClass += "pending";
              } else {
                amountClass += "positive";
              }
            }

            return (
              <div key={e.id} className={rowClass}>
                <div className="history-main">
                  <div className="history-type">
                    {isWithdraw
                      ? isEN
                        ? "Withdrawal"
                        : "Вывод средств"
                      : isEN
                      ? "Deposit"
                      : "Пополнение"}
                    {" · "}
                    {methodLabel(e.method)}
                    {/* статусы только для вывода, для пополнений убраны */}
                    {isWithdraw && isDone && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        {isEN ? "(completed)" : "(исполнен)"}
                      </span>
                    )}
                    {isWithdraw && pendingWithdraw && (
                      <span
                        style={{
                          color: "#fbbf24",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        {isEN ? "(processing)" : "(обработка)"}
                      </span>
                    )}
                  </div>
                  <div className="history-sub">{methodLabel(e.method)}</div>
                </div>

                <div className="history-right">
                  <div className={amountClass}>
                    {sign}
                    {displayAmount.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencyCode}
                  </div>

                  {pendingWithdraw && (
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        const idStr = String(e.id);
                        const dbId = idStr.startsWith("wd-")
                          ? idStr.replace("wd-", "")
                          : idStr;
                        handleCancelWithdrawal(e.id, dbId);
                      }}
                    >
                      {isEN ? "Cancel" : "Отменить"}
                    </button>
                  )}

                  <div className="history-time">{formatDateTime(e.ts)}</div>
                </div>
              </div>
            );
          })}

          {walletHistory.length === 0 && (
            <div className="wallet-empty" style={{ padding: 8 }}>
              {isEN ? "No operations" : "Нет операций"}
            </div>
          )}
        </div>
      </section>

      {/* Модалки */}
      {walletModal && (
        <div
          className="wallet-modal-backdrop"
          onClick={() => setWalletModal(null)}
        >
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="wallet-modal-close"
              onClick={() => setWalletModal(null)}
              aria-label={isEN ? "Close" : "Закрыть"}
            >
              ✕
            </button>

            {/* === ПОПОЛНЕНИЕ === */}
            {walletModal === "deposit" && (
              <>
                <div className="wallet-modal-title">
                  {isEN
                    ? "Top up personal account balance"
                    : "Пополнение баланса личного кабинета"}
                </div>

                {depositStep !== 1 && (
                  <div className="wallet-modal-sub">
                    {walletForm.method === "card" &&
                      (isEN
                        ? "Top up via bank card"
                        : "Пополнение через банковскую карту")}
                    {walletForm.method === "usdt" &&
                      (isEN
                        ? "Top up via USDT TRC-20"
                        : "Пополнение через USDT и TRC-20")}
                    {walletForm.method === "paypal" &&
                      (isEN
                        ? "Top up via PayPal"
                        : "Пополнение через PayPal")}
                    {walletForm.method === "support" &&
                      (isEN
                        ? "Top up via support"
                        : "Пополнение через техническую поддержку")}
                  </div>
                )}

                {/* Шаг 1: выбор способа */}
                {depositStep === 1 && (
                  <div className="wallet-methods">
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        marginBottom: 4,
                      }}
                    >
                      {isEN ? "Priority method" : "Приоритетный способ"}
                    </div>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "card" ? "active" : "") +
                        (!walletForm.method ? " pulse-white" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({ ...p, method: "card" }))
                      }
                    >
                      <div className="wallet-method-title">
                        {isEN
                          ? "Top up via bank card"
                          : "Пополнение через банковскую карту"}
                      </div>
                      <div className="wallet-method-sub">
                        VISA / MasterCard / МИР
                      </div>
                      <div className="wallet-method-extra">
                        {isEN
                          ? "Fastest crediting"
                          : "Самое быстрое зачисление"}
                      </div>
                    </button>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        margin: "8px 0 4px",
                      }}
                    >
                      {isEN ? "Crypto & other" : "Криптовалюта и другое"}
                    </div>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "usdt" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({ ...p, method: "usdt" }))
                      }
                    >
                      <div className="wallet-method-title">
                        {isEN
                          ? "Top up via USDT TRC-20"
                          : "Пополнение через USDT и TRC-20"}
                      </div>
                      <div className="wallet-method-sub">TRON Network</div>
                    </button>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "paypal" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({ ...p, method: "paypal" }))
                      }
                    >
                      <div className="wallet-method-title">
                        {isEN
                          ? "Top up via PayPal"
                          : "Пополнение через PayPal"}
                      </div>
                      <div className="wallet-method-sub">Global payments</div>
                    </button>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "support" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({
                          ...p,
                          method: "support",
                        }))
                      }
                    >
                      <div className="wallet-method-title">
                        {isEN
                          ? "Top up via support"
                          : "Пополнение через техподдержку"}
                      </div>
                      <div className="wallet-method-sub">
                        {isEN ? "Manager help" : "Менеджер поможет"}
                      </div>
                    </button>

                    <div className="wallet-modal-actions">
                      <button
                        className="wallet-modal-btn primary"
                        onClick={handleDepositStep}
                        disabled={!walletForm.method}
                        title={
                          walletForm.method
                            ? ""
                            : isEN
                            ? "Choose a method first"
                            : "Сначала выберите способ"
                        }
                      >
                        {isEN ? "Next" : "Далее"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Шаг 2: сумма */}
                {depositStep === 2 && (
                  <div className="wallet-modal-input-group">
                    <label>
                      {isEN ? "Enter amount" : "Введите сумму"} ({currencyCode})
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={
                        settings.currency === "RUB" ? "1000" : "10"
                      }
                    />
                    {!!depositError && (
                      <div className="wallet-modal-note error">
                        {depositError}
                      </div>
                    )}
                    <div className="wallet-modal-actions">
                      <button
                        className="wallet-modal-btn secondary"
                        onClick={() => setDepositStep(1)}
                      >
                        {isEN ? "Back" : "Назад"}
                      </button>
                      <button
                        className="wallet-modal-btn primary"
                        onClick={handleDepositStep}
                      >
                        {isEN ? "Next" : "Далее"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Шаг 3: реквизиты + чек */}
                {depositStep === 3 && (
                  <>
                    <div className="payment-details">
                      {isCard && (
                        <>
                          <div className="payment-row">
                            <div className="payment-label">
                              {isEN ? "Card" : "Номер карты"}
                            </div>
                            <div className="payment-value payment-value-wide">
                              5555 0000 0000 0000
                            </div>
                            <button
                              className="copy-btn"
                              onClick={() =>
                                copyToClipboard("5555 0000 0000 0000")
                              }
                            >
                              {isEN ? "Copy" : "Копировать"}
                            </button>
                          </div>
                          <div className="payment-row">
                            <div className="payment-label">
                              {isEN ? "Bank" : "Банк"}
                            </div>
                            <div className="payment-value">Tinkoff</div>
                          </div>
                        </>
                      )}

                      {isUSDT && (
                        <>
                          <div className="payment-row">
                            <div className="payment-label">Network</div>
                            <div className="payment-value">TRON (TRC-20)</div>
                            <button
                              className="copy-btn"
                              onClick={() => copyToClipboard("TRON (TRC-20)")}
                            >
                              {isEN ? "Copy" : "Копировать"}
                            </button>
                          </div>
                          <div className="payment-row">
                            <div className="payment-label">Wallet</div>
                            <div
                              className="payment-value"
                              style={{ wordBreak: "break-all" }}
                            >
                              TRxA1bCDeFGhijkLmNoPqRS2tuvWXyZ123
                            </div>
                            <button
                              className="copy-btn"
                              onClick={() =>
                                copyToClipboard(
                                  "TRxA1bCDeFGhijkLmNoPqRS2tuvWXyZ123"
                                )
                              }
                            >
                              {isEN ? "Copy" : "Копировать"}
                            </button>
                          </div>
                        </>
                      )}

                      {isPaypal && (
                        <>
                          <div className="payment-row">
                            <div className="payment-label">PayPal</div>
                            <div className="payment-value">
                              pay@forbex.example
                            </div>
                            <button
                              className="copy-btn"
                              onClick={() =>
                                copyToClipboard("pay@forbex.example")
                              }
                            >
                              {isEN ? "Copy" : "Копировать"}
                            </button>
                          </div>
                          <div className="payment-row">
                            <div className="payment-label">
                              {isEN ? "Note" : "Примечание"}
                            </div>
                            <div className="payment-value">
                              {isEN
                                ? "Use Friends & Family if available"
                                : "Если доступно, используйте Friends & Family"}
                            </div>
                          </div>
                        </>
                      )}

                      {isSupport && (
                        <>
                          <div className="warning-text">
                            <span>💬</span>
                            <div>
                              {isEN
                                ? "Top up via technical support. Press the button below to contact support."
                                : "Пополнение через техническую поддержку. Нажмите кнопку ниже, чтобы связаться с поддержкой."}
                            </div>
                          </div>
                          <a
                            href="https://t.me/ForbexSupport"
                            target="_blank"
                            className="telegram-support-btn"
                            rel="noreferrer"
                          >
                            👨‍💻 {isEN ? "Support" : "Техподдержка"}
                          </a>
                        </>
                      )}

                      {!isSupport && (
                        <>
                          <div className="payment-row">
                            <div className="payment-label">
                              {isEN ? "Time to pay" : "Время на оплату"}
                            </div>
                            <div className="payment-value payment-timer">
                              {formatTimer(paymentTimer)}
                            </div>
                          </div>
                          <div className="warning-text">
                            <span>⚠️</span>
                            <div>
                              {isEN
                                ? "Balance is credited automatically within 5 minutes after sending the receipt. If funds don’t arrive — contact support."
                                : "Баланс зачисляется автоматически в течение 5 минут после отправки квитанции. Если средства не пришли — напишите в поддержку."}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {!isSupport && (
                      <div className="payment-upload">
                        <label className="upload-btn">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setReceiptFile(f);
                              setReceiptFileName(f ? f.name : "");
                            }}
                          />
                          <span>
                            {isEN
                              ? "Attach receipt (photo or PDF)"
                              : "Прикрепить квитанцию (фото или PDF)"}
                          </span>
                        </label>
                        {receiptFileName && (
                          <div className="upload-filename">
                            {receiptFileName}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="wallet-modal-actions">
                      <button
                        className="wallet-modal-btn secondary"
                        onClick={() => setDepositStep(2)}
                      >
                        {isEN ? "Back" : "Назад"}
                      </button>

                      {!isSupport && (
                        <button
                          className="wallet-modal-btn primary"
                          onClick={handleDepositSendReceipt}
                          disabled={!receiptFile || isSendingReceipt}
                        >
                          {isSendingReceipt
                            ? isEN
                              ? "Sending..."
                              : "Отправка..."
                            : isEN
                            ? "I paid"
                            : "Я оплатил"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* === ВЫВОД СРЕДСТВ === */}
            {walletModal === "withdraw" && (
              <>
                <div className="wallet-modal-title">
                  {isEN ? "Withdraw" : "Вывод средств"}
                </div>

                {/* ШАГ 1: выбор метода вывода */}
                {withdrawStep === 1 && (
                  <div className="wallet-methods">
                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "card" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({ ...p, method: "card" }))
                      }
                    >
                      <div className="wallet-method-title">
                        {isEN ? "Bank card" : "Банковская карта"}
                      </div>
                    </button>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "usdt" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({ ...p, method: "usdt" }))
                      }
                    >
                      <div className="wallet-method-title">USDT TRC-20</div>
                    </button>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "paypal" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({ ...p, method: "paypal" }))
                      }
                    >
                      <div className="wallet-method-title">PayPal</div>
                    </button>

                    <button
                      className={
                        "wallet-method-card " +
                        (walletForm.method === "support" ? "active" : "")
                      }
                      onClick={() =>
                        setWalletForm((p) => ({ ...p, method: "support" }))
                      }
                    >
                      <div className="wallet-method-title">
                        {isEN ? "Via support" : "Через техподдержку"}
                      </div>
                    </button>

                    {/* если выбран support — показываем только кнопку в ТП */}
                    {walletForm.method === "support" ? (
                      <div style={{ marginTop: 12 }}>
                        <div className="warning-text">
                          <span>💬</span>
                          <div>
                            {isEN
                              ? "Withdrawal via technical support. Write to manager and he will help with details."
                              : "Вывод через техническую поддержку. Напишите менеджеру, он поможет с реквизитами."}
                          </div>
                        </div>
                        <a
                          href="https://t.me/ForbexSupport"
                          target="_blank"
                          className="telegram-support-btn"
                          rel="noreferrer"
                        >
                          👨‍💻 {isEN ? "Support" : "Техподдержка"}
                        </a>
                      </div>
                    ) : (
                      <div className="wallet-modal-actions">
                        <button
                          className="wallet-modal-btn primary"
                          onClick={() => {
                            setDepositError("");
                            setWithdrawStep(2);
                          }}
                          disabled={!walletForm.method}
                        >
                          {isEN ? "Next" : "Далее"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ШАГ 2: сумма вывода */}
                {withdrawStep === 2 && (
                  <div className="wallet-modal-input-group">
                    <label>
                      {isEN ? "Amount" : "Сумма вывода"} ({currencyCode})
                    </label>
                    <input
                      type="number"
                      value={walletForm.amount}
                      onChange={(e) =>
                        setWalletForm({
                          ...walletForm,
                          amount: e.target.value,
                        })
                      }
                      placeholder={
                        settings.currency === "RUB" ? "Min 1000" : "Min 10"
                      }
                    />
                    {depositError && (
                      <div className="wallet-modal-note error">
                        {depositError}
                      </div>
                    )}
                    <div className="wallet-modal-actions">
                      <button
                        className="wallet-modal-btn secondary"
                        onClick={() => {
                          setDepositError("");
                          setWithdrawStep(1);
                        }}
                      >
                        {isEN ? "Back" : "Назад"}
                      </button>
                      <button
                        className="wallet-modal-btn primary"
                        onClick={() => {
                          setDepositError("");
                          setWithdrawStep(3);
                        }}
                      >
                        {isEN ? "Next" : "Далее"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ШАГ 3: реквизиты */}
                {withdrawStep === 3 && (
                  <div className="wallet-modal-input-group">
                    <label>
                      {walletForm.method === "card"
                        ? isEN
                          ? "Card number"
                          : "Номер карты"
                        : walletForm.method === "usdt"
                        ? isEN
                          ? "USDT wallet (TRC-20)"
                          : "Кошелёк USDT (TRC-20)"
                        : walletForm.method === "paypal"
                        ? isEN
                          ? "PayPal email"
                          : "Email PayPal"
                        : isEN
                        ? "Payout details"
                        : "Реквизиты для вывода"}
                    </label>
                    <input
                      type="text"
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      placeholder={
                        walletForm.method === "card"
                          ? "5555 0000 0000 0000"
                          : walletForm.method === "usdt"
                          ? "TRxA1bCDeFGhijkLmNoPqRS2tuvWXyZ123"
                          : walletForm.method === "paypal"
                          ? "name@example.com"
                          : ""
                      }
                    />
                    {depositError && (
                      <div className="wallet-modal-note error">
                        {depositError}
                      </div>
                    )}
                    <div className="wallet-modal-actions">
                      <button
                        className="wallet-modal-btn secondary"
                        onClick={() => {
                          setDepositError("");
                          setWithdrawStep(2);
                        }}
                      >
                        {isEN ? "Back" : "Назад"}
                      </button>
                      <button
                        className="wallet-modal-btn primary"
                        onClick={handleWithdrawSubmit}
                      >
                        {isEN ? "Create request" : "Создать заявку"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

{walletModal === "withdraw" && (
  <>
    <div className="wallet-modal-title">
      {isEN ? "Withdraw" : "Вывод средств"}
    </div>

    {/* ШАГ 1: выбор метода вывода */}
    {withdrawStep === 1 && (
      <div className="wallet-methods">
        <button
          className={
            "wallet-method-card " +
            (walletForm.method === "card" ? "active" : "")
          }
          onClick={() =>
            setWalletForm((p) => ({ ...p, method: "card" }))
          }
        >
          <div className="wallet-method-title">
            {isEN ? "Bank card" : "Банковская карта"}
          </div>
        </button>

        <button
          className={
            "wallet-method-card " +
            (walletForm.method === "usdt" ? "active" : "")
          }
          onClick={() =>
            setWalletForm((p) => ({ ...p, method: "usdt" }))
          }
        >
          <div className="wallet-method-title">USDT TRC-20</div>
        </button>

        <button
          className={
            "wallet-method-card " +
            (walletForm.method === "paypal" ? "active" : "")
          }
          onClick={() =>
            setWalletForm((p) => ({ ...p, method: "paypal" }))
          }
        >
          <div className="wallet-method-title">PayPal</div>
        </button>

        <button
          className={
            "wallet-method-card " +
            (walletForm.method === "support" ? "active" : "")
          }
          onClick={() =>
            setWalletForm((p) => ({ ...p, method: "support" }))
          }
        >
          <div className="wallet-method-title">
            {isEN ? "Via support" : "Через техподдержку"}
          </div>
        </button>

        {/* если выбран support — показываем только кнопку в ТП */}
        {walletForm.method === "support" ? (
          <div style={{ marginTop: 12 }}>
            <div className="warning-text">
              <span>💬</span>
              <div>
                {isEN
                  ? "Withdrawal via technical support. Write to manager and he will help with details."
                  : "Вывод через техническую поддержку. Напишите менеджеру, он поможет с реквизитами."}
              </div>
            </div>
            <a
              href="https://t.me/ForbexSupport"
              target="_blank"
              className="telegram-support-btn"
              rel="noreferrer"
            >
              👨‍💻{" "}
              {isEN ? "Support" : "Техподдержка"}
            </a>
          </div>
        ) : (
          <div className="wallet-modal-actions">
            <button
              className="wallet-modal-btn primary"
              onClick={() => {
                setDepositError("");
                setWithdrawStep(2);
              }}
              disabled={!walletForm.method}
            >
              {isEN ? "Next" : "Далее"}
            </button>
          </div>
        )}
      </div>
    )}

    {/* ШАГ 2: сумма вывода */}
    {withdrawStep === 2 && (
      <div className="wallet-modal-input-group">
        <label>
          {isEN ? "Amount" : "Сумма вывода"} ({currencyCode})
        </label>
        <input
          type="number"
          value={walletForm.amount}
          onChange={(e) =>
            setWalletForm({
              ...walletForm,
              amount: e.target.value,
            })
          }
          placeholder={
            settings.currency === "RUB" ? "Min 1000" : "Min 10"
          }
        />
        {depositError && (
          <div className="wallet-modal-note error">
            {depositError}
          </div>
        )}
        <div className="wallet-modal-actions">
          <button
            className="wallet-modal-btn secondary"
            onClick={() => {
              setDepositError("");
              setWithdrawStep(1);
            }}
          >
            {isEN ? "Back" : "Назад"}
          </button>
          <button
            className="wallet-modal-btn primary"
            onClick={() => {
              setDepositError("");
              setWithdrawStep(3);
            }}
          >
            {isEN ? "Next" : "Далее"}
          </button>
        </div>
      </div>
    )}

    {/* ШАГ 3: реквизиты */}
    {withdrawStep === 3 && (
      <div className="wallet-modal-input-group">
        <label>
          {walletForm.method === "card"
            ? isEN
              ? "Card number"
              : "Номер карты"
            : walletForm.method === "usdt"
            ? isEN
              ? "USDT wallet (TRC-20)"
              : "Кошелёк USDT (TRC-20)"
            : walletForm.method === "paypal"
            ? isEN
              ? "PayPal email"
              : "Email PayPal"
            : isEN
            ? "Payout details"
            : "Реквизиты для вывода"}
        </label>
        <input
          type="text"
          value={withdrawDetails}
          onChange={(e) => setWithdrawDetails(e.target.value)}
          placeholder={
            walletForm.method === "card"
              ? "5555 0000 0000 0000"
              : walletForm.method === "usdt"
              ? "TRxA1bCDeFGhijkLmNoPqRS2tuvWXyZ123"
              : walletForm.method === "paypal"
              ? "name@example.com"
              : ""
          }
        />
        {depositError && (
          <div className="wallet-modal-note error">
            {depositError}
          </div>
        )}
        <div className="wallet-modal-actions">
          <button
            className="wallet-modal-btn secondary"
            onClick={() => {
              setDepositError("");
              setWithdrawStep(2);
            }}
          >
            {isEN ? "Back" : "Назад"}
          </button>
          <button
            className="wallet-modal-btn primary"
            onClick={handleWithdrawSubmit}
          >
            {isEN ? "Create request" : "Создать заявку"}
          </button>
        </div>
      </div>
    )}
  </>
)}

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
      {/* История входов */}
      <section className="section-block fade-in delay-1">
        <div className="section-title">
          <h2>{isEN ? "Login history" : "История входов"}</h2>
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
          {loginHistory.map((e) => {
            const typeLabel =
              e.type === "register"
                ? isEN
                  ? "Registration"
                  : "Регистрация"
                : e.type === "logout"
                ? isEN
                  ? "Logout"
                  : "Выход"
                : isEN
                ? "Login"
                : "Вход";

            return (
              <div key={e.id} className="history-row">
                <div className="history-main">
                  <div className="history-type">{typeLabel}</div>
                  <div className="history-sub">
                    {e.login} · {e.email}
                  </div>
                </div>
                <div className="history-time">
                  {formatDateTime(e.ts)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* История кошелька */}
      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>{isEN ? "Wallet history" : "История кошелька"}</h2>
          <p>
            {isEN
              ? "Deposits and withdrawals on your Forbex wallet."
              : "Пополнения и выводы в вашем кошельке Forbex."}
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
          {walletHistory.map((e) => {
            const displayAmount = toDisplayCurrency(
              e.amount,
              settings.currency
            );

            const isWithdraw = e.type === "withdraw";
            const isDeposit = e.type === "deposit";

            const isPending = e.status === "pending";
            const isRejected = e.status === "rejected";
            const isApproved = e.status === "approved";
            const isDone = e.status === "done";

            const pendingWithdraw =
              isWithdraw && (!e.status || e.status === "pending");

            const rowClass =
              "history-row " +
              (isPending ? "is-pending " : "") +
              (isRejected ? "is-rejected " : "");

            let sign = isWithdraw ? "-" : "+";
            let amountClass = "history-amount ";

            if (isWithdraw) {
              amountClass += "negative";
            } else {
              if (isRejected) {
                sign = "×";
                amountClass += "rejected";
              } else if (isPending) {
                amountClass += "pending";
              } else {
                amountClass += "positive";
              }
            }

            return (
              <div key={e.id} className={rowClass}>
                <div className="history-main">
                  <div className="history-type">
                    {isWithdraw
                      ? isEN
                        ? "Withdrawal"
                        : "Вывод средств"
                      : isEN
                      ? "Deposit"
                      : "Пополнение"}
                    {" · "}
                    {methodLabel(e.method)}
                    {isWithdraw && isDone && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        {isEN ? "(completed)" : "(исполнен)"}
                      </span>
                    )}
                    {isWithdraw && pendingWithdraw && (
                      <span
                        style={{
                          color: "#fbbf24",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        {isEN ? "(processing)" : "(обработка)"}
                      </span>
                    )}
                  </div>
                  <div className="history-sub">
                    {methodLabel(e.method)}
                  </div>
                </div>
                <div className="history-right">
<div className={amountClass}>
  {sign}
  {displayAmount.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}{" "}
  {currencyCode}
</div>
                  {pendingWithdraw && (
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        const idStr = String(e.id);
                        const dbId = idStr.startsWith("wd-")
                          ? idStr.replace("wd-", "")
                          : idStr;
                        handleCancelWithdrawal(e.id, dbId);
                      }}
                    >
                      {isEN ? "Cancel" : "Отменить"}
                    </button>
                  )}

                  <div className="history-time">
                    {formatDateTime(e.ts)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* История сделок */}
      <section className="section-block fade-in delay-3">
        <div className="section-title">
          <h2>{isEN ? "Trade history" : "История сделок"}</h2>
          <p>
            {isEN
              ? "All your opened trades: direction, amount, multiplier and result."
              : "Все ваши открытые сделки: направление, сумма, коэффициент и результат."}
          </p>
        </div>
        <div className="history-block">
          {tradeHistory.length === 0 && (
            <div className="history-empty">
              {isEN ? "No trades yet." : "Сделок ещё не было."}
            </div>
          )}
          {tradeHistory.map((t) => {
            const amountDisplay = toDisplayCurrency(
              t.amount,
              settings.currency
            );
            const profitDisplay = toDisplayCurrency(
              t.profit,
              settings.currency
            );

             return (
              <div key={t.id} className="history-row">
                <div className="history-main">
                  <div className="history-type">
                    {t.symbol}/USDT ·{" "}
                    {t.direction === "up"
                      ? isEN
                        ? "Up"
                        : "Вверх"
                      : t.direction === "down"
                      ? isEN
                        ? "Down"
                        : "Вниз"
                      : isEN
                      ? "No change"
                      : "Не изменится"}{" "}
                    · x{t.multiplier}
                  </div>
                  <div className="history-sub">
                    {isEN ? "Amount" : "Сумма"}:{" "}
                    {amountDisplay.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencyCode}
                  </div>
                </div>

                <div className="history-right">
                  <div
                    className={
                      "history-amount " +
                      (t.status === "win" ? "positive" : "negative")
                    }
                  >
                    {profitDisplay > 0 ? "+" : ""}
                    {profitDisplay.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencyCode}
                  </div>
                  <div className="history-time">
                    {formatDateTime(t.finishedAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

const renderProfile = () => {
  if (!user) return null;

  const getRegDateString = () => {
    try {
      const date = new Date(user.createdAt || Date.now());
      const dateStr = date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timeStr = date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return isEN
        ? `${dateStr} at ${timeStr}`
        : `${dateStr} в ${timeStr}`;
    } catch {
      return "...";
    }
  };

  return (
    <>
      {/* шапка профиля */}
      <section className="section-block fade-in delay-1">
        <div className="profile-card">
          <div className="profile-avatar">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="Avatar"
                className="profile-avatar-img"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(135deg, #f97316, #c2410c)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#fff",
                  fontSize: "20px",
                }}
              >
                {(user.login?.[0] || "U").toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-main">
            <div className="profile-login">{user.login}</div>
            <div className="profile-email">{user.email}</div>
            <div
              className="profile-created"
              style={{
                marginTop: "4px",
                fontSize: "11px",
                color: "#fde68a",
              }}
            >
              {isEN
                ? `On Forbex since ${getRegDateString()}`
                : `На Forbex с ${getRegDateString()}`}
            </div>
          </div>
        </div>
      </section>

      {/* блок действий: верификация / логин / email / пароль */}
      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>
            {isEN ? "Account actions" : "Управление аккаунтом"}
          </h2>
        </div>

        <div className="profile-actions-grid">
          <button
            className="profile-btn"
            type="button"
          >
            {isEN ? "Verification" : "Верификация"}
          </button>
          <button
            className="profile-btn"
            type="button"
            onClick={() => {
              setSettingsMsg("");
              setLoginForm({ login: user.login || "" });
              setLoginModalOpen(true);
            }}
          >
            {isEN ? "Change login" : "Сменить логин"}
          </button>
          <button
            className="profile-btn"
            type="button"
            onClick={() => {
              setSettingsMsg("");
              setEmailForm({ email: user.email || "" });
              setEmailModalOpen(true);
            }}
          >
            {isEN ? "Change email" : "Сменить email"}
          </button>
          <button
            className="profile-btn"
            type="button"
            onClick={() => {
              setPasswordForm({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setPasswordError("");
              setPasswordSuccess("");
              setPasswordModalOpen(true);
            }}
          >
            {isEN ? "Change password" : "Сменить пароль"}
          </button>
        </div>

        {settingsMsg && (
          <div
            className="wallet-modal-note"
            style={{ marginTop: 8 }}
          >
            {settingsMsg}
          </div>
        )}
      </section>
{/* Кнопка техподдержки в стиле GreenPulse */}
<section className="section-block fade-in delay-3">
  <a
    href="https://t.me/ForbexSupport"
    target="_blank"
    rel="noreferrer"
    className="greenPulse support-cta"
  >
    <span className="support-cta-icon">👨‍💻</span>
    <span className="support-cta-text">
      {isEN ? "Write to support" : "Связаться с Тех.Поддержкой"}
    </span>
  </a>
</section>
      {/* настройки языка и валюты */}
      <section className="section-block fade-in delay-4">
        <div className="section-title">
          <h2>{isEN ? "Settings" : "Настройки"}</h2>
        </div>

        <div className="settings-block">
          <div className="settings-row">
            <div className="settings-label">
              {isEN ? "Language" : "Язык интерфейса"}
            </div>
            <div className="settings-chips">
              <button
                className={
                  "settings-chip " +
                  (settings.language === "ru"
                    ? "active"
                    : "")
                }
                onClick={() =>
                  updateSettings({ language: "ru" })
                }
              >
                🇷🇺 Русский
              </button>
              <button
                className={
                  "settings-chip " +
                  (settings.language === "en"
                    ? "active"
                    : "")
                }
                onClick={() =>
                  updateSettings({ language: "en" })
                }
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
  RUB
</button>
<button
  className={
    "settings-chip " +
    (settings.currency === "USD" ? "active" : "")
  }
  onClick={() => updateSettings({ currency: "USD" })}
>
  USD
</button>
            </div>
          </div>
        </div>
      </section>

      {/* выход */}
      <section className="section-block fade-in delay-5">
        <div className="profile-actions">
          <button
            className="profile-btn logout"
            onClick={handleLogout}
          >
            {isEN ? "Log out" : "Выйти из аккаунта"}
          </button>
        </div>
      </section>

      {/* Модалка смены пароля */}
      {passwordModalOpen && (
        <div
          className="wallet-modal-backdrop"
          onClick={() => setPasswordModalOpen(false)}
        >
          <div
            className="wallet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wallet-modal-title">
              {isEN ? "Change password" : "Смена пароля"}
            </div>

            <div className="wallet-modal-input-group">
              <label>
                {isEN
                  ? "Current password"
                  : "Текущий пароль"}
              </label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  handlePasswordInput(
                    "oldPassword",
                    e.target.value
                  )
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
                  handlePasswordInput(
                    "newPassword",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="wallet-modal-input-group">
              <label>
                {isEN ? "Repeat" : "Повтор нового пароля"}
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  handlePasswordInput(
                    "confirmPassword",
                    e.target.value
                  )
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
                onClick={() => setPasswordModalOpen(false)}
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

      {/* Модалка смены логина */}
      {loginModalOpen && (
        <div
          className="wallet-modal-backdrop"
          onClick={() => setLoginModalOpen(false)}
        >
          <div
            className="wallet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wallet-modal-title">
              {isEN ? "Change login" : "Смена логина"}
            </div>

            <div className="wallet-modal-input-group">
              <label>
                {isEN ? "New login" : "Новый логин"}
              </label>
              <input
                type="text"
                value={loginForm.login}
                onChange={(e) => {
                  setLoginForm({ login: e.target.value });
                  setSettingsMsg("");
                }}
                placeholder={
                  isEN ? "New login" : "Введите новый логин"
                }
              />
            </div>

            {settingsMsg && (
              <div className="wallet-modal-note">
                {settingsMsg}
              </div>
            )}

            <div className="wallet-modal-actions">
              <button
                className="wallet-modal-btn secondary"
                onClick={() => setLoginModalOpen(false)}
              >
                {isEN ? "Close" : "Закрыть"}
              </button>
              <button
                className="wallet-modal-btn primary"
                onClick={handleLoginChange}
              >
                {isEN ? "Save" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка смены email */}
      {emailModalOpen && (
        <div
          className="wallet-modal-backdrop"
          onClick={() => setEmailModalOpen(false)}
        >
          <div
            className="wallet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wallet-modal-title">
              {isEN ? "Change email" : "Смена email"}
            </div>

            <div className="wallet-modal-input-group">
              <label>
                {isEN ? "New email" : "Новый email"}
              </label>
              <input
                type="email"
                value={emailForm.email}
                onChange={(e) => {
                  setEmailForm({ email: e.target.value });
                  setSettingsMsg("");
                }}
                placeholder={
                  isEN ? "name@example.com" : "name@example.com"
                }
              />
            </div>

            {settingsMsg && (
              <div className="wallet-modal-note">
                {settingsMsg}
              </div>
            )}

            <div className="wallet-modal-actions">
              <button
                className="wallet-modal-btn secondary"
                onClick={() => setEmailModalOpen(false)}
              >
                {isEN ? "Close" : "Закрыть"}
              </button>
              <button
                className="wallet-modal-btn primary"
                onClick={handleEmailChange}
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
              Данные аккаунта хранятся в защищённой базе Supabase.
              Часть истории и настроек сохраняется локально в вашем браузере.
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

        {/* Тост справа снизу */}
        {toast && (
          <div className={`toast-root toast-${toast.type}`}>
            <div className="toast-title">
              {toast.type === "success"
                ? (isEN ? "Balance updated" : "Баланс пополнен")
                : (isEN ? "Operation status" : "Статус операции")}
            </div>
            <div className="toast-text">{toast.text}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
