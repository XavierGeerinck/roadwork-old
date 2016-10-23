"use strict";

const Joi = require('joi');
const Boom = require('boom');
const accessScopesEnum = require('./enums/accessScopes');
const rootOptionsSchema = require('./schemes/rootOptions');

class RouteGenerator {
    constructor (adapter, authentication, options) {
        this.adapter = adapter;
        this.authentication = authentication;
        this.options = Joi.validate(options, rootOptionsSchema, { convert: true }).value; // No error reporting here, it gets caught by the main framework
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
     * Remove unneeded keys from the queryParams
     * @param queryParams
     */
    processQueryParams (queryParams) {
        if (!queryParams) {
            return {};
        }

        let temp = JSON.parse(JSON.stringify(queryParams)); // Clone the request.query object since we will make modifications
        delete temp.access_token; // Do not allow the access token in here
        delete temp.token;
        delete temp.limit; // Limit is system specified
        delete temp.with; // With is system specified for relation handling

        return temp;
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
            for (let scope of userScope) {
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
        routeOptions = routeOptions || {};

        let self = this;
        let routeConfig = {
            method: 'GET',
            path: model.getFullRoute(),
            handler: require('./handlers/findAll')(self, model, routeOptions)
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateFindAllWithPagination (model, routeOptions) {
        routeOptions = routeOptions || {};

        let self = this;
        let routeConfig = {
            method: 'GET',
            path: `${this.options.basePath}/${model.baseRoute}/pagination/{offset}`,
            config: {
                validate: {
                    query: {
                        limit: Joi.number().max(20),
                        access_token: Joi.string().optional()
                    }
                }
            },
            handler: require('./handlers/findAllWithPagination')(self, model, routeOptions)
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateFindOne (model, routeOptions) {
        routeOptions = routeOptions || {};

        let self = this;
        let routeConfig = {
            method: 'GET',
            path: `${this.options.basePath}/${model.baseRoute}/{id}`,
            handler: require('./handlers/findOne')(self, model, routeOptions)
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateCreate (model, routeOptions) {
        routeOptions = routeOptions || {};

        let self = this;
        let routeConfig = {
            method: 'POST',
            path: `${this.options.basePath}/${model.baseRoute}`,
            handler: require('./handlers/create')(self, model, routeOptions)
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateUpdate (model, routeOptions) {
        routeOptions = routeOptions || {};

        let self = this;
        let routeConfig = {
            method: 'PUT',
            path: `${this.options.basePath}/${model.baseRoute}/{id}`,
            handler: require('./handlers/update')(self, model, routeOptions)
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateDelete (model, routeOptions) {
        routeOptions = routeOptions || {};

        let self = this;
        let routeConfig = {
            method: 'DELETE',
            path: `${this.options.basePath}/${model.baseRoute}/{id}`,
            handler: require('./handlers/delete')(self, model, routeOptions)
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }

    generateCount (model, routeOptions) {
        routeOptions = routeOptions || {};

        let self = this;
        let routeConfig = {
            method: 'GET',
            path: `${this.options.basePath}/${model.baseRoute}/count`,
            handler: require('./handlers/count')(self, model, routeOptions)
        };

        return self.processRoles(model, routeOptions.allowedRoles, routeConfig);
    }
}

module.exports = RouteGenerator;
