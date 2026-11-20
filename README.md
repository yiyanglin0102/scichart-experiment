# SciChart.js React demo

A Vite + React example featuring a high-frequency, three-series live chart, numeric axes, and zoom/pan interactions. Each series receives 1,000 points every 10 ms and keeps a bounded 100,000-point FIFO window. SciChart.js WebAssembly assets are served locally from the app; chart rendering does not rely on a WASM CDN.

## Licensing

SciChart.js is commercial software with a [free Community License](https://scichart.com/community-licensing). Trial licenses are not required for SciChart.js 3.2 and later.

For commercial use, see the [SciChart.js licensing guide](https://scichart.com/licensing-scichart-js).

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and preview

```sh
npm run build
npm run preview
```

Vite copies the SciChart WebAssembly files from `node_modules/scichart/_wasm` into the build output.

## Learn more

- [Getting started with SciChart.js](https://www.scichart.com/getting-started-scichart-js)
- [SciChart.js documentation](https://www.scichart.com/documentation/js/current/webframe.html)
- [Official SciChart.js demos](https://demo.scichart.com/)
- [scichart-react on npm](https://www.npmjs.com/package/scichart-react)
