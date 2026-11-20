import { useCallback, useEffect, useRef, useState } from "react";
import {
  EAutoRange,
  FastLineRenderableSeries,
  MouseWheelZoomModifier,
  NumberRange,
  NumericAxis,
  SciChartJsNavyTheme,
  SciChartSurface,
  XyDataSeries,
  ZoomExtentsModifier,
  ZoomPanModifier,
} from "scichart";
import { SciChartReact } from "scichart-react";
import "./App.css";

SciChartSurface.loadWasmLocal();

const POINTS_PER_TICK = 1000;
const UPDATE_INTERVAL_MS = 10;
const MAX_POINTS_PER_SERIES = 100_000;
const STATS_INTERVAL_MS = 500;
const SERIES_COLORS = ["#ff5722", "#2196f3", "#4caf50"];

class RandomWalkGenerator {
  constructor(xStart = 0, yStart = 10) {
    this.x = xStart;
    this.y = yStart;
  }

  getSeries(count) {
    const xValues = [];
    const yValues = [];
    for (let i = 0; i < count; i += 1) {
      this.x += 1;
      this.y += Math.random() * 2 - 1;
      xValues.push(this.x);
      yValues.push(this.y);
    }
    return { xValues, yValues };
  }
}

function RealtimeChart() {
  const [fps, setFps] = useState(0);
  const [pointCount, setPointCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  const chartRef = useRef(null);
  const updateTimerRef = useRef(null);
  const statsTimerRef = useRef(null);
  const isRunningRef = useRef(false);
  const renderCountRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (updateTimerRef.current !== null) {
      window.clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    if (statsTimerRef.current !== null) {
      window.clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  const stopUpdate = useCallback(() => {
    clearTimers();
    setIsRunning(false);
  }, [clearTimers]);

  const initChart = useCallback(
    async (rootElement) => {
      const { sciChartSurface, wasmContext } = await SciChartSurface.create(
        rootElement,
        { theme: new SciChartJsNavyTheme() },
      );

      sciChartSurface.xAxes.add(
        new NumericAxis(wasmContext, {
          autoRange: EAutoRange.Always,
          growBy: new NumberRange(0.1, 0.1),
        }),
      );
      sciChartSurface.yAxes.add(
        new NumericAxis(wasmContext, {
          autoRange: EAutoRange.Always,
          growBy: new NumberRange(0.1, 0.1),
        }),
      );

      const dataSeriesList = SERIES_COLORS.map((stroke, index) => {
        const dataSeries = new XyDataSeries(wasmContext, {
          fifoCapacity: MAX_POINTS_PER_SERIES,
          dataSeriesName: `Series ${index + 1}`,
          dataIsSortedInX: true,
          dataEvenlySpacedInX: true,
          containsNaN: false,
        });
        sciChartSurface.renderableSeries.add(
          new FastLineRenderableSeries(wasmContext, {
            dataSeries,
            stroke,
            strokeThickness: 2,
          }),
        );
        return dataSeries;
      });

      sciChartSurface.chartModifiers.add(
        new ZoomPanModifier(),
        new MouseWheelZoomModifier(),
        new ZoomExtentsModifier(),
      );

      renderCountRef.current = 0;
      const onRendered = () => {
        renderCountRef.current += 1;
      };
      sciChartSurface.rendered.subscribe(onRendered);

      chartRef.current = {
        sciChartSurface,
        dataSeriesList,
        generators: [
          new RandomWalkGenerator(0, 10),
          new RandomWalkGenerator(0, 20),
          new RandomWalkGenerator(0, 30),
        ],
      };

      return {
        sciChartSurface,
        destructor: () => {
          sciChartSurface.rendered.unsubscribe(onRendered);
          if (chartRef.current?.sciChartSurface === sciChartSurface) {
            clearTimers();
            chartRef.current = null;
          }
        },
      };
    },
    [clearTimers],
  );

  const handleChartInit = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const handleChartDelete = useCallback(
    ({ sciChartSurface }) => {
      if (chartRef.current?.sciChartSurface === sciChartSurface) {
        clearTimers();
        chartRef.current = null;
        setIsRunning(false);
        setIsChartReady(false);
      }
    },
    [clearTimers],
  );

  const startUpdate = useCallback(() => {
    const chart = chartRef.current;
    if (isRunningRef.current || !chart) return;

    isRunningRef.current = true;
    setIsRunning(true);
    let previousRenderCount = renderCountRef.current;
    let previousStatsTime = performance.now();

    updateTimerRef.current = window.setInterval(() => {
      const currentChart = chartRef.current;
      if (
        currentChart?.sciChartSurface !== chart.sciChartSurface ||
        chart.sciChartSurface.isDeleted
      ) {
        stopUpdate();
        return;
      }

      chart.dataSeriesList.forEach((dataSeries, index) => {
        const { xValues, yValues } = chart.generators[index].getSeries(
          POINTS_PER_TICK,
        );
        dataSeries.appendRange(xValues, yValues);
      });
    }, UPDATE_INTERVAL_MS);

    statsTimerRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - previousStatsTime;
      setFps(
        elapsed > 0
          ? Math.round(
              ((renderCountRef.current - previousRenderCount) * 1000) / elapsed,
            )
          : 0,
      );
      setPointCount(chart.dataSeriesList[0].count());
      previousRenderCount = renderCountRef.current;
      previousStatsTime = now;
    }, STATS_INTERVAL_MS);
  }, [stopUpdate]);

  useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers],
  );

  return (
    <main className="app">
      <header className="app-header">
        <p className="eyebrow">SciChart.js + React</p>
        <h1>High-frequency live chart</h1>
        <p>
          Three live random walks, each receiving 1,000 points every 10 ms.
          Pause updates to explore the data.
        </p>
      </header>

      <section className="chart-controls" aria-label="Chart controls">
        <button
          className="control-button control-button-primary"
          onClick={startUpdate}
          disabled={!isChartReady || isRunning}
        >
          Start updates
        </button>
        <button
          className="control-button"
          onClick={stopUpdate}
          disabled={!isRunning}
        >
          Stop
        </button>
        <div className="chart-stat" aria-live="polite">
          <span className="chart-stat-label">Render FPS</span>
          <strong>{fps}</strong>
        </div>
        <div className="chart-stat" aria-live="polite">
          <span className="chart-stat-label">Points / series</span>
          <strong>
            {pointCount.toLocaleString()} / {MAX_POINTS_PER_SERIES.toLocaleString()}
          </strong>
        </div>
      </section>

      <section className="chart-frame" aria-label="Live multi-series chart">
        <SciChartReact
          initChart={initChart}
          onInit={handleChartInit}
          onDelete={handleChartDelete}
          className="chart"
          style={{ width: "100%", height: "100%" }}
          fallback={<div className="chart-loading">Initializing chart...</div>}
        />
      </section>

      <p className="chart-hint">
        Drag to pan, scroll to zoom, and use the chart’s zoom-extents control to
        reset the view. Each series retains its latest{" "}
        {MAX_POINTS_PER_SERIES.toLocaleString()} points.
      </p>

      <section className="licensing" aria-labelledby="licensing-heading">
        <h2 id="licensing-heading">Licensing</h2>
        <p>
          SciChart.js is commercial software with a{" "}
          <a href="https://scichart.com/community-licensing">
            free Community License
          </a>
          . Trial licenses are not required for SciChart.js 3.2 and later.
        </p>
        <p>
          For commercial use, see the{" "}
          <a href="https://scichart.com/licensing-scichart-js">
            SciChart.js licensing guide
          </a>
          .
        </p>
      </section>
    </main>
  );
}

export default RealtimeChart;
