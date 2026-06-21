# Windows Teleprompter Design

## Goal

Build a lightweight Windows-only teleprompter app that starts as an EXE, shows a main management page first, and can launch a draggable, resizable, always-on-top translucent floating prompt window.

## Scope

First version:

- Windows only.
- Offline speech recognition only.
- Chinese and English recognition.
- One script uses one language at a time.
- Automatically detect whether the script is Chinese or English.
- Use one bilingual model if quality and latency are acceptable.
- Use separate Chinese and English models only if the bilingual model is not good enough in testing.
- Keep the recognition architecture ready for Japanese support later.
- UI supports Chinese, English, and Japanese.
- Teleprompter content supports Chinese and English in the first version.

Out of scope for the first version:

- Online speech recognition.
- Mixed-language scripts.
- Japanese speech recognition.
- Cloud sync.
- Recording, streaming, or video meeting integration.
- Template marketplace or complex document management.

## Recommended Stack

- Desktop shell: Electron.
- Frontend: React.
- Speech recognition: sherpa-onnx.
- Storage: local JSON or SQLite, decided during implementation based on package size and existing dependency cost.
- Packaging: Electron Builder or equivalent Windows EXE packaging.

Electron is chosen because the app needs a main page, transparent always-on-top floating windows, global shortcuts, local storage, microphone access, and Windows EXE packaging. Tauri stays as a future option only if Electron package size becomes unacceptable.

## Speech Recognition

Use sherpa-onnx for offline streaming recognition.

Preferred first model:

- A sherpa-onnx Chinese-English bilingual streaming model.

Fallback:

- One Chinese streaming model.
- One English streaming model.

Future Japanese support:

- Add a Japanese model entry to the same model registry.
- Extend script language detection from `zh | en` to `zh | en | ja`.
- Keep matching logic language-aware so Japanese can use a different sentence splitter and similarity function later.

## Language Detection

Detect script language before starting the teleprompter:

- If CJK Unified Ideographs dominate, classify as `zh`.
- If Latin letters dominate, classify as `en`.
- If neither side is clear, ask the user to choose.

The first version should not guess mixed-language scripts.

## Main Window

The EXE starts with the main window.

Main areas:

- Script management.
- History.
- Settings.
- Floating window live preview.
- Start teleprompter action.

Script management:

- Create script.
- Edit script title.
- Edit script body.
- Save script.
- Load recent script.

History:

- Show recently used scripts.
- Reopen a previous script.
- Store last used language and settings with the script where useful.

Settings:

- UI language: Chinese, English, Japanese.
- Manual shortcut for previous sentence.
- Manual shortcut for next sentence.
- Speech recognition toggle.
- Floating window opacity.
- Floating window background effect.
- Font size.
- Font color.
- Highlight color.
- Window width and height defaults.

Font size, opacity, and color are configured only in UI settings. They do not get dedicated shortcuts.

## Floating Window

The floating teleprompter window:

- Always on top.
- Transparent or translucent.
- Borderless.
- Draggable.
- Resizable.
- Can be moved anywhere on the desktop.
- Shows the current sentence highlighted.
- Shows nearby sentences for context.
- Scrolls automatically when the current sentence changes.

The floating window should stay visually simple. Complex settings remain in the main window.

## Prompt Flow

1. User creates or opens a script.
2. App detects script language.
3. App splits script into sentence blocks.
4. User clicks start teleprompter.
5. App opens the floating window.
6. If speech recognition is enabled, app loads the matching offline recognizer.
7. App streams microphone audio to the recognizer.
8. Recognized text is matched against the current and next sentence.
9. When the next sentence is matched with enough confidence, the app advances and highlights it.
10. User can override with previous or next sentence shortcut.

## Sentence Matching

The first version should keep matching simple:

- Normalize punctuation and whitespace.
- Compare recognition output against the current sentence and next sentence.
- Advance only when the next sentence score passes a threshold.
- Avoid jumping more than one sentence at a time.
- If confidence is unclear, stay on the current sentence.

This prioritizes low-latency stable prompting over aggressive automatic jumps.

## Global Shortcuts

Only two global shortcuts are required:

- Previous sentence.
- Next sentence.

Shortcuts are configurable in settings.

## Persistence

Persist locally:

- Scripts.
- Script history.
- App settings.
- Last selected UI language.
- Shortcut configuration.
- Floating window style settings.

No cloud storage in the first version.

## GitHub Publication

The project is intended to be published on GitHub as a personal portfolio project.

Repository requirements:

- Include a clear README with screenshots, feature list, setup steps, model setup steps, and build instructions.
- Keep recognition model binaries out of Git.
- Document the expected local model directory.
- Include a `.gitignore` for dependencies, build output, local models, logs, and user data.
- Include a license before publishing.
- Keep secrets, personal data, and generated local history out of the repository.

## Internationalization

The app UI must support:

- Chinese.
- English.
- Japanese.

The first version recognition and teleprompter language support:

- Chinese.
- English.

Japanese UI support is included now so later Japanese recognition can be added without redesigning the settings surface.

## Error Handling

Required user-facing states:

- Microphone permission missing.
- Recognition model missing or failed to load.
- Script language cannot be detected confidently.
- Shortcut conflicts.
- Floating window already open.

When recognition fails, manual shortcuts and text display must still work.

## Testing Targets

Minimum verification:

- Script language detection returns `zh` for Chinese scripts.
- Script language detection returns `en` for English scripts.
- Ambiguous scripts require user selection.
- Sentence splitting works for Chinese punctuation.
- Sentence splitting works for English punctuation.
- Previous and next sentence shortcuts update the highlighted sentence.
- Floating window receives live style changes.
- Speech recognition can be disabled while manual prompting still works.

## Implementation Notes

Keep the first implementation small:

- No plugin system.
- No model download manager in the first version.
- No complex script folders or tags.
- No custom theme engine.

If model files are too large for the repository, document the expected local model directory and keep model binaries outside source control.
