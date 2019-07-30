// DO NOT MODIFY
// Default configuration for the MODBUS protocol.
// If you need to change configuration values, you need to modify your kuzzlerc
// configuration file
// (see https://docs.kuzzle.io/core/1/protocols/essentials/getting-started/#configuration)
module.exports = {
  port: 502,
  index: 'modbus',
  collection: 'devices',

  // Ignored if "store" is false
  mappings: {
    dynamic: 'strict',
    _all: { enabled: false },
    properties: {
      input: {
        type: 'nested',
        dynamic: 'false',
        properties: {
          addr: { type: 'long' },
          value: { type: 'long', index: false }
        }
      },
      holding: {
        type: 'nested',
        dynamic: 'false',
        properties: {
          addr: { type: 'long' },
          value: { type: 'long', index: false }
        }
      },
      coil: {
        type: 'nested',
        dynamic: 'false',
        properties: {
          addr: { type: 'long' },
          value: { type: 'long', index: false }
        }
      },
      vendor: { type: 'text' },
      productCode: { type: 'keyword' },
      majorMinorRevision: { type: 'keyword' },
      model: { type: 'text' },
      extended1: { type: 'text' },
      extended2: { type: 'text' }
    }
  }
};
