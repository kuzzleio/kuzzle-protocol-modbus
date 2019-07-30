# Disclaimer

This protocol is for educational purposes only, and is solely intended as a demonstration for Kuzzle's extensible protocol layer. 

It hasn't yet been thoroughly tested and it might not feature the same high level of quality as our official plugins & protocols.

If you do want to use this repository anyway, feel free to file any issue you might have here on github. 

Alternatively, you can discuss this protocol with us on [gitter](https://gitter.im/kuzzleio/kuzzle)

# Description

This protocol adds MODBUS capabilities to Kuzzle.

It works by storing devices registers in Kuzzle's storage layer, so that it can send those values back to devices requesting them.

This is done through the standard API layer, allowing plugins to [listen](https://docs.kuzzle.io/core/1/plugins/guides/hooks/) or [interact](https://docs.kuzzle.io/core/1/plugins/guides/pipes/) with requests made by this protocol.

By default, devices information are stored within the `modbus/devices` public index/collection. This can be changed by [configuring the protocol in the kuzzlerc file](https://docs.kuzzle.io/core/1/protocols/essentials/getting-started/#configuration).

# Install

This protocol is compatible with Kuzzle 1.8.5 and upper.

To install this protocol, simply copy the content of this directory in the `protocols/available` folder of your Kuzzle server, and then add a symlink pointing to `protocols/enabled`.

# Configuration

The following properties can be configured:

* `port` (default: `502`): TCP port to open for MODBUS requests
* `index` (default: `modbus`): name of the index holding the devices collection
* `collection` (default: `devices`): name of the collection holding devices registers in Kuzzle's storage layer
* `mappings`: Elasticsearch mapping used to define how device registers are stored

Default configuration values can be checked in the `config.js` file at the root of this project (**do not modify this file**).

# Tutorial

Simply send MODBUS data to the network port opened by this protocol.

Example, using [modbus-serial](https://www.npmjs.com/package/modbus-serial):

```js
var ModbusRTU = require('modbus-serial');
var client = new ModbusRTU();

client.connectTCP('localhost', { port: 502 })
  .then(() => {
    // setting this device ID
    client.setID(1);
    return write();
  })
  .then(() => read())
  .then(result => {
    console.dir(result);
    client.close();
  })
  .catch(error => {
    console.dir(error);
    process.exit(1);
  });

function write() {
  // write the values 0, 0xffff to registers starting at address 5
  // on device number 1.
  return client.writeRegisters(5, [0 , 0xffff]);
}

function read() {
  // read the 2 registers starting at address 5
  // on device number 1.
  return client.readHoldingRegisters(5, 2);
}
````

This outputs the following:

```
{ data: [ 0, 65535 ],
  buffer: Buffer [Uint8Array] [ 0, 0, 255, 255 ] }
```

And you can check the register values stored in Kuzzle, for instance with this cURL command line:

```
curl -XGET 'http://localhost:7512/modbus/devices/1?pretty'
```

Which results in the following JSON:

```json
{
  "status": 200,
  "error": null,
  "controller": "document",
  "action": "get",
  "collection": "devices",
  "index": "modbus",
  "volatile": null,
  "result": {
    "_id": "1",
    "found": true,
    "_source": {
      "holding": {
        "5": 0,
        "6": 65535
      },
      "_kuzzle_info": {
        "author": "-1",
        "createdAt": 1564498585708,
        "updatedAt": 1564500880673,
        "updater": "-1",
        "active": true,
        "deletedAt": null
      }
    }
  }
}
```
