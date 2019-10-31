const buildAdapterFunc = require('./src/lib/buildAdapterFunc');

/**
 * The builder function of boulangerie, the only requirement is a processor function
 * @param {object} config - the config object
 * @param {array} [config.build] - An array of functions to run during the build process
 * @param {array} [config.service] - the process step of the function, takes an array and defaults to an array
 * @param {array} [config.output] - the process when the service step has completed
 * @returns {object} output - outputs an object with the 2 sequences
 * @returns {object} [output.builder] - the builder will always be an object with a list of methods that you can build
 * @returns {function} [output.execute] - an asyncronous function to wrap your builder in that will act upon it.
 *
 */
const boulangerie = async (config = { build: [], service: [], output: [] }) => {
  const { build, service, output } = config;
  const adapter = await buildAdapterFunc(build, service, output);
  return {
    builder: await adapter.setup(),
    execute: adapter.execute,
  };
};

module.exports = boulangerie;
