// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as path from 'path';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Word Count Tests", () => {

	// Defines a Mocha unit test
	test("Word Count", (done) => {
		let testWordCounter = new myExtension.WordCounter();

		vscode.workspace.openTextDocument(path.join(__dirname, '..', '..', 'vsc-extension-quickstart.md')).then((document) => {
			assert.equal(testWordCounter._getWordCount(document), 254);
			done();
		}, (error) => {
			assert.fail(error);
			done();
		});
	});
});
