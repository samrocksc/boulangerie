const { ApolloClient } = require('apollo-boost');
const gql = require('graphql-tag');

const boulangerie = require('../');

// NOTE: Set up your apollo client here
const graphqlClient = new ApolloClient({
  uri: 'localhost:3000',
});

const prepQuery = ({ query, values, options }) => {
  if (!query) {
    throw Error('you must provide a valid query');
  }
  const queryFunc = () => gql`
    ${query}
  `;
  const prepped = {
    queryFunc,
    values,
    options,
  };
  return prepped;
};

const runQuery = async ({ queryFunc, values, options }) => {
  const results = await graphqlClient.query({ query: queryFunc(), variables: values });
  return {
    results,
    options,
  };
};

/**
 * @returns {object} builder - a builder object
 * @returns {function} builder.raw - a function that will accept a query and options
 */
const builderFunc = () => ({
  raw: (query, values, options) => ({ query, values, options }),
});

/**
 * Output func is going to take the options pass through, and if a query name is provided it's going to grab that specific query for you
 * @param {object} param.results - the results of the query
 * @param {object} param.options - options passed through from the builderFunc. Determines any special handling of the return
 */
const outputFunc = async ({ results, options }) => {
  if (options && options.queryName) {
    return results.data[options.queryName].results;
  }
  return results.data;
};

const config = {
  build: [builderFunc],
  service: [prepQuery, runQuery],
  output: [outputFunc],
};

const client = async () => boulangerie(config);

/**
 * A Working Example assuming you have a resolver of heroes names
 */
// const samplegraphqlQuery = `{
//   hero {
//     name
//   }
// }`;
// client().then(({ execute, builder }) => {
//   execute(builder.raw(samplegraphqlQuery)).then(res => {
//     console.log('raw');
//     return res;
//   });
// });

module.exports = client;
