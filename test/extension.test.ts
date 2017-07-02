import * as assert from "assert";

import * as vscode from "vscode";
import * as imissemacs from "../src/extension";


suite("I Miss Emacs Tests", () => {
    test("editor wipes out extra spaces", done => {
        let textEditor: vscode.TextEditor;
        let textDocument: vscode.TextDocument;
        vscode.workspace.openTextDocument({ content: 'hello     world', language: 'txt' }).then(document => {
            textDocument = document;
            return vscode.window.showTextDocument(textDocument);
        }).then(editor => {
            let textEditor = editor;
            const newpos = new vscode.Position(0, 6);
            editor.selection = new vscode.Selection(newpos, newpos);
            return editor.edit(edit => {
                imissemacs.normalizeSpaces(editor, edit, null);
            });
        }).then(() => {
            assert.equal(textDocument.getText(), 'hello world');
        }).then(done, done);
    });
});
