var pluralize = require('pluralize');

/**
 * This is the wrapper class for our base, we abstract this so that we are able to change
 * the database engine later on if needed and support multiple.
 * @param base
 * @constructor
 */
var Model = function (baseModel) {
    this.baseModel = baseModel;
    this.baseRoute = pluralize(baseModel.forge().tableName);
};

Model.prototype.getTableName = function () {
    return this.baseModel.forge().tableName;
};

Model.prototype.getBaseRouteName = function () {
    return this.baseRoute;
};

Model.prototype.findAll = function () {
    return this.baseModel.fetchAll();
};

Model.prototype.findOneById = function (id) {
    return this.baseModel.where({ id: id }).fetch();
};

Model.prototype.createObject = function (data){
    return this.baseModel.forge(data).save();
};

Model.prototype.update = function (id, data) {
    data.id = id;
    return this.baseModel.where({ id: id }).save(data, { patch: true });
};

Model.prototype.delete = function (id) {
    return this.baseModel.where({ id: id }).destroy();
};

module.exports = Model;