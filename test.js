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
      disk: require('sails-disk')
    },
    connections: {
      mocha: {
        adapter: 'disk'
      }
    }
  };
  var orm, waterline;

  describe('#toORM', function () {
    before(function () {
      orm = importer.toORM(json, 'mocha');
      fs.writeFileSync('./build/output.json', JSON.stringify(orm, null, 2));
      waterline = new Waterline();

      _.each(orm, waterline.loadCollection, waterline);
    });

    describe('Waterline#initialize', function () {
      this.timeout(120 * 1000);
      var collections;
      before(function (done) {
        waterline.initialize(configuration, function (err, orm) {
          collections = orm.collections;

          done(err);
        });
      });

      it('can create empty model', function (done) {
        collections.accnt.create({ })
          .then(function (accnt) {
            done();
          })
          .catch(done);
      });

    });

  });

});
