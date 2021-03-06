'use strict';

const common = require('../../common');
const assert = require('assert');
const vm = require('vm');
const binding = require('./build/Release/binding');
const makeCallback = binding.makeCallback;

assert.strictEqual(42, makeCallback(process, common.mustCall(function() {
  assert.strictEqual(0, arguments.length);
  assert.strictEqual(this, process);
  return 42;
})));

assert.strictEqual(42, makeCallback(process, common.mustCall(function(x) {
  assert.strictEqual(1, arguments.length);
  assert.strictEqual(this, process);
  assert.strictEqual(x, 1337);
  return 42;
}), 1337));

const recv = {
  one: common.mustCall(function() {
    assert.strictEqual(0, arguments.length);
    assert.strictEqual(this, recv);
    return 42;
  }),
  two: common.mustCall(function(x) {
    assert.strictEqual(1, arguments.length);
    assert.strictEqual(this, recv);
    assert.strictEqual(x, 1337);
    return 42;
  }),
};

assert.strictEqual(42, makeCallback(recv, 'one'));
assert.strictEqual(42, makeCallback(recv, 'two', 1337));

// Check that the callback is made in the context of the receiver.
const target = vm.runInNewContext(`
    (function($Object) {
      if (Object === $Object)
        throw Error('bad');
      return Object;
    })
`);
assert.notStrictEqual(Object, makeCallback(process, target, Object));

// Runs in inner context.
const forward = vm.runInNewContext(`
    (function(forward) {
      return forward(Object);
    })
`);
// Runs in outer context.
const endpoint = function($Object) {
  if (Object === $Object)
    throw Error('bad');
  return Object;
};
assert.strictEqual(Object, makeCallback(process, forward, endpoint));
