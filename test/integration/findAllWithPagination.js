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
const UserSession = ORM.Models.UserSession;
const server = require('../helpers/server-hapi').init();
const RouteGenerator = require(process.cwd() + '/src/adapters/route-generator-hapi');
const Api = require('../..')(server);

describe('GET /<model>/pagination/{offset}?limit={limit} collection', () => {
    before((done) => {
        Api.generate(User);
        done();
    });

    it('should register the GET /<model>/pagination/{offset}?limit={limit} call in the hapi framework', (done) => {
        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName) + '/pagination/{offset}';

        expect(routes).to.include({ method: 'get' });
        expect(routes).to.include({ path: routeName });

        done();
    });

    it('should not register the GET /<model>/pagination/{offset}?limit={limit} call if isEnabled = false', (done) => {
        const server = require('../helpers/server-hapi').init();
        const Api = require('../..')(server);
        Api.generate(User, { routes: { findAllWithPagination: { isEnabled: false } } });

        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName) + '/pagination/{offset}';

        expect(routes).to.not.include({ method: 'get', path: routeName });

        done();
    });

    it('should call the findAllWithPagination method in Model.js when we request this route without the $owner role', (done) => {
        const models = Api.getModels();

        // Spy on the mock model
        var spy = sinon.spy(models[0], 'findAllWithPagination');

        // Perform our normal routine
        const routeName =  '/' + pluralize(User.forge().tableName) + '/pagination/5?limit=2';
        server.start((err) => {
            expect(err).to.not.exist();

            // Note: The calls will fail since we have no connection to the database!
            //       We just want to check if the 'findAllWithPagination' function gets called
            server.inject({ method: 'GET', url: routeName }, (res) => {
                // Now check if we called the method findAllWithPagination
                spy.restore();
                sinon.assert.calledOnce(spy);

                done();
            });
        });
    });

    it('should call the findAllByUserId method in Model.js when we request this route with the $owner role', (done) => {
        Api.generate(UserSession, {
            routes: {
                findAllWithPagination: {
                    allowedRoles: [ '$owner' ]
                }
            }
        });

        Api.getRouteGenerator().authentication = true;

        const models = Api.getModels();

        // Spy on the mock model
        var spy = sinon.spy(models[1], 'findAllByUserIdWithPagination');

        // Perform our normal routine
        const routeName =  '/' + pluralize(UserSession.forge().tableName) + '/pagination/5?limit=2';
        server.start((err) => {
            expect(err).to.not.exist();

            // Note: The calls will fail since we have no connection to the database!
            //       We just want to check if the 'findAllWithPagination' function gets called
            server.inject({ method: 'GET', url: routeName, credentials: { get: function (column) { return 1; } } }, (res) => {
                // Now check if we called the method findAllWithPagination
                spy.restore();
                sinon.assert.calledOnce(spy);

                done();
            });
        });
    });

    it('should use the findAllByUserIdWithPagination method in the handler if we have authentication and the ownerRole', (done) => {
        const server = require('../helpers/server-hapi').init();

        const mockModel = {
            getBaseRouteName: function () {
                return 'mocks'
            },

            createObject: function (payload) {
                return false;
            },

            findAllByUserIdWithPagination: function (userId) {
                return 'findAllWithPaginationByUserId_called';
            },

            findAllWithPagination: function () {
                return 'findAllWithPagination_called';
            }
        };

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.createFindAllWithPaginationRoute(mockModel, [ '$owner' ]); // model, rolesAllowed
        routeGenerator.authentication = true;

        var routes = server.table()[0].table;
        const routeName =  '/' + mockModel.baseRoute + '/pagination/5?limit=2';

        server.start((err) => {
            expect(err).to.not.exist();

            server.inject({ method: 'GET', url: routeName, credentials: { get: function (column) { return 1; } } }, (res) => {
                // If the mock was called, then it should return findAllByUserId_called!
                expect(res.payload).to.equal('findAllWithPaginationByUserId_called');

                done();
            });
        });
    });
});