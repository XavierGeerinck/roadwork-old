const Promise = require('bluebird');

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

routeGenerator.prototype.createFindAllRoute = function (model, rolesAllowed) {
    var routeOptions = {
        method: 'GET',
        path: '/' + model.getBaseRouteName(),
        handler: function (request, reply) {
            reply(model.findAll());
        }
    };

    // If rolesAllowed is empty, do not register the route! this means nobody has access
    // TODO: Maybe allow the application access? (through the 'application' role?)
    if (rolesAllowed && rolesAllowed.length == 0) {
        return;
    }

    if (rolesAllowed && this.authentication) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: this.authentication.getStrategyName(),
            scope: rolesAllowed
        };
    }

    this.httpServer.route(routeOptions);
};

routeGenerator.prototype.createFindOneRoute = function (model, rolesAllowed) {
    var routeOptions = {
        method: 'GET',
        path: '/' + model.getBaseRouteName() + '/{id}',
        handler: function (request, reply) {
            var id = request.params.id;
            reply(model.findOneById(id));
        }
    };

    // If rolesAllowed is empty, do not register the route! this means nobody has access
    // TODO: Maybe allow the application access? (through the 'application' role?)
    if (rolesAllowed && rolesAllowed.length == 0) {
        return;
    }

    if (rolesAllowed && this.authentication) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: this.authentication.getStrategyName(),
            scope: rolesAllowed
        };
    }
console.log(routeOptions);
    this.httpServer.route(routeOptions);
};

routeGenerator.prototype.createCreateRoute = function (model, rolesAllowed) {
    var routeOptions = {
        method: 'POST',
        path: '/' + model.getBaseRouteName(),
        handler: function (request, reply) {
            reply(model.createObject(request.payload));
        }
    };

    // If rolesAllowed is empty, do not register the route! this means nobody has access
    // TODO: Maybe allow the application access? (through the 'application' role?)
    if (rolesAllowed && rolesAllowed.length == 0) {
        return;
    }

    if (rolesAllowed && this.authentication) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: this.authentication.getStrategyName(),
            scope: rolesAllowed
        };
    }

    this.httpServer.route(routeOptions);
};

routeGenerator.prototype.createUpdateRoute = function (model, rolesAllowed) {
    var routeOptions = {
        method: 'PUT',
        path: '/' + model.getBaseRouteName() + '/{id}',
        handler: function (request, reply) {
            var id = request.params.id;
            reply(model.update(id, request.payload));
        }
    };

    // If rolesAllowed is empty, do not register the route! this means nobody has access
    // TODO: Maybe allow the application access? (through the 'application' role?)
    if (rolesAllowed && rolesAllowed.length == 0) {
        return;
    }

    if (rolesAllowed && this.authentication) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: this.authentication.getStrategyName(),
            scope: rolesAllowed
        };
    }

    this.httpServer.route(routeOptions);
};

routeGenerator.prototype.createDeleteRoute = function (model, rolesAllowed) {
    var routeOptions = {
        method: 'DELETE',
        path: '/' + model.getBaseRouteName() + '/{id}',
        handler: function (request, reply) {
            var id = request.params.id;
            reply(model.delete(id));
        }
    };

    // If rolesAllowed is empty, do not register the route! this means nobody has access
    // TODO: Maybe allow the application access? (through the 'application' role?)
    if (rolesAllowed && rolesAllowed.length == 0) {
        return;
    }

    if (rolesAllowed && this.authentication) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: this.authentication.getStrategyName(),
            scope: rolesAllowed
        };
    }

    this.httpServer.route(routeOptions);
};

module.exports = routeGenerator;