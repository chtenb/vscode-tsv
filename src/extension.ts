import * as vscode from 'vscode';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	let decorationTypes: vscode.TextEditorDecorationType[] = [];
	let decorationRanges: vscode.Range[][] = [];
	for (let index = 0; index < 100; index++) {
		decorationTypes[index] = vscode.window.createTextEditorDecorationType({ after: { contentText: "\xa0".repeat(index) } });
		decorationRanges[index] = [];
	}

	const addDecorations = function (editor: vscode.TextEditor | undefined) {
		if (!editor) {
			return;
		}
		if (editor.document.languageId! in ["csv", "tsv"]) {
			return;
		}
		editor.options.tabSize = 1;

		// TODO: restrict to DSV files
		let pattern = /[^\t]*\t/g;
		if (editor.document.languageId === "csv") {
			// Check to see if the delimiter is defined. If not,
			// then default to comma.
			let strDelimiter = (undefined || ",");

			// Create a regular expression to parse the CSV values.
			// pattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"),"gi");
			pattern = /[^,]*,/g;
			// pattern = /(?:^|,)(?=[^"]|(")?)"?((?(1)[^"]*|[^,"]*))"?(?=,|$)/g;
		}

		for (let index = 0; index < 100; index++) {
			decorationRanges[index] = [];
		}

		for (const range of editor.visibleRanges) {
			const columnWidths: number[] = [];
			const lines = editor.document.getText(range).split(/\r\n|\r|\n/);
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
					const endPos = new vscode.Position(lineIndex + range.start.line, match.index + matchLength);
					const spaces = columnWidths[columnIndex] - matchLength;
					const decRange = new vscode.Range(endPos, endPos);
					decorationRanges[spaces].push(decRange);
					columnIndex++;
				}

				lineIndex++;
			}

			for (let index = 0; index < 100; index++) {
				editor.setDecorations(decorationTypes[index], decorationRanges[index]);
			}
		}
	};

	let timer: NodeJS.Timer;
	let disposables = [
		// vscode.window.onDidChangeActiveTextEditor(() => {
		// 	addDecorations(vscode.window.activeTextEditor);
		// }),
		// vscode.workspace.onDidOpenTextDocument(() => {
		// 	addDecorations(vscode.window.activeTextEditor);
		// }),
		// vscode.workspace.onDidSaveTextDocument(() => {
		// 	addDecorations(vscode.window.activeTextEditor);
		// }),
		vscode.window.onDidChangeTextEditorVisibleRanges(() => {
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(() => { addDecorations(vscode.window.activeTextEditor); }, 100);
		}, null, context.subscriptions),
	];
	context.subscriptions.push(...disposables);

}

// this method is called when your extension is deactivated
export function deactivate() { }
