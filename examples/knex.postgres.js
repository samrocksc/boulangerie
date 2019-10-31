/**
 * for this example we setup knex with postgres in order to extend postgres to passing data through
 * our service and output steps. this allows for a vanilla version of knex with postgres
*/
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  },
});

const boulangerie = require('../');

/**
 * use a pass-through function because the promise occurs in the build step and our builder has no middle man executor
 */
const serviceStep = async x => x;

/**
 * we use the output step to do anything we need to to the data
 */
const outputStep = async data => {
  return data[0];
};

const buildStep = async () => knex;

const config = {
  build: [buildStep],
  service: [serviceStep],
  output: [outputStep],
};

const client = boulangerie(config);

module.exports = client;
