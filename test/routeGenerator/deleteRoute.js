"use strict";

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

const HapiAdapter = require(process.cwd() + '/src/adapters/hapi');
const RouteGenerator = require(process.cwd() + '/src/RouteGenerator');
const RoadworkAuthentication = require('roadwork-authentication');

const Boom = require('boom');

describe('routeGenerator /delete', () => {
    let server, roadworkAuthentication, hapiAdapter, routeGenerator, routeGeneratorWithoutAuthentication;

    const mockModel = {
        baseRoute: 'mocks',
        destroyById: function (payload) {
            return 'destroy_called';
        },
        destroyByIdAndUserId: function (id, userId) {
            return `destroyByIdAndUserId_called_with_id_${id}_and_userId_${userId}`;
        }
    };

    const defaultRoute = `/${mockModel.baseRoute}/{id}`;

    before((done) => {
        server = require('../helpers/server-hapi').init();
        roadworkAuthentication = new RoadworkAuthentication(server, {});
        hapiAdapter = new HapiAdapter(server);
        routeGenerator = new RouteGenerator(hapiAdapter, roadworkAuthentication);
        routeGeneratorWithoutAuthentication = new RouteGenerator(hapiAdapter, null);

        done();
    });

    describe('basics', () => {
        it('should correctly register the route in the hapi framework', (done) => {
            server.route(routeGenerator.generateDelete(mockModel, null));

            const routes = server.table()[0].table;

            expect(routes).to.include({ method: 'delete' });
            expect(routes).to.include({ path: defaultRoute });

            done();
        });

        it('should return the correct routeoptions', (done) => {
            var options = routeGenerator.generateDelete(mockModel, null); // model, rolesAllowed

            expect(options.method).to.equal('DELETE');
            expect(options.path).to.equal(defaultRoute);
            expect(options.handler).to.exist();

            done();
        });

        it('should have authentication in the routeoptions if authentication is enabled', (done) => {
            var options = routeGenerator.generateCount(mockModel, [ 'user' ]); // model, rolesAllowed

            expect(options.config).to.exist();
            expect(options.config.auth).to.exist();
            expect(options.config.auth.strategy).to.equal(roadworkAuthentication.strategyName);

            done();
        });

        it('should not have authentication in the routeoptions if authentication is not enabled', (done) => {
            var options = routeGeneratorWithoutAuthentication.generateCount(mockModel, [ 'user' ]); // model, rolesAllowed

            expect(options.config).to.not.exist();
            //expect(options.config.auth).to.not.exist();

            done();
        });
    });

    describe('handler', () => {
        let request = {
            params: {
                id: 666
            },
            auth: {
                credentials: {
                    get: function (key) {
                        switch (key) {
                            case 'id':
                                return 25;
                                break;
                            case 'scope':
                                return [ 'user', '$owner' ];
                            default:
                                return `not_defined_key:_${key}`;
                        }
                    }
                }
            }
        };

        it('should return unauthorized when there are no roles passed', (done) => {
            let options = routeGenerator.generateDelete(mockModel, [ ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should return unauthorized when we have NO_ACCESS', (done) => {
            let options = routeGenerator.generateDelete(mockModel, [ 'admin' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should call model.deleteByIdAndUserId when we have OWNER_ACCESS', (done) => {
            let options = routeGenerator.generateDelete(mockModel, [ '$owner' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(`destroyByIdAndUserId_called_with_id_${request.params.id}_and_userId_${request.auth.credentials.get('id')}`);
                done();
            });
        });

        it('should call model.delete when we have ALL_ACCESS', (done) => {
            let options = routeGenerator.generateDelete(mockModel, [ 'user' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('destroy_called');
                done();
            });
        });

        it('should call model.delete when we have authentication registered and rolesAllowed is null', (done) => {
            let options = routeGenerator.generateDelete(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('destroy_called');
                done();
            });
        });

        it('should call model.delete when we have no authentication registered and rolesAllowed is null', (done) => {
            let options = routeGeneratorWithoutAuthentication.generateDelete(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('destroy_called');
                done();
            });
        });
    });
});