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
      .map(testFile);

   printResults(flattenArray(results));
  }
});

function read (fileName) {
  return {contents: fs.readFileSync(fileName, 'utf8'), fileName};
}

function testFile (args) {
  var contents = args.contents;
  var fileName = args.fileName;
  var codeSnippets = contents.match(/```js([^```]*)```/g) || [];

  var results = codeSnippets
    .map(cleanUpSnippet)
    .map(test(fileName));

  return flattenArray(results);
}

function test (filename) {
  return (codeSnippet) => {
    var success = false;

    var oldLog = console.log;

    console.log = () => null;

    try {
      eval(codeSnippet);

      success = true;
    } catch (e) {
      oldLog(filename);
      console.trace(e);
    }

    console.log = oldLog;

    return {success: success, filename: filename};
  };
}

function flattenArray (array) {
  return array.reduce((a, b) => a.concat(b), []);
}

function printResults (results) {
  console.log(results.filter(result => !result.success));

  var totalTestCount = results.length;
  var passingCount = results.filter(result => result.success).length;

  console.log(`${passingCount} passed out of ${totalTestCount} run.`);
}

function cleanUpSnippet (codeSnippet) {
  var rxImport = "var Rx = require('rx');";

  return codeSnippet
    .replace('```js', '')
    .replace('```', '')
    .replace(rxImport, '');
}
