const
  defaultConfiguration = require('../config'),
  manifest = require('../manifest'),
  Storage = require('./storage'),
  Modbus = require('modbus-serial');

module.exports = class ModbusProtocol {
  constructor () {
    this.name = manifest.name;
    this.config = defaultConfiguration;
    this.context = null;
    this.entryPoint = null;
    this.server = null;
  }

  /**
  * @param {EntryPoint} entryPoint - main protocol interface with Kuzzle
  * @param {object} context - Constructors and utilities
  */
  init (entryPoint, context) {
    // plugin initialization
    this.entryPoint = entryPoint;
    this.context = context;

    this.config = Object.assign(
      defaultConfiguration,
      entryPoint.config[this.name]);

    this.storage = new Storage(entryPoint, context, this.config);

    return this.storage.prepare()
      .then(() => {
        this.server = new Modbus.ServerTCP(
          {
            getInputRegister: (addr, unitId) => this.storage.read(
              unitId,
              'input',
              addr),
            getHoldingRegister: (addr, unitId) => this.storage.read(
              unitId,
              'holding',
              addr),
            getCoil: (addr, unitId) => this.storage.read(unitId, 'coil', addr),
            setRegister: (addr, value, unitId) => this.storage.write(
              unitId,
              'holding',
              addr,
              value),
            setCoil: (addr, value, unitId) => this.storage.write(
              unitId,
              'coil',
              addr,
              value),
            readDeviceIdentification: addr => this.storage.read(addr)
              .then(res => ({
                0x00: res.result._source.vendor,
                0x01: res.result._source.productCode,
                0x02: res.result._source.majorMinorRevision,
                0x05: res.result._source.model,
                0x97: res.result._source.extended1,
                0xAB: res.result._source.extended2
              }))
          },
          {
            host: '0.0.0.0',
            port: this.config.port,
            debug: this.config.debug
          });

        return new Promise(resolve => {
          this.server.on('initialized', () => {
            this.context.debug(
              'Modbus protocol listening on port %a',
              this.config.port);

            resolve();
          });
        });
      });
  }

  disconnect () {
    throw new this.context.errors.PreconditionError('Cannot disconnect: (not yet supported)');
  }

  /* ======================= */
  // Real-time features cannot be supported due to this protocol nature.
  // We throw just in case, but these methods cannot be invoked by Kuzzle since
  // a device communicating through MODBUS cannot subscribe to Kuzzle's realtime
  // notifications.
  broadcast () {
    throw new this.context.errors.PreconditionError('Cannot broadcast: the MODBUS protocol does not support realtime');
  }

  notify () {
    throw new this.context.errors.PreconditionError('Cannot notify: the MODBUS protocol does not support realtime');
  }

  joinChannel () {
    throw new this.context.errors.PreconditionError('Cannot join a channel: the MODBUS protocol does not support realtime');
  }

  leaveChannel () {
    throw new this.context.errors.PreconditionError('Cannot leave a channel: the MODBUS protocol does not support realtime');
  }
  /* ======================= */
};
