'use strict';
let Rx = require('.');

function getData () {
  return Rx.Observable.range(1, 10).share();
}

function getOtherData () {
  return Rx.Observable.range(1, 10).share();
}

module.exports = {
  require: {
    'rx': Rx,
    'fs': require('fs'),
    'async': require('async'),
    'events': require('events'),
    'path': require('path'),
    'rx-lite': require('./dist/rx.lite'),
    'request': require('request'),
  },
  globals: {
    Rx,
    getData,
    getOtherData,
    transducers: require('transducers-js'),
    setTimeout,
    process
  }
}

