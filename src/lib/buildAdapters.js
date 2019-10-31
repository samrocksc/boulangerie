const currier = require('./currier');
/**
 * @param Creates the build function for an array
 * @param {array|function} build - A function or an array offunctions to pass inthrough the build step
 * @param {array|function} service - A function or an array offunctions to pass inthrough the process step
 * @param {array|function} output - A function or an array offunctions to pass inthrough the output step
 */
const buildAdapterFunc = (build, service, output) => {
  const totalArray = [...build, ...service, ...output];
  return async initialParam =>
    currier(initialParam)
      .chain(totalArray)
      .execute();
};

module.exports = buildAdapterFunc;
