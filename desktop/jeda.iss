; Jeda for Windows - per-user installer (no admin rights). build.py compiles it with:
;   iscc /DAppVersion=1.0.0 /DSourceDir=<dist\Jeda> /DOutputDir=<dist> /DIconFile=<build\jeda.ico> jeda.iss
; Installs to %LOCALAPPDATA%\Programs\Jeda, adds Jeda to the Start menu (and optionally the desktop) and lists it
; in Settings > Apps. The window keeps its data (your space, notes and settings) in %LOCALAPPDATA%\Jeda, which
; uninstalling leaves in place so a reinstall finds it again.

#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef SourceDir
  #define SourceDir "dist\Jeda"
#endif
#ifndef OutputDir
  #define OutputDir "dist"
#endif
#ifndef IconFile
  #define IconFile "build\jeda.ico"
#endif

[Setup]
AppId={{E81247BA-698B-569E-A6DE-E1E1C366EEFB}
AppName=Jeda
AppVersion={#AppVersion}
AppVerName=Jeda {#AppVersion}
AppPublisher=Juwen Lie
AppPublisherURL=https://juw12.github.io/jeda/
AppSupportURL=https://github.com/juw12/jeda
DefaultDirName={autopf}\Jeda
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=Jeda-Windows-Setup
SetupIconFile={#IconFile}
UninstallDisplayIcon={app}\Jeda.exe
UninstallDisplayName=Jeda
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=no
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\Jeda"; Filename: "{app}\Jeda.exe"; Comment: "A quiet space for every faith in Indonesia"
Name: "{userdesktop}\Jeda"; Filename: "{app}\Jeda.exe"; Comment: "A quiet space for every faith in Indonesia"; Tasks: desktopicon

[Run]
Filename: "{app}\Jeda.exe"; Description: "{cm:LaunchProgram,Jeda}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\Jeda.exe"; Parameters: "--stop"; Flags: runhidden waituntilterminated; RunOnceId: "StopJeda"

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  { Updating: close an open Jeda window first so its files can be replaced. }
  if FileExists(ExpandConstant('{app}\Jeda.exe')) then
    Exec(ExpandConstant('{app}\Jeda.exe'), '--stop', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;
