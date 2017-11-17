/**
 * This module provides python editing facilities
 */
import * as vscode from 'vscode';

const LINE_RGX = /(\s*)(.*?)\s*(#.*)?$/;
const DEDENT_STATEMENTS_RGX = /\s+(return|continue|break|raise)\b/;
const OPENINGS = new Set('{[(');
const CLOSINGS = new Set('}])');
const MATCHING_MAP = {
    '(': ')',
    '{': '}',
    '[': ']',
    ')': '(',
    '}': '{',
    ']': '[',
};

export function rtrimcomment(text: string, colno: number): string {
    const match = LINE_RGX.exec(text.slice(0, colno));
    if (match[2]) {
        // found non empty string
        return match[1] + match[2];
    }
    return '';
}

function indentationLevel(line: vscode.TextLine): number {
    if (!line.isEmptyOrWhitespace) {
        return line.firstNonWhitespaceCharacterIndex;
    }
    return 0;
}

function insideExpression(line: vscode.TextLine, colno: number): boolean {
    let level = 0;

    for (let i = 0; i < colno; i++) {
        const letter = line.text[i];
        if (OPENINGS.has(letter)) {
            level++;
        } else if (CLOSINGS.has(letter)) {
            level--;
        }
    }
    return level > 0;
}

function dedentAfterLine(line: vscode.TextLine, colno: number): boolean {
    if (insideExpression(line, colno)) {
        return false;
    }
    return DEDENT_STATEMENTS_RGX.test(line.text);
}

function lastOpeningIndex(line: vscode.TextLine, colno: number): number {
    let closingExpected = null;
    const unmatched = [];
    for (let i = 0; i < colno; i++) {
        const c = line.text[i];
        if (OPENINGS.has(c)) {
            unmatched.push({char: c, index: i});
            closingExpected = MATCHING_MAP[c];
        } else if (c === closingExpected) {
            unmatched.pop();
            if (unmatched.length) {
                closingExpected = MATCHING_MAP[unmatched[unmatched.length - 1].char];
            }
        }
    }
    if (unmatched.length) {
        return unmatched[unmatched.length - 1].index;
    }
    return -1;
}

function* backwardDocumentLines(document: vscode.TextDocument, startline = document.lineCount - 1) {
    for (let lineno = startline; lineno >= 0; lineno--) {
        yield document.lineAt(lineno);
    }
}

function findBackward(
    char: string,
    document: vscode.TextDocument,
    initial: vscode.Position
): vscode.Position {
    const currentLine = document.lineAt(initial.line);
    const index = currentLine.text.lastIndexOf(char, initial.character);
    if (index !== -1) {
        return new vscode.Position(initial.line, index + 1);
    }
    for (let line of backwardDocumentLines(document, initial.line - 1)) {
        const index = line.text.lastIndexOf(char);
        if (index !== -1) {
            return new vscode.Position(line.lineNumber, index + 1);
        }
    }
    return null;
}

function nextIndentationLevel(
    document: vscode.TextDocument,
    lineno: number,
    colno: number
): number {
    for (let line of backwardDocumentLines(document, lineno)) {
        const lineIndent = indentationLevel(line);
        if (dedentAfterLine(line, colno)) {
            // if current line is a return / raise / … statement, dedent next line
            return lineIndent - 4;
        }
        const trimmed = rtrimcomment(line.text, colno);
        if (!trimmed) {
            continue; // empty line, go backwards
        }
        const lastchar = trimmed[trimmed.length - 1];
        if (CLOSINGS.has(lastchar)) {
            // if last non empty char is a closing symbol, compute next indentation level
            // of the character preceding the matching opening symbol.
            const matchingPos = findBackward(
                MATCHING_MAP[lastchar],
                document,
                new vscode.Position(line.lineNumber, trimmed.length - 1)
            );
            return nextIndentationLevel(document, matchingPos.line, matchingPos.character - 1);
        } else if (OPENINGS.has(lastchar) || lastchar === ':') {
            // if last non empty char is an opening symbol, indent next line of one extra level
            // of the character preceding the matching opening symbol.
            return lineIndent + 4;
        } else {
            // otherwise, if we're in the middle of an expression, align next line on the
            // opening symbol + 1, else keep the same indentation level as the current line.
            const lastParenIndex = lastOpeningIndex(line, colno);
            return lastParenIndex === -1 ? lineIndent : lastParenIndex + 1;
        }
    }
}

export function newlineAndIndent(
    textEditor: vscode.TextEditor,
    edit: vscode.TextEditorEdit,
    args: any[]
) {
    const position = textEditor.selection.active;
    const line = textEditor.document.lineAt(position.line);
    const insertionPoint = new vscode.Position(position.line, position.character);
    let toInsert = '\n';

    try {
        if (textEditor.document.languageId === 'python') {
            const indent = nextIndentationLevel(
                textEditor.document,
                line.lineNumber,
                position.character
            );
            if (indent !== null) {
                toInsert = '\n' + ' '.repeat(Math.max(indent, 0));
            }
        }
    } finally {
        // we never ever want to crash here, fallback on default "enter" behaviour
        edit.insert(insertionPoint, toInsert);
    }
}
