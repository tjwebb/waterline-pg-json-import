'use strict';

var fs = require('fs');
var _ = require('lodash');
var Promise = require('bluebird');
var Waterline = require('waterline');
var pluralize = require('pluralize');

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

function convertType (value, type) {
  if ('integer' === type && _.isNumber(value)) return parseInt(value);
  if ('numeric' === type && _.isNumber(value)) return parseFloat(value);
  if ('boolean' === type) return (value === 'true');

  return value;
}

function createModel (table, json, connection) {
  var keyed = false;  // XXX https://github.com/balderdashy/sails-postgresql/issues/87

  var model = {
    adapter: 'postgresql',
    connection: connection,
    dynamicFinders: false,
    associationFinders: false,
    tableName: table.table_name,
    identity: table.table_name,
    schema: true,
    autoCreatedAt: false,
    autoUpdatedAt: false,
    autoPK: false,
    description: table.obj_description,

    attributes: _.object(_.keys(table.columns), _.map(table.columns, function (column, columnName) {
      var attribute = createColumn(column, json);
      if (attribute.primaryKey) {
        // XXX https://github.com/balderdashy/sails-postgresql/issues/87
        if (keyed) attribute.primaryKey = false;
        keyed = true;
      }
      return attribute;
    }))
  };

  _.merge(model.attributes, getReferencingColumns(table, json), 'referenced_column');
  return model;
}

function isUnique (column, constraints) {
  return _.any([
    isPrimaryKey(constraints, column),
    !!_.find(constraints, { constraint_type: 'UNIQUE', referenced_column: column.column_name })
  ]);
}

function isPrimaryKey (constraints, column) {
  return !!_.find(constraints, {
    constraint_type: 'PRIMARY KEY',
    referenced_column: column.column_name
  });
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
    return pluralize.plural(table);
  });
  return _.object(keys, _.map(referencingConstraints, function (constraint) {
    return {
      collection: constraint.table_name,
      via: constraint.column_name
    };
  }));
}

function hasAssociatedSequence (column, json) {
  var sequenceTable = json.sequences[column.table_name];
  var sequenceColumn = sequenceTable && sequenceTable[column.column_name];

  return (sequenceColumn || { }).increment === '1';
}

function hasImplicitSequence (column) {
  return /nextval/.test(column.column_default);
}

function getDefaultsTo (column, json) {
  if (hasImplicitSequence(column)) return undefined;

  return convertType(column.column_default, typeMap[column.data_type]);
}

function createColumn (column, json) {
  var tableConstraints = json.constraints[column.table_name];
  var columnConstraints = _.isObject(tableConstraints) && tableConstraints[column.column_name];
  var attribute = {
    required: !column.is_nullable,
    unique: isUnique(column, columnConstraints),
    defaultsTo: getDefaultsTo(column, json)
  };
  var foreignKeyConstraint = getForeignKeyConstraint(columnConstraints);

  if (foreignKeyConstraint) return _.extend(attribute, {
    model: foreignKeyConstraint.referenced_table
  });

  return _.extend(attribute, {
    type: typeMap[column.data_type],
    primaryKey: isPrimaryKey(columnConstraints, column)
  });
}

/**
 * Import a JSON Postgres schema into a Waterline ORM
 *
 * @param json        {Object} Postgres Schema as JSON Object
 * @param connection  {String} Waterline connection
 * @return {Array} Waterline.Collection objects
 * @see <https://github.com/tjwebb/pg-json-schema-export>
 */
exports.toORM = function (json, connection) {
  var logfile = './build/toORM_'+ connection + '.json';
  try { fs.unlinkSync(logfile); } catch (e) { }
  return _.map(json.tables, function (table) {
    var model = createModel(table, json, connection);
    fs.appendFileSync(logfile, JSON.stringify(model, null, 2));
    return Waterline.Collection.extend(model);
  });
};
