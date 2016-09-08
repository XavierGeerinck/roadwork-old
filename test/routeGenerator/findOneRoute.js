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

const RouteGenerator = require(process.cwd() + '/src/adapters/route-generator-hapi');

describe('routeGenerator /findOne', () => {
    it('should register the POST /<model> call in the hapi framework', (done) => {
        const server = require('../helpers/server-hapi').init();
        const RoadworkAuthentication = require('roadwork-authentication');
        const roadworkAuthentication = new RoadworkAuthentication(server, {});

        const mockModel = {
            getBaseRouteName: function () {
                return 'mocks'
            },

            createObject: function (payload) {
            }
        };

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.createFindOneRoute(mockModel, null); // model, rolesAllowed

        var routes = server.table()[0].table;
        const routeName =  '/' + mockModel.getBaseRouteName() + '/{id}';

        expect(routes).to.include({ method: 'get', path: routeName });

        done();
    });
});