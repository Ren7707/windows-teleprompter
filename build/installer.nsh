!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!ifndef BUILD_UNINSTALLER
Var InstallModelsCheckbox
Var InstallModels
!endif

!macro customInit
  !insertmacro setInstallModePerUser
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

  ${NSD_CreateLabel} 0 0 100% 50u "Speech recognition requires local model files. Downloading the model is recommended. Without it, the app can still run, but speech recognition and auto paging may not work. Models will be saved to C:\Temp\teleprompter-models\bilingual."
  Pop $0

  ${NSD_CreateCheckbox} 0 62u 100% 14u "Download local speech recognition model (recommended, about 340 MB)"
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
    MessageBox MB_ICONEXCLAMATION|MB_OK "You chose not to install the local model. The app can still start, but speech recognition and auto paging may not work."
  ${EndIf}
FunctionEnd
!endif

!macro customInstall
  ${If} $InstallModels == ${BST_CHECKED}
    DetailPrint "Downloading offline speech recognition model..."
    ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\download-models.ps1"' $0
    ${If} $0 != 0
      MessageBox MB_ICONEXCLAMATION|MB_OK "Local model download failed. The app can still start, but speech recognition and auto paging may not work. You can manually download models later to C:\Temp\teleprompter-models\bilingual."
    ${EndIf}
  ${EndIf}
!macroend
