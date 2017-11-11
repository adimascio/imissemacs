/**
 * This module provides python editing facilities
 */
import * as vscode from 'vscode';


const LINE_RGX = /\s*(.*?)\s*(#.*)?$/;
const DEDENT_STATEMENTS_RGX = /\s+(return|continue|break|raise)\b/;


export function trimcomment(text: string): string {
    return LINE_RGX.exec(text)[1];
}


function lastNonEmptyChar(text: string, colno: number): string {
    const trimmed = trimcomment(text.slice(0, colno));
    return trimmed ? trimmed[trimmed.length - 1] : null;
}


function indentationLevel(line: vscode.TextLine): number {
    if (!line.isEmptyOrWhitespace) {
        return line.firstNonWhitespaceCharacterIndex;
    }
    return 0;
}

function insideExpression(line: vscode.TextLine, colno: number): boolean {
    const opening = new Set('{[(');
    const closing = new Set('}])');
    let level = 0;

    for (let i = 0; i < colno; i++) {
        const letter = line.text[i];
        if (opening.has(letter)) {
            level++;
        } else if (closing.has(letter)) {
            level--;
        }
    }
    return level > 0;
}

function dedentAfterLine(line: vscode.TextLine, colno: number): boolean {
    console.log('inside expression', line.text, colno, insideExpression(line, colno))
    if (insideExpression(line, colno)) {
        return false;
    }
    return DEDENT_STATEMENTS_RGX.test(line.text);
}

function lastOpeningIndex(line: vscode.TextLine, colno: number): number {
    const matching = new Map([['{', '}'], ['(', ')'], ['[', ']']]);
    const closing = new Set(matching.values());
    let closingExpected = null;
    const unmatched = [];
    for (let i = 0; i < colno; i++) {
        const c = line.text[i];
        if (matching.has(c)) {
            unmatched.push({ char: c, index: i });
            closingExpected = matching.get(c);
        } else if (c === closingExpected) {
            unmatched.pop();
            if (unmatched.length) {
                closingExpected = matching.get(unmatched[unmatched.length - 1].char);
            }
        }
    }
    if (unmatched.length) {
        return unmatched[unmatched.length - 1].index;
    }
    return -1;
}

function nextIndentationLevel(document: vscode.TextDocument, lineno: number, colno: number): number {
    while (lineno >= 0) {
        const line = document.lineAt(lineno);
        const lineIndent = indentationLevel(line);
        if (dedentAfterLine(line, colno)) {
            return lineIndent - 4;
        }
        const lastchar = lastNonEmptyChar(line.text, colno);
        if (lastchar === '(' || lastchar === '{' || lastchar === '[' || lastchar === ':') {
            return lineIndent + 4;
        } else {
            const lastParenIndex = lastOpeningIndex(line, colno);
            console.log('last paren index', typeof lastParenIndex, lastParenIndex);
            return lastParenIndex === -1 ? lineIndent : lastParenIndex + 1;
        }
    }
}


export function newlineAndIndent(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    const position = textEditor.selection.active;
    const line = textEditor.document.lineAt(position.line);
    const insertionPoint = new vscode.Position(position.line, position.character);
    let toInsert = '\n';

    try {
        if (textEditor.document.languageId === 'python') {
            const indent = nextIndentationLevel(textEditor.document, line.lineNumber, position.character);
            if (indent !== null) {
                toInsert = '\n' + ' '.repeat(indent);
            }
        }
    } finally {
        // we never ever want to crash here, fallback on default "enter" behaviour
        edit.insert(insertionPoint, toInsert);
    }
}    
