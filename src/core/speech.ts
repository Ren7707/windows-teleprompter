import type { ScriptLanguage } from '../types';

export interface SpeechStartOptions {
  language: Exclude<ScriptLanguage, 'unknown'>;
  onText: (text: string) => void;
}

export interface SpeechRecognizer {
  start(options: SpeechStartOptions): Promise<void>;
  stop(): Promise<void>;
}

interface SherpaOnlineStream {
  acceptWaveform(input: { samples: Float32Array; sampleRate: number }): void;
  inputFinished(): void;
}

interface SherpaOnlineRecognizer {
  createStream(): SherpaOnlineStream;
  isReady(stream: SherpaOnlineStream): boolean;
  decode(stream: SherpaOnlineStream): void;
  getResult(stream: SherpaOnlineStream): { text?: string };
  isEndpoint(stream: SherpaOnlineStream): boolean;
  reset(stream: SherpaOnlineStream): void;
}

interface SherpaBinding {
  OnlineRecognizer: new (config: unknown) => SherpaOnlineRecognizer;
}

interface CpalBinding {
  getDefaultInputDevice(): { deviceId: string };
  getDefaultInputConfig(deviceId: string): { sampleRate: number; channels: number; sampleFormat: string };
  createInputStream?(options: {
    deviceId: string;
    config: { sampleRate: number; channels: number; sampleFormat: string };
    onData: (data: Float32Array) => void;
  }): unknown;
  createStream?(
    deviceId: string,
    isInput: boolean,
    config: { sampleRate: number; channels: number; sampleFormat: string },
    onData: (data: Float32Array) => void
  ): unknown;
  closeStream(stream: unknown): void;
}

export interface SherpaRecognizerOptions {
  modelDir?: string;
  exists?: (file: string) => boolean;
  sherpa?: SherpaBinding;
  cpal?: CpalBinding;
}

export interface BilingualModelFiles {
  encoder: string;
  decoder: string;
  joiner: string;
  tokens: string;
}

export function createDisabledRecognizer(): SpeechRecognizer {
  return {
    async start() {},
    async stop() {}
  };
}

export function resolveBilingualModelFiles(modelDir: string): BilingualModelFiles {
  const root = modelDir.replace(/[\\/]+$/, '');
  return {
    encoder: `${root}/encoder-epoch-99-avg-1.onnx`,
    decoder: `${root}/decoder-epoch-99-avg-1.onnx`,
    joiner: `${root}/joiner-epoch-99-avg-1.onnx`,
    tokens: `${root}/tokens.txt`
  };
}

export function createSherpaRecognizer(options: SherpaRecognizerOptions = {}): SpeechRecognizer {
  let recognizer: SherpaOnlineRecognizer | undefined;
  let stream: SherpaOnlineStream | undefined;
  let audioStream: unknown;
  let lastText = '';

  return {
    async start({ onText }) {
      const modelDir = options.modelDir ?? getDefaultModelDir();
      const files = resolveBilingualModelFiles(modelDir);
      const exists = options.exists ?? ((file: string) => loadNodeModule<{ existsSync(path: string): boolean }>('node:fs').existsSync(file));

      for (const file of Object.values(files)) {
        if (!exists(file)) {
          throw new Error(`Missing sherpa-onnx model file: ${file}`);
        }
      }

      const sherpa = options.sherpa ?? loadNodeModule<SherpaBinding>('sherpa-onnx-node');
      const cpal = options.cpal ?? loadNodeModule<CpalBinding>('node-cpal');
      const inputDevice = cpal.getDefaultInputDevice();
      const inputConfig = cpal.getDefaultInputConfig(inputDevice.deviceId);

      recognizer = new sherpa.OnlineRecognizer({
        featConfig: {
          sampleRate: 16000,
          featureDim: 80
        },
        modelConfig: {
          transducer: {
            encoder: files.encoder,
            decoder: files.decoder,
            joiner: files.joiner
          },
          tokens: files.tokens,
          numThreads: 2,
          provider: 'cpu'
        },
        decodingMethod: 'greedy_search',
        maxActivePaths: 4,
        enableEndpoint: 1,
        rule1MinTrailingSilence: 1.2,
        rule2MinTrailingSilence: 0.8,
        rule3MinUtteranceLength: 20
      });
      stream = recognizer.createStream();

      const onData = (data: Float32Array) => {
        if (!recognizer || !stream) return;

        stream.acceptWaveform({
          samples: toMono(data, inputConfig.channels),
          sampleRate: inputConfig.sampleRate
        });

        while (recognizer.isReady(stream)) {
          recognizer.decode(stream);
        }

        const text = recognizer.getResult(stream).text?.trim() ?? '';
        if (text && text !== lastText) {
          lastText = text;
          onText(text);
        }

        if (recognizer.isEndpoint(stream)) {
          recognizer.reset(stream);
          lastText = '';
        }
      };

      audioStream = cpal.createInputStream
        ? cpal.createInputStream({ deviceId: inputDevice.deviceId, config: inputConfig, onData })
        : cpal.createStream?.(inputDevice.deviceId, true, inputConfig, onData);
    },
    async stop() {
      stream?.inputFinished();
      const cpal = options.cpal ?? loadNodeModule<CpalBinding>('node-cpal');
      if (audioStream) cpal.closeStream(audioStream);
      audioStream = undefined;
      stream = undefined;
      recognizer = undefined;
      lastText = '';
    }
  };
}

function toMono(data: Float32Array, channels: number) {
  if (channels <= 1) return data;

  const mono = new Float32Array(Math.floor(data.length / channels));
  for (let index = 0; index < mono.length; index += 1) {
    mono[index] = data[index * channels] ?? 0;
  }
  return mono;
}

function loadNodeModule<T>(name: string): T {
  return require(name) as T;
}

function getDefaultModelDir() {
  try {
    const process = loadNodeModule<{ env: Record<string, string | undefined> }>('node:process');
    return process.env.TELEPROMPTER_MODEL_DIR ?? 'C:/Temp/teleprompter-models/bilingual';
  } catch {
    return 'C:/Temp/teleprompter-models/bilingual';
  }
}
