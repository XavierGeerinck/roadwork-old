const Boom = require('boom');

var routeGenerator = function (httpServer) {
    this.httpServer = httpServer;
    this.authentication = null;
};

routeGenerator.prototype.addAuthentication = function (library) {
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
};

routeGenerator.prototype.processRoles = function (model, rolesAllowed, routeOptions) {
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
};

routeGenerator.prototype.createFindAllRoute = function (model, rolesAllowed) {
    var hasOwnerRole = rolesAllowed && rolesAllowed.indexOf('$owner') > -1;
    var self = this;

    var routeOptions = {
        method: 'GET',
        path: '/' + model.getBaseRouteName(),
        handler: function (request, reply) {
            if (self.authentication && hasOwnerRole) {
                return reply(model.findAllByUserId(request.auth.credentials.get('id')));
            } else {
                return reply(model.findAll());
            }
        }
    };

    this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
};

routeGenerator.prototype.createFindOneRoute = function (model, rolesAllowed) {
    var hasOwnerRole = rolesAllowed && rolesAllowed.indexOf('$owner') > -1;
    var self = this;

    var routeOptions = {
        method: 'GET',
        path: '/' + model.getBaseRouteName() + '/{id}',
        handler: function (request, reply) {
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
};

routeGenerator.prototype.createCreateRoute = function (model, rolesAllowed) {
    var self = this;

    var routeOptions = {
        method: 'POST',
        path: '/' + model.getBaseRouteName(),
        handler: function (request, reply) {
            reply(model.createObject(request.payload));
        }
    };

    this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
};

routeGenerator.prototype.createUpdateRoute = function (model, rolesAllowed) {
    var self = this;

    var routeOptions = {
        method: 'PUT',
        path: '/' + model.getBaseRouteName() + '/{id}',
        handler: function (request, reply) {
            var id = request.params.id;
            reply(model.update(id, request.payload));
        }
    };

    this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
};

routeGenerator.prototype.createDeleteRoute = function (model, rolesAllowed) {
    var self = this;

    var routeOptions = {
        method: 'DELETE',
        path: '/' + model.getBaseRouteName() + '/{id}',
        handler: function (request, reply) {
            var id = request.params.id;
            reply(model.delete(id));
        }
    };

    this.httpServer.route(self.processRoles(model, rolesAllowed, routeOptions));
};

module.exports = routeGenerator;