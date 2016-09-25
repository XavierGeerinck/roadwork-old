const pluralize = require('pluralize');
const Boom = require('boom');

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
        let where = (this.tableName === 'user') ? { 'id': userId } : { 'user_id': userId };
        return this.baseModel.where(where).fetchAll();
    }

    findAll () {
        return this.baseModel.fetchAll();
    }

    findAllWithPagination (offset, limit) {
        return this.baseModel.fetchPage({ offset: offset, limit: limit });
    }

    findAllByUserIdWithPagination (userId, offset, limit) {
        let where = (this.tableName === 'user') ? { 'id': userId } : { 'user_id': userId };
        return this.baseModel.where(where).fetchPage({ offset: offset, limit: limit });
    }

    findOneById (id) {
        return this.baseModel.where({ 'id': id }).fetch();
    }

    findOneByIdAndUserId (id, userId) {
        let where = (this.tableName === 'user') ? { 'id': userId } : { 'id': id, 'user_id': userId };
        return this.baseModel.where(where).fetch();
    }

    createObject (data) {
        return this.baseModel.forge(data).save();
    }

    updateById (id, data) {
        data.id = id;
        return this.baseModel.where({ id: id }).save(data, { patch: true });
    }

    /**
     * Scope = OWNER_ACCESS
     *
     * If editing the user table, then make sure that id === userId
     * Else just edit where user_id = given
     * @param id
     * @param userId
     * @param data
     * @returns {*}
     */
    updateByIdAndUserId (id, userId, data) {
        data.id = id;

        if (this.tableName === 'user') {
            if (id != userId) {
                return Promise.resolve(Boom.unauthorized());
            }

            return this.baseModel.where({ 'id': id }).save(data, { patch: true });
        } else {
            return this.baseModel.where({ 'id': id, 'user_id': userId }).save(data, { patch: true });
        }
    }

    destroyById (id) {
        return this.baseModel.where({ id: id }).destroy();
    }

    /**
     * Scope = OWNER_ACCESS
     *
     * If deleting from the user table, then make sure that id === userId
     * Else just edit where user_id = given
     * @param id
     * @param userId
     * @param data
     * @returns {*}
     */
    destroyByIdAndUserId (id, userId) {
        if (this.tableName === 'user') {
            if (id != userId) {
                return Promise.resolve(Boom.unauthorized());
            }

            return this.baseModel.where({ 'id': id }).destroy();
        } else {
            return this.baseModel.where({ 'id': id, 'user_id': userId }).destroy();
        }
    }

    count () {
        return this.baseModel.count().then(function (count) { return Promise.resolve({ count: count })});
    }

    countByUserId (userId) {
        let where = (this.tableName === 'user') ? { 'id': userId } : { 'user_id': userId };
        return this.baseModel.where(where).count().then(function (count) { return Promise.resolve({ count: count })});
    }
}

module.exports = Model;