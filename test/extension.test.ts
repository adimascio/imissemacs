import * as assert from "assert";

import * as vscode from "vscode";
import * as imissemacs from "../src/extension";
import * as restructuredtext from "../src/restructuredtext";


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

    test("editor switches characters", done => {
        let textEditor: vscode.TextEditor;
        let textDocument: vscode.TextDocument;
        vscode.workspace.openTextDocument({ content: 'hello', language: 'txt' }).then(document => {
            textDocument = document;
            return vscode.window.showTextDocument(textDocument);
        }).then(editor => {
            let textEditor = editor;
            const newpos = new vscode.Position(0, 1);
            editor.selection = new vscode.Selection(newpos, newpos);
            return editor.edit(edit => {
                imissemacs.switchCharacters(editor, edit, null);
            });
        }).then(() => {
            assert.equal(textDocument.getText(), 'ehllo');
            // assert.equal(textEditor.selection.active.character, 2);
        }).then(done, done);
    });
});


suite("restructuredtext tests", () => {
    test("editor underlines title", done => {
        let textEditor: vscode.TextEditor;
        let textDocument: vscode.TextDocument;
        vscode.workspace.openTextDocument({ content: 'hello', language: 'reStructuredText' }).then(document => {
            textDocument = document;
            return vscode.window.showTextDocument(textDocument);
        }).then(editor => {
            let textEditor = editor;
            const newpos = new vscode.Position(0, 5);
            editor.selection = new vscode.Selection(newpos, newpos);
            return editor.edit(edit => {
                restructuredtext.underline(editor, edit, null);
            });
        }).then(() => {
            assert.equal(textDocument.getText(), 'hello\n=====');
        }).then(done, done);
    });

    test("editor toggles title level", done => {
        let textEditor: vscode.TextEditor;
        let textDocument: vscode.TextDocument;
        vscode.workspace.openTextDocument({ content: 'hello\n=====', language: 'reStructuredText' }).then(document => {
            textDocument = document;
            return vscode.window.showTextDocument(textDocument);
        }).then(editor => {
            let textEditor = editor;
            const newpos = new vscode.Position(0, 5);
            editor.selection = new vscode.Selection(newpos, newpos);
            return editor.edit(edit => {
                restructuredtext.underline(editor, edit, null);
            });
        }).then(() => {
            assert.equal(textDocument.getText(), 'hello\n-----');
        }).then(done, done);
    });

    test("nextLineChar", () => {
        assert.equal(restructuredtext.nextUnderlineChar('='), '-');
        assert.equal(restructuredtext.nextUnderlineChar('-'), '~');
        assert.equal(restructuredtext.nextUnderlineChar('~'), '+');
        assert.equal(restructuredtext.nextUnderlineChar('+'), '=');
    });

});