'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { whitespaceRange } from './editutil';


function normalizeSpaces(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) {
    const position = textEditor.selection.active;
    const line = textEditor.document.lineAt(position.line).text;
    const currentColumn = position.character;
    const startstop = whitespaceRange(line, currentColumn);
    if (startstop === null) {
        return;
    }
    const [pos1, pos2] = startstop.map(idx => new vscode.Position(position.line, idx));;
    const range = new vscode.Range(pos1, pos2);
    edit.replace(range, ' ');
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('extension.normalizeSpaces', normalizeSpaces));
}

// this method is called when your extension is deactivated
export function deactivate() {
}