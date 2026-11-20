import { useCallback, useRef, useState } from "react";
import {
  CameraController,
  GradientColorPalette,
  MouseWheelZoomModifier3D,
  NumberRange,
  NumericAxis3D,
  OrbitModifier3D,
  ResetCamera3DModifier,
  SciChart3DSurface,
  SciChartJsNavyTheme,
  SciChartSurface,
  SurfaceMeshRenderableSeries3D,
  UniformGridDataSeries3D,
  Vector3,
  zeroArray2D,
} from "scichart";
import { SciChartReact } from "scichart-react";
import "./App.css";

SciChartSurface.loadWasmLocal();

const GRID_SIZE = 50;
const UPDATE_INTERVAL_MS = 20;

function Realtime3DChart() {
  const [isRunning, setIsRunning] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartRef = useRef(null);

  const initChart = useCallback(async (rootElement) => {
    const { sciChart3DSurface, wasmContext } = await SciChart3DSurface.create(
      rootElement,
      { theme: new SciChartJsNavyTheme() },
    );

    sciChart3DSurface.camera = new CameraController(wasmContext, {
      position: new Vector3(-150, 200, 150),
      target: new Vector3(GRID_SIZE / 2, 0, GRID_SIZE / 2),
    });
    sciChart3DSurface.worldDimensions = new Vector3(200, 100, 200);

    sciChart3DSurface.xAxis = new NumericAxis3D(wasmContext, {
      axisTitle: "X",
    });
    sciChart3DSurface.yAxis = new NumericAxis3D(wasmContext, {
      axisTitle: "Y",
      visibleRange: new NumberRange(-0.6, 0.6),
    });
    sciChart3DSurface.zAxis = new NumericAxis3D(wasmContext, {
      axisTitle: "Z",
    });

    const heightmap = zeroArray2D([GRID_SIZE, GRID_SIZE]);
    const dataSeries = new UniformGridDataSeries3D(wasmContext, {
      yValues: heightmap,
      xStep: 1,
      zStep: 1,
    });
    const yValues = dataSeries.getYValues();

    const colorPalette = new GradientColorPalette(wasmContext, {
      gradientStops: [
        { offset: 0, color: "#14233c" },
        { offset: 0.5, color: "#50c7e0" },
        { offset: 1, color: "#ec0f6c" },
      ],
    });

    sciChart3DSurface.renderableSeries.add(
      new SurfaceMeshRenderableSeries3D(wasmContext, {
        dataSeries,
        meshColorPalette: colorPalette,
        minimum: -0.5,
        maximum: 0.5,
      }),
    );
    sciChart3DSurface.chartModifiers.add(
      new MouseWheelZoomModifier3D(),
      new OrbitModifier3D(),
      new ResetCamera3DModifier(),
    );

    let timerId = null;
    let frame = 0;
    const updateData = () => {
      const phase = frame / 10;
      for (let z = 0; z < GRID_SIZE; z += 1) {
        for (let x = 0; x < GRID_SIZE; x += 1) {
          yValues[z][x] =
            Math.cos((x + phase) * 0.2) *
            Math.sin((z + phase) * 0.2) *
            0.5;
        }
      }
      dataSeries.notifyDataChanged();
      frame += 1;
    };

    const controls = {
      startUpdate: () => {
        if (timerId === null) {
          timerId = window.setInterval(updateData, UPDATE_INTERVAL_MS);
        }
      },
      stopUpdate: () => {
        if (timerId !== null) {
          window.clearInterval(timerId);
          timerId = null;
        }
      },
    };

    return {
      sciChartSurface: sciChart3DSurface,
      controls,
      destructor: controls.stopUpdate,
    };
  }, []);

  const handleChartInit = useCallback((chart) => {
    chartRef.current = chart;
    chart.controls.startUpdate();
    setIsChartReady(true);
    setIsRunning(true);
  }, []);

  const handleChartDelete = useCallback((chart) => {
    chart.controls.stopUpdate();
    if (chartRef.current === chart) {
      chartRef.current = null;
      setIsChartReady(false);
      setIsRunning(false);
    }
  }, []);

  const toggleSimulation = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (isRunning) {
      chart.controls.stopUpdate();
      setIsRunning(false);
    } else {
      chart.controls.startUpdate();
      setIsRunning(true);
    }
  }, [isRunning]);

  return (
    <main className="app">
      <header className="app-header">
        <p className="eyebrow">SciChart.js + React</p>
        <h1>Realtime Surface Mesh 3D Chart</h1>
        <p>
          A 50 x 50 height map animates at 50 updates per second. Orbit the
          surface by dragging and zoom with the mouse wheel.
        </p>
      </header>

      <section className="chart-controls" aria-label="Chart controls">
        <button
          className="control-button control-button-primary"
          onClick={toggleSimulation}
          disabled={!isChartReady}
        >
          {isRunning ? "Pause simulation" : "Resume simulation"}
        </button>
        <span className="simulation-status" aria-live="polite">
          {isRunning ? "Live - 50 updates/sec" : "Paused"}
        </span>
        <span className="chart-hint-inline">
          Drag to orbit | Scroll to zoom | Double-click to reset the camera
        </span>
      </section>

      <section className="chart-frame" aria-label="Realtime 3D surface mesh">
        <SciChartReact
          initChart={initChart}
          onInit={handleChartInit}
          onDelete={handleChartDelete}
          className="chart"
          style={{ width: "100%", height: "100%" }}
          fallback={<div className="chart-loading">Initializing 3D chart...</div>}
        />
      </section>

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

export default Realtime3DChart;
