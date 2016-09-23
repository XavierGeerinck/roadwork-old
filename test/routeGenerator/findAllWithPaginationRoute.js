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

describe('routeGenerator /findAllWithPagination', () => {
    let server, roadworkAuthentication, hapiAdapter, routeGenerator, routeGeneratorWithoutAuthentication;

    const mockModel = {
        baseRoute: 'mocks',
        findAllWithPagination: function (payload) {
            return 'findAllWithPagination_called';
        },
        findAllByUserIdWithPagination: function (authCredentialsId) {
            return `findAllWithPaginationByUserId_called_with_${authCredentialsId}`;
        }
    };

    const defaultRoute = `/${mockModel.baseRoute}/pagination/{offset}`;

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
            server.route(routeGenerator.generateFindAllWithPagination(mockModel, null));

            const routes = server.table()[0].table;

            expect(routes).to.include({ method: 'get' });
            expect(routes).to.include({ path: defaultRoute });

            done();
        });

        it('should return the correct routeoptions', (done) => {
            var options = routeGenerator.generateFindAllWithPagination(mockModel, null); // model, rolesAllowed

            expect(options.method).to.equal('GET');
            expect(options.path).to.equal(defaultRoute);
            expect(options.handler).to.exist();

            done();
        });
    });

    describe('handler', () => {
        let request = {
            query: {
                limit: 5
            },
            params: {
                offset: 0
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
            let options = routeGenerator.generateFindAllWithPagination(mockModel, [ ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should return unauthorized when we have NO_ACCESS', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, [ 'admin' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should call model.findAllWithPaginationByUserId when we have OWNER_ACCESS', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, [ '$owner' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(`findAllWithPaginationByUserId_called_with_${request.auth.credentials.get('id')}`);
                done();
            });
        });

        it('should call model.findAllWithPagination when we have ALL_ACCESS', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, [ 'user' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('findAllWithPagination_called');
                done();
            });
        });

        it('should call model.findAllWithPagination when we have authentication registered and rolesAllowed is null', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('findAllWithPagination_called');
                done();
            });
        });

        it('should call model.findAllWithPagination when we have no authentication registered and rolesAllowed is null', (done) => {
            let options = routeGeneratorWithoutAuthentication.generateFindAllWithPagination(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('findAllWithPagination_called');
                done();
            });
        });
    });
});