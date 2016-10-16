const Boom = require('boom');
const accessScopesEnum = require('../enums/accessScopes');

module.exports = (routeGenerator, model, routeOptions) => {
    return (request, reply) => {
        let limit = request.query.limit;
        let offset = request.params.offset;

        let accessScope = routeGenerator.getAccessScope(null, routeOptions.allowedRoles);

        if (routeGenerator.authentication && routeOptions.allowedRoles) {
            accessScope = routeGenerator.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
        }

        let queryParams = routeGenerator.processQueryParams(request.query);
        let promise = null;

        switch (accessScope) {
            case accessScopesEnum.ALL_ACCESS:
                promise = new Promise((resolve, reject) => {
                    model.findAllWithPagination(offset, limit, queryParams)
                    .then((results) => {
                        resolve({
                            results: results.toJSON(),
                            pagination: results.pagination
                        });
                    })
                    .catch((err) => {
                        return reject(err);
                    });
                });
                break;
            case accessScopesEnum.OWNER_ACCESS:
                promise = new Promise((resolve, reject) => {
                    model.findAllByUserIdWithPagination(request.auth.credentials.get('id'), offset, limit, queryParams)
                    .then((results) => {
                        resolve({
                            results: results.toJSON(),
                            pagination: results.pagination
                        });
                    })
                    .catch((err) => {
                        return reject(err);
                    });
                });
                break;
            case accessScopesEnum.NO_ACCESS:
            default:
                promise = Promise.resolve(Boom.unauthorized());
        }

        // Handle the reply
        promise
        .then((result) => {
            return reply(result);
        })
        .catch((err) => {
            //console.error(`[ERR: ${err.code}]: ${err.message}`);
            return reply(err);
        })
    }
};