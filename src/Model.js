const pluralize = require('pluralize');
const Boom = require('boom');

/**
 * This is the wrapper class for our base, we abstract this so that we are able to change
 * the database engine later on if needed and support multiple.
 * @param base
 * @constructor
 */
class Model {
    constructor (baseModel, options) {
        this.baseModel = baseModel;
        this.baseRoute = pluralize(baseModel.forge().tableName);
        this.basePath = (options && options.basePath) ? options.basePath : "";
    }

    get tableName () {
        return pluralize.singular(this.baseRoute);
    }

    getBasePath() {
        return this.basePath;
    }

    setBasePath (basePath) {
        this.basePath = basePath;
    }

    getFullRoute () {
        return `${this.basePath}/${this.baseRoute}`;
    }

    findAllByUserId (userId, filter, withRelated) {
        filter = filter || undefined;

        let fetchOptions = {};
        fetchOptions.withRelated = (withRelated) ? [ withRelated ] : undefined;

        return this.baseModel.forge().query((qb) => {
            // User table check
            if (this.tableName === 'user') {
                qb.where('id', userId);
            } else {
                qb.where('user_id', userId);
            }

            if (filter) {
                qb.where(filter);
            }
        })
        .fetchAll(fetchOptions)
    }

    findAll (filter, withRelated) {
        filter = filter || undefined;

        let fetchOptions = {};
        fetchOptions.withRelated = (withRelated) ? [ withRelated ] : undefined;

        return this.baseModel.forge().query((qb) => {
            if (filter) {
                qb.where(filter);
            }
        })
        .fetchAll(fetchOptions)
    }

    findAllWithPagination (offset, limit, filter, withRelated) {
        filter = filter || {};

        let fetchOptions = {};
        fetchOptions.withRelated = (withRelated) ? [ withRelated ] : undefined;
        fetchOptions.offset = offset;
        fetchOptions.limit = limit;

        return this.baseModel.forge().query((qb) => {
            if (filter) {
                qb.where(filter);
            }
        })
        .fetchPage(fetchOptions);
    }

    findAllByUserIdWithPagination (userId, offset, limit, filter, withRelated) {
        filter = filter || {};

        let fetchOptions = {};
        fetchOptions.withRelated = (withRelated) ? [ withRelated ] : undefined;
        fetchOptions.offset = offset;
        fetchOptions.limit = limit;

        return this.baseModel.forge().query((qb) => {
            // User table check
            if (this.tableName === 'user') {
                qb.where('id', userId);
            } else {
                qb.where('user_id', userId);
            }

            if (filter) {
                qb.where(filter);
            }
        })
        .fetchPage(fetchOptions);
    }

    findOneById (id, withRelated) {
        let fetchOptions = {};
        fetchOptions.withRelated = (withRelated) ? [ withRelated ] : undefined;

        return this.baseModel.where({ 'id': id }).fetch(fetchOptions);
    }

    findOneByIdAndUserId (id, userId, withRelated) {
        let fetchOptions = {};
        fetchOptions.withRelated = (withRelated) ? [ withRelated ] : undefined;

        let where = (this.tableName === 'user') ? { 'id': userId } : { 'id': id, 'user_id': userId };
        return this.baseModel.where(where).fetch(fetchOptions);
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

    count (filter) {
        filter = filter || {};

        return this.baseModel.forge().query((qb) => {
            if (filter) {
                qb.where(filter);
            }
        })
        .count();
    }

    countByUserId (userId, filter) {
        filter = filter || {};

        return this.baseModel.forge().query((qb) => {
            // User table check
            if (this.tableName === 'user') {
                qb.where('id', userId);
            } else {
                qb.where('user_id', userId);
            }

            if (filter) {
                qb.where(filter);
            }
        })
        .count();
    }
}

module.exports = Model;