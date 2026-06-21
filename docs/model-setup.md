# Model Setup

The app expects offline sherpa-onnx models under an ASCII path because the sherpa native addon fails to load model files from this project's Chinese path.

Runtime directory:

- `C:/Temp/teleprompter-models/bilingual/`

Optional override:

- Set `TELEPROMPTER_MODEL_DIR` to another ASCII model directory.

First model target:

- Chinese-English streaming sherpa-onnx model
- Source copy inside this project: `models/bilingual/`
- Runtime copy used by the app: `C:/Temp/teleprompter-models/bilingual/`
- Expected files:
  - `encoder-epoch-99-avg-1.onnx`
  - `decoder-epoch-99-avg-1.onnx`
  - `joiner-epoch-99-avg-1.onnx`
  - `tokens.txt`

Model binaries are not committed to Git. Download and unpack models manually during development.

Installer behavior:

- The Windows installer lets users choose whether to download the local speech model.
- If selected, the installer downloads model files from Hugging Face to `C:/Temp/teleprompter-models/bilingual/`.
- If skipped, the app can still launch, but offline speech recognition and automatic voice paging may not work.
- Existing model files in the runtime directory are kept and are not downloaded again.

Installer model source:

- `https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20`
