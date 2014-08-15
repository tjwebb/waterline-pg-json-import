var fs = require('fs');
var assert = require('assert');
var _ = require('lodash');
var importer = require('./');

describe('waterline-pg-json-import', function () {
  var json = require('schema_mocha');
  var orm;

  describe('#fromJSON', function () {
    before(function (done) {
      importer.fromJSON(json)
        .then(function (_orm) {
          orm = _orm;
          done();
        })
        .catch(done);
    });

    it('should return a waterline ORM', function () {

    });

  });

});
