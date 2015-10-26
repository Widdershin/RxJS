#! /usr/bin/env node

var Rx = require('.');

var fs = require('fs');

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function () {
  var filesToTest = process.stdin.read();

  if (filesToTest !== null) {
    var results = filesToTest
      .split('\n')
      .filter(fileName => fileName !== '')
      .map(read)
      .map(parseCodeSnippets)
      .map(testFile);

    printResults(flattenArray(results));
  }
});

function read (fileName) {
  return {contents: fs.readFileSync(fileName, 'utf8'), fileName};
}

function parseCodeSnippets (args) {
  var contents = args.contents;
  var fileName = args.fileName;

  var last = (arr) => arr[arr.length - 1];

  var codeSnippets = contents.split('\n').reduce((snippets, line, index) => {
    var lastSnippet = last(snippets);

    if (line === '```js') {
      snippets.lastComplete = false;
      return snippets.concat({code: '', lineNumber: index + 1, fileName});
    }

    if (lastSnippet && !snippets.lastComplete) {
      if (line === '```') {
        snippets.lastComplete = true;
      } else {
        lastSnippet.code += line + '\n';
      }
    }

    return snippets;
  }, []);

  return {fileName, codeSnippets: codeSnippets.map(cleanUpSnippet)};
}

function testFile (args) {
  var codeSnippets = args.codeSnippets;
  var fileName = args.fileName;

  var results = codeSnippets.map(test(fileName));

  return flattenArray(results);
}

function test (filename) {
  return (codeSnippet) => {
    var success = false;
    var stack = undefined;

    var oldLog = console.log;

    console.log = () => null;

    try {
      eval(codeSnippet.code);

      success = true;
    } catch (e) {
      stack = e.stack;
    } finally {
      console.log = oldLog;
    }

    return {success: success, codeSnippet: codeSnippet, stack: stack};
  };
}

function flattenArray (array) {
  return array.reduce((a, b) => a.concat(b), []);
}

function printResults (results) {
  results
    .filter(result => !result.success)
    .forEach(printFailure)

  var totalTestCount = results.length;
  var passingCount = results.filter(result => result.success).length;

  console.log(`${passingCount} passed out of ${totalTestCount} run.`);
}

function printFailure (result) {
  console.log(`FAILURE: ${result.codeSnippet.fileName}:${result.codeSnippet.lineNumber}`);
  console.log(relevantStackDetails(result.stack));
  console.log('');
}

function cleanUpSnippet (codeSnippet) {
  var rxImport = "var Rx = require('rx');";
  var rxImportComma = "var Rx = require('rx'),";

  codeSnippet.code = codeSnippet.code
    .replace('```js', '')
    .replace('```', '')
    .replace(rxImport, '')
    .replace(rxImportComma, '');

  return codeSnippet;
}

function relevantStackDetails (stack) {
  var match = stack.match(/([\w\W]*)at eval/) ||
    stack.match(/([\w\W]*)at [\w*\/]*doctest.js/);

  if (match !== null) {
    return match[1];
  }

  return stack;
}
