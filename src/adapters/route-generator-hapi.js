var routeGenerator = function (httpServer, model) {
    this.httpServer = httpServer;
};

routeGenerator.prototype.addBearerAuthentication = function (validateFunction, callback) {
    this.httpServer.register({
        register: require('hapi-auth-bearer-simple'),
        options: {}
    }, (err) => {
        //if (err) {
        //    throw err;
        //}

        this.httpServer.auth.strategy('bearer', 'bearerAuth', {
            validateFunction: validateFunction
        });

        console.info('--> Added bearer authentication');
        callback();
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

    if (rolesAllowed) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: 'bearer',
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


    if (rolesAllowed) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: 'bearer',
            scope: rolesAllowed
        };
    }

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


    if (rolesAllowed) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: 'bearer',
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


    if (rolesAllowed) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: 'bearer',
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

    if (rolesAllowed) {
        routeOptions.config = {};
        routeOptions.config.auth = {
            strategy: 'bearer',
            scope: rolesAllowed
        };
    }

    this.httpServer.route(routeOptions);
};

module.exports = routeGenerator;