"use strict";

const Joi = require('joi');
const Boom = require('boom');
const accessScopesEnum = require('./enums/accessScopes');

class RouteGenerator {
    constructor (adapter, authentication) {
        this.adapter = adapter;
        this.authentication = authentication;
    }

    processRoles (model, rolesAllowed, routeOptions) {
        if (rolesAllowed && this.authentication) {
            routeOptions.config = {};
            routeOptions.config.auth = {
                strategy: this.authentication.strategyName,
                scope: rolesAllowed
            };
        }

        return routeOptions;
    }

    /**
     * Gets the amount of access we have for a certain route, this gets divided into 3 levels:
     * - ALL_ACCESS: We have a custom access that matches our scope in the user table, return all the objects!
     * - OWNER_ACCESS: We have $owner access, so we need to return all the objects that we own
     * - NO_ACCESS: Not authorized to access this route
     * @param userScope the scopes that the user has
     * @param rolesAllowed the roles that are allowed to a certain route
     * @param model
     */
    getAccessScope (userScope, rolesAllowed) {
        // if no user scope and rolesAllowed has been passed, then we return ALL_ACCESS
        if (!userScope && !rolesAllowed) {
            return accessScopesEnum.ALL_ACCESS;
        }

        // If no rolesAllowed is specified, we allow everyone!
        if (!Array.isArray(rolesAllowed) && !rolesAllowed) {
            return accessScopesEnum.ALL_ACCESS;
        }

        if (Array.isArray(userScope)) {
            for (var scope of userScope) {
                if (scope != '$owner' && rolesAllowed.indexOf(scope) > -1) {
                    return accessScopesEnum.ALL_ACCESS;
                }
            }

            if (rolesAllowed.indexOf('$owner') > -1) {
                return accessScopesEnum.OWNER_ACCESS;
            }
        } else {
            if (rolesAllowed.indexOf(userScope) > -1) {
                return accessScopesEnum.ALL_ACCESS;
            }

            if (rolesAllowed.indexOf('$owner') > -1) {
                return accessScopesEnum.OWNER_ACCESS;
            }
        }

        return accessScopesEnum.NO_ACCESS;
    }

    generateFindAll (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'GET',
            path: '/' + model.baseRoute,
            handler: (request, reply) => {
                let accessScope = self.getAccessScope(null, rolesAllowed);

                if (self.authentication) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), rolesAllowed);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        return reply(model.findAll());
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        return reply(model.findAllByUserId(request.auth.credentials.get('id')));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                        return reply(Boom.unauthorized());
                        break;
                    // The default is that we have the ALL_ACCESS scope
                    default:
                        return reply(model.findAll());
                }
            }
        };

        return self.processRoles(model, rolesAllowed, routeOptions);
    }

    generateFindAllWithPagination (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'GET',
            path: '/' + model.baseRoute + '/pagination/{offset}',
            config: {
                validate: {
                    query: {
                        limit: Joi.number().max(20)
                    }
                }
            },
            handler: (request, reply) => {
                let limit = request.query.limit;
                let offset = request.params.offset;

                let accessScope = self.getAccessScope(null, rolesAllowed);

                if (self.authentication) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), rolesAllowed);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        return reply(model.findAllWithPagination(offset, limit));
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        return reply(model.findAllByUserIdWithPagination(request.auth.credentials.get('id'), offset, limit));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        return reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, rolesAllowed, routeOptions);
    }

    generateFindOne (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'GET',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                var id = request.params.id;

                let accessScope = self.getAccessScope(null, rolesAllowed);

                if (self.authentication) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), rolesAllowed);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        return reply(model.findOneById(id));
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        return reply(model.findOneByIdAndUserId(id, request.auth.credentials.get('id')));
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
                        return reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, rolesAllowed, routeOptions);
    }

    generateCreate (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'POST',
            path: '/' + model.baseRoute,
            handler: (request, reply) => {
                let accessScope = self.getAccessScope(null, rolesAllowed);

                if (self.authentication) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), rolesAllowed);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                    case accessScopesEnum.OWNER_ACCESS:
                        return reply(model.createObject(request.payload));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        return reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, rolesAllowed, routeOptions);
    }

    generateUpdate (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'PUT',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                let id = request.params.id;
                let accessScope = self.getAccessScope(null, rolesAllowed);

                if (self.authentication) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), rolesAllowed);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        return reply(model.updateById(id, request.payload));
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        return reply(model.updateByIdAndUserId(id, request.auth.credentials.get('id')));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        return reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, rolesAllowed, routeOptions);
    }

    generateDelete (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'DELETE',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                let id = request.params.id;
                let accessScope = self.getAccessScope(null, rolesAllowed);

                if (self.authentication) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), rolesAllowed);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        return reply(model.destroyById(id));
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        return reply(model.destroyByIdAndUserId(id, request.auth.credentials.get('id')));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        return reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, rolesAllowed, routeOptions);
    }

    generateCount (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'GET',
            path: `/${model.baseRoute}/count`,
            handler: (request, reply) => {
                let accessScope = self.getAccessScope(null, rolesAllowed);

                if (self.authentication) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), rolesAllowed);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        return reply(model.count());
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        return reply(model.countByUserId(request.auth.credentials.get('id')));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        return reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, rolesAllowed, routeOptions);
    }
}

module.exports = RouteGenerator;