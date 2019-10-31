const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'db',
  },
});
// PROTIP: mocking debug env varreturns must happen before the loading of the debug module.
// process.env.DEBUG = 'bread';
const mysqlBricks = require('mysql-bricks');
const dv = require('debug')('bread');

const boulangerie = require('../');
/**
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 */

/*
 * Default options for passing into other libraries
 */
const defaultOptions = {
  dialect: 'mysql', // We want to default to mysql for the time being
  dateField: 'created_at',
  pageSize: 1000, // Always default to default 1000 as the max for Data API is 1000
  page: 0,
  sortOrder: 'ASC',
  idField: 'id',
};

/*
 * Provides the sql-bricks query builder
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @params {function} settings - settings available
 */
const queryBuilder = bricksQueryBuilder => {
  if (!bricksQueryBuilder) {
    throw Error('Invalid params provided to queryBuilder');
  }
  /**
   * executeQb - will act in a similar way to the function returned from browse
   * @param {object} filter - the object you would like to search by
   * @param {array} fields - the list of fields you would like returned from the select query
   * @param {object} options - settings for what pages you would like to see
   * @param {integer} options.page - offset for pagination
   * @param {integer} options.pageSize - total options for page(note: max 1000 if AWS data API)
   * TODO: Remove the count query and find a way to automate this
   * @param {function} options.countQuery - Assuming that you want pagination, pass in a countQuery function with page size
   */
  const executeQb = async (
    builtQuery,
    options = {
      fields: '*',
      page: defaultOptions.page,
      pageSize: defaultOptions.pageSize,
    }
  ) => {
    // This is unfortunately assuming that you're using MySQL 5.6 Data API
    try {
      const offset = (options.pageSize || defaultOptions.pageSize) * (options.page || defaultOptions.page);

      const resultsQuery = builtQuery.limit(options.pageSize || defaultOptions.pageSize).offset(offset);

      // This is something we want to replace eventually
      const queryCount = options.countQuery ? options.countQuery.toParams({ placeholder: '?' }) : resultsQuery.length;

      dv(resultsQuery.toParams({ placeholder: '?' }));
      return {
        results: resultsQuery.toParams({ placeholder: '?' }),
        count: queryCount,
      };
    } catch (err) {
      throw err;
    }
  };

  return () => ({
    executeQb,
    queryBuilder: bricksQueryBuilder,
  });
};

/*
 * returns a connected function to browse database
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const browse = (bricksQueryBuilder, settings) => {
  if (!bricksQueryBuilder || typeof bricksQueryBuilder !== 'function') {
    throw Error('invalid params supplied to browse');
  }
  /*
   * @param {string} table - the table you would like to check
   * @param {object} filter - the object you would like to search by
   * @param {array} fields - the list of fields you would like returned from the select query
   * @param {object} options - settings for what pages you would like to see
   * @param {integer} options.page - offset for pagination
   * @param {integer} options.pageSize - total options for page(note: max 1000 if AWS data API)
   */
  return async (
    table,
    filter,
    options = {
      fields: '*',
      page: defaultOptions.page,
      pageSize: defaultOptions.pageSize,
    }
  ) => {
    // This is unfortunately assuming that you're using MySQL 5.6 Data API
    const offset = (options.pageSize || defaultOptions.pageSize) * options.page;
    const resultsQuery = bricksQueryBuilder
      .select(options.fields)
      .from(table)
      .where(filter)
      .limit(options.pageSize || defaultOptions.pageSize)
      .offset(offset);

    const countQuery = bricksQueryBuilder
      .select('COUNT(*)')
      .from(table)
      .where(filter);

    return {
      results: resultsQuery.toParams({ placeholder: '?' }),
      count: countQuery.toParams({ placeholder: '?' }),
    };
  };
};

/*
 * returns a connected function to read database
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const read = bricksQueryBuilder => {
  /**
   * rturns a single item returned by its ID, the read implies you need that specific item.
   * @param {string} table - the table you would like to check
   * @param {int} id - The id of the product that needs to be read
   */
  return async (table, id, options = { fields: '*', idField: defaultOptions.idField }) => {
    const query = bricksQueryBuilder
      .select(options.fields)
      .from(table)
      .where({ [options.idField]: id })
      .limit(1);
    return query.toParams({ placeholder: '?' });
  };
};

/*
 * Returns a function that updates an item based off of its ID
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const edit = bricksQueryBuilder => {
  /*
   * Updates an item by its ID
   */
  return async (table, id, updateObj, options) => {
    const qbQuery = bricksQueryBuilder
      .update(table)
      .set(updateObj)
      .where({ [options.idField]: id });
    dv(qbQuery);
    return qbQuery.toParams({ placeholder: '?' });
  };
};

/*
 * returns function for adding an item
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const add = bricksQueryBuilder => {
  /*
   * Adds a row to the database
   * @param {string} table - the table you would like to utilize
   * @param {object} addObj - object to add to the database
   */
  return async (table, addObj) => {
    const qbQuery = bricksQueryBuilder.insert(table, addObj);
    dv(qbQuery);
    return qbQuery.toParams({ placeholder: '?' });
  };
};

/*
 * Removes an item from a table
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const del = bricksQueryBuilder => {
  /*
   * Uses the id and id field to delete an item from a table
   * @param {string} table - the table you would like to utilize
   * @param {string/integer} id - field you want to delete by
   * @param {object} options - options for deletion, such as idField
   */
  return async (table, id, options) => {
    const qbQuery = bricksQueryBuilder.deleteFrom(table).where({ [options.idField]: id });
    dv(qbQuery.toString());
    return qbQuery.toString();
  };
};

/*
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 */
const raw = executeSql => {
  /*
   * Using a text query, runs the query on the selected system directly
   * @param {string} query - A valid SQL query
   */
  return async query => {
    if (!query) {
      throw Error('No Query Provided');
    }

    dv(query);
    return executeSql(query);
  };
};

/*
 * Function that creates an adapter surface for any surface providing raw functionality
 * @param {function} connector - a Connector for an ORM that receives a raw query
 * @param {string} dialect - a dialect of SQL, defaults to SQL92 functionality only.
 */
const provideBread = options => {
  const brick = mysqlBricks;
  return {
    queryBuilder: queryBuilder(brick, options),
    browse: browse(brick, options),
    read: read(brick, options),
    edit: edit(brick, options),
    add: add(brick, options),
    del: del(brick, options),
    raw: raw(brick, options),
  };
};

/**
 * Here you can see our output step is releasing the count values according to what sql executor we are using
 */
const outputStep = async data => {
  const { results, count } = data;
  const countObj = count[0][0];
  const countVal = countObj[Object.keys(countObj)[0]];
  const result = {
    results: results[0],
    count: countVal,
  };
  return result;
};

const serviceSql = async query => {
  const { results, count, text, values } = query;
  if (count) {
    const result = {
      results: await knex.raw(results.text, results.values),
      count: await knex.raw(count.text, results.values),
    };
    return result;
  }
  return knex.raw(text, values);
};

const config = {
  build: [provideBread],
  service: [serviceSql],
  output: [outputStep],
};

const client = boulangerie(config);

/**
 * Uncomment this to get a quick view of what's happening
 */
// client.then(res => {
//   return res.execute(res.builder.browse('test')).then(res2 => {
//     console.log('res2', res2);
//     return res2;
//   });
// });

module.exports = client;
