var Promise = require('bluebird');
var knex = require('knex')({});
var bookshelf = require('bookshelf')(knex);

const User = bookshelf.Model.extend({
    tableName: 'users'
});

const UserSession = bookshelf.Model.extend({
    tableName: 'user_sessions'
});

module.exports = {
    engine: bookshelf,
    Models: {
        User: User,
        UserSession: UserSession
    }
};