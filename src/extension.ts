import * as vscode from 'vscode';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Decoration types are very expensive to make, so we create them once and then reuse them.
	// The decoration types are indexed by the amount of spaces they add.
	let decorationTypes: vscode.TextEditorDecorationType[] = [];
	let decorationRanges: vscode.Range[][] = [];
	const MAX_DECORATION_WIDTH = 100;

	for (let index = 0; index < MAX_DECORATION_WIDTH; index++) {
		decorationTypes[index] = vscode.window.createTextEditorDecorationType({ after: { contentText: "\xa0".repeat(index) } });
		// decorationTypes[index] = vscode.window.createTextEditorDecorationType({ after: { contentText: "\t" } });
		decorationRanges[index] = [];
	}

	const updateDecorations = (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			return;
		}
		if (editor.document.languageId! in ["csv", "tsv"]) {
			return;
		}

		let pattern = /[^,]*,/g;
		if (editor.document.languageId === "tsv") {
			editor.options.tabSize = 1;
			pattern = /[^\t]*\t/g;
		}

		for (let index = 0; index < MAX_DECORATION_WIDTH; index++) {
			decorationRanges[index] = [];
		}

		for (const range of editor.visibleRanges) {
			const columnWidths: number[] = [];
			const rangeLineCount = range.end.line - range.start.line;
			const extendedRangeStart = new vscode.Position(Math.max(0, range.start.line - rangeLineCount), 0);
			const extendedRangeEnd = new vscode.Position(range.end.line + rangeLineCount, 0);
			const extendedRange = new vscode.Range(extendedRangeStart, extendedRangeEnd);
			const lines = editor.document.getText(extendedRange).split(/\r\n|\r|\n/);
			for (const line of lines) {
				let columnIndex = 0;
				let match;
				while ((match = pattern.exec(line)) !== null) {
					columnWidths[columnIndex] = Math.max(match[0].length, columnWidths[columnIndex] ?? 1);
					columnIndex++;
				}
			}

			let lineIndex = 0;
			for (const line of lines) {
				let match;
				let columnIndex = 0;
				while ((match = pattern.exec(line)) !== null) {
					const matchText = match[0];
					const matchLength = matchText.length;
					const endPos = new vscode.Position(lineIndex + extendedRange.start.line, match.index + matchLength);
					const spaces = columnWidths[columnIndex] - matchLength + 1;
					const decRange = new vscode.Range(endPos, endPos);
					decorationRanges[spaces].push(decRange);
					columnIndex++;
				}

				lineIndex++;
			}
		}

		for (let index = 0; index < MAX_DECORATION_WIDTH; index++) {
			editor.setDecorations(decorationTypes[index], decorationRanges[index]);
			// if (decorationRanges[index].length > 0) {
			// 	editor.options.tabSize = index;
			// }
		}
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