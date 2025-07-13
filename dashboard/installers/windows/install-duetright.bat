@echo off
REM DuetRight Dashboard Quick Installer for Windows
REM This script creates shortcuts and sets up the dashboard for easy access

echo ====================================
echo DuetRight Dashboard Quick Setup
echo ====================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This installer needs to run as Administrator.
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Dashboard URL
set DASHBOARD_URL=https://dashboard.duetright.com
set APP_NAME=DuetRight Dashboard
set INSTALL_DIR=%LOCALAPPDATA%\DuetRight

REM Create installation directory
echo Creating installation directory...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Create a simple launcher HTML file
echo Creating launcher...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo ^<title^>%APP_NAME%^</title^>
echo ^<meta http-equiv="refresh" content="0; url=%DASHBOARD_URL%"^>
echo ^<script^>window.location.href='%DASHBOARD_URL%';^</script^>
echo ^</head^>
echo ^<body^>
echo ^<p^>Loading DuetRight Dashboard...^</p^>
echo ^</body^>
echo ^</html^>
) > "%INSTALL_DIR%\launcher.html"

REM Create a batch file to open in app mode
(
echo @echo off
echo start msedge --app="%DASHBOARD_URL%" --start-fullscreen
) > "%INSTALL_DIR%\DuetRight-Dashboard.bat"

REM Create VBS script for silent launch
(
echo Set objShell = CreateObject^("Wscript.Shell"^)
echo objShell.Run """%INSTALL_DIR%\DuetRight-Dashboard.bat""", 0, False
) > "%INSTALL_DIR%\launcher.vbs"

REM Download icon (or use a default one)
echo Downloading icon...
powershell -Command "& {Invoke-WebRequest -Uri '%DASHBOARD_URL%/icons/icon-256x256.png' -OutFile '%INSTALL_DIR%\icon.ico' -UseBasicParsing}" 2>nul

REM Create Desktop shortcut
echo Creating Desktop shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\%APP_NAME%.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\launcher.vbs'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.ico'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Launch DuetRight Dashboard'; $Shortcut.Save()"

REM Create Start Menu shortcut
echo Creating Start Menu shortcut...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\DuetRight" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\DuetRight"
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\DuetRight\%APP_NAME%.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\launcher.vbs'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.ico'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Launch DuetRight Dashboard'; $Shortcut.Save()"

REM Create uninstaller
(
echo @echo off
echo echo Uninstalling DuetRight Dashboard...
echo rmdir /s /q "%INSTALL_DIR%"
echo del "%USERPROFILE%\Desktop\%APP_NAME%.lnk" 2^>nul
echo rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\DuetRight" 2^>nul
echo echo Uninstall complete.
echo pause
) > "%INSTALL_DIR%\uninstall.bat"

REM Register as installed app (for Add/Remove Programs)
echo Registering application...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\DuetRightDashboard" /v "DisplayName" /t REG_SZ /d "%APP_NAME%" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\DuetRightDashboard" /v "UninstallString" /t REG_SZ /d "%INSTALL_DIR%\uninstall.bat" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\DuetRightDashboard" /v "DisplayIcon" /t REG_SZ /d "%INSTALL_DIR%\icon.ico" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\DuetRightDashboard" /v "Publisher" /t REG_SZ /d "DuetRight IT" /f >nul
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\DuetRightDashboard" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f >nul

echo.
echo ====================================
echo Installation Complete!
echo ====================================
echo.
echo The DuetRight Dashboard has been installed successfully.
echo.
echo You can now:
echo - Click the Desktop shortcut to launch
echo - Find it in your Start Menu under DuetRight
echo - Access it directly at: %DASHBOARD_URL%
echo.
echo For the best experience, we recommend using:
echo - Microsoft Edge (recommended)
echo - Google Chrome
echo - Mozilla Firefox
echo.
echo Press any key to launch the dashboard now...
pause >nul

REM Launch the app
start "" "%INSTALL_DIR%\launcher.vbs"