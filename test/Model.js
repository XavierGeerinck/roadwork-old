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
const UserSession = ORM.Models.UserSession;


describe('Model', () => {
    let server, userModel, userSessionModel;

    beforeEach((done) => {
        server = require('./helpers/server-hapi').init();

        const Model = require(process.cwd() + '/src/Model.js');
        userModel = new Model(User);
        userSessionModel = new Model(UserSession);

        done();
    });

    describe('findAllByUserId', () => {
        it('should call baseModel.where(\'id\', userId) if the table is the userTable', (done) => {
            let stub = sinon.stub(userModel.baseModel, 'where', (column, value) => {
                return {
                    fetchAll: function () {
                        return Promise.resolve(column + '_' + value);
                    }
                }
            });

            userModel.findAllByUserId(666)
                .then((result) => {
                    expect(result).to.equal('id_666');

                    stub.restore();
                    done();
                });
        });

        it('should call baseModel.where(\'user_id\', userId) if the table is NOT the userTable', (done) => {
            let stub = sinon.stub(userSessionModel.baseModel, 'where', (column, value) => {
                return {
                    fetchAll: function () {
                        return Promise.resolve(column + '_' + value);
                    }
                }
            });

            userSessionModel.findAllByUserId(666)
                .then((result) => {
                    expect(result).to.equal('user_id_666');

                    stub.restore();
                    done();
                });
        });
    });

    describe('findAll', () => {
        it('should call baseModel.where(\'id\', userId) if the table is the userTable', (done) => {
            let stub = sinon.stub(userModel.baseModel, 'fetchAll', () => {
                return Promise.resolve('fetchAll_called');
            });

            userModel.findAll()
            .then((result) => {
                expect(result).to.equal('fetchAll_called');

                stub.restore();
                done();
            });
        });
    });

    // describe('findAllWithPagination', () => {
    //     it('should call fetchPage', (done) => {
    //         let stub = sinon.stub(userModel.baseModel, 'fetchPage', (obj) => {
    //             return Promise.resolve(`fetchPage_called_with_offset_${obj.offset}_limit_${obj.limit}`);
    //         });
    //
    //         userModel.findAllWithPagination(10, 999)
    //         .then((result) => {
    //             expect(result).to.equal('fetchPage_called_with_offset_10_limit_999');
    //
    //             stub.restore();
    //             done();
    //         });
    //     });
    // });
    //
    // describe('findAllByUserIdWithPagination', () => {
    //     it('should call where(user_id) and fetchPage', (done) => {
    //         let stub = sinon.stub(userSessionModel.baseModel, 'where', (column, value) => {
    //             return {
    //                 fetchPage: function (obj) {
    //                     return Promise.resolve(`fetchPage_called_with_user_${value}_offset_${obj.offset}_limit_${obj.limit}`);
    //                 }
    //             }
    //         });
    //
    //         userModel.findAllByUserIdWithPagination(666, 10, 999)
    //         .then((result) => {
    //             expect(result).to.equal('fetchPage_called_with_offset_10_limit_999');
    //
    //             stub.restore();
    //             done();
    //         });
    //     });
    // });

    // describe('findOneById', () => {
    //     it('should call where(id) and fetch', (done) => {
    //         let stub = sinon.stub(userSessionModel.baseModel, 'where', (obj) => {
    //             return {
    //                 fetch: function () {
    //                     return Promise.resolve(`fetch_called_with_id_${obj.id}`);
    //                 }
    //             }
    //         });
    //
    //         userModel.findOneById(693)
    //         .then((result) => {
    //             expect(result).to.equal('fetch_called_with_id_693');
    //
    //             stub.restore();
    //             done();
    //         });
    //     });
    // });

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
            const stub = sinon.stub(userModel.baseModel, 'where', function () {
                return {
                    count:  function () {
                        return Promise.resolve(2);
                    }
                }
            });

            userModel.countByUserId()
            .then(function (result) {
                stub.restore();
                expect(result).to.be.an.object();
                expect(result.count).to.equal(2);
                done();
            });
        });
    });
});