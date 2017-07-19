'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { whitespaceRange } from './editutil';


export function normalizeSpaces(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    textEditor.selections.forEach(selection => {
        const position = selection.active;
        const line = textEditor.document.lineAt(position.line).text;
        const currentColumn = position.character;
        const startstop = whitespaceRange(line, currentColumn);
        if (startstop === null) {
            return;
        }
        const [pos1, pos2] = startstop.map(idx => new vscode.Position(position.line, idx));;
        const range = new vscode.Range(pos1, pos2);
        edit.replace(range, ' ');
    });
}


export function switchCharacters(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    const position = textEditor.selection.active;
    const line = textEditor.document.lineAt(position.line).text;
    if (position.character == 0) {
        return;  // don't switch on first column
    }
    const switched = line.charAt(position.character) + line.charAt(position.character - 1);
    const nextPosition = new vscode.Position(position.line, position.character + 1)
    const range = new vscode.Range(
        new vscode.Position(position.line, position.character - 1),
        nextPosition
    );
    edit.replace(range, switched);
    textEditor.selection = new vscode.Selection(nextPosition, nextPosition);
}


export function gotoEndOfLine(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    const { line: lineno } = textEditor.selection.active;
    const line = textEditor.document.lineAt(lineno).text;
    const endOfLine = new vscode.Position(lineno, line.length);
    textEditor.selection = new vscode.Selection(endOfLine, endOfLine);
}


export function gotoBeginningOfLine(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    const { line: lineno } = textEditor.selection.active;
    const beginningOfLine = new vscode.Position(lineno, 0);
    textEditor.selection = new vscode.Selection(beginningOfLine, beginningOfLine);
}


export function commentAndNextLine(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    const position = textEditor.selection.active;
    const nextLine = new vscode.Position(position.line + 1, position.character);
    vscode.commands.executeCommand('editor.action.commentLine').then(() => {
        textEditor.selection = new vscode.Selection(nextLine, nextLine);
    })
}


export function cutEndOfLine(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    const position = textEditor.selection.active;
    const line = textEditor.document.lineAt(position.line).text;
    const selectionEnd = (position.character === 0) ? new vscode.Position(position.line + 1, 0) : new vscode.Position(position.line, line.length);
    textEditor.selection = new vscode.Selection(position, selectionEnd);
    vscode.commands.executeCommand('editor.action.clipboardCutAction');
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('extension.normalizeSpaces', normalizeSpaces));
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('extension.switchCharacters', switchCharacters));
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('extension.gotoBeginningOfLine', gotoBeginningOfLine));
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('extension.gotoEndOfLine', gotoEndOfLine));
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('extension.commentAndNextLine', commentAndNextLine));
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('extension.cutEndOfLine', cutEndOfLine));
}

// this method is called when your extension is deactivated
export function deactivate() {
}