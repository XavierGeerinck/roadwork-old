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
const accessScopesEnum = require(process.cwd() + '/src/enums/accessScopes');

const Boom = require('boom');

describe('routeGenerator getAccessScope', () => {
    let server, roadworkAuthentication, hapiAdapter, routeGenerator;


    before((done) => {
        server = require('../helpers/server-hapi').init();
        roadworkAuthentication = new RoadworkAuthentication(server, {});
        hapiAdapter = new HapiAdapter(server);
        routeGenerator = new RouteGenerator(hapiAdapter, roadworkAuthentication);

        done();
    });

    it('should return ALL_ACCESS when no userscope and no rolesAllowed are passed', (done) => {
        let result = routeGenerator.getAccessScope(null, null);
        expect(result).to.equal(accessScopesEnum.ALL_ACCESS);

        done();
    });

    it('should return ALL_ACCESS if no rolesAllowed were specified', (done) => {
        let result = routeGenerator.getAccessScope('user', null);
        expect(result).to.equal(accessScopesEnum.ALL_ACCESS);

        done();
    });

    it('should return ALL_ACCESS if the userscope is a string that is in rolesAllowed', (done) => {
        let result = routeGenerator.getAccessScope('user', [ 'user', 'admin' ]);
        expect(result).to.equal(accessScopesEnum.ALL_ACCESS);

        done();
    });

    it('should return OWNER_ACCESS if the rolesAllowed is set to $owner', (done) => {
        let result = routeGenerator.getAccessScope('user', [ '$owner', 'admin' ]);
        expect(result).to.equal(accessScopesEnum.OWNER_ACCESS);

        done();
    });

    it('should return OWNER_ACCESS if userScope is an array and rolesAllowed has $owner in it', (done) => {
        let result = routeGenerator.getAccessScope([ 'user' ], [ '$owner', 'admin' ]);
        expect(result).to.equal(accessScopesEnum.OWNER_ACCESS);

        done();
    });

    it('should return ALL_ACCESS if the userScope is an array that has a scope in it that appears in the rolesAllowed array', (done) => {
        let result = routeGenerator.getAccessScope([ 'user' ], [ 'user', '$owner', 'admin' ]);
        expect(result).to.equal(accessScopesEnum.ALL_ACCESS);

        done();
    });

    it('should return NO_ACCESS if the userScope (array) is not in rolesAllowed', (done) => {
        let result = routeGenerator.getAccessScope([ 'user' ], [ 'admin' ]);
        expect(result).to.equal(accessScopesEnum.NO_ACCESS);

        done();
    });

    it('should return NO_ACCESS if the userScope (string) is not in rolesAllowed', (done) => {
        let result = routeGenerator.getAccessScope('user', [ 'admin' ]);
        expect(result).to.equal(accessScopesEnum.NO_ACCESS);

        done();
    });

    it('should return NO_ACCESS if rolesAllowed is empty', (done) => {
        let result = routeGenerator.getAccessScope('user', [ ]);
        expect(result).to.equal(accessScopesEnum.NO_ACCESS);

        done();
    });

    it('should return OWNER_ACCESS if no user scope, but $owner is allowed', (done) => {
        let result = routeGenerator.getAccessScope("", [ '$owner' ]);
        expect(result).to.equal(accessScopesEnum.OWNER_ACCESS);

        done();
    });
});