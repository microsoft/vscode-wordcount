// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, workspace, commands, Disposable} from 'vscode';

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(disposables: Disposable[]) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "Markdown-Tools" is now active!');

    // create a new word counter
    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);

    // add to a list of disposables which are disposed when this extension
    // is deactivated again.
    disposables.push(controller);
    disposables.push(wordCounter);
}

class WordCounter {

    private _statusBarMessage: Disposable;

    dispose() {
        this.hideWordCount();
    }

    public showWordCount() {

        // Remove previous status bar message
        this.hideWordCount();

        // Get the current text editor
        let editor = window.getActiveTextEditor();
        if (!editor) {
            return;
        }

        let doc = editor.getTextDocument();

        // Only update status if an MD file
        if (doc.getLanguageId() === "markdown") {
            let docContent = doc.getText();

            // Parse out unwanted whitespace so the split is accurate
            docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
            docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            let wordCount = docContent.split(" ").length;

            // Update the status bar
            this._statusBarMessage = window.setStatusBarMessage(wordCount !== 1 ? `${wordCount} Words` : '1 Word');
        }
    }

    public hideWordCount() {
        if (this._statusBarMessage) {
            this._statusBarMessage.dispose();
        }
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.showWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.of(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._wordCounter.showWordCount();
    }
}