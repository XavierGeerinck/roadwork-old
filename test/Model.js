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
const afterEach = lab.afterEach;
const expect = Code.expect;

const ORM = require('./helpers/orm-bookshelf');
const User = ORM.Models.User;
const UserSession = ORM.Models.UserSession;
const Model = require(process.cwd() + '/src/Model.js');

describe('Model', () => {
    let server, userModel, userSessionModel, whereStub, whereStub2;

    beforeEach((done) => {
        server = require('./helpers/server-hapi').init();

        userModel = new Model(User);
        userSessionModel = new Model(UserSession);

        whereStub = sinon.stub(userModel.baseModel, 'where', (obj) => {
            return {
                fetchAll: function () {
                    return Promise.resolve(`fetchAll_called_with_${JSON.stringify(obj)}`);
                },
                fetchPage: function () {
                    return Promise.resolve(`fetchPage_called_with_${JSON.stringify(obj)}`);
                },
                fetch: function () {
                    return Promise.resolve(`fetch_called_with_${JSON.stringify(obj)}`);
                },
                count:  function () {
                    return Promise.resolve(`count_called_with_${JSON.stringify(obj)}`);
                },
                save: function (data) {
                    return Promise.resolve(`save_called_with_${JSON.stringify(obj)}_and_data_${JSON.stringify(data)}`);
                },
                destroy: function () {
                    return Promise.resolve(`destroy_called_with_${JSON.stringify(obj)}`);
                }
            }
        });

        whereStub2 = sinon.stub(userSessionModel.baseModel, 'where', (obj) => {
            return {
                fetchAll: function () {
                    return Promise.resolve(`fetchAll_called_with_${JSON.stringify(obj)}`);
                },
                fetchPage: function () {
                    return Promise.resolve(`fetchPage_called_with_${JSON.stringify(obj)}`);
                },
                fetch: function () {
                    return Promise.resolve(`fetch_called_with_${JSON.stringify(obj)}`);
                },
                count:  function () {
                    return Promise.resolve(`count_called_with_${JSON.stringify(obj)}`);
                }
            }
        });

        done();
    });

    afterEach((done) => {
        whereStub.restore();
        whereStub2.restore();

        done();
    });

    describe('findAllByUserId', () => {
        it('should call baseModel.where(\'id\', userId) if the table is the userTable', (done) => {
            userModel.findAllByUserId(666)
            .then((result) => {
                expect(result).to.equal('fetchAll_called_with_{"id":666}');
                done();
            });
        });

        it('should call baseModel.where(\'user_id\', userId) if the table is NOT the userTable', (done) => {
            userSessionModel.findAllByUserId(666)
            .then((result) => {
                expect(result).to.equal('fetchAll_called_with_{"user_id":666}');
                done();
            });
        });
    });

    describe('findAll', () => {
        it('should call baseModel.where(\'id\', userId) if the table is the userTable', (done) => {
            let fetchAllStub = sinon.stub(userModel.baseModel, 'fetchAll', () => {
                return Promise.resolve('fetchAll_called');
            });

            userModel.findAll()
            .then((result) => {
                expect(result).to.equal('fetchAll_called');
                fetchAllStub.restore();
                done();
            });
        });
    });

    describe('findAllWithPagination', () => {
        it('should call fetchPage', (done) => {
            let stub = sinon.stub(userModel.baseModel, 'fetchPage', (obj) => {
                return Promise.resolve(`fetchPage_called_with_{"offset":${obj.offset},"limit":${obj.limit}}`);
            });

            userModel.findAllWithPagination(10, 999)
            .then((result) => {
                expect(result).to.equal('fetchPage_called_with_{"offset":10,"limit":999}');

                stub.restore();
                done();
            });
        });
    });

    describe('findAllByUserIdWithPagination', () => {
        it('should call where(user_id) and fetchPage', (done) => {
            userModel.findAllByUserIdWithPagination(666, 10, 999)
            .then((result) => {
                expect(result).to.equal('fetchPage_called_with_{"user_id":666}');
                done();
            });
        });
    });

    describe('findOneById', () => {
        it('should call where(id) and fetch', (done) => {
            userModel.findOneById(693)
            .then((result) => {
                expect(result).to.equal('fetch_called_with_{"id":693}');
                done();
            });
        });

        it('should call where(id, user_id) and fetch', (done) => {
            userModel.findOneByIdAndUserId(693, 666)
            .then((result) => {
                expect(result).to.equal('fetch_called_with_{"id":693,"user_id":666}');
                done();
            });
        });
    });

    describe('createObject', () => {
        it('should call forge(data) and save', (done) => {
            const stub = sinon.stub(userModel.baseModel, 'forge', (data) => {
                return {
                    save: function () {
                        return Promise.resolve(`save_called_with_${JSON.stringify(data)}`);
                    }
                };
            });

            userModel.createObject({ 'id': 666, 'email': "satan@devil.org" })
            .then((result) => {
                expect(result).to.equal('save_called_with_{"id":666,"email":"satan@devil.org"}');
                stub.restore();
                done();
            });
        });
    });

    describe('update', () => {
        it('should call where(id) and save(data with patch) if Model.updateById', (done) => {
            userModel.updateById(666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result).to.equal('save_called_with_{"id":666}_and_data_{"email":"satan@devil.org","tail":true,"id":666}');
                done();
            });
        });

        it('should call where(id) and save(data with patch) if Model.updateByIdAndUserId', (done) => {
            userModel.updateByIdAndUserId(693, 666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result).to.equal('save_called_with_{"id":693,"user_id":666}_and_data_{"email":"satan@devil.org","tail":true,"id":693}');
                done();
            });
        });
    });

    describe('delete', () => {
        it('should call where(id) and destroy() if Model.destroyById', (done) => {
            userModel.destroyById(666)
            .then((result) => {
                expect(result).to.equal('destroy_called_with_{"id":666}');
                done();
            });
        });

        it('should call where(id) and destroy() if Model.destroyByIdAndUserId', (done) => {
            userModel.destroyByIdAndUserId(693, 666)
            .then((result) => {
                expect(result).to.equal('destroy_called_with_{"id":693,"user_id":666}');
                done();
            });
        });
    });

    describe('Count', () => {
        before((done) => {
            done();
        });

        it('should return the count as an object { count: \<count\> } for count', (done) => {
            const stub = sinon.stub(userModel.baseModel, 'count', function () {
                return Promise.resolve(5);
            });

            userModel.count()
            .then(function (result) {
                stub.restore();
                expect(result).to.be.an.object();
                expect(result.count).to.equal(5);
                done();
            });
        });

        it('should return the count as an object { count: \<count\> } for countByUserId', (done) => {
            userModel.countByUserId(666)
            .then(function (result) {
                expect(result.count).to.equal('count_called_with_{"user_id":666}');

                done();
            });
        });
    });
});