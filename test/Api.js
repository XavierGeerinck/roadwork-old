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
const server = require('./helpers/server-hapi').init();


describe('Module', () => {
    before((done) => {
        done();
    });

    it('should return an error if no server object was passed', (done) => {
        try {

            const Api = require('..')();
        } catch (err) {
            expect(err.message).to.equal('No http engine given!');
        }

        done();
    });

    it('should return the server object on getServer', (done) => {
        const Api = require('..')(server);
        expect(Api.getServer().version).to.equal(server.version);

        done();
    });

    it ('should return an error if no model was passed to generate', (done) => {
        const Api = require('..')(server);

        try {
            Api.generate();
        } catch (err) {
            expect(err.message).to.equal('Invalid Base Model Specified');
        }

        done();
    });

    it('should return an error on an incorrect options scheme', (done) => {
        const Api = require('..')(server);

        try {
            Api.generate(User, { something: 'wrong' });
        } catch (err) {
            expect(err.message).to.equal('ValidationError: "something" is not allowed');
        }

        done();
    });
});