// // Load modules
// const pluralize = require('pluralize');
// const Code = require('code');
// const Lab = require('lab');
// const lab = exports.lab = Lab.script();
// const sinon = require('sinon');
//
// // Define shortcuts
// const describe = lab.describe;
// const it = lab.it;
// const before = lab.before;
// const beforeEach = lab.beforeEach;
// const after = lab.after;
// const expect = Code.expect;
//
// const ORM = require('../helpers/orm-bookshelf');
// const User = ORM.Models.User;
// const UserSession = ORM.Models.UserSession;
// const server = require('../helpers/server-hapi').init();
// const HapiAdapter = require(process.cwd() + '/src/adapters/hapi');
// const RouteGenerator = require(process.cwd() + '/src/RouteGenerator');
// const Api = require('../..')(server);
//
// describe('GET /<model> collection', () => {
//     before((done) => {
//         Api.generate(User, {
//             routes: {
//                 findAll: {
//                     allowedRoles: [ '$owner', 'admin' ]
//                 }
//             }
//         });
//
//         Api.generate(UserSession, {
//             routes: {
//                 findAll: {
//                     allowedRoles: [ '$owner', 'admin' ]
//                 }
//             }
//         });
//
//         done();
//     });
//
//     it('should register the GET /<model> call in the hapi framework', (done) => {
//         var routes = server.table()[0].table;
//         const routeName =  '/' + pluralize(User.forge().tableName);
//
//         expect(routes).to.include({ method: 'get' });
//         expect(routes).to.include({ path: routeName });
//
//         done();
//     });
//
//     it('should not register the GET /<model> call if isEnabled = false', (done) => {
//         const server = require('../helpers/server-hapi').init();
//         const Api = require('../..')(server);
//         Api.generate(User, { routes: { findAll: { isEnabled: false } } });
//
//         var routes = server.table()[0].table;
//         const routeName =  '/' + pluralize(User.forge().tableName);
//
//         expect(routes).to.not.include({ method: 'get', path: routeName });
//
//         done();
//     });
//
//     it('should call fetchAll when we request it with the scope ALL_ACCESS', (done) => {
//         const server = require('../helpers/server-hapi').init();
//         const RoadworkAuthentication = require('roadwork-authentication');
//
//         const mockModel = {
//             getBaseRouteName: function () {
//                 return 'mocks'
//             },
//
//             createObject: function (payload) {
//             }
//         };
//
//         const mockAuthentication = {
//             getAccessScope: function () {
//                 return RoadworkAuthentication.accessScopes.ALL_ACCESS;
//             },
//             accessScopes: RoadworkAuthentication.accessScopes
//         };
//
//         const routeGenerator = new RouteGenerator(server);
//         routeGenerator.authentication = mockAuthentication;
//         routeGenerator.createFindAllRoute(mockModel, [ 'admin' ]); // model, rolesAllowed
//
//         const routeName =  '/' + mockModel.getBaseRouteName();
//         server.inject({ method: 'GET', url: routeName }, (res) => {
//             // Now check if we called the method fetchAll
//             //spy.restore();
//             //sinon.assert.calledOnce(spy);
//
//             done();
//         });
//     });
//     //
//     // it('should call fetchAll when we request it with the scope ALL_ACCESS', (done) => {
//     //     const models = Api.getModels();
//     //
//     //     // Spy on the mock model
//     //     var spy = sinon.spy(models[0], 'findAll');
//     //
//     //     // Perform our normal routine
//     //     const routeName =  '/' + pluralize(User.forge().tableName);
//     //     server.start((err) => {
//     //         expect(err).to.not.exist();
//     //
//     //         // Note: The calls will fail since we have no connection to the database!
//     //         //       We just want to check if the 'fetchAll' function gets called
//     //         server.inject({ method: 'GET', url: routeName }, (res) => {
//     //             // Now check if we called the method fetchAll
//     //             spy.restore();
//     //             sinon.assert.calledOnce(spy);
//     //
//     //             done();
//     //         });
//     //     });
//     // });
//     //
//     // it('should call the findAllByUserId method in Model.js when we request this route with the $owner role, and it should call this with .where("id") if the table is our main user table', (done) => {
//     //     Api.getRouteGenerator().authentication = true;
//     //
//     //     const models = Api.getModels();
//     //
//     //     // Spy on the mock model
//     //     var spy = sinon.spy(models[0], 'findAllByUserId');
//     //     const stub = sinon.stub(models[0].baseModel, 'where', function (column, value) {
//     //         return {
//     //             fetchAll:  function () {
//     //                 return Promise.resolve('called_column_' + column);
//     //             }
//     //         }
//     //     });
//     //
//     //     expect(models[0].tableName).to.equal('user');
//     //
//     //     // Perform our normal routine
//     //     const routeName =  '/' + pluralize(User.forge().tableName);
//     //     server.start((err) => {
//     //         expect(err).to.not.exist();
//     //
//     //         // Note: The calls will fail since we have no connection to the database!
//     //         //       We just want to check if the 'fetchAll' function gets called
//     //         server.inject({ method: 'GET', url: routeName, credentials: { get: function (column) { return 1; } } }, (res) => {
//     //             // Now check if we called the method fetchAll
//     //             spy.restore();
//     //             stub.restore();
//     //             sinon.assert.calledOnce(spy);
//     //
//     //             // It should call the where with the id column!
//     //             expect(res.payload).to.equal('called_column_id');
//     //
//     //             done();
//     //         });
//     //     });
//     // });
//     //
//     // it('should call the findAllByUserId method in Model.js when we request this route with the $owner role, and it should call this with .where("user_id") if the table is NOT our main user table', (done) => {
//     //     Api.getRouteGenerator().authentication = true;
//     //
//     //     const models = Api.getModels();
//     //
//     //     // Spy on the mock model
//     //     var spy = sinon.spy(models[1], 'findAllByUserId');
//     //     const stub = sinon.stub(models[1].baseModel, 'where', function (column, value) {
//     //         return {
//     //             fetchAll:  function () {
//     //                 return Promise.resolve('called_column_' + column);
//     //             }
//     //         }
//     //     });
//     //
//     //     expect(models[0].tableName).to.equal('user');
//     //
//     //     // Perform our normal routine
//     //     const routeName =  '/' + pluralize(UserSession.forge().tableName);
//     //     server.start((err) => {
//     //         expect(err).to.not.exist();
//     //
//     //         // Note: The calls will fail since we have no connection to the database!
//     //         //       We just want to check if the 'fetchAll' function gets called
//     //         server.inject({ method: 'GET', url: routeName, credentials: { get: function (column) { return 1; } } }, (res) => {
//     //             // Now check if we called the method fetchAll
//     //             spy.restore();
//     //             stub.restore();
//     //             sinon.assert.calledOnce(spy);
//     //
//     //             // It should call the where with the id column!
//     //             expect(res.payload).to.equal('called_column_user_id');
//     //
//     //             done();
//     //         });
//     //     });
//     // });
//     //
//     // it('should use the findAllByUserId method in the handler if we have authentication and the ownerRole', (done) => {
//     //     const server = require('../helpers/server-hapi').init();
//     //
//     //     const mockModel = {
//     //         getBaseRouteName: function () {
//     //             return 'mocks'
//     //         },
//     //
//     //         createObject: function (payload) {
//     //             return false;
//     //         },
//     //
//     //         findAllByUserId: function (userId) {
//     //             return 'findAllByUserId_called';
//     //         },
//     //
//     //         findAll: function () {
//     //             return false;
//     //         }
//     //     };
//     //
//     //     const routeGenerator = new RouteGenerator(server);
//     //     routeGenerator.createFindAllRoute(mockModel, [ '$owner' ]); // model, rolesAllowed
//     //     routeGenerator.authentication = true;
//     //
//     //     var routes = server.table()[0].table;
//     //     const routeName =  '/' + mockModel.baseRoute;
//     //
//     //     server.start((err) => {
//     //         expect(err).to.not.exist();
//     //
//     //         server.inject({ method: 'GET', url: routeName, credentials: { get: function (column) { return 1; } } }, (res) => {
//     //             // If the mock was called, then it should return findAllByUserId_called!
//     //             expect(res.payload).to.equal('findAllByUserId_called');
//     //
//     //             done();
//     //         });
//     //     });
//     // });
// });