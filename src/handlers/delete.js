const Boom = require('boom');
const accessScopesEnum = require('../enums/accessScopes');

module.exports = (routeGenerator, model, routeOptions) => {
    return (request, reply) => {
        let id = request.params.id;
        let accessScope = routeGenerator.getAccessScope(null, routeOptions.allowedRoles);

        if (routeGenerator.authentication && routeOptions.allowedRoles) {
            accessScope = routeGenerator.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
        }

        switch (accessScope) {
            case accessScopesEnum.ALL_ACCESS:
                reply(model.destroyById(id));
                break;
            case accessScopesEnum.OWNER_ACCESS:
                reply(model.destroyByIdAndUserId(id, request.auth.credentials.get('id')));
                break;
            case accessScopesEnum.NO_ACCESS:
            default:
                reply(Boom.unauthorized());
        }
    }
};