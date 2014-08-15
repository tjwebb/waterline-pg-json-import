'use strict';

var fs = require('fs');
var _ = require('lodash');
var Promise = require('bluebird');

/**
 * A mapping of Postgres type to Waterline type. A reverse of
 * https://github.com/balderdashy/sails-postgresql/blob/master/lib/utils.js#L227-L272
 */
var typeMap = {
  integer: 'integer',
  string: 'string',
  text: 'string', 
  character: 'string',
  numeric: 'float',
  date: 'date',
  'boolean': 'boolean',
  'time with time zone': 'time',
  'timestamp with time zone': 'datetime',
  ARRAY: 'array',
  bytea: 'binary',
  json: 'json',
  bigint: 'integer'
};

var requiredMap = {
  'YES': false,
  'NO': true
};

function createModel (table, name, json, schema) {
  return {
    adapter: 'postgresql',
    tableName: name,
    identity: name,
    schema: true,
    description: table.obj_description,

    attributes: _.object(_.keys(table.columns), _.map(table.columns, function (column, name) {
      return createColumn(column, name, json, schema);
    }))
  };
}

function createColumn (column, name, json, schema) {
  // resolve column polymorphism
  return {
    type: typeMap[column.data_type],
    required: requiredMap[column.is_nullable],
    defaultsTo: column.column_default,
    autoIncrement: getAutoIncrement(column, json, schema)
  };
}

function getAutoIncrement (column, json, schema) {
  return (_.isNumber(column.increment));
}

/**
 * Import a JSON Postgres schema into a Waterline ORM
 */
exports.fromJSON = function (json, schema) {
  return _.map(json[schema].tables, function (table, name) {
    return createModel(table, name, json, schema);
  });
};
