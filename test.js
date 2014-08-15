var fs = require('fs');
var assert = require('assert');
var _ = require('lodash');
var importer = require('./');

describe('waterline-pg-json-import', function () {
  var json = require('./schema_mocha');
  var orm;

  describe('#fromJSON', function () {
    before(function () {
      orm = importer.fromJSON(json, 'public');
      console.log(orm);
    });

    it('should return a waterline ORM', function () {
      assert(_.isObject(orm));
    });

  });

});
