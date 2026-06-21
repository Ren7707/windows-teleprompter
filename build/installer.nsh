!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!ifndef BUILD_UNINSTALLER
Var InstallModelsCheckbox
Var InstallModels
!endif

!macro customInit
  StrCpy $InstallModels ${BST_CHECKED}
!macroend

!ifndef BUILD_UNINSTALLER
!macro customPageAfterChangeDir
  Page custom ModelOptionsPage ModelOptionsLeave
!macroend

Function ModelOptionsPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 50u "语音识别依赖本地模型文件。建议下载安装本地模型，否则提词器仍可使用，但语音识别和自动翻页可能无法正常运行。模型会下载到 C:\Temp\teleprompter-models\bilingual。"
  Pop $0

  ${NSD_CreateCheckbox} 0 62u 100% 14u "下载并安装本地语音识别模型（推荐，约 340 MB）"
  Pop $InstallModelsCheckbox

  ${If} $InstallModels == ${BST_CHECKED}
    ${NSD_Check} $InstallModelsCheckbox
  ${Else}
    ${NSD_Uncheck} $InstallModelsCheckbox
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function ModelOptionsLeave
  ${NSD_GetState} $InstallModelsCheckbox $InstallModels

  ${If} $InstallModels == ${BST_UNCHECKED}
    MessageBox MB_ICONEXCLAMATION|MB_OK "你选择了不安装本地模型。程序可以正常启动，但语音识别和自动翻页功能可能无法正常运行。"
  ${EndIf}
FunctionEnd
!endif

!macro customInstall
  ${If} $InstallModels == ${BST_CHECKED}
    DetailPrint "Downloading offline speech recognition model..."
    ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\download-models.ps1"' $0
    ${If} $0 != 0
      MessageBox MB_ICONEXCLAMATION|MB_OK "本地模型下载失败。程序可以正常启动，但语音识别和自动翻页功能可能无法正常运行。你可以稍后手动下载模型到 C:\Temp\teleprompter-models\bilingual。"
    ${EndIf}
  ${EndIf}
!macroend
