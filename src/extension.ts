import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposables = [
		vscode.workspace.onDidOpenTextDocument(() => {
			adjustTabSize(vscode.window.activeTextEditor);
		}),
		vscode.window.onDidChangeActiveTextEditor(() => {
			adjustTabSize(vscode.window.activeTextEditor);
		}),
		vscode.workspace.onDidSaveTextDocument(() => {
			adjustTabSize(vscode.window.activeTextEditor);
		})
	];
	context.subscriptions.push(...disposables);
}

function adjustTabSize(editor: vscode.TextEditor | undefined) {
	if (!editor) {
		return;
	}
	if (editor.document.languageId !== "tsv") {
		return;
	}
	let text = editor.document.getText();
	let cellSizes = text.split(/\r\n|\r|\n|\t/).map(cell => cell.length);
	let maxCellSize = Math.max(...cellSizes);
	editor.options.tabSize = maxCellSize + 1;
}

// this method is called when your extension is deactivated
export function deactivate() { }
