const currier = require('./currier');

const passThru = [x => x];
/**
 * simple pass through function check
 * @private
 */ const passThroughFunc = val => {
  if (Array.isArray(val) && val.length > 0) {
    return val;
  }
  return passThru;
};

/**
 * @param Creates the build function for an array
 * @returns {function} setup - A function that extends the builder of whatever library is needed
 * @returns {function} execute -
 */
const buildAdapterFunc = (build, service, output) => {
  const buildArray = [...passThroughFunc(build)];
  const serviceArray = [...passThroughFunc(service), ...passThroughFunc(output)];
  const execute = async initialParam => {
    if (initialParam && !!initialParam.then) {
      const awaitedVal = await initialParam;
      return currier(awaitedVal)
        .chain(serviceArray)
        .execute();
    }
    return currier(initialParam)
      .chain(serviceArray)
      .execute();
  };

  const setup = async initialParam => {
    const curriedProcess = await currier(initialParam)
      .chain(buildArray)
      .execute();
    return {
      ...curriedProcess,
    };
  };
  return {
    setup,
    execute,
  };
};

module.exports = buildAdapterFunc;
