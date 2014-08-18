var fs = require('fs');
var assert = require('assert');
var _ = require('lodash');
var importer = require('./');
var Waterline = require('waterline');
var util = require('util');

describe('waterline-pg-json-import', function () {
  var json = require('./build/postbooks_demo_460');
  var configuration = {
    adapters: {
      memory: require('sails-memory')
    },
    connections: {
      mocha: {
        adapter: 'memory'
      }
    }
  };
  var orm, waterline, collections;

  describe('#toORM', function () {
    it('should run without error', function () {
      orm = importer.toORM(json, 'mocha');
    });
    it('result is accepted by waterline.loadCollection without error', function () {
      waterline = new Waterline();
      _.each(orm, waterline.loadCollection, waterline);
      fs.writeFileSync('./build/output.json', JSON.stringify(orm, null, 2));
    });

    describe('Waterline#initialize', function () {
      this.timeout(120 * 1000);

      it('should run without error', function (done) {
        waterline.initialize(configuration, function (err, orm) {
          collections = orm.collections;

          done(err);
        });
      });
    });
  });

  describe('Waterline Models', function () {
    it('can create empty model', function (done) {
      collections.accnt.create({ })
        .then(function (accnt) {
          done();
        }).catch(done);
    });

  });

});
