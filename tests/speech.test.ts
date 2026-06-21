import { describe, expect, it, vi } from 'vitest';
import { createDisabledRecognizer, createSherpaRecognizer, resolveBilingualModelFiles } from '../src/core/speech';

describe('disabled recognizer', () => {
  it('starts and stops without emitting text', async () => {
    const onText = vi.fn();
    const recognizer = createDisabledRecognizer();
    await recognizer.start({ language: 'zh', onText });
    await recognizer.stop();
    expect(onText).not.toHaveBeenCalled();
  });
});

describe('sherpa recognizer adapter', () => {
  it('resolves bilingual model files', () => {
    expect(resolveBilingualModelFiles('models/bilingual')).toEqual({
      encoder: 'models/bilingual/encoder-epoch-99-avg-1.onnx',
      decoder: 'models/bilingual/decoder-epoch-99-avg-1.onnx',
      joiner: 'models/bilingual/joiner-epoch-99-avg-1.onnx',
      tokens: 'models/bilingual/tokens.txt'
    });
  });

  it('emits recognized text from injected sherpa and microphone bindings', async () => {
    let onData: ((data: Float32Array) => void) | undefined;
    const onText = vi.fn();
    const stream = {
      acceptWaveform: vi.fn(),
      inputFinished: vi.fn()
    };
    let ready = true;
    const recognizer = {
      createStream: () => stream,
      isReady: () => {
        const value = ready;
        ready = false;
        return value;
      },
      decode: vi.fn(),
      getResult: () => ({ text: '欢迎使用提词器' }),
      isEndpoint: () => false,
      reset: vi.fn()
    };
    const sherpa = {
      OnlineRecognizer: vi.fn(function OnlineRecognizer() {
        return recognizer;
      })
    };
    const cpal = {
      getDefaultInputDevice: () => ({ deviceId: 'mic' }),
      getDefaultInputConfig: () => ({ sampleRate: 48000, channels: 1, sampleFormat: 'f32' }),
      createInputStream: vi.fn((options) => {
        onData = options.onData;
        return { streamId: 'stream' };
      }),
      closeStream: vi.fn()
    };

    const adapter = createSherpaRecognizer({
      modelDir: 'models/bilingual',
      exists: () => true,
      sherpa,
      cpal
    });

    await adapter.start({ language: 'zh', onText });
    onData?.(new Float32Array([0.1, 0.2]));
    await adapter.stop();

    expect(onText).toHaveBeenCalledWith('欢迎使用提词器');
    expect(stream.acceptWaveform).toHaveBeenCalledWith({
      samples: new Float32Array([0.1, 0.2]),
      sampleRate: 48000
    });
    expect(cpal.closeStream).toHaveBeenCalledWith({ streamId: 'stream' });
  });
});
