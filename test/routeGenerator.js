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
const RouteGenerator = require('../src/adapters/route-generator-hapi');

describe('routeGenerator processRoles', () => {
    it('should correctly process the roles in rolesAllowed', (done) => {
        const server = require('./helpers/server-hapi').init();
        const RoadworkAuthentication = require('roadwork-authentication');
        const roadworkAuthentication = new RoadworkAuthentication(server, {});

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.addAuthentication(roadworkAuthentication)
        .then(() => {
            const scope = [ 'admin' ];
            const result = routeGenerator.processRoles(null, scope, {});

            expect(result.config).to.exist();
            expect(result.config.auth).to.exist();
            expect(result.config.auth.strategy).to.exist();
            expect(result.config.auth.scope).to.exist();

            expect(result.config.auth.strategy).to.equal(roadworkAuthentication.getStrategyName());
            expect(result.config.auth.scope).to.equal(scope);

            done();
        });
    });

    it('should allow nobody if only [] was passed', (done) => {
        const server = require('./helpers/server-hapi').init();
        const RoadworkAuthentication = require('roadwork-authentication');
        const roadworkAuthentication = new RoadworkAuthentication(server, {});

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.addAuthentication(roadworkAuthentication)
        .then(() => {
            const scope = [ '' ];
            const result = routeGenerator.processRoles(null, scope, {});

            expect(result.config).to.exist();
            expect(result.config.auth).to.exist();
            expect(result.config.auth.strategy).to.exist();
            expect(result.config.auth.scope).to.exist();

            expect(result.config.auth.strategy).to.equal(roadworkAuthentication.getStrategyName());
            expect(result.config.auth.scope).to.equal([ '' ]);

            done();
        });
    });

    it('should add default role user if only the $owner roles was passed', (done) => {
        const server = require('./helpers/server-hapi').init();
        const RoadworkAuthentication = require('roadwork-authentication');
        const roadworkAuthentication = new RoadworkAuthentication(server, {});

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.addAuthentication(roadworkAuthentication)
        .then(() => {
            const scope = [ '$owner' ];
            const result = routeGenerator.processRoles(null, scope, {});

            expect(result.config).to.exist();
            expect(result.config.auth).to.exist();
            expect(result.config.auth.strategy).to.exist();
            expect(result.config.auth.scope).to.exist();

            expect(result.config.auth.strategy).to.equal(roadworkAuthentication.getStrategyName());
            expect(result.config.auth.scope).to.equal([ 'user' ]);

            done();
        });
    });

    it('should filter out the $owner role', (done) => {
        const server = require('./helpers/server-hapi').init();
        const RoadworkAuthentication = require('roadwork-authentication');
        const roadworkAuthentication = new RoadworkAuthentication(server, {});

        const routeGenerator = new RouteGenerator(server);
        routeGenerator.addAuthentication(roadworkAuthentication)
        .then(() => {
            const scope = [ 'admin', '$owner' ];
            const result = routeGenerator.processRoles(null, scope, {});

            expect(result.config).to.exist();
            expect(result.config.auth).to.exist();
            expect(result.config.auth.strategy).to.exist();
            expect(result.config.auth.scope).to.exist();

            expect(result.config.auth.strategy).to.equal(roadworkAuthentication.getStrategyName());
            expect(result.config.auth.scope).to.equal(scope.filter(function (item) { return item != '$owner' }));

            done();
        });
    });

    it('should call the bearer authentication registration correctly', (done) => {
        const server = require('./helpers/server-hapi').init();
        const Api = require('..')(server);

        const roadworkAuthentication = require('roadwork-authentication');
        const stub = sinon.stub(roadworkAuthentication.prototype, 'checkRequiredScheme', function () { return Promise.resolve(); });

        const routeGenerator = Api.getRouteGenerator();
        var spy = sinon.spy(routeGenerator, 'addAuthentication');

        Api.addAuthentication(require('roadwork-authentication'), {})
        .then(() => {
            Api.generate(User, {
                routes: {
                    create: {
                        allowedRoles: [ 'admin' ]
                    }
                }
            });

            stub.restore();
            spy.restore();
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(stub);

            done();
        });
});
});