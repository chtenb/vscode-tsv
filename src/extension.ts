import * as vscode from 'vscode';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Decoration types are very expensive to make, so we create them once and then reuse them.
	// The decoration types are indexed by the amount of spaces they add.
	let decorationType = vscode.window.createTextEditorDecorationType({ border: "1px solid red", letterSpacing: "-0.5ch" });
	let decorationRanges: vscode.Range[] = [];

	const updateDecorations = (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			return;
		}
		if (editor.document.languageId! !== "tsv") {
			return;
		}

		editor.options.tabSize = 40;
		decorationRanges = [];
		let pattern = /\t/g;
		for (const range of editor.visibleRanges) {
			const rangeLineCount = range.end.line - range.start.line;
			const extendedRangeStart = new vscode.Position(Math.max(0, range.start.line - rangeLineCount), 0);
			const extendedRangeEnd = new vscode.Position(range.end.line + rangeLineCount, 0);
			const extendedRange = new vscode.Range(extendedRangeStart, extendedRangeEnd);
			const lines = editor.document.getText(extendedRange).split(/\r\n|\r|\n/);

			let lineIndex = 0;
			for (const line of lines) {
				let match;
				let columnIndex = 0;
				while ((match = pattern.exec(line)) !== null) {
					const matchText = match[0];
					const matchLength = matchText.length;
					const endPos = new vscode.Position(lineIndex + extendedRange.start.line, match.index + matchLength);
					const decRange = new vscode.Range(endPos.translate(0, -1), endPos);
					decorationRanges.push(decRange);
					columnIndex++;
				}

				lineIndex++;
			}
		}

		editor.setDecorations(decorationType, decorationRanges);
	};

	let timer: NodeJS.Timer;
	const delayedUpdateDecorations = () => {
		vscode.window.showInformationMessage('Hello World from vscode-tsv!');
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => { updateDecorations(vscode.window.activeTextEditor); }, 100);
	};

	let disposables = [
		vscode.workspace.onDidOpenTextDocument(delayedUpdateDecorations, null, context.subscriptions),
		vscode.workspace.onDidChangeTextDocument(delayedUpdateDecorations, null, context.subscriptions),
		vscode.window.onDidChangeActiveTextEditor(delayedUpdateDecorations, null, context.subscriptions),
		vscode.window.onDidChangeTextEditorVisibleRanges(delayedUpdateDecorations, null, context.subscriptions),
	];
	context.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() { }