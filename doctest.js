#! /usr/bin/env node

var Rx = require('.');

var fs = require('fs');

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function () {
  var filesToTest = process.stdin.read();

  if (filesToTest !== null) {
    filesToTest
      .split('\n')
      .filter(fileName => fileName !== '')
      .map(read)
      .forEach(testFile);
  }
});

function read (fileName) {
  return fs.readFileSync(fileName, 'utf8');
}

function testFile (docFile) {
  var codeSnippets = docFile.match(/```js([^```]*)```/g) || [];

  codeSnippets
    .map(snippet => snippet.replace('```js', '').replace('```', ''))
    .forEach(test);
}

function test (codeSnippet) {
  var success = false;

  try {
    eval(codeSnippet);

    success = true;
  } catch (e) {
    console.trace(e);
  }

  console.log(success);
}

