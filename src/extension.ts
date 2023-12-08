import * as vscode from 'vscode';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	const disabledForFiles = new Set();

	let disposableCommand = vscode.commands.registerCommand('extension.toggleEnabled', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		if (editor.document.languageId! !== "tsv") {
			return;
		}
		if (disabledForFiles.has(editor.document.uri)) {
			// Enable again
			disabledForFiles.delete(editor.document.uri);
			updateDecorations(vscode.window.activeTextEditor);
		} else {
			// Disable
			disabledForFiles.add(editor.document.uri);
			editor.options.tabSize = 1;
		}
	});

	const updateDecorations = (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			return;
		}
		if (editor.document.languageId! !== "tsv" || disabledForFiles.has(editor.document.uri)) {
			return;
		}

		let pattern = /([^\t]+)(\t|$)/g;
		let maxColumnWidth = 1;
		for (const range of editor.visibleRanges) {
			const extendedRangeStart = new vscode.Position(Math.max(0, range.start.line - 1), 0);
			const extendedRangeEnd = new vscode.Position(range.end.line + 1, 0);
			const extendedRange = new vscode.Range(extendedRangeStart, extendedRangeEnd);
			const lines = editor.document.getText(extendedRange).split(/\r\n|\r|\n/);
			for (const line of lines) {
				// Skip comment lines
				if (line.trim().startsWith("#")) {
					continue;
				}
				let match;
				while ((match = pattern.exec(line)) !== null) {
					maxColumnWidth = Math.max(match[1].length, maxColumnWidth);
				}
			}
		}

		editor.options.tabSize = maxColumnWidth + 2;
	};

	let timer: NodeJS.Timer;
	const delayedUpdateDecorations = () => {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => { updateDecorations(vscode.window.activeTextEditor); }, 100);
	};

	let disposables = [
		disposableCommand,
		vscode.workspace.onDidOpenTextDocument(delayedUpdateDecorations, null, context.subscriptions),
		vscode.workspace.onDidChangeTextDocument(delayedUpdateDecorations, null, context.subscriptions),
		vscode.window.onDidChangeActiveTextEditor(delayedUpdateDecorations, null, context.subscriptions),
		vscode.window.onDidChangeTextEditorVisibleRanges(delayedUpdateDecorations, null, context.subscriptions),
	];
	context.subscriptions.push(...disposables);

	delayedUpdateDecorations();
}

// this method is called when your extension is deactivated
export function deactivate() { }