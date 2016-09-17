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
    return pluralize.singular(this.baseModel.forge().tableName);
};

Model.prototype.getBaseModel = function () {
    return this.baseModel;
};

Model.prototype.getBaseRouteName = function () {
    return this.baseRoute;
};

Model.prototype.findAllByUserId = function (userId) {
    if (this.getTableName() === 'user') {
        return this.baseModel.where('id', userId).fetchAll();
    } else {
        return this.baseModel.where('user_id', userId).fetchAll();
    }
};

Model.prototype.findAll = function () {
    return this.baseModel.fetchAll();
};

Model.prototype.findAllWithPagination = function (offset, limit) {
    return this.baseModel.fetchPage({ offset: offset, limit: limit });
};

Model.prototype.findAllByUserIdWithPagination = function (userId, offset, limit) {
    return this.baseModel.where('user_id', userId).fetchPage({ offset: offset, limit: limit });
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

Model.prototype.count = function () {
    return this.baseModel.count().then(function (count) { return Promise.resolve({ count: count })});
};

Model.prototype.countByUserId = function (userId) {
    return this.baseModel.where('user_id', userId).count().then(function (count) { return Promise.resolve({ count: count })});
};

module.exports = Model;