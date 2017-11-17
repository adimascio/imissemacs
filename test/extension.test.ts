/**
 * closeActiveWindows() implementation copied from pythonVSCode extension
 * https://github.com/DonJayamanne/pythonVSCode/ Copyright (c) 2015 DonJayamanne
 */
import { join as pathjoin } from 'path';
import * as fs from 'fs';
import * as assert from "assert";

import * as vscode from "vscode";
import * as imissemacs from "../src/extension";
import * as restructuredtext from "../src/restructuredtext";
import * as python from "../src/python";


function inputpath(basename: string): string {
    return pathjoin(__dirname, '..', '..', 'test', 'inputfiles', basename);
}

async function readFile(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, 'utf-8', (err, data) => {
            if (err) {
                throw err;
            }
            resolve(data);
        })
    });
}


async function openTextContent(content: string, language = 'txt'): Promise<vscode.TextEditor> {
    const document = await vscode.workspace.openTextDocument({ content, language });
    return await vscode.window.showTextDocument(document);
}


async function openFile(path: string): Promise<vscode.TextEditor> {
    const document = await vscode.workspace.openTextDocument(path);
    return await vscode.window.showTextDocument(document);
}


function moveCursorTo(editor: vscode.TextEditor, lineno: number, colno = 0): vscode.Position {
    const position = new vscode.Position(lineno, colno);
    editor.selection = new vscode.Selection(position, position);
    return position;
}

async function pressEnterAt(editor: vscode.TextEditor, lineno: number, colno: number): Promise<vscode.Position> {
    moveCursorTo(editor, lineno, colno);
    const success = await editor.edit(edit => {
        python.newlineAndIndent(editor, edit, null);
    });
    return editor.selection.active;
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

suite("python tests", () => {

//     test("module level indentation on end of line", async function () {
//         const editor = await openTextContent('x = 1', 'python');
//         moveCursorTo(editor, 0, 5);
//         const success = await editor.edit(edit => {
//             python.newlineAndIndent(editor, edit, null);
//         });
//         assert.equal(editor.document.getText(), 'x = 1\n');
//         assert.equal(editor.selection.active.line, 1);
//         assert.equal(editor.selection.active.character, 0);
//     });

    test("module level indentation on beginning of line", async function () {
        const editor = await openTextContent('x = 1', 'python');
        moveCursorTo(editor, 0, 0);
        const success = await editor.edit(edit => {
            python.newlineAndIndent(editor, edit, null);
        });
        assert.equal(editor.document.getText(), '\nx = 1');
        assert.equal(editor.selection.active.line, 1);
        assert.equal(editor.selection.active.character, 0);
    });

    test("indentation after beginning of block", async function () {
        const editor = await openTextContent('def f():', 'python');
        moveCursorTo(editor, 0, 8);
        const success = await editor.edit(edit => {
            python.newlineAndIndent(editor, edit, null);
        });
        assert.equal(editor.document.getText(), 'def f():\n    ');
        assert.equal(editor.selection.active.line, 1);
        assert.equal(editor.selection.active.character, 4);
    });

    test("indentation inside function declaration", async function () {
        const editor = await openTextContent('def func(foo, bar,', 'python');
        moveCursorTo(editor, 0, 18);
        const success = await editor.edit(edit => {
            python.newlineAndIndent(editor, edit, null);
        });
        assert.equal(editor.document.getText(), 'def func(foo, bar,\n         ');
        assert.equal(editor.selection.active.line, 1);
        assert.equal(editor.selection.active.character, 9);
    });

    test("indentation inside method declaration", async function () {
        const editor = await openFile(inputpath('sample.py'));
        const newPosition = await pressEnterAt(editor, 2, 23);
        const expectedContent = await readFile(inputpath('indented1_sample.py'));
        assert.equal(editor.document.getText(), expectedContent);
        assert.equal(newPosition.line, 3);
        assert.equal(newPosition.character, 17);
    });

    test('dedent after break', async function () {
        const editor = await openFile(inputpath('sample.py'));
        const newPosition = await pressEnterAt(editor, 8, 21);
        const expectedContent = await readFile(inputpath('indented2_sample.py'));
        assert.equal(editor.document.getText(), expectedContent);
        assert.equal(newPosition.line, 9);
        assert.equal(newPosition.character, 12);
    });

    test('dedent after raise', async function () {
        const editor = await openTextContent(`def f():
    raise ValueError('oops')`);
        const newPosition = await pressEnterAt(editor, 1, 28);
        const expectedContent = await readFile(inputpath('indented2_sample.py'));
        assert.equal(editor.document.getText(), `def f():
    raise ValueError('oops')
`);
        assert.equal(newPosition.line, 2);
        assert.equal(newPosition.character, 0);
    });

    test('dedent after re-raise', async function () {
        const editor = await openTextContent(`def f():
    raise`);
        const newPosition = await pressEnterAt(editor, 1, 9);
        assert.equal(editor.document.getText(), `def f():
    raise
`);
        assert.equal(newPosition.line, 2);
        assert.equal(newPosition.character, 0);
    });

    test('indent inside list comprehension', async function () {
        const editor = await openTextContent(`
class A:
    def f(self):
        return [x*2 for x in range(5)]
`, 'python');
        const newPosition = await pressEnterAt(editor, 3, 37);
        assert.equal(editor.document.getText(), `
class A:
    def f(self):
        return [x*2 for x in range(5)
                ]
`);
        assert.equal(newPosition.line, 4);
        assert.equal(newPosition.character, 16);
    })

    test('indent inside list comprehension 2', async function () {
        const editor = await openTextContent(`
class A:
    def f(self):
        return [x*2 for x in range(5)]
`, 'python');
        const newPosition = await pressEnterAt(editor, 3, 29);
        assert.equal(editor.document.getText(), `
class A:
    def f(self):
        return [x*2 for x in
                range(5)]
`);
        assert.equal(newPosition.line, 4);
        assert.equal(newPosition.character, 16);
    })

});


export async function closeActiveWindows(): Promise<any> {
    // code copied from https://github.com/DonJayamanne/pythonVSCode/ Copyright (c) 2015 DonJayamanne
    // https://github.com/Microsoft/vscode/blob/master/extensions/vscode-api-tests/src/utils.ts
    return new Promise(resolve => {
        if (vscode.window.visibleTextEditors.length === 0) {
            return resolve();
        }

        // TODO: the visibleTextEditors variable doesn't seem to be
        // up to date after a onDidChangeActiveTextEditor event, not
        // even using a setTimeout 0... so we MUST poll :(
        const interval = setInterval(() => {
            if (vscode.window.visibleTextEditors.length > 0) {
                return;
            }

            clearInterval(interval);
            resolve();
        }, 10);

        setTimeout(() => {
            if (vscode.window.visibleTextEditors.length === 0) {
                return resolve();
            }
            vscode.commands.executeCommand('workbench.action.closeAllEditors')
                .then(() => null, (err: any) => {
                    clearInterval(interval);
                    resolve();
                });
        }, 50);

    }).then(() => {
        assert.equal(vscode.window.visibleTextEditors.length, 0);
    });
}

// close active windows to avoid changes persisting between tests
teardown(() => closeActiveWindows());
