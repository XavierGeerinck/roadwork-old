// In-memory db, if ever needed install sqlite3 as a dep!
var knex = require('knex')({
    client: 'sqlite3',
    connection: ':memory:'
});

// var knex = require('knex')({
// });

var bookshelf = require('bookshelf')(knex);

// Plugin registration
bookshelf.plugin('pagination');
bookshelf.plugin('visibility');
bookshelf.plugin('registry');
bookshelf.plugin('virtuals');

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