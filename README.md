waterline-pg-json-import
========================

Construct a Waterline ORM from a Postgres Schema.

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]

## Install
```sh
$ npm install waterline-pg-json-import
```

## Usage

### Input JSON
First export your Postgres schema using https://www.npmjs.org/package/pg-json-schema-export

### Run the Importer
```js
var importer = require('waterline-pg-json-import');
var json = {
  // output from pg-json-schema-export
};
var configuration = {
  adapters: {
    disk: require('sails-disk')
  },
  connections: {
    readme: {
      adapter: 'disk'
    }
  }
};
var orm = importer.toORM(json, 'readme');
var collections;
waterline.initialize(configuration, function (err, orm) {
  if (err) throw err;
  collections = orm.collections;
});

```

## License
MIT

[npm-image]: https://img.shields.io/npm/v/waterline-pg-json-import.svg?style=flat
[npm-url]: https://npmjs.org/package/waterline-pg-json-import
[travis-image]: https://img.shields.io/travis/tjwebb/waterline-pg-json-import.svg?style=flat
[travis-url]: https://travis-ci.org/tjwebb/pg-json-schema-export
[daviddm-image]: http://img.shields.io/david/tjwebb/waterline-pg-json-import
[daviddm-url]: https://david-dm.org/tjwebb/waterline-pg-json-import
