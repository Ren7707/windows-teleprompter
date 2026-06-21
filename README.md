# Teleprompter

轻量化 Windows 悬浮窗提词器，适合视频会议、录课、直播和自媒体创作场景。应用提供一个置顶的半透明提词窗口，支持文档导入、历史文稿管理、快捷键翻句，以及基于本地模型的中英文离线语音识别自动翻页。

> 当前版本仅支持 Windows。

## 功能特性

- 深色毛玻璃风格主界面，支持中文、英文、日语 UI。
- 可导入 `TXT`、`DOCX`、`PDF` 文档，并自动拆分为适合朗读的提词行。
- 历史文档管理，支持加载、重命名和删除导入文档。
- 悬浮提词窗口置顶显示，支持拖动、缩放、圆角亚克力半透明效果。
- 提词窗口采用三行歌词式布局：上一句、当前句、下一句。
- 当前句高亮显示，文字在窗口内居中显示。
- 支持上一句、下一句快捷键。
- 支持离线中文 / 英文语音识别，根据文稿语言自动匹配识别语言。
- 支持朗读到当前句末尾时提前翻到下一句。
- 支持麦克风测试、测试文稿、字体颜色、字号、透明度和高亮颜色设置。
- 安装器支持自定义安装路径。
- 安装时可选择是否下载本地语音识别模型。

## 安装

从 GitHub Release 下载最新版安装包：

[Teleprompter v0.1.3](https://github.com/Ren7707/windows-teleprompter/releases/tag/v0.1.3)

安装过程中可以选择是否下载本地语音识别模型。如果不下载模型，应用仍可启动并使用手动提词功能，但语音识别和自动翻页可能无法正常运行。

默认模型目录：

```text
C:/Temp/teleprompter-models/bilingual/
```

也可以通过环境变量覆盖模型目录：

```text
TELEPROMPTER_MODEL_DIR
```

## 使用方式

1. 启动应用。
2. 导入 `TXT`、`DOCX` 或 `PDF` 文档，或直接在编辑区输入文稿。
3. 在预览区检查自动切分后的提词行。
4. 根据需要调整字号、颜色、透明度、快捷键和语音识别设置。
5. 点击“启动提词”打开悬浮提词窗口。
6. 朗读文稿，或使用快捷键切换上一句 / 下一句。

## 语音识别模型

当前版本使用 sherpa-onnx 中英文流式识别模型：

```text
csukuangfj/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20
```

安装器会按需下载以下文件：

```text
encoder-epoch-99-avg-1.onnx
decoder-epoch-99-avg-1.onnx
joiner-epoch-99-avg-1.onnx
tokens.txt
```

模型文件不提交到 Git 仓库。

## 本地开发

安装依赖：

```bash
npm install
```

启动前端开发服务器：

```bash
npm run dev
```

另开一个终端启动 Electron：

```bash
npm run electron
```

也可以使用一键测试脚本：

```bash
npm run start:test
```

## 测试与打包

运行测试：

```bash
npm test
```

构建应用：

```bash
npm run build
```

生成 Windows 安装包：

```bash
npm run package
```

安装包默认输出到：

```text
%TEMP%/teleprompter-release/
```

## 技术栈

- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- sherpa-onnx-node
- node-cpal
- electron-builder

## 当前状态

项目处于个人作品首个公开版本阶段。核心提词、文档管理、快捷键、离线语音识别、安装包和 GitHub Release 流程已跑通。
