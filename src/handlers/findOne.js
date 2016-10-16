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
                reply(model.findOneById(id));
                break;
            case accessScopesEnum.OWNER_ACCESS:
                reply(model.findOneByIdAndUserId(id, request.auth.credentials.get('id')));
                // self.authentication.hasAccessToRow(request, rolesAllowed, model)
                // .then((hasAccess) => {
                //     if (hasAccess) {
                //         return reply(model.findOneById(id));
                //     }
                //
                //     return reply(Boom.unauthorized());
                // });
                break;
            case accessScopesEnum.NO_ACCESS:
            default:
                reply(Boom.unauthorized());
        }
    }
};