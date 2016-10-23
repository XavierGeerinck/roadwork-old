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
const Roadwork = require('..');

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
                },
                save: function (data) {
                    return Promise.resolve(`save_called_with_${JSON.stringify(obj)}_and_data_${JSON.stringify(data)}`);
                },
                destroy: function () {
                    return Promise.resolve(`destroy_called_with_${JSON.stringify(obj)}`);
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

    describe('General', () => {
        it('should change the basePath if there is a custom one provided', (done) => {
            let model = new Model(User);
            model.setBasePath('/testApi');

            expect(model.getBasePath()).to.equal('/testApi');
            expect(model.getFullRoute()).to.equal('/testApi/users');
            done();
        });

        it('should change the basePath if it is provided as option to a roadwork instance', (done) => {
            let roadwork2 = new Roadwork(server, ORM.engine, { basePath: '/test' });
            roadwork2.generate(User);

            expect(roadwork2.options.basePath).to.equal('/test');
            expect(roadwork2.models[0].getFullRoute()).to.equal('/test/users');

            const tableNamePlural = pluralize(User.forge().tableName);
            const route = `/test/${tableNamePlural}`;
            const routes = roadwork2.getServer().table()[0].table;

            expect(routes).to.include({ method: 'get', path: route });

            done();
        });
    });

    describe('findAllByUserId', () => {
        it('should call baseModel.where(\'id\', userId) if the table is the userTable', (done) => {
            userModel.findAllByUserId(666)
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" where "id" = 666 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should call baseModel.where(\'id\', userId) if the table is the userTable (with filter)', (done) => {
            userModel.findAllByUserId(666, { test: 1 })
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" where "id" = 666 and "test" = 1 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should call baseModel.where(\'user_id\', userId) if the table is NOT the userTable', (done) => {
            userSessionModel.findAllByUserId(666)
            .catch((err) => {
                expect(err.message).to.equal('select "user_sessions".* from "user_sessions" where "user_id" = 666 - SQLITE_ERROR: no such table: user_sessions');
                done();
            });
        });

        it('should use withRelated if the with parameter is defined', (done) => {
            userSessionModel.findAllByUserId(666, null, 'sessions')
            .catch((err) => {
                expect(err.message).to.equal('select "user_sessions".* from "user_sessions" where "user_id" = 666 - SQLITE_ERROR: no such table: user_sessions');
                done();
            });
        });
    });

    describe('findAll', () => {
        it('should call baseModel.where(\'id\', userId) if the table is the userTable', (done) => {
            userModel.findAll()
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should call baseModel.where(\'id\', userId) if the table is the userTable', (done) => {
            userModel.findAll({ test: 1 })
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" where "test" = 1 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should use withRelated if the with parameter is defined', (done) => {
            userModel.findAll({}, 'sessions')
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" - SQLITE_ERROR: no such table: users');
                done();
            });
        });
    });

    describe('findAllWithPagination', () => {
        it('should call fetchPage', (done) => {
            userModel.findAllWithPagination(10, 999)
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" limit 999 offset 10 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should call fetchPage (with filter)', (done) => {
            userModel.findAllWithPagination(10, 999, { test: 1 })
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" where "test" = 1 limit 999 offset 10 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should use withRelated if the with parameter is defined', (done) => {
            userModel.findAllWithPagination(10, 999, { }, 'sessions')
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" limit 999 offset 10 - SQLITE_ERROR: no such table: users');
                done();
            });
        });
    });

    describe('findAllByUserIdWithPagination', () => {
        it('should call where(id: id) since it\'s the user table and fetchPage', (done) => {
            userModel.findAllByUserIdWithPagination(666, 10, 999)
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" where "id" = 666 limit 999 offset 10 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should call where(id: id) since it\'s the user table and fetchPage (with filter)', (done) => {
            userModel.findAllByUserIdWithPagination(666, 10, 999, { test: 1 })
            .catch((err) => {
                expect(err.message).to.equal('select "users".* from "users" where "id" = 666 and "test" = 1 limit 999 offset 10 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should call where(id: id) since it\'s the user table and fetchPage', (done) => {
            userSessionModel.findAllByUserIdWithPagination(666, 10, 999)
            .catch((err) => {
                expect(err.message).to.equal('select "user_sessions".* from "user_sessions" where "user_id" = 666 limit 999 offset 10 - SQLITE_ERROR: no such table: user_sessions');
                done();
            });
        });

        it('should use withRelated if the with parameter is defined', (done) => {
            userSessionModel.findAllByUserIdWithPagination(666, 10, 999, {}, 'sessions')
            .catch((err) => {
                expect(err.message).to.equal('select "user_sessions".* from "user_sessions" where "user_id" = 666 limit 999 offset 10 - SQLITE_ERROR: no such table: user_sessions');
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

        it('should call where(id = userId) since it\'s the user table and fetch', (done) => {
            userModel.findOneByIdAndUserId(693, 666)
            .then((result) => {
                expect(result).to.equal('fetch_called_with_{"id":666}');
                done();
            });
        });

        it('should call where(id, user_id) and fetch', (done) => {
            userSessionModel.findOneByIdAndUserId(693, 666)
            .then((result) => {
                expect(result).to.equal('fetch_called_with_{"id":693,"user_id":666}');
                done();
            });
        });

        it('should use withRelated if the with parameter is defined', (done) => {
            userSessionModel.findOneById(693, 'sessions')
            .then((result) => {
                expect(result).to.equal('fetch_called_with_{"id":693}');
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

        it('should call where(id = id, user_id = userId) if not user table and save(data with patch) if Model.updateByIdAndUserId', (done) => {
            userSessionModel.updateByIdAndUserId(693, 666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result).to.equal('save_called_with_{"id":693,"user_id":666}_and_data_{"email":"satan@devil.org","tail":true,"id":693}');
                done();
            });
        });

        it('should call where(userId) if user table (but userId should equal id) and save(data with patch) if Model.updateByIdAndUserId', (done) => {
            userModel.updateByIdAndUserId(666, 666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result).to.equal('save_called_with_{"id":666}_and_data_{"email":"satan@devil.org","tail":true,"id":666}');
                done();
            });
        });

        it('should return unauthorized if user table (but userId is not equal id) and save(data with patch) if Model.updateByIdAndUserId', (done) => {
            userModel.updateByIdAndUserId(693, 666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result.output.payload.error).to.equal('Unauthorized');
                expect(result.output.payload.statusCode).to.equal(401);
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

        it('should call where(id = id, user_id = userId) if not user table and destroy() if Model.destroyByIdAndUserId', (done) => {
            userSessionModel.destroyByIdAndUserId(693, 666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result).to.equal('destroy_called_with_{"id":693,"user_id":666}');
                done();
            });
        });

        it('should call where(userId) if user table (but userId should equal id) and destroy() if Model.destroyByIdAndUserId', (done) => {
            userModel.destroyByIdAndUserId(666, 666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result).to.equal('destroy_called_with_{"id":666}');
                done();
            });
        });

        it('should return unauthorized if user table (but userId is not equal id) and destroy() if Model.destroyByIdAndUserId', (done) => {
            userModel.destroyByIdAndUserId(693, 666, { 'email': "satan@devil.org", tail: true })
            .then((result) => {
                expect(result.output.payload.error).to.equal('Unauthorized');
                expect(result.output.payload.statusCode).to.equal(401);
                done();
            });
        });
    });

    describe('Count', () => {
        before((done) => {
            done();
        });

        it('should return the count as an object { count: \<count\> } for count', (done) => {
            userModel.count()
            .catch((err) => {
                expect(err.message).to.equal('select count(*) as "count" from "users" - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should return the count as an object { count: \<count\> } for count (with filter)', (done) => {
            userModel.count({ test: 1 })
            .catch((err) => {
                expect(err.message).to.equal('select count(*) as "count" from "users" where "test" = 1 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should return the count as an object { count: \<count\> } where(user_id = userId) if it\s not the user table for countByUserId', (done) => {
            userSessionModel.countByUserId(666)
            .catch((err) => {
                expect(err.message).to.equal('select count(*) as "count" from "user_sessions" where "user_id" = 666 - SQLITE_ERROR: no such table: user_sessions');
                done();
            });
        });

        it('should return the count as an object { count: \<count\> } where(id = userId) if it\s the user table for countByUserId', (done) => {
            userModel.countByUserId(666)
            .catch((err) => {
                expect(err.message).to.equal('select count(*) as "count" from "users" where "id" = 666 - SQLITE_ERROR: no such table: users');
                done();
            });
        });

        it('should return the count as an object { count: \<count\> } where(user_id = userId) if it\s not the user table for countByUserId (with filter)', (done) => {
            userSessionModel.countByUserId(666, { test: 1 })
            .catch((err) => {
                expect(err.message).to.equal('select count(*) as "count" from "user_sessions" where "user_id" = 666 and "test" = 1 - SQLITE_ERROR: no such table: user_sessions');
                done();
            });
        });
    });
});