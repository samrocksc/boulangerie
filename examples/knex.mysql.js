/**
 * for this example we setup knex with postgres in order to extend postgres to passing data through
 * our service and output steps. this allows for a vanilla version of knex with postgres.  because knex is doing all
 * of the heavy lifting for us, we can simply just pass through, and make our entire connection happen in
 * the adapter
 */
const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'db',
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
