Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
nodePath = "C:\Users\Administrator\nodejs\node-v22.16.0-win-x64\node.exe"
If fso.FileExists(nodePath) Then
  cmd = "cmd /c cd /d """ & root & """ && """ & nodePath & """ server.js > server.out.log 2> server.err.log"
Else
  cmd = "cmd /c cd /d """ & root & """ && node server.js > server.out.log 2> server.err.log"
End If
shell.Run cmd, 0, False
