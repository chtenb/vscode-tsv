import * as vscode from 'vscode';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Decoration types are very expensive to make, so we create them once and then reuse them.
	// The decoration types are indexed by the amount of spaces they add.
	let decorationTypes: vscode.TextEditorDecorationType[][] = [];
	let decorationRanges: vscode.Range[][][] = [];
	const MAX_DECORATION_WIDTH = 50;

	for (let from = 1; from < MAX_DECORATION_WIDTH; from++) {
		decorationTypes[from] = [];
		decorationRanges[from] = [];
		for (let to = 0; to < MAX_DECORATION_WIDTH; to++) {
			// decorationTypes[from][to] = vscode.window.createTextEditorDecorationType({ border: "1px solid red",  letterSpacing: "-0px", before: { contentText: "X".repeat(1) }});
			decorationTypes[from][to] = vscode.window.createTextEditorDecorationType({ border: "1px solid red",  letterSpacing: "1ch"});
			// decorationTypes[from][to] = vscode.window.createTextEditorDecorationType({ border: "1px solid red",  after: { contentText: "X".repeat(1), margin: -5 + "ch", width:"0px" }  });
			// decorationTypes[index] = vscode.window.createTextEditorDecorationType({ after: { contentText: "\b".repeat(index) } });
			// decorationTypes[index] = vscode.window.createTextEditorDecorationType({ letterSpacing: -index + "pc" });
			// decorationTypes[index] = vscode.window.createTextEditorDecorationType({ after: { contentText: "x".repeat(index) } });
			// decorationTypes[index] = vscode.window.createTextEditorDecorationType({ letterSpacing: -index + "ch" });
			// decorationTypes[index] = vscode.window.createTextEditorDecorationType({ after: { contentText: "\xa0".repeat(index) } });
			// decorationTypes[index] = vscode.window.createTextEditorDecorationType({ after: { contentText: "\t" } });
		}
	}

	const updateDecorations = (editor: vscode.TextEditor | undefined) => {
		if (!editor) {
			return;
		}
		if (editor.document.languageId! !== "tsv") {
			return;
		}


		for (let from = 1; from < MAX_DECORATION_WIDTH; from++) {
			for (let to = 0; to < MAX_DECORATION_WIDTH; to++) {
				decorationRanges[from][to] = [];
			}
		}

		let pattern = /[^\t]*\t/g;
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

			let maxColumnWidth = Math.max(...columnWidths)
			editor.options.tabSize = maxColumnWidth + 1;

			let lineIndex = 0;
			for (const line of lines) {
				let match;
				let columnIndex = 0;
				while ((match = pattern.exec(line)) !== null) {
					const matchText = match[0];
					const matchLength = matchText.length;
					const endPos = new vscode.Position(lineIndex + extendedRange.start.line, match.index + matchLength);
					const currentTabWidth = maxColumnWidth - matchLength + 1;
					const targetTabWidth = columnWidths[columnIndex] - matchLength + 1;
					const decRange = new vscode.Range(endPos.translate(0, -1), endPos);
					decorationRanges[currentTabWidth][targetTabWidth].push(decRange);
					columnIndex++;
				}

				lineIndex++;
			}
		}

		for (let from = 1; from < MAX_DECORATION_WIDTH; from++) {
			for (let to = 0; to < MAX_DECORATION_WIDTH; to++) {
				editor.setDecorations(decorationTypes[from][to], decorationRanges[from][to]);
			}
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