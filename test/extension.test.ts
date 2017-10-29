import * as assert from "assert";

import * as vscode from "vscode";
import * as imissemacs from "../src/extension";
import * as restructuredtext from "../src/restructuredtext";


async function openTextContent(content: string, language = 'txt'): Promise<vscode.TextEditor> {
    const document = await vscode.workspace.openTextDocument({ content, language });
    return await vscode.window.showTextDocument(document);
}


function moveCursorTo(editor: vscode.TextEditor, lineno: number, colno = 0): vscode.Position {
    const position = new vscode.Position(lineno, colno);
    editor.selection = new vscode.Selection(position, position);
    return position;
}



suite("I Miss Emacs Tests", () => {
    test("editor wipes out extra spaces", async function() {
        const editor = await openTextContent('hello     world');
        moveCursorTo(editor, 0, 6);
        const success = await editor.edit(edit => {
            imissemacs.normalizeSpaces(editor, edit, null);
        });
        assert.equal(editor.document.getText(), 'hello world');
    });

    test("editor switches characters", async function () {
        const editor = await openTextContent('hello');
        moveCursorTo(editor, 0, 1);
        const success = await editor.edit(edit => {
            imissemacs.switchCharacters(editor, edit, null);
        });
        assert.equal(editor.document.getText(), 'ehllo');
    });
});


suite("restructuredtext tests", () => {
    test("editor underlines title", async function () {
        const editor = await openTextContent('hello', 'rst');
        moveCursorTo(editor, 0, 5);
        const success = await editor.edit(edit => {
            restructuredtext.underline(editor, edit, null);
        });
        assert.equal(editor.document.getText(), 'hello\n=====');
    });

    test("editor toggles title level", async function() {
        const editor = await openTextContent('hello\n=====', 'rst');
        moveCursorTo(editor, 0, 5);
        const success = await editor.edit(edit => {
            restructuredtext.underline(editor, edit, null);
        });
        assert.equal(editor.document.getText(), 'hello\n-----');
    });

    test("nextLineChar", () => {
        assert.equal(restructuredtext.nextUnderlineChar('='), '-');
        assert.equal(restructuredtext.nextUnderlineChar('-'), '~');
        assert.equal(restructuredtext.nextUnderlineChar('~'), '+');
        assert.equal(restructuredtext.nextUnderlineChar('+'), '=');
    });

});