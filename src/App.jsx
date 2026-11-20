import {
  EAxisType,
  EChart2DModifierType,
  EPointMarkerType,
  ESeriesType,
  NumberRange,
  SciChartJsNavyTheme,
  SciChartSurface,
  SweepAnimation,
} from "scichart";
import { SciChartDeclarative } from "scichart-react";
import "./App.css";

SciChartSurface.loadWasmLocal();

const chartConfig = {
  surface: {
    theme: new SciChartJsNavyTheme(),
    title: "SciChart.js First Chart",
    titleStyle: { fontSize: 22 },
  },
  xAxes: [
    {
      type: EAxisType.NumericAxis,
      options: {
        axisTitle: "X Axis",
        growBy: new NumberRange(0.1, 0.1),
      },
    },
  ],
  yAxes: [
    {
      type: EAxisType.NumericAxis,
      options: {
        axisTitle: "Y Axis",
        growBy: new NumberRange(0.1, 0.1),
      },
    },
  ],
  series: [
    {
      type: ESeriesType.LineSeries,
      xyData: {
        xValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        yValues: [
          0, 0.0998, 0.1986, 0.2955, 0.3894, 0.4794, 0.5646, 0.6442, 0.7173,
          0.7833,
        ],
      },
      options: {
        stroke: "steelblue",
        strokeThickness: 3,
        pointMarker: {
          type: EPointMarkerType.Ellipse,
          options: {
            width: 11,
            height: 11,
            fill: "#fff",
          },
        },
        animation: new SweepAnimation({
          duration: 300,
          fadeEffect: true,
        }),
      },
    },
  ],
  modifiers: [
    { type: EChart2DModifierType.MouseWheelZoom },
    {
      type: EChart2DModifierType.ZoomPan,
      options: { enableZoom: true },
    },
    { type: EChart2DModifierType.ZoomExtents },
  ],
};

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <p className="eyebrow">SciChart.js + React</p>
        <h1>SciChart.js with React</h1>
        <p>
          An interactive line chart with local WebAssembly, animated data, and
          zoom and pan controls.
        </p>
      </header>
      <section className="chart-frame" aria-label="Interactive line chart">
        <SciChartDeclarative config={chartConfig} className="chart" />
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

export default App;
