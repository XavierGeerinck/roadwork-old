"use strict";

const Joi = require('joi');
const Boom = require('boom');
const accessScopesEnum = require('./enums/accessScopes');

class RouteGenerator {
    constructor (adapter, authentication) {
        this.adapter = adapter;
        this.authentication = authentication;
    }

    processRoles (model, allowedRoles, routeConfig) {
        if (allowedRoles && this.authentication) {
            routeConfig.config = {};
            routeConfig.config.auth = {
                strategy: this.authentication.strategyName,
                scope: allowedRoles
            };
        }

        return routeConfig;
    }

    /**
     * Gets the amount of access we have for a certain route, this gets divided into 3 levels:
     * - ALL_ACCESS: We have a custom access that matches our scope in the user table, return all the objects!
     * - OWNER_ACCESS: We have $owner access, so we need to return all the objects that we own
     * - NO_ACCESS: Not authorized to access this route
     * @param userScope the scopes that the user has
     * @param routeOptions.allowedRoles the roles that are allowed to a certain route
     * @param model
     */
    getAccessScope (userScope, allowedRoles) {
        // if no user scope and rolesAllowed has been passed, then we return ALL_ACCESS
        if (!userScope && !allowedRoles) {
            return accessScopesEnum.ALL_ACCESS;
        }

        // If no rolesAllowed is specified, we allow everyone!
        if (!Array.isArray(allowedRoles) && !allowedRoles) {
            return accessScopesEnum.ALL_ACCESS;
        }

        if (Array.isArray(userScope)) {
            for (var scope of userScope) {
                if (scope != '$owner' && allowedRoles.indexOf(scope) > -1) {
                    return accessScopesEnum.ALL_ACCESS;
                }
            }

            if (allowedRoles.indexOf('$owner') > -1) {
                return accessScopesEnum.OWNER_ACCESS;
            }
        } else {
            if (allowedRoles.indexOf(userScope) > -1) {
                return accessScopesEnum.ALL_ACCESS;
            }

            if (allowedRoles.indexOf('$owner') > -1) {
                return accessScopesEnum.OWNER_ACCESS;
            }
        }

        return accessScopesEnum.NO_ACCESS;
    }

    generateFindAll (model, routeOptions) {
        var self = this;

        var routeConfig = {
            method: 'GET',
            path: '/' + model.baseRoute,
            handler: (request, reply) => {
                let accessScope = self.getAccessScope(null, routeOptions.allowedRoles);

                if (self.authentication && routeOptions.allowedRoles) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        reply(model.findAll());
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        reply(model.findAllByUserId(request.auth.credentials.get('id')));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                        reply(Boom.unauthorized());
                        break;
                    // The default is that we have the ALL_ACCESS scope
                    default:
                        reply(model.findAll());
                }
            }
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateFindAllWithPagination (model, routeOptions) {
        var self = this;

        var routeConfig = {
            method: 'GET',
            path: '/' + model.baseRoute + '/pagination/{offset}',
            config: {
                validate: {
                    query: {
                        limit: Joi.number().max(20),
                        access_token: Joi.string().optional()
                    }
                }
            },
            handler: (request, reply) => {
                let limit = request.query.limit;
                let offset = request.params.offset;

                let accessScope = self.getAccessScope(null, routeOptions.allowedRoles);

                if (self.authentication && routeOptions.allowedRoles) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
                }

                let results;

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        model.findAllWithPagination(offset, limit)
                        .then((results) => {
                            reply({
                                results: results.toJSON(),
                                pagination: results.pagination
                            });
                        });
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        model.findAllByUserIdWithPagination(request.auth.credentials.get('id'), offset, limit)
                        .then((results) => {
                            reply({
                                results: results.toJSON(),
                                pagination: results.pagination
                            });
                        });
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateFindOne (model, routeOptions) {
        var self = this;

        var routeConfig = {
            method: 'GET',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                var id = request.params.id;

                let accessScope = self.getAccessScope(null, routeOptions.allowedRoles);

                if (self.authentication && routeOptions.allowedRoles) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
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

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateCreate (model, routeOptions) {
        var self = this;

        var routeConfig = {
            method: 'POST',
            path: '/' + model.baseRoute,
            handler: (request, reply) => {
                let accessScope = self.getAccessScope(null, routeOptions.allowedRoles);

                if (self.authentication && routeOptions.allowedRoles) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
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

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateUpdate (model, routeOptions) {
        var self = this;

        var routeConfig = {
            method: 'PUT',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                let id = request.params.id;
                let accessScope = self.getAccessScope(null, routeOptions.allowedRoles);

                if (self.authentication && routeOptions.allowedRoles) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        reply(model.updateById(id, request.payload));
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        reply(model.updateByIdAndUserId(id, request.auth.credentials.get('id')));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateDelete (model, routeOptions) {
        var self = this;

        var routeConfig = {
            method: 'DELETE',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                let id = request.params.id;
                let accessScope = self.getAccessScope(null, routeOptions.allowedRoles);

                if (self.authentication && routeOptions.allowedRoles) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
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

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateCount (model, routeOptions) {
        var self = this;

        var routeConfig = {
            method: 'GET',
            path: `/${model.baseRoute}/count`,
            handler: (request, reply) => {
                let accessScope = self.getAccessScope(null, routeOptions.allowedRoles);

                if (self.authentication && routeOptions.allowedRoles) {
                    accessScope = self.getAccessScope(request.auth.credentials.get('scope'), routeOptions.allowedRoles);
                }

                switch (accessScope) {
                    case accessScopesEnum.ALL_ACCESS:
                        reply(model.count());
                        break;
                    case accessScopesEnum.OWNER_ACCESS:
                        reply(model.countByUserId(request.auth.credentials.get('id')));
                        break;
                    case accessScopesEnum.NO_ACCESS:
                    default:
                        reply(Boom.unauthorized());
                }
            }
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }
}

module.exports = RouteGenerator;
