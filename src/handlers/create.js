const Boom = require('boom');
const accessScopesEnum = require('../enums/accessScopes');

module.exports = (routeGenerator, model, routeOptions) => {
    return (request, reply) => {
        let accessScope = routeGenerator.getAccessScope(null, routeOptions.allowedRoles);

        if (routeGenerator.authentication && routeOptions.allowedRoles) {
            accessScope = routeGenerator.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
        }

        switch (accessScope) {
            case accessScopesEnum.ALL_ACCESS:
            case accessScopesEnum.OWNER_ACCESS:
                reply(model.createObject(request.payload));
                break;
            case accessScopesEnum.NO_ACCESS:
            default:
                reply(Boom.unauthorized());
        }
    }
};