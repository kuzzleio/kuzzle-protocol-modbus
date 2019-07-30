/**
 * Manages the storage space receiving MODBUS devices informations
 * @param  {EntryPoint} entryPoint - Kuzzle entry point object
 * @param  {Context} context       - Protocol context
 * @return {Promise.<null>}
 */
module.exports = class ModBusStorage {
  constructor (entryPoint, context, config) {
    this.context = context;
    this.config = config;
    this.execute = request => {
      return new Promise((resolve, reject) => {
        entryPoint.execute(request, result => {
          if (result.content.error !== null) {
            return reject(result.content.error);
          }
          resolve(result.content.result);
        });
      });
    };
  }

  prepare () {
    return this.indexExists()
      .then(exists => exists ? null : this.createStorage())
      .then(() => this.updateMapping());
  }

  indexExists () {
    this.context.debug('Checking if data index "%s" exists', this.config.index);

    return this
      .execute(new this.context.Request({
        index: this.config.index,
        controller: 'index',
        action: 'exists'
      }));
  }

  createStorage() {
    this.context.debug('Creating new data index "%s"', this.config.index);

    return this
      .execute(new this.context.Request({
        index: this.config.index,
        controller: 'index',
        action: 'create'
      }))
      .then(() => {
        this.context.debug(
          'Creating new data collection "%s/%s"',
          this.config.index,
          this.config.collection);

        return this.execute(new this.context.Request({
          index: this.config.index,
          collection: this.config.collection,
          controller: 'collection',
          action: 'create'
        }));
      });
  }

  updateMapping () {
    this.context.debug(
      'Updating data mappings on "%s/%s"',
      this.config.index,
      this.config.collection);

    return this.execute(new this.context.Request({
      index: this.config.index,
      collection: this.config.collection,
      controller: 'collection',
      action: 'updateMapping',
      body: this.config.mappings
    }));
  }

  read (unitId, field, addr) {
    this.context.debug('Fetching document for device %s', unitId);

    return this
      .execute(new this.context.Request({
        index: this.config.index,
        collection: this.config.collection,
        controller: 'document',
        action: 'get',
        _id: unitId.toString()
      }))
      .then(result => {
        const content = result._source;

        if (field && addr) {
          return content[field] && content[field][addr]
            ? content[field][addr]
            : 0;
        }

        return content;
      });
  }

  write (unitId, field, addr, value) {
    const rq = {
      index: this.config.index,
      collection: this.config.collection,
      controller: 'document',
      action: 'update',
      _id: unitId.toString(),
      body: {
        [field]: { [addr]: value }
      },
      retryOnConflict: 10
    };

    this.context.debug(
      'Updating device %s: %s.%s=%s',
      unitId,
      field,
      addr,
      value);

    return this
      .execute(new this.context.Request(rq))
      .catch(error => {
        // Create the document if it does not yet exist
        if (error.status === 404) {
          this.context.debug(
            'Data not found for device %s: creating document',
            unitId);
          rq.action = 'create';
          return this.execute(new this.context.Request(rq));
        }

        this.context.debug(
          'Error while trying to update device %s: %a',
          unitId,
          error);
        throw error;
      })
      .then(() => {
        this.context.debug('Device %s updated', unitId);
        return;
      });
  }
};
