const Boom = require('boom');
const Joi = require('joi');

let instance = null;

class HapiAdapter {
    constructor (httpServer) {
        // if (!instance) {
        //     instance = this;
        // }

        this.httpServer = httpServer;

        // return instance;
    }

    registerPlugin (plugin) {
        return new Promise((resolve, reject) => {
            this.httpServer.register({
                register: plugin.getHapiFrameworkInterface(),
                options: {}
            }, { once: true }, (err) => {
                //if (err) {
                //    reject(err);
                //}

                try {
                    this.httpServer.auth.strategy(plugin.strategyName, plugin.strategyName);
                    console.info('--> Added authentication: ' + plugin.strategyName);
                } catch (err) {
                    //console.info('--> [IGNORED] ' +  plugin.strategyName + '  authentication already registered, ignoring');
                    // Ignore error, it can happen when we call the addAuthentication function twice
                }

                return resolve();
            });
        });
    }

    registerRoute (routeConfiguration) {
        this.httpServer.route(routeConfiguration);
    }
}

module.exports = HapiAdapter;