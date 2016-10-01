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

    const pagination = {
        offset: 1,
        limit: 10,
        rowCount: 3,
        pageCount: 1
    };

    const mockModel = {
        baseRoute: 'mocks',
        findAllWithPagination: function (payload) {
            return Promise.resolve({
                toJSON: function () {
                    return [
                        `findAllWithPagination_called`
                    ];
                },
                pagination: pagination
            });
        },
        findAllByUserIdWithPagination: function (authCredentialsId) {
            return Promise.resolve({
                toJSON: function () {
                    return [
                        `findAllWithPaginationByUserId_called_with_${authCredentialsId}`
                    ];
                },
                pagination: pagination
            });
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

        it('should have authentication in the routeoptions if authentication is enabled', (done) => {
            var options = routeGenerator.generateFindAllWithPagination(mockModel, { allowedRoles: [ 'user' ] }); // model, rolesAllowed

            expect(options.config).to.exist();
            expect(options.config.auth).to.exist();
            expect(options.config.auth.strategy).to.equal(roadworkAuthentication.strategyName);

            done();
        });

        it('should not have authentication in the routeoptions if authentication is not enabled', (done) => {
            var options = routeGeneratorWithoutAuthentication.generateFindAllWithPagination(mockModel, { allowedRoles: [ 'user' ] }); // model, rolesAllowed

            expect(options.config.auth).to.not.exist();

            done();
        });

        it('should change the basePath if we configured it', (done) => {
            const basePath = '/newPath';
            const routeGeneratorNew = new RouteGenerator(hapiAdapter, null, { basePath: basePath });
            const result = routeGeneratorNew.generateFindAllWithPagination(mockModel, null);

            expect(result.path).to.equal(`${basePath}${defaultRoute}`);

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
            let options = routeGenerator.generateFindAllWithPagination(mockModel, { allowedRoles: [ ] }); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should return unauthorized when we have NO_ACCESS', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, { allowedRoles: [ 'admin' ] }); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should call model.findAllWithPaginationByUserId when we have OWNER_ACCESS', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, { allowedRoles: [ '$owner' ] }); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result.results).to.exist();
                expect(result.pagination).to.exist();
                expect(result.results).to.be.an.array();
                expect(result.results[0]).to.equal(`findAllWithPaginationByUserId_called_with_${request.auth.credentials.get('id')}`);
                expect(result.pagination).to.equal(pagination);
                done();
            });
        });

        it('should call model.findAllWithPagination when we have ALL_ACCESS', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, { allowedRoles: [ 'user' ] }); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result.results).to.exist();
                expect(result.pagination).to.exist();
                expect(result.results).to.be.an.array();
                expect(result.results[0]).to.equal('findAllWithPagination_called');
                expect(result.pagination).to.equal(pagination);
                done();
            });
        });

        it('should call model.findAllWithPagination when we have authentication registered and rolesAllowed is null', (done) => {
            let options = routeGenerator.generateFindAllWithPagination(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result.results).to.exist();
                expect(result.pagination).to.exist();
                expect(result.results).to.be.an.array();
                expect(result.results[0]).to.equal('findAllWithPagination_called');
                expect(result.pagination).to.equal(pagination);
                done();
            });
        });

        it('should call model.findAllWithPagination when we have no authentication registered and rolesAllowed is null', (done) => {
            let options = routeGeneratorWithoutAuthentication.generateFindAllWithPagination(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result.results).to.exist();
                expect(result.pagination).to.exist();
                expect(result.results).to.be.an.array();
                expect(result.results[0]).to.equal('findAllWithPagination_called');
                expect(result.pagination).to.equal(pagination);
                done();
            });
        });
    });
});