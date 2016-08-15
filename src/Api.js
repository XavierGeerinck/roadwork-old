var Joi = require('joi');
var Model = require('./Model');
var RouteGenerator = require('./adapters/route-generator-hapi');
var generateOptionsSchema = require('./schemes/generateOptions');

/**
 * TODO: Ultimate goal of the lib: connect a Database, and automatically get Rest endpoints
 * DONE: Allow routes to be limited to specific roles
 * DONE: Add ability to turn off certain routes
 * TODO: Create option to get relations until a specified level (example 3)
 * TODO: Advanced filters
 * TODO: Add user support out of the box? (Could allow us for better roles, provide password on delete, ...)
 * TODO: Add exists route
 * TODO: Add count route
 * @param server
 * @constructor
 */
var Api = function (server) {
    if (!server) {
        throw new Error('No http engine given!');
    }

    this.server = server;
    this.models = [];

    this.routeGenerator = new RouteGenerator(this.server);
};

Api.prototype.getRouteGenerator = function () {
    return this.routeGenerator;
};

Api.prototype.addBearerAuthentication = function (validateFunction, callback) {
    this.routeGenerator.addBearerAuthentication(validateFunction, () => {
        return callback();
    });
};

Api.prototype.getServer = function () {
    return this.server;
};

Api.prototype.getModels = function () {
    return this.models;
};

/**
 * options: {
 *     routes: {
 *         read: {
 *             roles: [ 'admin' ]
 *         }
 *     }
 * }
 * @param baseModel
 * @param options
 */
Api.prototype.generate = function (baseModel, options) {
    if (!baseModel) {
        throw new Error('Invalid Base Model Specified');
    }

    Joi.validate(options, generateOptionsSchema, { convert: true }, (err, value) => {
        if (err) {
            throw new Error(err);
        }

        options = value;

        var model = new Model(baseModel);

        this.models.push(model);

        console.info('creating REST routes for ' + model.getTableName() + ':');
        if (options.routes.findAll.isEnabled) {
            this.routeGenerator.createFindAllRoute(model, options.routes.findAll.allowedRoles);
            console.info('--> created GET /' + model.getBaseRouteName());
        }

        if (options.routes.findOne.isEnabled) {
            this.routeGenerator.createFindOneRoute(model, options.routes.findOne.allowedRoles);
            console.info('--> created GET /' + model.getBaseRouteName() + '/{id}');
        }

        if (options.routes.create.isEnabled) {
            this.routeGenerator.createCreateRoute(model, options.routes.create.allowedRoles);
            console.info('--> created POST /' + model.getBaseRouteName());
        }

        if (options.routes.update.isEnabled) {
            this.routeGenerator.createUpdateRoute(model, options.routes.update.allowedRoles);
            console.info('--> created PUT /' + model.getBaseRouteName() + '/{id}');
        }

        if (options.routes.delete.isEnabled) {
            this.routeGenerator.createDeleteRoute(model, options.routes.delete.allowedRoles);
            console.info('--> created DELETE /' + model.getBaseRouteName() + '/{id}');
        }
    });
};

module.exports = function (server) {
    return new Api(server);
};