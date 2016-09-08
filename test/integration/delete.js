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
const Api = require('../..')(server);

describe('GET /<model> collection', () => {
    before((done) => {
        Api.generate(User);

        done();
    });

    it('should register the DELETE /<model>/{id} call in the hapi framework', (done) => {
        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName) + '/{id}';

        expect(routes).to.include({ method: 'delete', path: routeName });

        done();
    });

    it('should not register the DELETE /<model>/<id> call if isEnabled = false', (done) => {
        const server = require('../helpers/server-hapi').init();
        const Api = require('../..')(server);
        Api.generate(User, { routes: { delete: { isEnabled: false } } });

        var routes = server.table()[0].table;
        const routeName =  '/' + pluralize(User.forge().tableName) + '/{id}';

        expect(routes).to.not.include({ method: 'delete', path: routeName });

        done();
    });

    it('should call the delete method in Model.js when we request this route and should return our result', (done) => {
        const models = Api.getModels();

        // Spy on the mock model
        var deleteSpy = sinon.spy(models[0], 'delete');

        // Perform our normal routine
        const routeName =  '/' + pluralize(User.forge().tableName) + '/1';
        server.start((err) => {
            expect(err).to.not.exist();

            // Note: The calls will fail since we have no connection to the database!
            //       We just want to check if the 'delete' function gets called
            server.inject({ method: 'DELETE', url: routeName }, (res) => {
                // Now check if we called the method fetchAll
                deleteSpy.restore();
                sinon.assert.calledOnce(deleteSpy);
                sinon.assert.calledWith(deleteSpy, "1"); // expect that we call findOneById with id: 1 (see route)

                done();
            });
        });
    });
});