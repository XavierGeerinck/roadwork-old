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

describe('routeGenerator /create', () => {
    let server, roadworkAuthentication, hapiAdapter, routeGenerator, routeGeneratorWithoutAuthentication;

    const mockModel = {
        baseRoute: 'mocks',
        createObject: function (payload) {
            return 'create_called';
        }
    };

    const defaultRoute = `/${mockModel.baseRoute}`;

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
            server.route(routeGenerator.generateCreate(mockModel, null));

            const routes = server.table()[0].table;

            expect(routes).to.include({ method: 'post' });
            expect(routes).to.include({ path: defaultRoute });

            done();
        });

        it('should return the correct routeoptions', (done) => {
            var options = routeGenerator.generateCreate(mockModel, null); // model, rolesAllowed

            expect(options.method).to.equal('POST');
            expect(options.path).to.equal(defaultRoute);
            expect(options.handler).to.exist();

            done();
        });
    });

    describe('handler', () => {
        let request = {
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
            let options = routeGenerator.generateCreate(mockModel, [ ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should return unauthorized when we have NO_ACCESS', (done) => {
            let options = routeGenerator.generateCreate(mockModel, [ 'admin' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(Boom.unauthorized());
                done();
            });
        });

        it('should call model.createByUserId when we have OWNER_ACCESS', (done) => {
            let options = routeGenerator.generateCreate(mockModel, [ '$owner' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal(`create_called`);
                done();
            });
        });

        it('should call model.create when we have ALL_ACCESS', (done) => {
            let options = routeGenerator.generateCreate(mockModel, [ 'user' ]); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('create_called');
                done();
            });
        });

        it('should call model.create when we have authentication registered and rolesAllowed is null', (done) => {
            let options = routeGenerator.generateCreate(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('create_called');
                done();
            });
        });

        it('should call model.count when we have no authentication registered and rolesAllowed is null', (done) => {
            let options = routeGeneratorWithoutAuthentication.generateCreate(mockModel, null); // model, rolesAllowed

            options.handler(request, (result) => {
                expect(result).to.equal('create_called');
                done();
            });
        });
    });
});