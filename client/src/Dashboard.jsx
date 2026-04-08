import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  LayoutDashboard, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  ArrowLeftRight, 
  Settings, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Star,
  Activity,
  Download,
  Info,
  Newspaper,
  Calendar,
  Moon,
  Sun,
  CreditCard,
  MessageSquare,
  X,
  Send
} from 'lucide-react';
import './Dashboard.css';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (config.url.includes('localhost:3000') && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const CURRENCY_RATES = {
  USD: 1,
  EUR: 0.92,
  RON: 4.60
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  RON: 'RON'
};

function Dashboard() {
  const [watchlist, setWatchlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [assets, setAssets] = useState([]);
  
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState('');
  
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedSellAsset, setSelectedSellAsset] = useState(null);
  const [sellQuantity, setSellQuantity] = useState('');

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedChartAsset, setSelectedChartAsset] = useState(null);
  const [chartData, setChartData] = useState([]);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositData, setDepositData] = useState({
    amount: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [alerts, setAlerts] = useState([]);
  const [news, setNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsDateFilter, setNewsDateFilter] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { text: "Salut! Sunt asistentul tău InvestPro. Cu ce informații despre piețe te pot ajuta?", sender: 'bot' }
  ]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const portfolioPieData = portfolio.map(item => ({
    name: item.asset.symbol,
    value: parseFloat((item.quantity * item.asset.currentPrice).toFixed(2))
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

  const formatCurrency = (value, customDecimals = null) => {
    if (value === undefined || value === null) return '';
    const currency = user?.currency || 'USD';
    const rate = CURRENCY_RATES[currency] || 1;
    const convertedValue = value * rate;

    let decimals = customDecimals !== null ? customDecimals : (convertedValue < 1 ? 4 : 2);

    if (currency === 'RON') {
      return `${convertedValue.toFixed(decimals)} RON`;
    }
    return `${CURRENCY_SYMBOLS[currency]}${convertedValue.toFixed(decimals)}`;
  };

  const handleCurrencyChange = async (newCurrency) => {
    try {
      const updatedUser = { ...user, currency: newCurrency };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      await axios.put('http://localhost:3000/api/auth/update-profile', {
        userId: user.id,
        name: user.name,
        currency: newCurrency,
        profilePicture: user.profilePicture
      });
    } catch (err) {}
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/assets');
      setAssets(response.data);
    } catch (error) {}
  };

  useEffect(() => {
    const fetchNews = async () => {
      if (activeView === 'news') {
        setIsNewsLoading(true);
        try {
          const res = await axios.get('http://localhost:3000/api/assets/market-news');
          if (res.data && Array.isArray(res.data)) {
            setNews(res.data.slice(0, 15));
          } else {
            setNews([]);
          }
        } catch (err) {
          setNews([]);
        } finally {
          setIsNewsLoading(false);
        }
      }
    };
    fetchNews();
  }, [activeView]);
   
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (user && user.id) {
          const res = await axios.get(`http://localhost:3000/api/trade/history/${user.id}`);
          setTransactions(res.data);
        }
      } catch (err) {}
    };

    if (activeView === 'transactions') {
      fetchTransactions();
    }
  }, [activeView, user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/');
    } else {
      setUser(JSON.parse(userData));
      fetchAssets();
      
      const interval = setInterval(() => {
        fetchAssets();
        if (isChartModalOpen && selectedChartAsset) {
          handleRefreshChartData(selectedChartAsset.id);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [navigate, isChartModalOpen, selectedChartAsset]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && user.id) {
          const portRes = await axios.get(`http://localhost:3000/api/portfolio/${user.id}`);
          setPortfolio(portRes.data);
          
          const histRes = await axios.get(`http://localhost:3000/api/portfolio/history/${user.id}`);
          setBalanceHistory(histRes.data);

          const watchRes = await axios.get(`http://localhost:3000/api/watchlist/${user.id}`);
          setWatchlist(watchRes.data);
        }
      } catch (err) {}
    };

    if (activeView === 'portfolio' || activeView === 'dashboard') {
      fetchData();
    }
  }, [activeView, user]);

  useEffect(() => {
    const newAlerts = [];

    if (user && user.balance < 50) {
      newAlerts.push({
        id: 'low-balance',
        type: 'warning',
        text: `Your balance is below ${formatCurrency(50)}. Consider adding funds to avoid missing market opportunities.`,
        icon: <AlertTriangle size={20} />
      });
    }

    if (portfolio.length > 0) {
      const cryptoTotal = portfolio.filter(p => p.asset.type === 'CRYPTO').reduce((sum, p) => sum + p.currentValue, 0);
      const stockTotal = portfolio.filter(p => p.asset.type === 'STOCK').reduce((sum, p) => sum + p.currentValue, 0);
      const totalValue = cryptoTotal + stockTotal;

      if (totalValue > 0) {
        if (cryptoTotal / totalValue > 0.8) {
          newAlerts.push({
            id: 'high-crypto',
            type: 'info',
            text: 'Your portfolio is heavily concentrated in Crypto (>80%). Consider diversifying into Stocks to reduce volatility risk.',
            icon: <Info size={20} />
          });
        } else if (stockTotal / totalValue > 0.8) {
          newAlerts.push({
            id: 'high-stocks',
            type: 'info',
            text: 'Your portfolio is heavily concentrated in Stocks (>80%). Consider adding Crypto for higher growth potential.',
            icon: <Info size={20} />
          });
        }
      }

      const bestAsset = [...portfolio].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)[0];
      if (bestAsset && bestAsset.profitLossPercentage > 5) {
        newAlerts.push({
          id: 'best-asset',
          type: 'success',
          text: `Great job! ${bestAsset.asset.name} is up ${bestAsset.profitLossPercentage.toFixed(2)}% in your portfolio.`,
          icon: <TrendingUp size={20} />
        });
      }

      const worstAsset = [...portfolio].sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)[0];
      if (worstAsset && worstAsset.profitLossPercentage < -5) {
        newAlerts.push({
          id: 'worst-asset',
          type: 'danger',
          text: `${worstAsset.asset.name} is down by ${Math.abs(worstAsset.profitLossPercentage).toFixed(2)}%. Monitor this position closely.`,
          icon: <TrendingDown size={20} />
        });
      }
    } else if (user) {
      newAlerts.push({
        id: 'empty-portfolio',
        type: 'info',
        text: 'Your portfolio is empty. Head to the Markets tab to make your first trade and start investing!',
        icon: <Activity size={20} />
      });
    }

    setAlerts(newAlerts);
  }, [portfolio, user]);

  const handleRefreshChartData = async (assetId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/assets/history/${assetId}`);
      setChartData(res.data);
    } catch (err) {}
  };

  const handleOpenChart = async (asset) => {
    setSelectedChartAsset(asset);
    setIsChartModalOpen(true);
    setChartData([]);
    try {
      const res = await axios.get(`http://localhost:3000/api/assets/history/${asset.id}`);
      setChartData(res.data);
    } catch (err) {}
  };

  const handleToggleWatchlist = async (assetId) => {
    try {
      await axios.post('http://localhost:3000/api/watchlist/toggle', {
        userId: user.id,
        assetId
      });
      const watchRes = await axios.get(`http://localhost:3000/api/watchlist/${user.id}`);
      setWatchlist(watchRes.data);
    } catch (err) {}
  };

  const handleBuyAsset = async () => {
    if (!buyQuantity || buyQuantity <= 0) return;
    try {
      const res = await axios.post('http://localhost:3000/api/trade/buy', {
        userId: user.id,
        assetId: selectedAsset.id,
        quantity: buyQuantity
      });
      const updatedUser = { ...user, balance: res.data.newBalance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Asset purchased successfully!');
      setIsBuyModalOpen(false);
      setBuyQuantity('');
    } catch (err) {
      alert(err.response?.data?.message || 'Transaction failed');
    }
  };

  const handleSellAsset = async () => {
    if (!sellQuantity || sellQuantity <= 0) return;
    if (sellQuantity > selectedSellAsset.quantity) {
      return alert('You cannot sell more than you own!');
    }

    try {
      const res = await axios.post('http://localhost:3000/api/trade/sell', {
        userId: user.id,
        assetId: selectedSellAsset.asset.id,
        quantity: sellQuantity
      });
      
      const updatedUser = { ...user, balance: res.data.newBalance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert('Asset sold successfully!');
      setIsSellModalOpen(false);
      setSellQuantity('');
      
      const portRes = await axios.get(`http://localhost:3000/api/portfolio/${user.id}`);
      setPortfolio(portRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Transaction failed');
    }
  };

  const handleDepositSubmit = async () => {
    if (!depositData.amount || isNaN(depositData.amount) || parseFloat(depositData.amount) <= 0) {
      return alert('Please enter a valid amount.');
    }
    
    try {
      const amountInUSD = parseFloat(depositData.amount) / (CURRENCY_RATES[user?.currency || 'USD'] || 1);

      const res = await axios.post('http://localhost:3000/api/trade/deposit', {
        userId: user.id,
        amount: amountInUSD
      });
      const updatedUser = { ...user, balance: res.data.newBalance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert('Funds deposited successfully!');
      setIsDepositModalOpen(false);
      setDepositData({ amount: '', cardNumber: '', cardName: '', expiry: '', cvv: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Deposit failed');
    }
  };

  const exportTransactionsPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text('Transaction History - InvestPro', 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Account: ${user?.name} (${user?.email})`, 14, 36);

      const tableColumn = ["Date", "Asset", "Type", "Quantity", "Price", "Total"];
      const tableRows = [];

      transactions.forEach(tx => {
        const isBuy = tx.type === 'BUY';
        const transactionData = [
          new Date(tx.date).toLocaleString(),
          `${tx.asset.name} (${tx.asset.symbol})`,
          tx.type,
          tx.quantity.toString(),
          formatCurrency(tx.priceAtPurchase),
          `${isBuy ? '-' : '+'}${formatCurrency(tx.quantity * tx.priceAtPurchase)}`
        ];
        tableRows.push(transactionData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`InvestPro_Transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { text: chatInput, sender: 'user' };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    setChatMessages(prev => [...prev, { text: "...", sender: 'bot', isLoading: true }]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API Key missing");
      }

      const promptText = `Ești InvestPro AI, un asistent financiar inteligent integrat într-o platformă de tranzacționare. Răspunde concis, prietenos, profesionist și strict în limba română la următoarea întrebare a utilizatorului: ${userMsg.text}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: promptText }] }]
        }
      );

      const botText = response.data.candidates[0].content.parts[0].text;

      setChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop(); 
        newMsgs.push({ text: botText, sender: 'bot' });
        return newMsgs;
      });

    } catch (error) {
      setChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        newMsgs.push({ text: "Ne pare rău, am întâmpinat o eroare de conexiune cu serverul AI.", sender: 'bot' });
        return newMsgs;
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="dashboard-section">
            <header className="header">
              <h1>Overview</h1>
              <p>Welcome back, {user?.name || 'Investor'}. Here is what's happening with your money.</p>
            </header>

            {alerts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {alerts.map(alert => {
                  let bgColor, borderColor, textColor;
                  if (alert.type === 'warning' || alert.type === 'danger') {
                    bgColor = isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2'; 
                    borderColor = '#ef4444'; 
                    textColor = isDarkMode ? '#fca5a5' : '#b91c1c';
                  } else if (alert.type === 'success') {
                    bgColor = isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4'; 
                    borderColor = '#10b981'; 
                    textColor = isDarkMode ? '#6ee7b7' : '#047857';
                  } else {
                    bgColor = isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff'; 
                    borderColor = '#3b82f6'; 
                    textColor = isDarkMode ? '#93c5fd' : '#1d4ed8';
                  }

                  return (
                    <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${borderColor}`, backgroundColor: bgColor, color: 'var(--text-main)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ color: textColor, display: 'flex', alignItems: 'center' }}>
                        {alert.icon}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: textColor }}>{alert.text}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="dashboard-grid">
              <div className="stat-card" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '14px', margin: '0 0 8px 0', color: 'var(--text-muted)' }}>Available Balance</p>
                  <h2 style={{ fontSize: '32px', margin: 0, color: 'var(--text-main)' }}>
                    {formatCurrency(user?.balance || 0)}
                  </h2>
                </div>
                <button 
                  className="trade-btn-outline"
                  onClick={() => setIsDepositModalOpen(true)}
                >
                  <CreditCard size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
                  Add Funds
                </button>
              </div>

              <div className="stat-card" style={{ gridColumn: 'span 2', minHeight: '350px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '24px', color: 'var(--text-main)' }}>Balance History</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={balanceHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} minTickGap={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} tickFormatter={(value) => formatCurrency(value, 0)} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                        formatter={(value) => [formatCurrency(value), 'Balance']}
                      />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="stat-card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '24px', color: 'var(--text-main)' }}>Asset Allocation</h3>
                {portfolioPieData.length > 0 ? (
                  <div style={{ flex: 1, width: '100%', minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <RechartsPieChart>
                        <Pie
                          data={portfolioPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {portfolioPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px' }} formatter={(value) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                      {portfolioPieData.map((entry, index) => (
                        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                          {entry.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
                    No assets in portfolio yet.<br/>Buy some assets to see your allocation.
                  </div>
                )}
              </div>

              <div className="stat-card" style={{ gridColumn: '1 / -1', padding: '24px 32px', marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Watchlist</h3>
                </div>
                
                {watchlist.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    Your watchlist is empty. Go to Markets to add assets.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                    {watchlist.map(item => {
                      const isPositive = item.asset.change24h >= 0;
                      return (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.asset.symbol} <span style={{ color: '#fbbf24' }}>★</span></div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.asset.name}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formatCurrency(item.asset.currentPrice)}</div>
                            <div style={{ fontSize: '13px', color: isPositive ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                              {isPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {Math.abs(item.asset.change24h || 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        );

      case 'markets':
        const filteredAssets = assets.filter(asset => {
          const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesFilter = marketFilter === 'ALL' || asset.type === marketFilter;
          return matchesSearch && matchesFilter;
        });

        return (
          <div className="markets-section">
            <header className="header">
              <h1>Markets</h1>
              <p>Explore assets and expand your portfolio.</p>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div className="search-container" style={{ margin: 0, backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <Search className="search-icon" size={20} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search by symbol or name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  style={{ backgroundColor: 'transparent', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setMarketFilter('ALL')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: marketFilter === 'ALL' ? '#3b82f6' : 'var(--bg-card)', color: marketFilter === 'ALL' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600' }}
                >
                  All
                </button>
                <button 
                  onClick={() => setMarketFilter('CRYPTO')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: marketFilter === 'CRYPTO' ? '#3b82f6' : 'var(--bg-card)', color: marketFilter === 'CRYPTO' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600' }}
                >
                  Crypto
                </button>
                <button 
                  onClick={() => setMarketFilter('STOCK')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: marketFilter === 'STOCK' ? '#3b82f6' : 'var(--bg-card)', color: marketFilter === 'STOCK' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600' }}
                >
                  Stocks
                </button>
              </div>
            </div>

            <div className="assets-list-container" style={{ marginTop: 0 }}>
              {filteredAssets.map(asset => {
                const isPositive = asset.change24h >= 0;
                return (
                  <div key={asset.id} className="asset-row-clean" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div 
                      className="asset-info-main" 
                      onClick={() => handleOpenChart(asset)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="asset-symbol" style={{ color: 'var(--text-main)' }}>{asset.symbol}</span>
                      <span className="asset-name" style={{ color: 'var(--text-muted)' }}>{asset.name}</span>
                      <span className="asset-type-badge">{asset.type}</span>
                    </div>
                    
                    <div className="asset-price-section">
                      <div className="price-wrapper" style={{ marginRight: '16px' }}>
                        <span className="current-price" style={{ color: 'var(--text-main)' }}>{formatCurrency(asset.currentPrice)}</span>
                        <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Math.abs(asset.change24h || 0).toFixed(2)}%
                        </span>
                      </div>
                      <button 
                        onClick={() => handleOpenChart(asset)}
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', marginRight: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: '600' }}
                      >
                        <Activity size={16} /> Chart
                      </button>
                      <button 
                        onClick={() => handleToggleWatchlist(asset.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px', display: 'flex', alignItems: 'center' }}
                      >
                        <Star size={22} fill={watchlist.some(w => w.assetId === asset.id) ? "#fbbf24" : "none"} color={watchlist.some(w => w.assetId === asset.id) ? "#fbbf24" : "var(--border-color)"} />
                      </button>
                      <button 
                        className="trade-btn-outline"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsBuyModalOpen(true);
                        }}
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'portfolio':
        const totalPortfolioValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
        const totalInvested = portfolio.reduce((sum, item) => sum + (item.quantity * item.avgBuyPrice), 0);
        const totalPnL = totalPortfolioValue - totalInvested;
        const isPnLPositive = totalPnL >= 0;

        return (
          <div className="portfolio-section">
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1>My Assets</h1>
                <p>Track your assets and overall performance.</p>
              </div>
              
              <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                {['USD', 'EUR', 'RON'].map(curr => (
                  <button
                    key={curr}
                    onClick={() => handleCurrencyChange(curr)}
                    style={{
                      padding: '8px 20px',
                      border: 'none',
                      background: user?.currency === curr ? 'var(--bg-card)' : 'transparent',
                      color: user?.currency === curr ? 'var(--text-main)' : 'var(--text-muted)',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: user?.currency === curr ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                      fontSize: '14px'
                    }}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </header>

            <div className="portfolio-summary-cards" style={{ display: 'flex', gap: '40px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '32px', borderRadius: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div className="summary-box" style={{ border: 'none', padding: 0, flex: 1, minWidth: '250px' }}>
                <span className="summary-label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Total Portfolio Value</span>
                <span className="summary-value" style={{ color: 'var(--text-main)', fontSize: '32px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {formatCurrency(totalPortfolioValue)}
                </span>
              </div>
              
              <div className="summary-divider" style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
              
              <div className="summary-box" style={{ border: 'none', padding: 0, flex: 1, minWidth: '250px' }}>
                <span className="summary-label" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Total P&L</span>
                <span className={`summary-value ${isPnLPositive ? 'text-green' : 'text-red'}`} style={{ fontSize: '32px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {isPnLPositive ? '+' : ''}{formatCurrency(totalPnL)}
                </span>
              </div>
            </div>

            <div className="table-container" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>ASSET NAME</th>
                    <th>SYMBOL</th>
                    <th>QUANTITY</th>
                    <th>AVG. BUY PRICE</th>
                    <th>CURRENT PRICE</th>
                    <th>TOTAL VALUE</th>
                    <th>PROFIT/LOSS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No assets found. Start trading to build your portfolio.
                      </td>
                    </tr>
                  ) : (
                    portfolio.map(item => {
                      const isPositive = item.profitLoss >= 0;
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="table-asset-name" onClick={() => handleOpenChart(item.asset)} style={{ cursor: 'pointer', color: 'var(--text-main)' }}>
                              <span className="table-icon">{item.asset.symbol.charAt(0)}</span>
                              {item.asset.name}
                            </div>
                          </td>
                          <td><span className="badge">{item.asset.symbol}</span></td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.avgBuyPrice)}</td>
                          <td className="text-blue" style={{ fontWeight: '600' }}>{formatCurrency(item.asset.currentPrice)}</td>
                          <td>{formatCurrency(item.currentValue)}</td>
                          <td>
                            <span className={`pnl-badge ${isPositive ? 'pnl-positive' : 'pnl-negative'}`}>
                              {isPositive ? '+' : ''}{formatCurrency(item.profitLoss)} ({isPositive ? '+' : ''}{item.profitLossPercentage.toFixed(2)}%)
                            </span>
                          </td>
                          <td>
                            <button 
                              className="sell-btn"
                              onClick={() => {
                                setSelectedSellAsset(item);
                                setIsSellModalOpen(true);
                              }}
                            >
                              Sell
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="transactions-section">
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>Transaction History</h1>
                <p>View all your past trades and operations.</p>
              </div>
              <button 
                onClick={exportTransactionsPDF}
                disabled={transactions.length === 0}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  backgroundColor: transactions.length === 0 ? 'var(--border-color)' : '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: transactions.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                <Download size={18} />
                Export PDF
              </button>
            </header>

            <div className="table-container" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>ASSET</th>
                    <th>TYPE</th>
                    <th>QUANTITY</th>
                    <th>PRICE</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No transactions found. Start trading to see your history here.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => {
                      const isBuy = tx.type === 'BUY';
                      return (
                        <tr key={tx.id}>
                          <td>{new Date(tx.date).toLocaleString()}</td>
                          <td>
                            <div className="table-asset-name" style={{ color: 'var(--text-main)' }}>
                              <span className="table-icon">{tx.asset.symbol.charAt(0)}</span>
                              {tx.asset.name} <span className="badge">{tx.asset.symbol}</span>
                            </div>
                          </td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: isBuy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                color: isBuy ? '#10b981' : '#ef4444' 
                              }}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td>{tx.quantity}</td>
                          <td>{formatCurrency(tx.priceAtPurchase)}</td>
                          <td style={{ fontWeight: '600', color: isBuy ? '#ef4444' : '#10b981' }}>
                            {isBuy ? '-' : '+'}{formatCurrency(tx.quantity * tx.priceAtPurchase)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'news':
        const filteredNews = newsDateFilter 
          ? news.filter(item => {
              const itemDate = new Date(item.pubDate).toISOString().split('T')[0];
              return itemDate === newsDateFilter;
            })
          : news;

        const getImageUrl = (item) => {
          if (item.thumbnail) return item.thumbnail;
          if (item.enclosure && item.enclosure.link) return item.enclosure.link;
          return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80';
        };

        return (
          <div className="news-section">
            <header className="header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(90deg, var(--text-main), #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 8px 0' }}>
                  Market Intelligence
                </h1>
                <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
                  Curated financial news, analysis, and breaking updates.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <Calendar size={18} color="var(--text-muted)" />
                <input 
                  type="date" 
                  value={newsDateFilter}
                  onChange={(e) => setNewsDateFilter(e.target.value)}
                  style={{ border: 'none', outline: 'none', color: 'var(--text-main)', fontWeight: '500', fontSize: '14px', background: 'transparent' }}
                  className="theme-date-input"
                />
                {newsDateFilter && (
                  <button 
                    onClick={() => setNewsDateFilter('')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </header>

            {isNewsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredNews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {!newsDateFilter && (
                  <a href={filteredNews[0].link} target="_blank" rel="noreferrer" style={{ display: 'block', position: 'relative', height: '400px', borderRadius: '24px', overflow: 'hidden', textDecoration: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                    <img src={getImageUrl(filteredNews[0])} alt="Featured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 50%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Top Story
                        </span>
                        <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
                          {new Date(filteredNews[0].pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <h2 style={{ color: 'white', fontSize: '36px', fontWeight: '800', margin: '0 0 16px 0', lineHeight: '1.2', maxWidth: '800px' }}>
                        {filteredNews[0].title}
                      </h2>
                      <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: '800px' }}>
                        Click to read the full analysis and market impact on Yahoo Finance.
                      </p>
                    </div>
                  </a>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {filteredNews.slice(newsDateFilter ? 0 : 1).map((item, index) => (
                    <a 
                      key={index} 
                      href={item.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}
                    >
                      <div style={{ position: 'relative', height: '220px' }}>
                        <img src={getImageUrl(item)} alt="News" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Finance
                        </div>
                      </div>
                      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: '0 0 16px 0', lineHeight: '1.5', fontWeight: '700', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.title}
                        </h3>
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6' }}>Yahoo Finance</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '60px 40px', color: 'var(--text-muted)', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
                <Newspaper size={64} style={{ margin: '0 auto 24px auto', opacity: 0.3, color: '#3b82f6' }} />
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '20px' }}>No news available for this date</h3>
                <p style={{ margin: 0, fontSize: '16px' }}>Try clearing the filter or selecting a more recent date.</p>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="settings-section">
            <header className="header">
              <h1>Settings</h1>
              <p>Manage your account security and preferences.</p>
            </header>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '24px' }}>
              
              <div className="stat-card" style={{ maxWidth: '600px' }}>
                <h3 style={{ color: 'var(--text-main)', fontSize: '18px', marginBottom: '24px' }}>Profile Preferences</h3>
                <form className="auth-form" style={{ padding: 0, backgroundColor: 'transparent', boxShadow: 'none' }} onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const response = await axios.put('http://localhost:3000/api/auth/update-profile', {
                      userId: user.id,
                      name: user.name,
                      currency: user.currency || 'USD',
                      profilePicture: user.profilePicture
                    });
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    setUser(response.data.user);
                    alert('Profile preferences updated!');
                  } catch (err) {
                    alert('Failed to update profile');
                  }
                }}>
                  
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-display">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    
                    <div className="profile-avatar-actions">
                      <label className="settings-label" style={{ color: 'var(--text-muted)' }}>Profile Picture</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 5000000) return alert('File is too large. Maximum size is 5MB.');
                            const reader = new FileReader();
                            reader.onloadend = () => setUser({...user, profilePicture: reader.result});
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="custom-file-btn"
                        onClick={() => fileInputRef.current.click()}
                      >
                        Choose Image
                      </button>
                      <p className="helper-text">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="settings-label" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                    <input type="text" value={user.name || ''} onChange={(e) => setUser({...user, name: e.target.value})} className="settings-input" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }} />
                  </div>
                  
                  <button type="submit" className="submit-btn" style={{ marginTop: '16px' }}>
                    Save Preferences
                  </button>
                </form>
              </div>

              <div className="stat-card" style={{ maxWidth: '600px' }}>
                <h3 style={{ color: 'var(--text-main)', fontSize: '18px', marginBottom: '20px' }}>Change Password</h3>
                <form className="auth-form" style={{ padding: 0, backgroundColor: 'transparent', boxShadow: 'none' }} onSubmit={async (e) => {
                  e.preventDefault();
                  const currentPassword = e.target.currentPassword.value;
                  const newPassword = e.target.newPassword.value;
                  const confirmPassword = e.target.confirmPassword.value;
                  
                  if (newPassword !== confirmPassword) return alert('New passwords do not match');
                  if (newPassword.length < 6) return alert('Password must be at least 6 characters');

                  try {
                    await axios.put('http://localhost:3000/api/auth/change-password', {
                      userId: user.id,
                      currentPassword,
                      newPassword
                    });
                    alert('Password updated successfully!');
                    e.target.reset();
                  } catch (err) {
                    alert(err.response?.data?.message || 'Error updating password');
                  }
                }}>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-muted)' }}>Current Password</label>
                    <input type="password" name="currentPassword" required style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-muted)' }}>New Password</label>
                    <input type="password" name="newPassword" required style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-muted)' }}>Confirm New Password</label>
                    <input type="password" name="confirmPassword" required style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }} />
                  </div>
                  <button type="submit" className="submit-btn" style={{ marginTop: '10px' }}>Update Password</button>
                </form>
              </div>

              <div className="stat-card" style={{ maxWidth: '600px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <h3 style={{ color: '#ef4444', fontSize: '18px', marginBottom: '10px' }}>Danger Zone</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button 
                  onClick={async () => {
                    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
                      try {
                        await axios.delete(`http://localhost:3000/api/auth/delete-account/${user.id}`);
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        navigate('/');
                      } catch (err) {
                        alert('Error deleting account');
                      }
                    }
                  }}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Delete Account
                </button>
              </div>

            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TrendingUp size={20} color="white" />
          </div>
          <span>InvestPro</span>
        </div>
        
        <nav className="sidebar-menu">
          <div 
            className={`menu-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div 
            className={`menu-item ${activeView === 'markets' ? 'active' : ''}`}
            onClick={() => setActiveView('markets')}
          >
            <LineChartIcon size={20} /> Markets
          </div>
          <div 
            className={`menu-item ${activeView === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveView('portfolio')}
          >
            <PieChartIcon size={20} /> Portfolio
          </div>
          <div 
            className={`menu-item ${activeView === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveView('transactions')}
          >
            <ArrowLeftRight size={20} /> Transactions
          </div>
          <div 
            className={`menu-item ${activeView === 'news' ? 'active' : ''}`}
            onClick={() => setActiveView('news')}
          >
            <Newspaper size={20} /> News
          </div>
          <div 
            className={`menu-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <Settings size={20} /> Settings
          </div>

          <div 
            className="menu-item"
            style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </div>
        </nav>

        <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div className="user-info">
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#f8fafc' }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {user.email}
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>

      {isDepositModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '450px' }}>
            <h2>Deposit Funds</h2>
            
            <div className="credit-card-preview">
              <div className="card-chip"></div>
              <div className="card-number-display">
                {depositData.cardNumber ? depositData.cardNumber.padEnd(16, '•').match(/.{1,4}/g).join(' ') : '•••• •••• •••• ••••'}
              </div>
              <div className="card-details-display">
                <div>
                  <div>Card Holder</div>
                  <div>{depositData.cardName || 'YOUR NAME'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Expires</div>
                  <div>{depositData.expiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)' }}>Amount ({user?.currency || 'USD'})</label>
              <input 
                type="number" 
                value={depositData.amount}
                onChange={(e) => setDepositData({...depositData, amount: e.target.value})}
                placeholder="0.00"
                style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)' }}>Card Number</label>
              <input 
                type="text" 
                maxLength="16"
                value={depositData.cardNumber}
                onChange={(e) => setDepositData({...depositData, cardNumber: e.target.value.replace(/\D/g, '')})}
                placeholder="1234567890123456"
                style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div className="deposit-grid">
              <div className="form-group">
                <label style={{ color: 'var(--text-muted)' }}>Expiry Date</label>
                <input 
                  type="text" 
                  maxLength="5"
                  value={depositData.expiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                    setDepositData({...depositData, expiry: val});
                  }}
                  placeholder="MM/YY"
                  style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
                />
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--text-muted)' }}>CVV</label>
                <input 
                  type="text" 
                  maxLength="3"
                  value={depositData.cvv}
                  onChange={(e) => setDepositData({...depositData, cvv: e.target.value.replace(/\D/g, '')})}
                  placeholder="123"
                  style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label style={{ color: 'var(--text-muted)' }}>Name on Card</label>
              <input 
                type="text" 
                value={depositData.cardName}
                onChange={(e) => setDepositData({...depositData, cardName: e.target.value.toUpperCase()})}
                placeholder="JOHN DOE"
                style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
              />
            </div>

            <div className="modal-buttons" style={{ marginTop: '24px' }}>
              <button className="cancel-btn" onClick={() => setIsDepositModalOpen(false)}>Cancel</button>
              <button className="confirm-btn" onClick={handleDepositSubmit}>Process Payment</button>
            </div>
          </div>
        </div>
      )}
      
      {isChartModalOpen && selectedChartAsset && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '800px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0 }}>{selectedChartAsset.name}</h2>
                <span className="badge" style={{ fontSize: '14px' }}>{selectedChartAsset.symbol}</span>
              </div>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => setIsChartModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-price-box" style={{ marginBottom: '24px', textAlign: 'left', padding: '16px', background: 'var(--bg-main)', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Current Price</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <h3 style={{ fontSize: '28px', margin: '4px 0 0 0', color: 'var(--text-main)' }}>{formatCurrency(selectedChartAsset.currentPrice, 4)}</h3>
                <span style={{ fontSize: '14px', fontWeight: '600', color: selectedChartAsset.change24h >= 0 ? '#10b981' : '#ef4444', marginBottom: '6px' }}>
                  {selectedChartAsset.change24h >= 0 ? '+' : ''}{selectedChartAsset.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div style={{ width: '100%', height: '350px', marginBottom: '24px' }}>
              {chartData.length === 0 ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Loading chart data...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} minTickGap={30} />
                    <YAxis 
                      domain={[(dataMin) => dataMin * 0.9995, (dataMax) => dataMax * 1.0005]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                      dx={-10} 
                      tickFormatter={(value) => formatCurrency(value, value < 1 ? 6 : 2)} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                      formatter={(value) => [formatCurrency(value, Number(value) < 1 ? 6 : 2), 'Price']}
                    />
                    <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="modal-buttons">
              <button 
                className="confirm-btn" 
                style={{ width: '100%' }}
                onClick={() => {
                  setIsChartModalOpen(false);
                  setSelectedAsset(selectedChartAsset);
                  setIsBuyModalOpen(true);
                }}
              >
                Trade {selectedChartAsset.symbol}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBuyModalOpen && selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Buy {selectedAsset.symbol}</h2>
            <div className="modal-price-box" style={{ backgroundColor: 'var(--bg-main)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Price</span>
              <h3 style={{ color: 'var(--text-main)' }}>{formatCurrency(selectedAsset.currentPrice, 4)}</h3>
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label style={{ color: 'var(--text-muted)' }}>Quantity</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(e.target.value)}
                placeholder="e.g. 1.5"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
              />
            </div>

            <div className="modal-summary">
              <span style={{ color: 'var(--text-muted)' }}>Estimated Cost:</span>
              <span style={{ color: 'var(--text-main)' }}>{formatCurrency(selectedAsset.currentPrice * (buyQuantity || 0))}</span>
            </div>

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setIsBuyModalOpen(false)}>Cancel</button>
              <button className="confirm-btn" onClick={handleBuyAsset}>Confirm Purchase</button>
            </div>
          </div>
        </div>
      )}

      {isSellModalOpen && selectedSellAsset && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Sell {selectedSellAsset.asset.symbol}</h2>
            <div className="modal-price-box" style={{ backgroundColor: 'var(--bg-main)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Price</span>
              <h3 style={{ color: 'var(--text-main)' }}>{formatCurrency(selectedSellAsset.asset.currentPrice, 4)}</h3>
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label style={{ color: 'var(--text-muted)' }}>Quantity to Sell (Max: {selectedSellAsset.quantity})</label>
              <input 
                type="number" 
                min="0" 
                max={selectedSellAsset.quantity}
                step="0.01" 
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                placeholder="e.g. 1.5"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
              />
            </div>

            <div className="modal-summary">
              <span style={{ color: 'var(--text-muted)' }}>Estimated Return:</span>
              <span className="text-green">{formatCurrency(selectedSellAsset.asset.currentPrice * (sellQuantity || 0))}</span>
            </div>

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setIsSellModalOpen(false)}>Cancel</button>
              <button className="sell-confirm-btn" onClick={handleSellAsset}>Confirm Sale</button>
            </div>
          </div>
          
        </div>
      )}

      {/* --- START CHATBOT --- */}
      <button 
        className="chatbot-toggle-btn"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isChatOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>InvestPro AI</span>
            <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          
          <div className="chatbot-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} className="chatbot-input-area">
            <input 
              type="text" 
              placeholder="Întreabă-mă ceva..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit">
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
      {/* --- END CHATBOT --- */}

    </div>
  );
}

export default Dashboard;