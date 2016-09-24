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

const Roadwork = require('..');

describe('Module', () => {
    let server, bookshelf, roadwork;

    beforeEach((done) => {
        server = require('./helpers/server-hapi').init();
        bookshelfHelper = require('./helpers/orm-bookshelf');
        roadwork = new Roadwork(server, bookshelfHelper.engine);

        done();
    });

    it('should return an error if no server object was passed', (done) => {
        try {
            let Api = new Roadwork();
        } catch (err) {
            expect(err.message).to.equal('No http engine given!');
        }

        done();
    });

    it('should throw an error when no database configuration was passed', (done) => {
        try {
            let Api = new Roadwork(server);
        } catch (err) {
            expect(err.message).to.equal('database connection not started');
        }

        done();
    });

    it('should return the server object on getServer', (done) => {
        expect(roadwork.getServer().version).to.equal(server.version);

        done();
    });

    it('should return the routeGenerator object on getRouteGenerator', (done) => {
        expect(roadwork.getRouteGenerator()).to.exist();

        done();
    });

    it('should return the models array on getModels', (done) => {
        expect(roadwork.getModels()).to.exist();
        expect(roadwork.getModels()).to.be.a.array();

        done();
    });

    it ('should return an error if no model was passed to generate', (done) => {
        try {
            roadwork.generate();
        } catch (err) {
            expect(err.message).to.equal('Invalid Base Model Specified');
        }

        done();
    });

    it('should return an error on an incorrect options scheme', (done) => {
        let User = bookshelfHelper.Models.User;

        try {
            roadwork.generate(User, { something: 'wrong' });
        } catch (err) {
            expect(err.message).to.equal('ValidationError: "something" is not allowed');
        }

        done();
    });

    it('should use a authentication plugin if one is added through addAuthentication', (done) => {
        const roadworkAuthentication = require('roadwork-authentication');
        const checkRequiredSchemeStub = sinon.stub(roadworkAuthentication.prototype, 'checkRequiredScheme', function () { return Promise.resolve(); });

        roadwork.addAuthentication(roadworkAuthentication, {})
        .then(() => {
            checkRequiredSchemeStub.restore();
            sinon.assert.calledWith(checkRequiredSchemeStub);

            done();
        });
    });

    // it('should still work with bearer authentication if the plugin is already registered', (done) => {
    //     const roadworkAuthentication = require('roadwork-authentication');
    //     const stub = sinon.stub(roadworkAuthentication.prototype, 'init', function () { return Promise.resolve(); });
    //
    //     roadwork.addAuthentication(require('roadwork-authentication'))
    //     .then(() => {
    //         return roadwork.addAuthentication(require('roadwork-authentication'))
    //     })
    //     .then(() => {
    //         stub.restore();
    //         sinon.assert.calledWith(stub);
    //
    //         done();
    //     })
    //     .catch((err) => {
    //         console.error(err);
    //     });
    // });

    it('should throw an error when adding authentication if no library plugin was specified', (done) => {
        roadwork.addAuthentication(null, {})
        .catch((err) => {
            expect(err.message).to.equal("Missing the authenticationLibrary");
            done();
        });
    });

    it('should not register the findAll route if it is not enabled in the config', (done) => {
        let User = bookshelfHelper.Models.User;

        roadwork.generate(User, { routes: {
            findAll: {
                isEnabled: false
            }
        }});

        const tableNamePlural = pluralize(User.forge().tableName);
        const route = `/${tableNamePlural}`;
        const routes = roadwork.getServer().table()[0].table;

        expect(routes).to.not.include({ method: 'get', path: route });

        done();
    });

    it('should not register the findOne route if it is not enabled in the config', (done) => {
        let User = bookshelfHelper.Models.User;

        roadwork.generate(User, { routes: {
            findOne: {
                isEnabled: false
            }
        }});

        const tableNamePlural = pluralize(User.forge().tableName);
        const route = `/${tableNamePlural}/{id}`;
        const routes = roadwork.getServer().table()[0].table;

        expect(routes).to.not.include({ method: 'get', path: route });

        done();
    });

    it('should not register the count route if it is not enabled in the config', (done) => {
        let User = bookshelfHelper.Models.User;

        roadwork.generate(User, { routes: {
            count: {
                isEnabled: false
            }
        }});

        const tableNamePlural = pluralize(User.forge().tableName);
        const route = `/${tableNamePlural}/count`;
        const routes = roadwork.getServer().table()[0].table;

        expect(routes).to.not.include({ method: 'get', path: route });

        done();
    });

    it('should not register the findAllWithPagination route if it is not enabled in the config', (done) => {
        let User = bookshelfHelper.Models.User;

        roadwork.generate(User, { routes: {
            findAllWithPagination: {
                isEnabled: false
            }
        }});

        const tableNamePlural = pluralize(User.forge().tableName);
        const route = `/${tableNamePlural}/pagination/{offset}`;
        const routes = roadwork.getServer().table()[0].table;

        expect(routes).to.not.include({ method: 'get', path: route });

        done();
    });

    it('should not register the create route if it is not enabled in the config', (done) => {
        let User = bookshelfHelper.Models.User;

        roadwork.generate(User, { routes: {
            create: {
                isEnabled: false
            }
        }});

        const tableNamePlural = pluralize(User.forge().tableName);
        const route = `/${tableNamePlural}`;
        const routes = roadwork.getServer().table()[0].table;

        expect(routes).to.not.include({ method: 'post', path: route });

        done();
    });

    it('should not register the update route if it is not enabled in the config', (done) => {
        let User = bookshelfHelper.Models.User;

        roadwork.generate(User, { routes: {
            update: {
                isEnabled: false
            }
        }});

        const tableNamePlural = pluralize(User.forge().tableName);
        const route = `/${tableNamePlural}`;
        const routes = roadwork.getServer().table()[0].table;

        expect(routes).to.not.include({ method: 'put', path: route });

        done();
    });

    it('should not register the destroy route if it is not enabled in the config', (done) => {
        let User = bookshelfHelper.Models.User;

        roadwork.generate(User, { routes: {
            delete: {
                isEnabled: false
            }
        }});

        const tableNamePlural = pluralize(User.forge().tableName);
        const route = `/${tableNamePlural}`;
        const routes = roadwork.getServer().table()[0].table;

        expect(routes).to.not.include({ method: 'delete', path: route });

        done();
    });
});