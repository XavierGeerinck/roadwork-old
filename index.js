module.exports = function (server) {
    var Api = require('./src/Roadwork');
    var api = new Api(server);

    return api;
};