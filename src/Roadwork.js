const Joi = require('joi');
const Model = require('./Model');
const RouteGenerator = require('./RouteGenerator');
const HapiAdapter = require('./adapters/hapi');
const generateOptionsSchema = require('./schemes/generateOptions');
const rootOptionsSchema = require('./schemes/rootOptions');
const dbConfigSchema = require('./schemes/dbConfig');

class Roadwork {
    constructor (server, bookshelf, options) {
        if (!server) {
            throw new Error('No http engine given!');
        }

        if (!bookshelf) {
            throw new Error('database connection not started');
        }

        const result = Joi.validate(options, rootOptionsSchema, { convert: true });

        if (result.error) {
            throw result.error;
        }

        this.options = result.value; // Not validated options object!
        this.authentication = null; // The authentication plugin used
        this.server = server;
        this.models = [];
        this.adapter = new HapiAdapter(this.server);
        this.routeGenerator = new RouteGenerator(this.adapter);

        // Init bookshelf and add the plugins
        this.bookshelf = bookshelf;
        this.bookshelf.plugin('virtuals');
        this.bookshelf.plugin('visibility');
        this.bookshelf.plugin('registry');
        this.bookshelf.plugin('pagination');
    }

    getRouteGenerator () {
        return this.routeGenerator;
    };

    /**
     * This should initiate the authentication requirements
     * @param AuthenticationLibrary
     * @param bookshelf
     */
    addAuthentication (AuthenticationLibrary) {
        return new Promise((resolve, reject) => {
            if (!AuthenticationLibrary) {
                return reject(new Error('Missing the authenticationLibrary'));
            }

            this.authentication = new AuthenticationLibrary(this.server, this.bookshelf);
            this.routeGenerator.authentication = this.authentication;

            // Register the plugin in the httpserver
            this.adapter.registerPlugin(this.authentication)
            .then(() => {
                // Init the authentication library, this will create required tables, ...
                return this.authentication.init();
            })
            .then(() => {
                console.info('[x] Database scheme is valid');
                return resolve();
            });
        });
    };

    getServer () {
        return this.server;
    };

    getModels () {
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
    generate (baseModel, routeOptions) {
        if (!baseModel) {
            throw new Error('Invalid Base Model Specified');
        }

        const result = Joi.validate(routeOptions, generateOptionsSchema, { convert: true });

        if (result.error) {
            throw result.error;
        }

        routeOptions = result.value;

        var model = new Model(baseModel, this.options);

        this.models.push(model);

        console.info('creating REST routes for ' + model.tableName + ':');
        if (routeOptions.routes.findAll.isEnabled) {
            this.adapter.registerRoute(this.routeGenerator.generateFindAll(model, routeOptions.routes.findAll));
            console.info('--> created GET ' + model.baseRoute + ' for: ' + routeOptions.routes.findAll);
        }

        if (routeOptions.routes.findAllWithPagination.isEnabled) {
            this.adapter.registerRoute(this.routeGenerator.generateFindAllWithPagination(model, routeOptions.routes.findAllWithPagination));
            console.info('--> created GET ' + model.getFullRoute() + '/pagination/{offset}?limit={limit}' + ' for: ' + routeOptions.routes.findAllWithPagination);
        }

        if (routeOptions.routes.findOne.isEnabled) {
            this.adapter.registerRoute(this.routeGenerator.generateFindOne(model, routeOptions.routes.findOne));
            console.info('--> created GET ' + model.getFullRoute() + '/{id}' + ' for: ' + routeOptions.routes.findOne);
        }

        if (routeOptions.routes.create.isEnabled) {
            this.adapter.registerRoute(this.routeGenerator.generateCreate(model, routeOptions.routes.create));
            console.info('--> created POST ' + model.getFullRoute() + ' for: ' + routeOptions.routes.create);
        }

        if (routeOptions.routes.update.isEnabled) {
            this.adapter.registerRoute(this.routeGenerator.generateUpdate(model, routeOptions.routes.update));
            console.info('--> created PUT ' + model.getFullRoute() + '/{id}' + ' for: ' + routeOptions.routes.update);
        }

        if (routeOptions.routes.delete.isEnabled) {
            this.adapter.registerRoute(this.routeGenerator.generateDelete(model, routeOptions.routes.delete));
            console.info('--> created DELETE ' + model.getFullRoute() + '/{id}' + ' for: ' + routeOptions.routes.delete);
        }

        if (routeOptions.routes.count.isEnabled) {
            this.adapter.registerRoute(this.routeGenerator.generateCount(model, routeOptions.routes.count));
            console.info('--> created GET ' + model.getFullRoute() + '/count' + ' for: ' + routeOptions.routes.count);
        }
    };
}

module.exports = Roadwork;
