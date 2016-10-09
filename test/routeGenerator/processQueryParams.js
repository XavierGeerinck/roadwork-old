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

describe('routeGenerator processQueryParams', () => {
    let server, roadworkAuthentication, hapiAdapter, routeGenerator;


    before((done) => {
        server = require('../helpers/server-hapi').init();
        roadworkAuthentication = new RoadworkAuthentication(server, {});
        hapiAdapter = new HapiAdapter(server);
        routeGenerator = new RouteGenerator(hapiAdapter, roadworkAuthentication);

        done();
    });

    it('should return a stripped object without the specified keys', (done) => {
        let result = routeGenerator.processQueryParams({ access_token: 'test123', token: 'awdawd', test: 'dawd' });
        expect(result).exist();
        expect(result.access_token).to.not.exist();
        expect(result.token).to.not.exist();
        expect(result.test).to.exist();

        done();
    });
});