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
      memory: require('sails-memory'),
    },
    connections: {
      mocha: {
        adapter: 'memory',
      }
    }
  };

  describe.skip('#toORM', function () {
    var orm, waterline, collections;
    it('should run without error', function () {
      orm = importer.toORM(json, 'mocha');
    });
    it('result is accepted by waterline.loadCollection without error', function () {
      waterline = new Waterline();
      _.each(orm, waterline.loadCollection, waterline);
      fs.writeFileSync('./build/output.json', JSON.stringify(orm, null, 2));
    });

    describe('Waterline#initialize', function () {
      this.timeout(30 * 1000);

      it('should run without error', function (done) {
        waterline.initialize(configuration, function (err, orm) {
          collections = orm.collections;

          done(err);
        });
      });
    });
    describe.skip('Waterline Models', function () {
      it('can create empty model', function (done) {
        collections.accnt.create({ })
          .then(function (accnt) {
            done();
          }).catch(done);
      });
    });
  });

  describe('postgres adapter', function () {
    var collections;
    var pgConfiguration = {
      adapters: {
        postgresql: require('sails-postgresql')
      },
      connections: {
        postgresql: {
          adapter: 'postgresql',
          user: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || 'postgres',
          database: process.env.POSTGRES_DATABASE || 'postgres',
          port: process.env.POSTGRES_PORT || 5432
        }
      }
    };
    before(function (done) {
      this.timeout(300 * 1000); // 5 minutes
      var orm = importer.toORM(json, 'postgresql');
      var waterline = new Waterline();
      _.each(orm, waterline.loadCollection, waterline);

      waterline.initialize(pgConfiguration, function (err, orm) {
        if (err) {
          console.log(util.inspect(err));
          throw err;
        }

        collections = orm.collections;

        done(err);
      });
    });
    it('can create empty model', function (done) {
      collections.accnt.create({ })
        .then(function (accnt) {
          done();
        }).catch(done);
    });
  });

});
