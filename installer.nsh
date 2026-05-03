; ============================================================
;  VORTEX FILE MANAGER — Custom NSIS Script
;  Registers file associations + Capabilities so Windows
;  shows Vortex in "Open With" and "Default Apps" settings.
; ============================================================

; ── Helper: register one file extension ──────────────────────
; Usage: !insertmacro RegisterExt ".mp4" "VortexPlayer" "Video File"
!macro RegisterExt EXT PROGID DESC
  ; Point extension → ProgID (per-user, no admin needed)
  WriteRegStr HKCU "Software\Classes\${EXT}" "" "${PROGID}"
  WriteRegStr HKCU "Software\Classes\${EXT}\OpenWithProgids" "${PROGID}" ""

  ; Register in "Open With" list for this extension
  WriteRegStr HKCU "Software\Classes\${EXT}\OpenWithList\Vortex File Manager.exe" "" ""
!macroend

; ── Helper: remove one extension registration ────────────────
!macro UnRegisterExt EXT PROGID
  DeleteRegValue HKCU "Software\Classes\${EXT}\OpenWithProgids" "${PROGID}"
  DeleteRegKey   HKCU "Software\Classes\${EXT}\OpenWithList\Vortex File Manager.exe"
!macroend

; ════════════════════════════════════════════════════════════
;  INSTALL — runs after files are copied
; ════════════════════════════════════════════════════════════
!macro customInstall

  ; ── 1. Register ProgIDs ────────────────────────────────────

  ; VortexPlayer ProgID (for video + audio)
  WriteRegStr HKCU "Software\Classes\VortexPlayer" "" "Media File"
  WriteRegStr HKCU "Software\Classes\VortexPlayer" "FriendlyTypeName" "Vortex Player"
  WriteRegStr HKCU "Software\Classes\VortexPlayer\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCU "Software\Classes\VortexPlayer\shell" "" "open"
  WriteRegStr HKCU "Software\Classes\VortexPlayer\shell\open" "" "Play with Vortex"
  WriteRegStr HKCU "Software\Classes\VortexPlayer\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

  ; VortexPDF ProgID (for PDF)
  WriteRegStr HKCU "Software\Classes\VortexPDF" "" "PDF Document"
  WriteRegStr HKCU "Software\Classes\VortexPDF" "FriendlyTypeName" "Vortex PDF Reader"
  WriteRegStr HKCU "Software\Classes\VortexPDF\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCU "Software\Classes\VortexPDF\shell" "" "open"
  WriteRegStr HKCU "Software\Classes\VortexPDF\shell\open" "" "Open with Vortex PDF Reader"
  WriteRegStr HKCU "Software\Classes\VortexPDF\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

  ; ── 2. Register Capabilities (shows in Windows Default Apps) ──

  WriteRegStr HKCU "Software\VortexFileManager\Capabilities" "ApplicationName"        "Vortex File Manager"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities" "ApplicationDescription" "Modern file manager with built-in video player and PDF reader"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities" "ApplicationIcon"        "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"

  ; Video file associations in Capabilities
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".mp4"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".mkv"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".avi"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".mov"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".wmv"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".webm" "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".m4v"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".flv"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".ogv"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".3gp"  "VortexPlayer"

  ; Audio file associations in Capabilities
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".mp3"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".wav"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".flac" "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".ogg"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".m4a"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".aac"  "VortexPlayer"
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".wma"  "VortexPlayer"

  ; PDF association in Capabilities
  WriteRegStr HKCU "Software\VortexFileManager\Capabilities\FileAssociations" ".pdf"  "VortexPDF"

  ; Register app in Windows "Registered Applications"
  WriteRegStr HKCU "Software\RegisteredApplications" "VortexFileManager" "Software\VortexFileManager\Capabilities"

  ; ── 3. Register each extension's OpenWithProgids ──────────

  !insertmacro RegisterExt ".mp4"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".mkv"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".avi"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".mov"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".wmv"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".webm" "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".m4v"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".flv"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".ogv"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".3gp"  "VortexPlayer" "Video File"
  !insertmacro RegisterExt ".mp3"  "VortexPlayer" "Audio File"
  !insertmacro RegisterExt ".wav"  "VortexPlayer" "Audio File"
  !insertmacro RegisterExt ".flac" "VortexPlayer" "Audio File"
  !insertmacro RegisterExt ".ogg"  "VortexPlayer" "Audio File"
  !insertmacro RegisterExt ".m4a"  "VortexPlayer" "Audio File"
  !insertmacro RegisterExt ".aac"  "VortexPlayer" "Audio File"
  !insertmacro RegisterExt ".wma"  "VortexPlayer" "Audio File"
  !insertmacro RegisterExt ".pdf"  "VortexPDF"    "PDF Document"

  ; ── 4. App Paths (so exe is findable by name) ─────────────
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\App Paths\Vortex File Manager.exe" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\App Paths\Vortex File Manager.exe" "Path" "$INSTDIR"

  ; ── 5. Notify Windows shell to refresh icons/associations ──
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'

!macroend

; ════════════════════════════════════════════════════════════
;  UNINSTALL — cleanup everything
; ════════════════════════════════════════════════════════════
!macro customUnInstall

  ; Remove ProgIDs
  DeleteRegKey HKCU "Software\Classes\VortexPlayer"
  DeleteRegKey HKCU "Software\Classes\VortexPDF"

  ; Remove Capabilities
  DeleteRegKey  HKCU "Software\VortexFileManager"
  DeleteRegValue HKCU "Software\RegisteredApplications" "VortexFileManager"

  ; Remove OpenWithProgids entries
  !insertmacro UnRegisterExt ".mp4"  "VortexPlayer"
  !insertmacro UnRegisterExt ".mkv"  "VortexPlayer"
  !insertmacro UnRegisterExt ".avi"  "VortexPlayer"
  !insertmacro UnRegisterExt ".mov"  "VortexPlayer"
  !insertmacro UnRegisterExt ".wmv"  "VortexPlayer"
  !insertmacro UnRegisterExt ".webm" "VortexPlayer"
  !insertmacro UnRegisterExt ".m4v"  "VortexPlayer"
  !insertmacro UnRegisterExt ".flv"  "VortexPlayer"
  !insertmacro UnRegisterExt ".ogv"  "VortexPlayer"
  !insertmacro UnRegisterExt ".3gp"  "VortexPlayer"
  !insertmacro UnRegisterExt ".mp3"  "VortexPlayer"
  !insertmacro UnRegisterExt ".wav"  "VortexPlayer"
  !insertmacro UnRegisterExt ".flac" "VortexPlayer"
  !insertmacro UnRegisterExt ".ogg"  "VortexPlayer"
  !insertmacro UnRegisterExt ".m4a"  "VortexPlayer"
  !insertmacro UnRegisterExt ".aac"  "VortexPlayer"
  !insertmacro UnRegisterExt ".wma"  "VortexPlayer"
  !insertmacro UnRegisterExt ".pdf"  "VortexPDF"

  ; Remove App Paths
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\App Paths\Vortex File Manager.exe"

  ; Notify shell
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'

!macroend
