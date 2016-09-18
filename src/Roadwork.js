var Joi = require('joi');
var Model = require('./Model');
var RouteGenerator = require('./adapters/route-generator-hapi');
var generateOptionsSchema = require('./schemes/generateOptions');

/**
 * @param server
 * @constructor
 */
var Roadwork = function (server) {
    if (!server) {
        throw new Error('No http engine given!');
    }

    this.authentication = null; // The authentication plugin used
    this.server = server;
    this.models = [];

    this.routeGenerator = new RouteGenerator(this.server);
};

Roadwork.prototype.getRouteGenerator = function () {
    return this.routeGenerator;
};

/**
 * This should initiate the authentication requirements
 * @param authenticationLibrary
 * @param bookshelf
 */
Roadwork.prototype.addAuthentication = function (authenticationLibrary, bookshelf) {
    return new Promise((resolve, reject) => {
        if (!authenticationLibrary) {
            return reject(new Error('Missing the authenticationLibrary'));
        }

        if (!bookshelf) {
            return reject(new Error('Missing the bookshelf object'));
        }

        // Create a new authentication instance
        this.authentication = new authenticationLibrary(this.server, bookshelf);

        // Inform the route generator that we have authentication!
        this.routeGenerator.addAuthentication(this.authentication);

        // Call the check to see if the tables exist and create them if needed
        this.authentication.init()
        .then(function () {
            console.info('[x] Database scheme is valid');
            return resolve();
        });
    });
};

Roadwork.prototype.getServer = function () {
    return this.server;
};

Roadwork.prototype.getModels = function () {
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
Roadwork.prototype.generate = function (baseModel, options) {
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

        console.info('creating REST routes for ' + model.tableName + ':');
        if (options.routes.findAll.isEnabled) {
            this.routeGenerator.createFindAllRoute(model, options.routes.findAll.allowedRoles);
            console.info('--> created GET /' + model.baseRoute + ' for: ' + options.routes.findAll.allowedRoles);
        }

        if (options.routes.findAllWithPagination.isEnabled) {
            this.routeGenerator.createFindAllWithPaginationRoute(model, options.routes.findAllWithPagination.allowedRoles);
            console.info('--> created GET /' + model.baseRoute + '/pagination/{offset}?limit={limit}' + ' for: ' + options.routes.findAllWithPagination.allowedRoles);
        }

        if (options.routes.findOne.isEnabled) {
            this.routeGenerator.createFindOneRoute(model, options.routes.findOne.allowedRoles);
            console.info('--> created GET /' + model.baseRoute + '/{id}' + ' for: ' + options.routes.findOne.allowedRoles);
        }

        if (options.routes.create.isEnabled) {
            this.routeGenerator.createCreateRoute(model, options.routes.create.allowedRoles);
            console.info('--> created POST /' + model.baseRoute + ' for: ' + options.routes.create.allowedRoles);
        }

        if (options.routes.update.isEnabled) {
            this.routeGenerator.createUpdateRoute(model, options.routes.update.allowedRoles);
            console.info('--> created PUT /' + model.baseRoute + '/{id}' + ' for: ' + options.routes.update.allowedRoles);
        }

        if (options.routes.delete.isEnabled) {
            this.routeGenerator.createDeleteRoute(model, options.routes.delete.allowedRoles);
            console.info('--> created DELETE /' + model.baseRoute + '/{id}' + ' for: ' + options.routes.delete.allowedRoles);
        }

        if (options.routes.count.isEnabled) {
            this.routeGenerator.createCountRoute(model, options.routes.count.allowedRoles);
            console.info('--> created GET /' + model.baseRoute + '/count' + ' for: ' + options.routes.count.allowedRoles);
        }
    });
};

module.exports = Roadwork;