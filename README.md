waterline-pg-json-import
========================

Construct a Waterline ORM from a Postgres Schema.

[![Build Status](https://travis-ci.org/tjwebb/waterline-pg-json-import.svg?branch=master)](https://travis-ci.org/tjwebb/waterline-pg-json-import)
[![NPM version](https://badge.fury.io/js/waterline-pg-json-import.svg)](http://badge.fury.io/js/waterline-pg-json-import)
[![Dependency Status](https://david-dm.org/tjwebb/waterline-pg-json-import.svg)](https://david-dm.org/tjwebb/waterline-pg-json-import)

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
