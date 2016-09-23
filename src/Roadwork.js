const Joi = require('joi');
const Model = require('./Model');
const RouteGenerator = require('./RouteGenerator');
const HapiAdapter = require('./adapters/hapi');
const generateOptionsSchema = require('./schemes/generateOptions');
const dbConfigSchema = require('./schemes/dbConfig');

class Roadwork {
    constructor (server, dbConfig) {
        console.log(dbConfig);
        if (!server) {
            throw new Error('No http engine given!');
        }

        this.authentication = null; // The authentication plugin used
        this.server = server;
        this.models = [];
        this.dbConfig = dbConfig;
        this.adapter = new HapiAdapter(this.server);
        this.routeGenerator = new RouteGenerator(this.adapter);
    }

    /**
     * Initialize the library, this will start the database connection
     */
    init () {
        console.log(this.dbConfig);
        Joi.validate(this.dbConfig, dbConfigSchema, { convert: true }, (err, value) => {
            if (err) {
                throw new Error(err);
            }

            let knex = require('knex')(value);
            this.dbConnection = require('bookshelf')(knex);
        });
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

            if (!bookshelf) {
                return reject(new Error('Missing the bookshelf object'));
            }

            this.authentication = new AuthenticationLibrary(this.server, bookshelf);
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
    generate (baseModel, options) {
        if (!baseModel) {
            throw new Error('Invalid Base Model Specified');
        }

        Joi.validate(options, generateOptionsSchema, { convert: true }, (err, value) => {
            // if (err) {
            //     throw new Error(err);
            // }

            options = value;

            var model = new Model(baseModel);

            this.models.push(model);

            console.info('creating REST routes for ' + model.tableName + ':');
            if (options.routes.findAll.isEnabled) {
                this.adapter.registerRoute(this.routeGenerator.generateFindAll(model, options.routes.findAll.allowedRoles));
                console.info('--> created GET /' + model.baseRoute + ' for: ' + options.routes.findAll.allowedRoles);
            }

            if (options.routes.findAllWithPagination.isEnabled) {
                this.adapter.registerRoute(this.routeGenerator.generateFindAllWithPagination(model, options.routes.findAllWithPagination.allowedRoles));
                console.info('--> created GET /' + model.baseRoute + '/pagination/{offset}?limit={limit}' + ' for: ' + options.routes.findAllWithPagination.allowedRoles);
            }

            if (options.routes.findOne.isEnabled) {
                this.adapter.registerRoute(this.routeGenerator.generateFindOne(model, options.routes.findOne.allowedRoles));
                console.info('--> created GET /' + model.baseRoute + '/{id}' + ' for: ' + options.routes.findOne.allowedRoles);
            }

            if (options.routes.create.isEnabled) {
                this.adapter.registerRoute(this.routeGenerator.generateCreate(model, options.routes.create.allowedRoles));
                console.info('--> created POST /' + model.baseRoute + ' for: ' + options.routes.create.allowedRoles);
            }

            if (options.routes.update.isEnabled) {
                this.adapter.registerRoute(this.routeGenerator.generateUpdate(model, options.routes.update.allowedRoles));
                console.info('--> created PUT /' + model.baseRoute + '/{id}' + ' for: ' + options.routes.update.allowedRoles);
            }

            if (options.routes.delete.isEnabled) {
                this.adapter.registerRoute(this.routeGenerator.generateDelete(model, options.routes.delete.allowedRoles));
                console.info('--> created DELETE /' + model.baseRoute + '/{id}' + ' for: ' + options.routes.delete.allowedRoles);
            }

            if (options.routes.count.isEnabled) {
                this.adapter.registerRoute(this.routeGenerator.generateCount(model, options.routes.count.allowedRoles));
                console.info('--> created GET /' + model.baseRoute + '/count' + ' for: ' + options.routes.count.allowedRoles);
            }
        });
    };
}

module.exports = Roadwork;