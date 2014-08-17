'use strict';

var fs = require('fs');
var _ = require('lodash');
var Promise = require('bluebird');
var Waterline = require('waterline');

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
  'timestamp without time zone': 'datetime',
  'character varying': 'string',
  ARRAY: 'array',
  bytea: 'binary',
  json: 'json',
  bigint: 'integer'
};

var requiredMap = {
  'YES': false,
  'NO': true
};

function createModel (table, json, connection) {
  var model = {
    adapter: 'postgresql',
    connection: connection,
    dynamicFinders: false,
    associationFinders: false,
    tableName: table.table_name,
    identity: table.table_name,
    schema: true,
    description: table.obj_description,

    attributes: _.object(_.keys(table.columns), _.map(table.columns, function (column, columnName) {
      return createColumn(column, json);
    }))
  };

  _.merge(model.attributes, getReferencingColumns(table, json), 'referenced_column');
  return model;
}

function isUnique (constraints) {
  return !!_.find(constraints, { constraint_type: 'UNIQUE' });
}

function isPrimaryKey (constraints) {
  return !!_.find(constraints, { constraint_type: 'PRIMARY KEY' });
}

function getForeignKeyConstraint (constraints) {
  return _.find(constraints, { constraint_type: 'FOREIGN KEY' });
}

var indexConstraintsByReferencedTable = _.memoize(function (json) {
  return _.groupBy(_.flatten(_.values(_.mapValues(json.constraints, _.values))), 'referenced_table');
});

function getReferencingColumns (table, json) {
  var indexedConstraints = indexConstraintsByReferencedTable(json);
  var referencingConstraints = _.where(indexedConstraints[table.table_name], {
    constraint_type: 'FOREIGN KEY',
  });
  var keys = _.map(_.pluck(referencingConstraints, 'table_name'), function (table) {
    return table + 's';
  });

  return _.object(keys, _.map(referencingConstraints, function (constraint) {
    return {
      collection: constraint.table_name,
      via: constraint.column_name
    };
  }));
}

function hasSequence (column, json) {
  var tableSequences = json.sequences[column.table_name];
  var columnSequence = _.isObject(tableSequences) && tableSequences[column.column_name];
  return columnSequence && columnSequence.increment === '1';
}

function createColumn (column, json) {
  var tableConstraints = json.constraints[column.table_name];
  var columnConstraints = _.isObject(tableConstraints) && tableConstraints[column.column_name];
  var attribute = {
    required: !!requiredMap[column.is_nullable],
    unique: isUnique(columnConstraints)
  };
  var foreignKeyConstraint = getForeignKeyConstraint(columnConstraints);

  if (foreignKeyConstraint) return _.extend(attribute, {
    model: foreignKeyConstraint.referenced_table
  });

  return _.extend(attribute, {
    type: typeMap[column.data_type],
    primaryKey: isPrimaryKey(columnConstraints),
    autoIncrement: hasSequence(column, json)
  });
}

/**
 * Import a JSON Postgres schema into a Waterline ORM
 */
exports.toORM = function (json, connection) {
  return _.map(json.tables, function (table) {
    return Waterline.Collection.extend(createModel(table, json, connection));
  });
};
