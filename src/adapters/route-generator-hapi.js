const Boom = require('boom');
const Joi = require('joi');

class RouteGenerator {
    constructor (httpServer) {
        this.httpServer = httpServer;
        this.authentication = null;
    }

    addAuthentication (library) {
        this.authentication = library;

        var self = this;

        return new Promise((resolve, reject) => {
            this.httpServer.register({
                register: library.getHapiFrameworkInterface(),
                options: {}
            }, { once: true }, (err) => {
                //if (err) {
                //    throw err;
                //}

                try {
                    this.httpServer.auth.strategy(library.getStrategyName(), library.getStrategyName());
                    console.info('--> Added authentication: ' + library.getStrategyName());
                } catch (err) {
                    console.info('--> [IGNORED] ' +  library.getStrategyName() + '  authentication already registered, ignoring');
                    // Ignore error, it can happen when we call the addAuthentication function twice
                }

                return resolve();
            });
        });
    }

    processRoles (model, rolesAllowed, routeOptions) {
        let hasOwnerRole = rolesAllowed && rolesAllowed.indexOf('$owner') > -1;

        if (hasOwnerRole) {
            rolesAllowed = rolesAllowed.filter((item) => { return item != '$owner' } );
            rolesAllowed = rolesAllowed.length > 0 ? rolesAllowed : [ 'user' ];
        }

        if (rolesAllowed && this.authentication) {
            routeOptions.config = {};
            routeOptions.config.auth = {
                strategy: this.authentication.getStrategyName(),
                scope: rolesAllowed
            };
        }

        return routeOptions;
    }

    createFindAllRoute (model, rolesAllowed) {
        var hasOwnerRole = rolesAllowed && rolesAllowed.indexOf('$owner') > -1;
        var self = this;

        var routeOptions = {
            method: 'GET',
            path: '/' + model.baseRoute,
            handler: (request, reply) => {
                if (self.authentication && hasOwnerRole) {
                    return reply(model.findAllByUserId(request.auth.credentials.get('id')));
                } else {
                    return reply(model.findAll());
                }
            }
        };

        this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
    }

    createFindAllWithPaginationRoute (model, rolesAllowed) {
        var hasOwnerRole = rolesAllowed && rolesAllowed.indexOf('$owner') > -1;
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

                if (self.authentication && hasOwnerRole) {
                    let userId = request.auth.credentials.get('id');
                    return reply(model.findAllByUserIdWithPagination(request.auth.credentials.get('id'), offset, limit));
                } else {
                    return reply(model.findAllWithPagination(offset, limit));
                }
            }
        };

        this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
    }

    createFindOneRoute (model, rolesAllowed) {
        var hasOwnerRole = rolesAllowed && rolesAllowed.indexOf('$owner') > -1;
        var self = this;

        var routeOptions = {
            method: 'GET',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                var id = request.params.id;

                if (self.authentication && hasOwnerRole) {
                    self.authentication.hasAccess(request, rolesAllowed, model)
                        .then((hasAccess) => {
                            if (hasAccess) {
                                return reply(model.findOneById(id));
                            } else {
                                return reply(Boom.unauthorized());
                            }
                        });
                } else {
                    return reply(model.findOneById(id));
                }
            }
        };

        this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
    }

    createCreateRoute (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'POST',
            path: '/' + model.baseRoute,
            handler: (request, reply) => {
                reply(model.createObject(request.payload));
            }
        };

        this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
    }

    createUpdateRoute (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'PUT',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                var id = request.params.id;
                reply(model.update(id, request.payload));
            }
        };

        this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
    }

    createDeleteRoute (model, rolesAllowed) {
        var self = this;

        var routeOptions = {
            method: 'DELETE',
            path: '/' + model.baseRoute + '/{id}',
            handler: (request, reply) => {
                var id = request.params.id;
                reply(model.delete(id));
            }
        };

        this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
    }

    createCountRoute (model, rolesAllowed) {
        var hasOwnerRole = rolesAllowed && rolesAllowed.indexOf('$owner') > -1;
        var self = this;

        var routeOptions = {
            method: 'GET',
            path: '/' + model.baseRoute + '/count',
            handler: (request, reply) => {
                if (self.authentication && hasOwnerRole) {
                    return reply(model.countByUserId(request.auth.credentials.get('id')));
                } else {
                    return reply(model.count());
                }
            }
        };

        this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
    }
}

module.exports = RouteGenerator;