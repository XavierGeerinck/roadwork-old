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
// const ORM = require('./../helpers/orm-bookshelf');
// const User = ORM.Models.User;
//
// describe('GET /<model> collection', () => {
//     it('should register the POST /<model> call in the hapi framework', (done) => {
//         const server = require('../helpers/server-hapi').init();
//         const Api = require('../..')(server);
//         Api.generate(User);
//
//         var routes = server.table()[0].table;
//         const routeName =  '/' + pluralize(User.forge().tableName);
//
//         expect(routes).to.include({ method: 'post', path: routeName });
//
//         done();
//     });
//
//     it('should not register the POST /<model> call if isEnabled = false', (done) => {
//         const server = require('../helpers/server-hapi').init();
//         const Api = require('../..')(server);
//         Api.generate(User, { routes: { create: { isEnabled: false } } });
//
//         var routes = server.table()[0].table;
//         const routeName =  '/' + pluralize(User.forge().tableName);
//
//         expect(routes).to.not.include({ method: 'post', path: routeName });
//
//         done();
//     });
//
//     it('should call the create method in Model.js when we request this route and should return our result', (done) => {
//         const server = require('../helpers/server-hapi').init();
//         const Api = require('../..')(server);
//         Api.generate(User);
//
//         const models = Api.getModels();
//
//         // Spy on the mock model
//         var createSpy = sinon.spy(models[0], 'createObject');
//
//         // Perform our normal routine
//         const routeName =  '/' + pluralize(User.forge().tableName);
//         server.start((err) => {
//             expect(err).to.not.exist();
//
//             // Note: The calls will fail since we have no connection to the database!
//             //       We just want to check if the 'createObject' function gets called
//             let payload = {
//                 id: '1',
//                 first_name: 'Xavier',
//                 last_name: 'Geerinck'
//             };
//
//             server.inject({ method: 'POST', url: routeName, payload: payload }, (res) => {
//                 createSpy.restore();
//                 sinon.assert.calledOnce(createSpy);
//                 expect(createSpy.args[0][0]).to.equal(payload); // First parameter is the data
//
//                 done();
//             });
//         });
//     });
// });