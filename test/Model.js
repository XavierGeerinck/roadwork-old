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


describe('Model Count', () => {
    before((done) => {
        done();
    });

    it('should return the count as an object { count: \<count\> } for count', (done) => {
        let Model = require(process.cwd() + '/src/Model.js');
        let model = new Model(User);

        const stub = sinon.stub(model.baseModel, 'count', function () { return Promise.resolve(5); });

        model.count()
        .then(function (result) {
            stub.restore();
            expect(result).to.be.an.object();
            expect(result.count).to.equal(5);
            done();
        });
    });

    it('should return the count as an object { count: \<count\> } for countByUserId', (done) => {
        let Model = require(process.cwd() + '/src/Model.js');
        let model = new Model(User);

        const stub = sinon.stub(model.baseModel, 'where', function () {
            return {
                count:  function () {
                    return Promise.resolve(2);
                }
            }
        });

        model.countByUserId()
        .then(function (result) {
            stub.restore();
            expect(result).to.be.an.object();
            expect(result.count).to.equal(2);
            done();
        });
    });
});