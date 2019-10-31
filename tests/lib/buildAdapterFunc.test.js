const buildAdapterFunc = require('../../src/lib/buildAdapterFunc');

const mockBuildFunc = () => {
  return {
    mockLoad: x => x,
  };
};

describe('lib::buildAdapterFunc', () => {
  it('should be a function', () => {
    expect(buildAdapterFunc).toBeInstanceOf(Object);
  });

  it('should return a function with proper params', done => {
    const newFunc = buildAdapterFunc([x => x], [y => y], [z => z]);
    expect(newFunc).toBeInstanceOf(Object);
    done();
  });

  it('should extend two initial functions', async done => {
    const result = buildAdapterFunc([mockBuildFunc], [y => y], [z => z]);
    expect(result).toHaveProperty('setup');
    expect(result).toHaveProperty('execute');
    done();
  });

  it('should extend the mockBuildFunc', async done => {
    const newFunc = buildAdapterFunc([mockBuildFunc], [y => y], [z => z]);
    const { setup } = newFunc;
    const mockBuilder = await setup();
    const result = await mockBuilder.mockLoad(2);
    expect(result).toBe(2);
    done();
  });

  it('should allow the wrapping of a result', async done => {
    const newFunc = buildAdapterFunc([mockBuildFunc], [y => y], [z => z]);
    const { setup, execute } = newFunc;
    const mockBuilder = await setup();
    const builder = await mockBuilder.mockLoad(2);
    const result = await execute(builder);
    expect(result).toBe(2);
    done();
  });

  it('should allow the manipulation of the builder function in the service step', async done => {
    const newFunc = buildAdapterFunc([mockBuildFunc], [y => y + 2], [z => z]);
    const { setup, execute } = newFunc;
    const mockBuilder = await setup();
    const builder = await mockBuilder.mockLoad(2);
    const result = await execute(builder);
    expect(result).toBe(4);
    done();
  });

  it('should allow the manipulation of the builder function in the output step', async done => {
    const newFunc = buildAdapterFunc([mockBuildFunc], [y => y + 2], [z => z + 2]);
    const { setup, execute } = newFunc;
    const mockBuilder = await setup();
    const builder = await mockBuilder.mockLoad(2);
    const result = await execute(builder);
    expect(result).toBe(6);
    done();
  });
});
