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


function dedentAfterLine(line: vscode.TextLine): boolean {
    return DEDENT_STATEMENTS_RGX.test(line.text);
}


function nextIndentationLevel(document: vscode.TextDocument, lineno: number, colno: number): number {
    let indent = 0;

    while (lineno >= 0) {
        const line = document.lineAt(lineno);
        const lineIndent = indentationLevel(line);
        console.log('testing line', line.text);
        if (dedentAfterLine(line)) {
            indent = lineIndent - 4;
            break;
        }
        const lastchar = lastNonEmptyChar(line.text, colno);
        if (lastchar === '(' || lastchar === '{' || lastchar === '[' || lastchar === ':') {
            indent = lineIndent + 4;
            break;
        } else if (lastchar == ',') {
            const lastParenIndex = line.text.lastIndexOf('(');
            indent = lastParenIndex === -1 ? lineIndent : lastParenIndex + 1;
            break;
        } else if (lastchar) {
            indent = lineIndent;
            break;
        }
        lineno--;
    }
    return Math.max(indent, 0);
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
