# VSCode TSV

## Features

- Automatically adjust the tabsize based on the widest column content within the file.
- Disable line wrapping for tsv files.
- Command to toggle extension on/off on a per-file basis.

## Building locally

```
npm install
npm install -g @vscode-vsce
vsce package
code --install-extension vscode-tsv-xxxx.vsix
```
