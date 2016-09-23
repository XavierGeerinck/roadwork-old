const Joi = require('joi');

const schema = Joi.object({
    connection: Joi.object({
        host: Joi.string().default("127.0.0.1").required(),
        port: Joi.number().default(3306).required(),
        user: Joi.string().default("root").required(),
        password: Joi.string().default("root").required(),
        database: Joi.string().required()
    }).required().default(),
    client: Joi.string().allow([ "mysql", "mariasql", "pg", "sqlit3" ]).default("mysql").required(),
    pool: Joi.object({
        min: Joi.number().default(1),
        max: Joi.number().default(10)
    }).required().default()
}).default();

module.exports = schema;