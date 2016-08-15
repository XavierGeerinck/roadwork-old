// Load modules
const pluralize = require('pluralize');
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const sinon = require('sinon');

// Define shortcuts
const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const beforeEach = lab.beforeEach;
const after = lab.after;
const expect = Code.expect;

const ORM = require('./helpers/orm-bookshelf');
const User = ORM.Models.User;

describe('GET /<model> collection', () => {
    it('should register the POST /<model> call in the hapi framework', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);
        Api.generate(User);

        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName);

        expect(routes).to.include({ method: 'post', path: routeName });

        done();
    });

    it('should not register the POST /<model> call if isEnabled = false', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);
        Api.generate(User, { routes: { create: { isEnabled: false } } });

        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName);

        expect(routes).to.not.include({ method: 'post', path: routeName });

        done();
    });

    it('should call the create method in Model.js when we request this route and should return our result', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);
        Api.generate(User);

        const models = Api.getModels();

        // Spy on the mock model
        var createSpy = sinon.spy(models[0], 'createObject');

        // Perform our normal routine
        const routeName =  '/' + pluralize(User.forge().tableName);
        server.start((err) => {
            expect(err).to.not.exist();

            // Note: The calls will fail since we have no connection to the database!
            //       We just want to check if the 'createObject' function gets called
            let payload = {
                id: '1',
                first_name: 'Xavier',
                last_name: 'Geerinck'
            };

            server.inject({ method: 'POST', url: routeName, payload: payload }, (res) => {
                createSpy.restore();
                sinon.assert.calledOnce(createSpy);
                expect(createSpy.args[0][0]).to.equal(payload); // First parameter is the data

                done();
            });
        });
    });

    it('should call the bearer authentication registration correctly', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);

        const routeGenerator = Api.getRouteGenerator();
        var spy = sinon.spy(routeGenerator, 'addBearerAuthentication');

        Api.addBearerAuthentication((token, callback) => { return callback(null, true, {}); })
        .then(() => {
            Api.generate(User, {
                routes: {
                    create: {
                        allowedRoles: [ 'admin' ]
                    }
                }
            });

            spy.restore();
            sinon.assert.calledOnce(spy);

            done();
        });
    });

    it('should limit to the specified role, if one is given and return the result when we do have access', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);
        const routeGenerator = Api.getRouteGenerator();

        var spy = sinon.spy(routeGenerator, 'addBearerAuthentication');

        Api.addBearerAuthentication((token, callback) => { return callback(null, true, { scope: [ 'admin' ] }); })
        .then(() => {
            Api.generate(User, {
                routes: {
                    create: {
                        allowedRoles: [ 'admin' ]
                    }
                }
            });

            const models = Api.getModels();
            var spy2 = sinon.spy(models[0], 'createObject'); // should not get called!

            // Perform our normal routine
            const routeName =  '/' + pluralize(User.forge().tableName);
            server.start((err) => {
                expect(err).to.not.exist();

                // Note: The calls will fail since we have no connection to the database!
                //       We just want to check if the 'createObject' function gets called
                let request = {
                    method: 'POST',
                    url: routeName,
                    headers: {
                        Authorization: 'Bearer <SOMETOKEN>'
                    },
                    payload: {
                        id: '1',
                        first_name: 'Xavier',
                        last_name: 'Geerinck'
                    }
                };

                server.inject(request, (res) => {
                    expect(res.payload).to.exist();

                    console.log(res.payload);

                    expect(spy.callCount).to.equal(1);
                    expect(spy2.callCount).to.equal(1);
                    spy.restore();
                    spy2.restore();

                    done();
                });
            });
        });
    });

    it('should limit to the specified role, if one is given and return Unauthorized when we do not have access', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);
        const routeGenerator = Api.getRouteGenerator();

        var spy = sinon.spy(routeGenerator, 'addBearerAuthentication');

        Api.addBearerAuthentication((token, callback) => { return callback(null, false); })
        .then(() => {
            Api.generate(User, {
                routes: {
                    create: {
                        allowedRoles: [ 'admin' ]
                    }
                }
            });

            const models = Api.getModels();
            var spy2 = sinon.spy(models[0], 'createObject'); // should not get called!

            // Perform our normal routine
            const routeName =  '/' + pluralize(User.forge().tableName);
            server.start((err) => {
                expect(err).to.not.exist();

                // Note: The calls will fail since we have no connection to the database!
                //       We just want to check if the 'createObject' function gets called
                let request = {
                    method: 'POST',
                    url: routeName,
                    headers: {
                        Authorization: 'Bearer <SOMETOKEN>'
                    },
                    payload: {
                        id: '1',
                        first_name: 'Xavier',
                        last_name: 'Geerinck'
                    }
                };

                server.inject(request, (res) => {
                    expect(res.payload).to.exist();
                    expect(JSON.parse(res.payload)).to.exist();
                    expect(JSON.parse(res.payload).error).to.equal('Unauthorized');

                    expect(spy.callCount).to.equal(1);
                    expect(spy2.callCount).to.equal(0); // Create should not be called if unauthorized
                    spy.restore();
                    spy2.restore();

                    done();
                });
            });
        });
    });
});