var Promise = require('bluebird');
var knex = require('knex')({});
var bookshelf = require('bookshelf')(knex);

const User = bookshelf.Model.extend({
    tableName: 'users'
});

module.exports = {
    engine: bookshelf,
    Models: {
        User: User
    }
};