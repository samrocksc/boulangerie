/**
 * An an opinionated Currying function that generates an asyncronous call through each of the parameters passed into it.
 * @param {objet|string|function} initialParams - an initial set of params for passing into the initial function for consumption through the chain.
 * @returns {function} add - Adds a singular function to the chain
 * @returns {function} chain - A function that takes an array of functions and curries them together passing each value into the next
 * @returns {function} execute - Executes all functions in the chain asyncronously
 */
const currier = initialParams => {
  const funcArray = [];
  if (typeof initialParams !== 'function') {
    funcArray.push(() => initialParams);
  }

  /* eslint-disable-next-line */
  const execute = () => executeFuncArray(funcArray);

  const executeFuncArray = arr => {
    return arr.reduce(async (acc, cur, i) => {
      if (i > 0) {
        const prevResolved = await acc;
        return cur(prevResolved);
      }
      if (typeof cur !== 'function') {
        return async () => cur;
      }
      return cur(initialParams);
    }, Promise.resolve());
  };

  const chain = arr => {
    if (Array.isArray(arr)) {
      arr.forEach(func => {
        if (typeof func !== 'function') {
          funcArray.push(async () => func);
        } else {
          funcArray.push(func);
        }
      });
      return {
        /* eslint-disable-next-line */
        add,
        chain,
        execute,
      };
    }
    return {
      /* eslint-disable-next-line */
      add,
      chain,
      execute,
    };
  };

  const add = func => {
    if (typeof func !== 'function') {
      funcArray.push(() => func);
    } else {
      funcArray.push(func);
    }
    return {
      add,
      chain,
      execute,
    };
  };

  return { add, execute, chain };
};

module.exports = currier;
