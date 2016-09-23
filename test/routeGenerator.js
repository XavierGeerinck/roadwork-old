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
// const ORM = require('./helpers/orm-bookshelf');
// const User = ORM.Models.User;
// const HapiAdapter = require(process.cwd() + '/src/adapters/hapi');
// const RouteGenerator = require(process.cwd() + '/src/RouteGenerator');
// const RoadworkAuthentication = require('roadwork-authentication');
//
// describe('routeGenerator getRouteGenerator', () => {
//     let server, roadworkAuthentication, hapiAdapter, routeGenerator, routeGeneratorWithoutAuthentication;
//
//     before((done) => {
//         server = require('../helpers/server-hapi').init();
//         roadworkAuthentication = new RoadworkAuthentication(server, {});
//         hapiAdapter = new HapiAdapter(server);
//         routeGenerator = new RouteGenerator(hapiAdapter, roadworkAuthentication);
//         routeGeneratorWithoutAuthentication = new RouteGenerator(hapiAdapter, null);
//
//         done();
//     });
//
//     it('should return the routeGenerator', (done) => {
//         expect(routeGenerator.getRouteGenerator()).;
//         const scope = [ 'admin' ];
//         const result = routeGenerator.processRoles(null, scope, {});
//
//         expect(result.config).to.exist();
//         expect(result.config.auth).to.exist();
//         expect(result.config.auth.strategy).to.exist();
//         expect(result.config.auth.scope).to.exist();
//
//         expect(result.config.auth.strategy).to.equal(roadworkAuthentication.strategyName);
//         expect(result.config.auth.scope).to.equal(scope);
//
//         done();
//     });
// });