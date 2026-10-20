# RRGs · Pulau Idaman

Independent 3D animated board environment. The original RRG-Game-Website project is not modified.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5190. For a production bundle, run `npm run build`.

## Controls

- Drag to orbit; right-drag to pan; scroll or pinch to zoom.
- Switch between 2.5D and top-down views.
- Click tokens or landmarks to inspect exact coordinates.
- Collect money bags, diamonds, chests and bulbs with the inspection button.
- Pause animation, toggle the grid, or reset the camera from the toolbar.
- Open How to explore to reset the collectible session.

This is an animated exploration environment, not a replacement implementation of the original turn-based mathematics game. Collection is a session-only demonstration. The logo and QR artwork are displayed directly from a copied original board image; no QR destination is invented. The environment uses real-time stylized 3D geometry, rather than a flat background image. All external code dependencies are bundled by Vite; optional Google Fonts fall back to system fonts.
