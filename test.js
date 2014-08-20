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

  describe('#toORM', function () {
    var orm, waterline, collections;
    it('should run without error', function () {
      orm = importer.toORM(json, 'mocha');
    });
    it('result is accepted by waterline.loadCollection without error', function () {
      waterline = new Waterline();
      _.each(orm, waterline.loadCollection, waterline);
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
    describe('Waterline Models', function () {
      it('can create empty model', function (done) {
        collections.crmacct.create({ crmacct_id: 100, crmacct_number: 'qwert', crmacct_active: true })
          .then(function (accnt) {
            done();
          }).catch(function (error) {
            done(error);
          });
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
    it('should create postgres schema', function (done) {
      this.timeout(300 * 1000); // 5 minutes
      var orm = importer.toORM(json, 'postgresql');
      var waterline = new Waterline();
      _.each(orm, waterline.loadCollection, waterline);

      waterline.initialize(pgConfiguration, function (err, orm) {
        if (err) return done(err);
        collections = orm.collections;
        done();
      });
    });
    it('can create empty model', function (done) {
      collections.crmacct.create({ crmacct_id: 2, crmacct_number: 'xyz' })
        .then(function (accnt) {
          done();
        }).catch(function (error) {
          done(error);
        });
    });
  });

});
