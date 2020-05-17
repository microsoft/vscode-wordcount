// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, Selection} from 'vscode';

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(ctx: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "Wordcount" is now active!');

    // create a new word counter
    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);

    // define the command to view the summary of the word count
    let summaryCommand = commands.registerCommand('wordcount.viewSummary',() => {
        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        let doc = editor.document;
        let sel = editor.selection; 
        let mode = sel == undefined || sel.isEmpty ? "Total" : "Selection"
        window.showInformationMessage(`
            ${mode}: | 
            Words: ${wordCounter._getWordCount(doc, sel)} | 
            Characters (without spaces): ${wordCounter._getCharCount(doc, sel)} | 
            Sentences: ${wordCounter._getSentenceCount(doc, sel)} | 
            Paragraphs: ${wordCounter._getParagraphCount(doc, sel)}
        `);
    });
    

    // add to a list of disposables which are disposed when this extension
    // is deactivated again.
    ctx.subscriptions.push(controller);
    ctx.subscriptions.push(wordCounter);
    ctx.subscriptions.push(summaryCommand);
}

export class WordCounter {

    private _statusBarItem: StatusBarItem;

    public updateWordCount() {
        
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
            this._statusBarItem.command = 'wordcount.viewSummary';
        } 

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;
        let sel = editor.selection;

        // Only update status if an MD file
        if (doc.languageId === "markdown") {
            let wordCount = this._getWordCount(doc, sel);

            // Update the status bar
            this._statusBarItem.text = sel === undefined || sel.isEmpty ? `${wordCount} Words` : `${wordCount} Selected`;            
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getWordCount(doc: TextDocument, sel?: Selection): number {
        let docContent = sel === undefined || sel.isEmpty ? doc.getText() : doc.getText(sel);

        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        let wordCount = 0;
         
        if (docContent != "") {
            wordCount = docContent.split(" ").length;
        }

        return wordCount;
    }

    //this function counts the number of characters in the main content of the document
    public _getCharCount(doc: TextDocument, sel?: Selection): number {
        let docContent = sel === undefined || sel.isEmpty ? doc.getText() : doc.getText(sel);
    
        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, '');
        docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        docContent = docContent.replace(' ', '')
        let charCount = 0;
        if (docContent != "") {
            charCount = docContent.length;
        }

        return charCount;
    }

    //this function counts the number of sentences across the document by just looking at the number of 
    // full stops.
    public _getSentenceCount(doc: TextDocument, sel?: Selection): number {
        let docContent = sel === undefined || sel.isEmpty ? doc.getText() : doc.getText(sel);
        let sentenceCount = 0;
        if (docContent != "") {
            sentenceCount = docContent.split(".").length - 1;
        }

        return sentenceCount;
    }

    //this function counts the number of paragraphs across the document by defining a paragraph as characters split by 
    // two or more new lines
    public _getParagraphCount(doc: TextDocument, sel?: Selection): number {
        let docContent = sel === undefined || sel.isEmpty ? doc.getText() : doc.getText(sel);
        docContent += "\r\n\r\n"  /* Added so trailing newlines at the end of the document 
                                    can be factored out regardless if the user inputted it or not. Otherwise, 
                                    if the user leaves 2 trailing newlines, the program will split it and add both 
                                    sides to the counter. */
        let paragraphCount = 0;
        if (docContent != "") {
            paragraphCount = docContent.split(/[^\r\n][\r\n]{4}[\s\n\r]*/).length - 1;
        }

        return paragraphCount;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
