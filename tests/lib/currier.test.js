const currier = require('../../src/lib/currier');

describe('lib::currier', () => {
  it('should be a function', done => {
    expect(currier).toBeInstanceOf(Function);
    done();
  });

  it('should return three methods', done => {
    const data = currier();
    expect(data).toHaveProperty('add');
    expect(data).toHaveProperty('chain');
    expect(data).toHaveProperty('execute');
    done();
  });

  it('each method should return its own function plus all included', done => {
    const resultAdd = currier().add();
    expect(resultAdd).toHaveProperty('add');
    expect(resultAdd).toHaveProperty('chain');
    expect(resultAdd).toHaveProperty('execute');

    const resultChain = currier().chain([]);
    expect(resultChain).toHaveProperty('add');
    expect(resultChain).toHaveProperty('chain');
    expect(resultChain).toHaveProperty('execute');
    done();
  });

  it('should accept a string as a param to add', async done => {
    const resultChain = await currier('testVal').execute();
    expect(resultChain).toBe('testVal');
    const resultChainWithAdd = await currier()
      .add('testVal')
      .execute();
    expect(resultChainWithAdd).toBe('testVal');
    const resultChainWithChain = await currier()
      .chain(['testVal'])
      .execute();
    expect(resultChainWithChain).toBe('testVal');
    done();
  });
});
