var Hapi = require('hapi');

exports.init = function() {
    var server = new Hapi.Server();
    server.connection();
    return server;
};