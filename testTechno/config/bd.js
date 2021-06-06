const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL -> mongodb://XXX.XXX.XX.XXX:27017
const url = 'mongodb://127.0.0.1:27017'; 

// Database Name
const client = new MongoClient(url);

/*client.connect(function (err) {
    if (err) throw err
    console.log('ok pirate');
});*/


module.exports = client;
