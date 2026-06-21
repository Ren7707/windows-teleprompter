# Teleprompter

Windows desktop teleprompter with a translucent floating prompt window, manual sentence shortcuts, and offline Chinese/English speech-following support.

## Features

- Windows EXE desktop app
- Script management and history
- Always-on-top translucent floating prompt window
- Configurable previous/next sentence shortcuts
- Offline Chinese/English recognition design using sherpa-onnx
- Chinese, English, and Japanese UI

## Development

```bash
npm install
npm test
npm run dev
```

In another terminal:

```bash
npm run electron
```

## Models

Model binaries are not committed. The app loads models from an ASCII path by default:

```text
C:/Temp/teleprompter-models/bilingual/
```

You can override this with `TELEPROMPTER_MODEL_DIR`.

First target:

```text
models/bilingual/
  encoder-epoch-99-avg-1.onnx
  decoder-epoch-99-avg-1.onnx
  joiner-epoch-99-avg-1.onnx
  tokens.txt
```

## Build

```bash
npm run build
npm run package
```
