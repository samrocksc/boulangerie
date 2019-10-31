// PROTIP: mocking debug env varreturns must happen before the loading of the debug module.
// process.env.DEBUG = 'bread';
const mysqlBricks = require('mysql-bricks');
const sqlBricks = require('sql-bricks');
const dv = require('debug')('bread');

/*
 * returns the proper sql-bricks for the requested dialect
 * @param {string} dialect - the dialect of sql you would like to use */
const getDialect = dialect => {
  const dialectMap = {
    generic: sqlBricks, // SQL-92 compliant
    mysql: mysqlBricks, // SQL-92 plus MySQL functions
  };
  if (dialectMap[dialect]) {
    return dialectMap[dialect];
  }
  dv('no dialect provided reverting to SQL-92 specific functionality');
  return dialectMap.generic;
};

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

const cleanResult = (structure, data) =>
  data.reduce((acc, cur, ind) => {
    const checkNullsy = item => {
      const key = Object.keys(item)[0];
      const value = item[key];
      const newData = key === 'isNull' && value === true ? null : value;
      // console.log(`given value: ${value === true} and key: ${key === 'isNull'}, data is ${data}`);
      return newData;
    };
    return {
      ...acc,
      [structure[ind].name]: checkNullsy(cur),
    };
  }, {});

/*
 * Provides the sql-bricks query builder
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @params {function} settings - settings available
 */
const queryBuilder = (executeSql, bricksQueryBuilder, settings) => {
  if (!executeSql || !bricksQueryBuilder) {
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
      const queryCount = options.countQuery ? await executeSql(options.countQuery.toString()) : resultsQuery.length;

      if (settings.isDataApi) {
        const rawResults = await executeSql(resultsQuery.toString());

        return {
          results: rawResults.records.map(result => {
            return cleanResult(rawResults.columnMetadata, result);
          }),
          count: parseInt(queryCount.records[0][0].longValue, 10), // is still a longValue if this is 0
        };
      }
      dv(resultsQuery.toString());
      return {
        results: await executeSql(resultsQuery.toString()),
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
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const browse = (executeSql, bricksQueryBuilder, settings) => {
  if (
    !executeSql ||
    !bricksQueryBuilder ||
    typeof executeSql !== 'function' ||
    typeof bricksQueryBuilder !== 'function'
  ) {
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
      .select(settings.isDataApi ? '*' : options.fields)
      .from(table)
      .where(filter)
      .limit(options.pageSize || defaultOptions.pageSize)
      .offset(offset);

    const countQuery = bricksQueryBuilder
      .select('COUNT(*)')
      .from(table)
      .where(filter);

    if (settings.isDataApi) {
      const rawResults = await executeSql(resultsQuery.toString());
      const rawCount = await executeSql(countQuery.toString());

      return {
        results: rawResults.records.map(result => {
          return cleanResult(rawResults.columnMetadata, result);
        }),
        count: parseInt(rawCount.records[0][0].longValue, 10), // is still a longValue if this is 0
      };
    }
    return {
      results: await executeSql(resultsQuery.toString()),
      count: await executeSql(countQuery.toString()),
    };
  };
};

/*
 * returns a connected function to read database
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const read = (executeSql, bricksQueryBuilder) => {
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
    return executeSql(query.toString());
  };
};

/*
 * Returns a function that updates an item based off of its ID
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const edit = (executeSql, bricksQueryBuilder) => {
  /*
   * Updates an item by its ID
   */
  return async (table, id, updateObj, options) => {
    const qbQuery = bricksQueryBuilder
      .update(table)
      .set(updateObj)
      .where({ [options.idField]: id });
    dv(qbQuery);
    return executeSql(qbQuery.toString());
  };
};

/*
 * returns function for adding an item
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const add = (executeSql, bricksQueryBuilder) => {
  /*
   * Adds a row to the database
   * @param {string} table - the table you would like to utilize
   * @param {object} addObj - object to add to the database
   */
  return async (table, addObj) => {
    const qbQuery = bricksQueryBuilder.insert(table, addObj);
    dv(qbQuery);
    return executeSql(qbQuery.toString());
  };
};

/*
 * Removes an item from a table
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 * @param {function} bricksQueryBuilder - the sql query builder with bricks syntax
 * @param {object} settings - settings passed into the configuration of the function
 */
const del = (executeSql, bricksQueryBuilder) => {
  /*
   * Uses the id and id field to delete an item from a table
   * @param {string} table - the table you would like to utilize
   * @param {string/integer} id - field you want to delete by
   * @param {object} options - options for deletion, such as idField
   */
  return async (table, id, options) => {
    const qbQuery = bricksQueryBuilder.deleteFrom(table).where({ [options.idField]: id });
    dv(qbQuery.toString())
    return executeSql(qbQuery.toString());
  };
};

/*
 * @param {function} executeSql - a Connector for an ORM that receives a raw query
 */
const raw = (executeSql, settings) => {
  /*
   * Using a text query, runs the query on the selected system directly
   * @param {string} query - A valid SQL query
   */
  return async query => {
    if (!query) {
      throw Error('No Query Provided');
    }

    dv(query);
    if (settings.isDataApi) {
      const rawResults = await executeSql(query);

      return rawResults.records.map(result => {
        return cleanResult(rawResults.columnMetadata, result);
      });
    }
    return executeSql(query);
  };
};

/*
 * Function that creates an adapter surface for any surface providing raw functionality
 * @param {function} connector - a Connector for an ORM that receives a raw query
 * @param {string} dialect - a dialect of SQL, defaults to SQL92 functionality only.
 */
const provideBread = (connector, options = { isDataApi: false }) => {
  if (!connector) {
    throw Error('No connector provided, sql cannot execute');
  }
  const brick = getDialect(options.dialect || defaultOptions.dialect);
  return {
    queryBuilder: queryBuilder(connector, brick, options),
    browse: browse(connector, brick, options),
    read: read(connector, brick, options),
    edit: edit(connector, brick, options),
    add: add(connector, brick, options),
    del: del(connector, brick, options),
    raw: raw(connector, options),
  };
};

module.exports = {
  provideBread,
  queryBuilder,
  browse,
  read,
  edit,
  add,
  del,
  raw,
  getDialect,
  cleanResult,
};
