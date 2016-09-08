module.exports = function (server) {
    var Api = require('./src/Api');
    var api = new Api(server);

    return api;
};