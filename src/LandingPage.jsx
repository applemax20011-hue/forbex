import React, { useEffect, useRef, useState } from "react"; 

// Данные для тикера (бегущая строка)
const COINS = [
  { name: "BTC", price: "97,320.50", change: "+3.2%", up: true },
  { name: "ETH", price: "3,270.12", change: "+1.8%", up: true },
  { name: "SOL", price: "192.30", change: "-0.7%", up: false },
  { name: "USDT", price: "100.50 ₽", change: "+0.1%", up: true },
  { name: "TON", price: "6.25", change: "+4.5%", up: true },
  { name: "EUR/RUB", price: "105.20", change: "+0.4%", up: true },
];

// Уведомления
const LIVE_ACTIONS = [
  "Александр К. (Москва) вывел 50,000 ₽",
  "Елена В. (СПб) купила 0.5 BTC",
  "Дмитрий (Казань) открыл сделку",
  "User7723 получил бонус",
  "Иван М. пополнил счет через СБП",
];

// --- КОМПОНЕНТЫ ЛЕНДИНГА ---

const Ticker = () => (
  <div className="w-full bg-brand-card/80 border-b border-white/5 overflow-hidden py-2 backdrop-blur-sm relative z-40">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...COINS, ...COINS, ...COINS].map((coin, i) => (
        <div
          key={i}
          className="flex items-center mx-4 sm:mx-6 text-xs sm:text-sm font-mono"
        >
          <span className="font-bold text-white mr-2">{coin.name}</span>
          <span className="text-gray-400 mr-2">${coin.price}</span>
          <span className={coin.up ? "text-brand-accent" : "text-red-500"}>
            {coin.change}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const LiveNotification = () => {
  const [notification, setNotification] = useState(LIVE_ACTIONS[0]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setNotification(
          LIVE_ACTIONS[Math.floor(Math.random() * LIVE_ACTIONS.length)]
        );
        setVisible(true);
      }, 500);
    }, 6000);

    setTimeout(() => setVisible(true), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`hidden md:block fixed bottom-8 left-8 z-50 transition-all duration-500 transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-white/5 backdrop-blur-xl px-4 py-3 rounded-lg flex items-center gap-3 border-l-4 border-brand-accent">
        <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
        <span className="text-xs font-mono text-gray-200">{notification}</span>
      </div>
    </div>
  );
};

const LiveChart = () => (
  <div className="w-full h-40 sm:h-48 relative overflow-hidden rounded-xl bg-brand-card/50 border border-white/5 p-3 sm:p-4">
    <div className="absolute top-2 left-3 sm:left-4 text-xs text-gray-500 font-mono">
      BTC/USD LIVE
    </div>
    <svg viewBox="0 0 400 100" className="w-full h-full">
      <defs>
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,80 Q20,70 40,85 T80,50 T120,60 T160,30 T200,55 T240,40 T280,20 T320,40 T360,10 T400,30 V100 H0 Z"
        fill="url(#gradient)"
      />
      <path
        d="M0,80 Q20,70 40,85 T80,50 T120,60 T160,30 T200,55 T240,40 T280,20 T320,40 T360,10 T400,30"
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
      />
    </svg>
  </div>
);

const ThreeBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!window.THREE) return;
    const THREE = window.THREE;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030304, 0.02);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (mountRef.current) {
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);
    }

    const particlesGeometry = new THREE.BufferGeometry();
    const count = window.innerWidth < 768 ? 150 : 300;
    const posArray = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 40;
    }
    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xf97316,
      transparent: true,
      opacity: 0.8,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);
    camera.position.z = 10;

    let mouseX = 0,
      mouseY = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      particlesMesh.rotation.y += 0.0005;
      particlesMesh.rotation.x += 0.0002;
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    animate();

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      if (mountRef.current) mountRef.current.innerHTML = "";
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      id="canvas-container"
      style={{ position: "fixed", inset: 0, zIndex: -2 }}
    />
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-brand-card/90 border border-white/10 rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 transition-colors"
          >
            <i data-lucide="x" className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto text-xs text-gray-300 space-y-3">
          {children}
        </div>
        <div className="px-5 py-3 border-t border-white/10 text-right">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ---

export default function LandingPage({ onLogin, onRegister }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Пересоздаём иконки lucide, когда открываются модалки/меню
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [showPrivacy, showTerms, mobileMenuOpen]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-brand-accent selection:text-black pb-20">
      {/* Фон */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none -z-10" />
      <ThreeBackground />
      <Ticker />

      {/* Навигация */}
      <nav className="w-full z-50 bg-brand-bg/80 backdrop-blur border-b border-white/5 py-4 sticky top-0">
        <div className="container mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-blue rounded-lg flex items-center justify-center border border-brand-accent">
              <span className="text-xl">🦊</span>
            </div>
            <span className="text-xl font-bold tracking-wider">
              FORBEX <span className="text-brand-accent">TRADE</span>
            </span>
          </div>

          {/* Линки по секциям (десктоп) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-gray-400">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-white transition-colors"
            >
              Как начать
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-white transition-colors"
            >
              Возможности
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-white transition-colors"
            >
              FAQ
            </button>
          </div>

          {/* Правый блок: кнопки + бургер */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="hidden sm:inline-block text-sm font-medium hover:text-brand-accent transition-colors"
            >
              Вход
            </button>
            <button
              onClick={onRegister}
              className="hidden sm:inline-block bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"
            >
              Регистрация
            </button>

            {/* Бургер (мобилка) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <i
                data-lucide={mobileMenuOpen ? "x" : "menu"}
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 border-t border-white/10 pt-3">
            <div className="container mx-auto px-6 flex flex-col gap-3 text-sm text-gray-200">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="flex justify-between items-center py-2"
              >
                <span>Как начать</span>
                <i
                  data-lucide="chevron-right"
                  className="w-4 h-4 text-gray-500"
                />
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="flex justify-between items-center py-2"
              >
                <span>Возможности</span>
                <i
                  data-lucide="chevron-right"
                  className="w-4 h-4 text-gray-500"
                />
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="flex justify-between items-center py-2"
              >
                <span>FAQ</span>
                <i
                  data-lucide="chevron-right"
                  className="w-4 h-4 text-gray-500"
                />
              </button>

              <div className="h-px bg-white/5 my-1" />

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogin && onLogin();
                }}
                className="w-full py-2 text-left text-gray-300"
              >
                Вход
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRegister && onRegister();
                }}
                className="w-full py-2 text-left text-brand-accent font-semibold"
              >
                Регистрация
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO Секция */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-0 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-64 h-64 md:w-96 md:h-96 bg-brand-blue/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-brand-accent/10 rounded-full blur-[120px] animate-pulse" />

        <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 mx-auto md:mx-0">
              <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
              <span className="text-xs font-mono text-brand-accent uppercase tracking-widest">
                Работает в РФ 24/7
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              Торгуй без <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-blue">
                Границ.
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto md:mx-0 leading-relaxed">
              Единая экосистема для акций, крипты и форекса. Пополнение через
              СБП, P2P и криптовалюты. Никаких блокировок.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button
                onClick={onRegister}
                className="px-8 py-4 bg-brand-accent text-black font-bold rounded-lg hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgба(249,115,22,0.4)] flex items-center justify-center gap-2 group"
              >
                Открыть счет
                <i
                  data-lucide="arrow-right"
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-white/5 backdrop-blur rounded-lg font-medium hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <i data-lucide="log-in" className="w-4 h-4" />
                Войти
              </button>
            </div>
            <div className="flex justify-center md:justify-start gap-6 text-xs sm:text-sm text-gray-500 font-mono pt-4">
              <div className="flex items-center gap-2">
                <i
                  data-lucide="shield-check"
                  className="text-brand-accent w-4 h-4"
                />
                <span>No KYC до $15k</span>
              </div>
              <div className="flex items-center gap-2">
                <i data-lucide="zap" className="text-brand-blue w-4 h-4" />
                <span>Моментальный вывод</span>
              </div>
            </div>
          </div>

          {/* Интерактивная карточка */}
          <div className="relative mt-8 md:mt-0 mx-auto max-w-sm w-full">
            <div className="bg-brand-card/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 md:transform md:rotate-2 md:hover:rotate-0 transition-all duration-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-400 text-xs font-mono mb-1">
                    TOTAL BALANCE
                  </p>
                  <h3 className="text-3xl font-bold font-mono text-white">
                    $124,592.40
                  </h3>
                </div>
                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">
                  +12.5%
                </div>
              </div>
              <LiveChart />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={onRegister}
                  className="bg-green-500/10 text-green-400 py-3 rounded-lg font-bold hover:bg-green-500 hover:text-black transition-colors text-sm"
                >
                  Купить
                </button>
                <button
                  onClick={onRegister}
                  className="bg-red-500/10 text-red-400 py-3 rounded-lg font-bold hover:bg-red-500 hover:text-black transition-colors text-sm"
                >
                  Продать
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Как начать */}
      <section id="how-it-works" className="py-12 md:py-16 relative z-10">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center md:text-left">
            Как начать за 10 минут
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "user-plus",
                title: "1. Регистрация",
                desc: "Создай аккаунт по номеру телефона или email. Без сложных анкет.",
              },
              {
                icon: "wallet-cards",
                title: "2. Пополнение",
                desc: "Пополняй баланс через СБП, карту РФ или криптовалюту.",
              },
              {
                icon: "activity",
                title: "3. Торговля",
                desc: "Открывай сделки на акциях, крипте и форексе в один клик.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                    <i
                      data-lucide={step.icon}
                      className="w-4 h-4 text-brand-accent"
                    />
                  </div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                </div>
                <p className="text-xs text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Карточки преимуществ */}
      <section
        id="features"
        className="py-16 relative z-10 container mx-auto px-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: "globe-2",
              title: "Все рынки",
              desc: "NASDAQ, MOEX, Crypto.",
              color: "text-brand-blue",
            },
            {
              icon: "credit-card",
              title: "Рубли",
              desc: "Ввод/вывод на карты РФ.",
              color: "text-brand-accent",
            },
            {
              icon: "lock",
              title: "Безопасность",
              desc: "Холодное хранение.",
              color: "text-purple-400",
            },
            {
              icon: "smartphone",
              title: "WebApp",
              desc: "Торгуй прямо в Telegram.",
              color: "text-yellow-400",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-xl hover:-translate-y-2 transition-transform"
            >
              <div className="mb-4">
                <i
                  data-lucide={card.icon}
                  className={`w-6 h-6 ${card.color}`}
                />
              </div>
              <h3 className="font-bold mb-2">{card.title}</h3>
              <p className="text-xs text-gray-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="py-12 md:py-16 relative z-10 container mx-auto px-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center md:text-left">
          Частые вопросы
        </h2>
        <div className="space-y-3 max-w-2xl">
          {[
            {
              q: "Нужен ли KYC для торговли?",
              a: "Для объёма до $15,000 в месяц доступна торговля без полной верификации. Для больших лимитов потребуется KYC.",
            },
            {
              q: "Как быстро зачисляются рубли?",
              a: "Пополнение через СБП обычно зачисляется в течение 1–3 минут. В редких случаях возможно увеличение времени из-за банка-отправителя.",
            },
            {
              q: "Какой минимальный депозит?",
              a: "Минимум зависит от метода пополнения, но стартовать можно с небольшой суммы — от нескольких сотен рублей.",
            },
            {
              q: "Есть ли комиссия за вывод?",
              a: "Комиссия зависит от способа вывода и указывается в интерфейсе перед подтверждением операции.",
            },
          ].map((item, idx) => (
            <details
              key={idx}
              className="group bg-white/5 border border-white/10 rounded-lg px-4 py-3"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-sm font-medium text-white">
                  {item.q}
                </span>
                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">
                  <i data-lucide="chevron-down" className="w-4 h-4" />
                </span>
              </summary>
              <p className="text-xs text-gray-400 mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Футер + ссылки на документы */}
      <footer className="bg-black/80 backdrop-blur py-8 border-t border-white/10 text-sm text-gray-500 text-center">
        <p>© 2025 Forbex Trade. All rights reserved.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
          <button
            onClick={() => setShowTerms(true)}
            className="hover:text-brand-accent transition-colors"
          >
            Правила пользователя
          </button>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <button
            onClick={() => setShowPrivacy(true)}
            className="hover:text-brand-accent transition-colors"
          >
            Политика конфиденциальности
          </button>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <span className="text-gray-500">
            Торговля связана с риском потери капитала
          </span>
        </div>
      </footer>

      <LiveNotification />

      {/* Модалка "Правила пользователя" */}
      <Modal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Правила пользователя"
      >
        <p>
          Платформа Forbex Trade предоставляет пользователям интерфейс для
          операций с цифровыми активами в формате WebApp. Мы работаем на рынке
          с 2014 года, постоянно улучшая инфраструктуру, скорость исполнения
          ордеров и качество службы поддержки.
        </p>
        <p>Основные принципы использования платформы:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Платформа предназначена для совершеннолетних пользователей,
            принимающих на себя все риски, связанные с операциями с цифровыми
            активами.
          </li>
          <li>
            Пользователь обязуется указывать достоверные данные при регистрации
            и не передавать доступ к аккаунту третьим лицам.
          </li>
          <li>
            Оборот и результаты торговли зависят от рыночной ситуации и не
            гарантируются платформой.
          </li>
          <li>
            Администрация вправе временно ограничивать доступ к отдельным
            функциям при проведении технических работ и мер безопасности.
          </li>
          <li>
            Все действия в личном кабинете фиксируются в истории операций и
            могут быть использованы для проверок безопасности и разрешения
            спорных ситуаций.
          </li>
        </ul>
        <p>
          Используя Forbex Trade, вы подтверждаете, что понимаете характер
          рисков, связанных с цифровыми активами, и действуете от своего имени и
          в своих интересах.
        </p>
      </Modal>

      {/* Модалка "Политика конфиденциальности" */}
      <Modal
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Политика конфиденциальности"
      >
        <p>
          Forbex Trade уважает конфиденциальность своих пользователей и
          обрабатывает персональные данные строго в объёме, необходимом для
          работы платформы и исполнения обязательств перед пользователем.
        </p>
        <p>Мы можем обрабатывать и хранить следующие данные:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            регистрационные данные (логин, email, технические идентификаторы
            Telegram WebApp);
          </li>
          <li>
            техническую информацию о сессии (IP-адрес, тип устройства, браузер,
            время входа);
          </li>
          <li>
            историю действий внутри личного кабинета (пополнения, выводы,
            сделки, изменения настроек).
          </li>
        </ul>
        <p>
          Данные используются для обеспечения работы платформы, повышения
          безопасности, анализа нагрузки и улучшения качества сервиса. Мы не
          передаём персональные данные третьим лицам, за исключением случаев,
          прямо предусмотренных действующим законодательством или необходимых
          для исполнения юридически значимых запросов.
        </p>
        <p>
          Часть вспомогательной информации (например, настройки интерфейса)
          может сохраняться локально в вашем браузере в виде cookies и
          локального хранилища. Это помогает сохранять выбранный язык, валюту и
          упорядочивать отображение интерфейса.
        </p>
        <p>
          Используя платформу Forbex Trade, вы даёте согласие на обработку
          ваших персональных данных в соответствии с настоящей Политикой
          конфиденциальности и применимыми нормами действующего
          законодательства.
        </p>
      </Modal>
    </div>
  );
}
