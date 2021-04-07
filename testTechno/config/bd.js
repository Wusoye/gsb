const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const client = new MongoClient(url);

/*client.connect(function (err) {
    if (err) throw err
    console.log('ok pirate');
});*/


module.exports = client;