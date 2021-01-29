const vscode = require('vscode');

const TAB = '\t'.charCodeAt(0);

function isFullWidthCharacter(charCode: number) {
	// Do a cheap trick to better support wrapping of wide characters, treat them as 2 columns
	// http://jrgraphix.net/research/unicode_blocks.php
	//          2E80 — 2EFF   CJK Radicals Supplement
	//          2F00 — 2FDF   Kangxi Radicals
	//          2FF0 — 2FFF   Ideographic Description Characters
	//          3000 — 303F   CJK Symbols and Punctuation
	//          3040 — 309F   Hiragana
	//          30A0 — 30FF   Katakana
	//          3100 — 312F   Bopomofo
	//          3130 — 318F   Hangul Compatibility Jamo
	//          3190 — 319F   Kanbun
	//          31A0 — 31BF   Bopomofo Extended
	//          31F0 — 31FF   Katakana Phonetic Extensions
	//          3200 — 32FF   Enclosed CJK Letters and Months
	//          3300 — 33FF   CJK Compatibility
	//          3400 — 4DBF   CJK Unified Ideographs Extension A
	//          4DC0 — 4DFF   Yijing Hexagram Symbols
	//          4E00 — 9FFF   CJK Unified Ideographs
	//          A000 — A48F   Yi Syllables
	//          A490 — A4CF   Yi Radicals
	//          AC00 — D7AF   Hangul Syllables
	// [IGNORE] D800 — DB7F   High Surrogates
	// [IGNORE] DB80 — DBFF   High Private Use Surrogates
	// [IGNORE] DC00 — DFFF   Low Surrogates
	// [IGNORE] E000 — F8FF   Private Use Area
	//          F900 — FAFF   CJK Compatibility Ideographs
	// [IGNORE] FB00 — FB4F   Alphabetic Presentation Forms
	// [IGNORE] FB50 — FDFF   Arabic Presentation Forms-A
	// [IGNORE] FE00 — FE0F   Variation Selectors
	// [IGNORE] FE20 — FE2F   Combining Half Marks
	// [IGNORE] FE30 — FE4F   CJK Compatibility Forms
	// [IGNORE] FE50 — FE6F   Small Form Variants
	// [IGNORE] FE70 — FEFF   Arabic Presentation Forms-B
	//          FF00 — FFEF   Halfwidth and Fullwidth Forms
	//               [https://en.wikipedia.org/wiki/Halfwidth_and_fullwidth_forms]
	//               of which FF01 - FF5E fullwidth ASCII of 21 to 7E
	// [IGNORE]    and FF65 - FFDC halfwidth of Katakana and Hangul
	// [IGNORE] FFF0 — FFFF   Specials
	charCode = +charCode; // @perf
	return (
		(charCode >= 0x2E80 && charCode <= 0xD7AF)
		|| (charCode >= 0xF900 && charCode <= 0xFAFF)
		|| (charCode >= 0xFF01 && charCode <= 0xFF5E)
	);
}

function computeCharWidth(charCode: number, visibleColumn: number, tabSize: number, columnsForFullWidthChar: number) {
	if (charCode === TAB) {
		return (tabSize - (visibleColumn % tabSize));
	}
	if (isFullWidthCharacter(charCode)) {
		return columnsForFullWidthChar;
	}
	if (charCode < 32) {
		// when using `editor.renderControlCharacters`, the substitutions are often wide
		return columnsForFullWidthChar;
	}
	return 1;
}

function repeat(char: string, cnt: number) {
	let r = char;
	while (r.length < cnt) {
		r += char;
	}
	return r;
}

exports.activate = function (context: { subscriptions: any[]; }) {
	// Decoration types are very expensive to make, so we create them once and then reuse them.
	// The decoration types are indexed by the amount of spaces they add.
	let decorationType = vscode.window.createTextEditorDecorationType({
		border: "1px solid red",
		letterSpacing: "-1ch"
	});
	let decorations = [];

	const updateDecorations = (editor: { options: { tabSize: number; }; visibleRanges: any; document: { getText: (arg0: any) => string; }; setDecorations: (arg0: any, arg1: { range: any; renderOptions: { before: { contentText: string; border: string; }; }; }[]) => void; }) => {
		if (!editor) {
			return;
		}
		// if (editor.document.languageId !== "tsv") {
		// 	return;
		// }

		editor.options.tabSize = 40;
		decorations = [];
		let pattern = /\t/g;
		for (const range of editor.visibleRanges) {
			const rangeLineCount = range.end.line - range.start.line;
			const extendedRangeStart = new vscode.Position(Math.max(0, range.start.line - rangeLineCount), 0);
			const extendedRangeEnd = new vscode.Position(range.end.line + rangeLineCount, 0);
			const extendedRange = new vscode.Range(extendedRangeStart, extendedRangeEnd);
			const lines = editor.document.getText(extendedRange).split(/\r\n|\r|\n/);

			let lineIndex = 0;
			for (const line of lines) {
				let visibleColumn = 0;
				for (let i = 0; i < line.length; i++) {
					const charCode = line.charCodeAt(i);
					const charWidth = computeCharWidth(charCode, visibleColumn, 40, 2);
					visibleColumn += charWidth;

					if (charCode === TAB) {
						decorations.push({
							range: new vscode.Range(lineIndex + extendedRange.start.line, i, lineIndex + extendedRange.start.line, i + 1),
							renderOptions: {
								before: {
									contentText: repeat('_', charWidth),
									border: '1px solid #0f0'
								}
							}
						});
					}
				}

				lineIndex++;
			}
		}

		editor.setDecorations(decorationType, decorations);
	};

	let timer: NodeJS.Timeout;
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