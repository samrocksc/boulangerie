const boulangerie = require('../index');

const mockBuildFunc = () => {
  return {
    mockLoad: x => x,
  };
};

describe('index', () => {
  it('should be a function', done => {
    expect(boulangerie).toBeInstanceOf(Function);
    done();
  });

  it('should allow a config object', async done => {
    const config = {
      build: () => {},
    };
    const result = await boulangerie(config);
    expect(result).toHaveProperty('builder');
    expect(result).toHaveProperty('execute');
    done();
  });

  it('should allow builder to be placed inside of execute', async done => {
    const config = {
      build: [() => {}, mockBuildFunc],
    };
    const { builder, execute } = await boulangerie(config);
    const builderData = await execute(builder.mockLoad(2));
    expect(builderData).toBe(2);
    done();
  });

  it('should allow the service and output step to modify data', async done => {
    const config = {
      build: [() => {}, mockBuildFunc],
      service: [x => x + 2],
      output: [x => x + 2, x =>  x * 2],
    };
    const { builder, execute } = await boulangerie(config);
    const builderData = await execute(builder.mockLoad(2));
    expect(builderData).toBe(12);
    done();
  });
});
