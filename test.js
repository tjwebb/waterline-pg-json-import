var fs = require('fs');
var assert = require('assert');
var _ = require('lodash');
var importer = require('./');
var Waterline = require('waterline');

describe('waterline-pg-json-import', function () {
  var json = require('./build/postbooks_demo_460');
  var definition, orm, waterline;

  describe('#fromJSON', function () {
    before(function () {
      definition = importer.fromJSON(json, 'public');
      waterline = new Waterline();
    });

    describe('Waterline.Collection', function () {
      before(function () {
        orm = _.transform(_.groupBy(definition, 'tableName'), function (_orm, _model, name) {
          var model = _model[0];
          model.connection = 'mocha';
          _orm[name] = Waterline.Collection.extend(model);
          waterline.loadCollection(_orm[name]);
        });
      });
      it('should return an object', function () {
        assert(_.isObject(definition));
      });
      it('Waterline.Collection.extend', function () {
        assert(_.isObject(orm));
        assert(_.isObject(orm.aropen));
      });
    });

    describe('Waterline#initialize', function () {
      this.timeout(60 * 1000);
      var collections;
      var wlContext = {
        adapters: {
          postgresql: require('sails-disk')
        },
        connections: {
          mocha: {
            adapter: 'postgresql'
          }
        }
      };
      before(function (done) {
        waterline.initialize(wlContext, function (err, _collections) {
          //console.log(_collections);
          collections = _collections;

          done(err);
        });
      });

      it('should load collection', function () {

      });


    });

  });

});