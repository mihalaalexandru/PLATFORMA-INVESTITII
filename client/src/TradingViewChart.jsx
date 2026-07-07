import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, CrosshairMode } from 'lightweight-charts';

const TIMEFRAMES = ['20s', '1m', '5m', '15m', '1h', '4h', '1d'];
const WS_URL = 'ws://localhost:3000';

// decalaj in secunde ca axa graficului sa afiseze ora locala in loc de UTC
const TZ_OFFSET_SEC = -new Date().getTimezoneOffset() * 60;
const toLocal  = (t) => t + TZ_OFFSET_SEC;
const fromLocal = (t) => t - TZ_OFFSET_SEC;

const showSeconds = (tf) => tf === '20s' || tf === '1m';

const TradingViewChart = ({ assetId, symbol }) => {
  const containerRef  = useRef(null);
  const chartRef      = useRef(null);
  const candleRef     = useRef(null);
  const volumeRef     = useRef(null);
  const wsRef         = useRef(null);
  const tfRef         = useRef('1m');
  const reconnectRef  = useRef(null);

  const [timeframe, setTimeframe]   = useState('1m');
  const [lastCandle, setLastCandle] = useState(null);

  // ── 1. initializarea graficului (o singura data) ──────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: 'solid', color: '#0b0e14' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: 'rgba(43,49,57,0.5)', style: 1 },
        horzLines: { color: 'rgba(43,49,57,0.5)', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#848e9c', width: 1, style: 3, labelBackgroundColor: '#3b82f6' },
        horzLine: { color: '#848e9c', width: 1, style: 3, labelBackgroundColor: '#3b82f6' },
      },
      localization: {
        // afisam ora in fusul orar local pe eticheta crosshair-ului
        timeFormatter: (unixSec) => {
          const d = new Date(fromLocal(unixSec) * 1000);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        },
      },
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      timeScale: {
        timeVisible:    true,
        secondsVisible: showSeconds(tfRef.current),
        borderColor:    '#2b3139',
        rightOffset:    8,
        barSpacing:     8,
        fixLeftEdge:    false,
      },
      rightPriceScale: {
        borderColor: '#2b3139',
        autoScale:   true,
      },
      handleScroll: true,
      handleScale:  true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:      '#2ebd85',
      downColor:    '#f6465d',
      borderVisible: false,
      wickUpColor:   '#2ebd85',
      wickDownColor: '#f6465d',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color:       '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current   = chart;
    candleRef.current  = candleSeries;
    volumeRef.current  = volumeSeries;

    const onResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current  = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // ── 2. actualizam secondsVisible cand se schimba timeframe-ul ──────────────────────────
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        timeScale: { secondsVisible: showSeconds(timeframe) },
      });
    }
  }, [timeframe]);

  // ── 3. incarcam istoricul si ne abonam la WebSocket de fiecare data cand se schimba simbolul/timeframe-ul ─
  const connect = useCallback(async (sym, tf) => {
    if (!sym || !candleRef.current) return;

    // inchidem conexiunea WebSocket anterioara inainte de a deschide una noua
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    clearTimeout(reconnectRef.current);

    try {
      // incarcam istoricul de lumanari de la server pentru simbolul si timeframe-ul curent
      const res = await fetch(`http://localhost:3000/api/assets/history/${assetId}?timeframe=${tf}`);
      const candles = await res.json();
      if (candleRef.current && candles.length > 0) {
        // convertim timestamp-urile in fusul orar local ca axa sa afiseze ora locala
        const localCandles = candles.map(c => ({ ...c, time: toLocal(c.time) }));
        candleRef.current.setData(localCandles);
        volumeRef.current.setData(
          localCandles.map(c => ({
            time:  c.time,
            value: c.volume || 0,
            color: c.close >= c.open ? 'rgba(46,189,133,0.4)' : 'rgba(246,70,93,0.4)',
          }))
        );
        setLastCandle(localCandles[localCandles.length - 1]);
        chartRef.current.timeScale().scrollToRealTime();
      }
    } catch (_) {}

    // deschidem o conexiune WebSocket noua si ne abonam la actualizari live pentru acest simbol/timeframe
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', symbol: sym, timeframe: tf }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (
          msg.type === 'candle' &&
          msg.symbol === sym &&
          msg.timeframe === tfRef.current &&
          candleRef.current
        ) {
          const c = { ...msg.candle, time: toLocal(msg.candle.time) };
          candleRef.current.update(c);
          volumeRef.current.update({
            time:  c.time,
            value: c.volume || 0,
            color: c.close >= c.open ? 'rgba(46,189,133,0.4)' : 'rgba(246,70,93,0.4)',
          });
          setLastCandle(c);
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      // reconectam automat dupa 3 secunde, doar daca timeframe-ul nu s-a schimbat intre timp
      reconnectRef.current = setTimeout(() => {
        if (tfRef.current === tf) connect(sym, tf);
      }, 3000);
    };
  }, [assetId]);

  useEffect(() => {
    tfRef.current = timeframe;
    if (symbol && assetId) connect(symbol, timeframe);

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      clearTimeout(reconnectRef.current);
    };
  }, [symbol, assetId, timeframe, connect]);

  // ── 4. randare ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* bara de selectare a timeframe-ului */}
      <div style={{
        display: 'flex', gap: '4px', padding: '6px 10px',
        background: '#0b0e14', borderBottom: '1px solid #2b3139',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              padding: '3px 10px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: timeframe === tf ? '700' : '400',
              background: timeframe === tf ? '#3b82f6' : 'transparent',
              color: timeframe === tf ? '#fff' : '#848e9c',
              transition: 'all 0.15s',
            }}
          >
            {tf}
          </button>
        ))}

        {lastCandle && (
          <div style={{
            marginLeft: 'auto', display: 'flex', gap: '12px',
            fontSize: '12px', color: '#848e9c',
          }}>
            <span>O <strong style={{ color: '#fff' }}>{lastCandle.open?.toFixed(2)}</strong></span>
            <span>H <strong style={{ color: '#2ebd85' }}>{lastCandle.high?.toFixed(2)}</strong></span>
            <span>L <strong style={{ color: '#f6465d' }}>{lastCandle.low?.toFixed(2)}</strong></span>
            <span>C <strong style={{
              color: lastCandle.close >= lastCandle.open ? '#2ebd85' : '#f6465d'
            }}>{lastCandle.close?.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      {/* zona graficului propriu-zis */}
      <div ref={containerRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
};

export default TradingViewChart;
