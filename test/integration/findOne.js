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

const ORM = require('../helpers/orm-bookshelf');
const User = ORM.Models.User;
const server = require('../helpers/server-hapi').init();
const RouteGenerator = require(process.cwd() + '/src/adapters/route-generator-hapi');
const Api = require('../..')(server);

describe('GET /<model> collection', () => {
    before((done) => {
        Api.generate(User);

        done();
    });

    it('should register the GET /<model>/{id} call in the hapi framework', (done) => {
        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName) + '/{id}';

        expect(routes).to.include({ method: 'get' });
        expect(routes).to.include({ path: routeName });

        done();
    });

    it('should not register the GET /<model>/<id> call if isEnabled = false', (done) => {
        const server = require('../helpers/server-hapi').init();
        const Api = require('../..')(server);
        Api.generate(User, { routes: { findOne: { isEnabled: false } } });

        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName) + '/{id}';

        expect(routes).to.not.include({ method: 'get', path: routeName });

        done();
    });

    it('should call the fetchOne method in Model.js when we request this route and should return our result', (done) => {
        const models = Api.getModels();

        // Spy on the mock model
        var fetchOneSpy = sinon.spy(models[0], 'findOneById');

        // Perform our normal routine
        const routeName =  '/' + pluralize(User.forge().tableName) + '/1';
        server.start((err) => {
            expect(err).to.not.exist();

            // Note: The calls will fail since we have no connection to the database!
            //       We just want to check if the 'findOneById' function gets called
            server.inject({ method: 'GET', url: routeName }, (res) => {
                // Now check if we called the method fetchAll
                fetchOneSpy.restore();
                sinon.assert.calledOnce(fetchOneSpy);
                sinon.assert.calledWith(fetchOneSpy, "1"); // expect that we call findOneById with id: 1 (see route)

                done();
            });
        });
    });

    it('should use the findOneById method in the handler if we have authentication, the ownerRole and have access!', (done) => {
        const server = require('../helpers/server-hapi').init();

        const mockModel = {
            getBaseRouteName: function () {
                return 'mocks'
            },

            createObject: function (payload) {
                return false;
            },

            findOneById: function (id) {
                return 'findOneById_called';
            },

            findAll: function () {
                return false;
            }
        };

        const mockAuthentication = {
            hasAccess: function (request, rolesAllowed, model) {
                return Promise.resolve(true);
            }
        };

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.createFindOneRoute(mockModel, [ '$owner' ]); // model, rolesAllowed
        routeGenerator.authentication = mockAuthentication;

        var routes = server.table()[0].table;
        const routeName =  '/' + mockModel.getBaseRouteName() + '/1';

        server.start((err) => {
            expect(err).to.not.exist();

            server.inject({ method: 'GET', url: routeName, credentials: { get: function (column) { return 1; } } }, (res) => {
                // If the mock was called, then it should return true!
                expect(res.payload).to.equal('findOneById_called');

                done();
            });
        });
    });

    it('should return unauthorized if we have authentication, the ownerRole and have no access!', (done) => {
        const server = require('../helpers/server-hapi').init();

        const mockModel = {
            getBaseRouteName: function () {
                return 'mocks'
            },

            createObject: function (payload) {
                return false;
            },

            findOneById: function (id) {
                return 'findOneById_called';
            },

            findAll: function () {
                return false;
            }
        };

        const mockAuthentication = {
            hasAccess: function (request, rolesAllowed, model) {
                return Promise.resolve(false);
            }
        };

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.createFindOneRoute(mockModel, [ '$owner' ]); // model, rolesAllowed
        routeGenerator.authentication = mockAuthentication;

        var routes = server.table()[0].table;
        const routeName =  '/' + mockModel.getBaseRouteName() + '/1';

        server.start((err) => {
            expect(err).to.not.exist();

            server.inject({ method: 'GET', url: routeName, credentials: { get: function (column) { return 1; } } }, (res) => {
                expect(JSON.parse(res.payload).statusCode).to.equal(401);
                expect(JSON.parse(res.payload).error).to.equal('Unauthorized');

                done();
            });
        });
    });
});