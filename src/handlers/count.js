const Boom = require('boom');
const accessScopesEnum = require('../enums/accessScopes');

module.exports = (routeGenerator, model, routeOptions) => {
    return (request, reply) => {
        let accessScope = routeGenerator.getAccessScope(null, routeOptions.allowedRoles);

        if (routeGenerator.authentication && routeOptions.allowedRoles) {
            accessScope = routeGenerator.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
        }

        let queryParams = routeGenerator.processQueryParams(request.query);
        let promise = null;

        switch (accessScope) {
            case accessScopesEnum.ALL_ACCESS:
                promise = new Promise((resolve, reject) => {
                    model.count(queryParams)
                        .then((count) => {
                            return resolve({
                                count: count
                            })
                        })
                        .catch((err) => {
                            return reject(err);
                        });
                });
                promise = model.count(queryParams);
                break;
            case accessScopesEnum.OWNER_ACCESS:
                promise = new Promise((resolve, reject) => {
                    model.countByUserId(request.auth.credentials.get('id'), queryParams)
                        .then((count) => {
                            return resolve({
                                count: count
                            })
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
    };
};