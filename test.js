var fs = require('fs');
var assert = require('assert');
var _ = require('lodash');
var importer = require('./');
var Waterline = require('waterline');
var util = require('util');

describe('waterline-pg-json-import', function () {
  var json = require('./build/postbooks_demo_460');
  var definition, orm, waterline;

  describe('#fromJSON', function () {
    before(function () {
      definition = importer.fromJSON(json, 'public');
      fs.writeFileSync('./build/output.json', JSON.stringify(definition, null, 2));
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
        console.log('after loadCollection, before initialize', util.inspect(process.memoryUsage()));
        waterline.initialize(wlContext, function (err, orm) {
          console.log('after initialize', util.inspect(process.memoryUsage()));
          collections = orm.collections;

          done(err);
        });
      });

      it('can create empty model', function (done) {
        collections.accnt.create({ })
          .then(function (accnt) {
            console.log(accnt);
            done();
          })
          .catch(done);
      });

    });

  });

});
