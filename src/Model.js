var pluralize = require('pluralize');

/**
 * This is the wrapper class for our base, we abstract this so that we are able to change
 * the database engine later on if needed and support multiple.
 * @param base
 * @constructor
 */
class Model {
    constructor (baseModel) {
        this.baseModel = baseModel;
        this.baseRoute = pluralize(baseModel.forge().tableName);
    }

    get tableName () {
        return pluralize.singular(this.baseRoute);
    }

    findAllByUserId (userId) {
        if (this.tableName === 'user') {
            return this.baseModel.where('id', userId).fetchAll();
        } else {
            return this.baseModel.where('user_id', userId).fetchAll();
        }
    }

    findAll () {
        return this.baseModel.fetchAll();
    }

    findAllWithPagination (offset, limit) {
        return this.baseModel.fetchPage({ offset: offset, limit: limit });
    }

    findAllByUserIdWithPagination (userId, offset, limit) {
        return this.baseModel.where('user_id', userId).fetchPage({ offset: offset, limit: limit });
    }

    findOneById (id) {
        return this.baseModel.where({ id: id }).fetch();
    }

    findOneByIdAndUserId (id, userId) {
        return this.baseModel.where({ id: id, user_id: userId }).fetch();
    }

    createObject (data) {
        return this.baseModel.forge(data).save();
    }

    updateById (id, data) {
        data.id = id;
        return this.baseModel.where({ id: id }).save(data, { patch: true });
    }

    updateByIdAndUserId (id, userId, data) {
        data.id = id;
        return this.baseModel.where({ id: id, user_id: userId }).save(data, { patch: true });
    }

    destroyById (id) {
        return this.baseModel.where({ id: id }).destroy();
    }

    destroyByIdAndUserId (id, userId) {
        return this.baseModel.where({ id: id, user_id: userId }).destroy();
    }

    count () {
        return this.baseModel.count().then(function (count) { return Promise.resolve({ count: count })});
    }

    countByUserId (userId) {
        return this.baseModel.where('user_id', userId).count().then(function (count) { return Promise.resolve({ count: count })});
    }
}

module.exports = Model;