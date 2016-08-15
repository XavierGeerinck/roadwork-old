const Joi = require('joi');

const schema = Joi.object({
    routes: Joi.object({
        findOne: Joi.object({
            allowedRoles: Joi.array(),
            isEnabled: Joi.boolean().default(true)
        }).default(),
        findAll: Joi.object({
            allowedRoles: Joi.array(),
            isEnabled: Joi.boolean().default(true)
        }).default(),
        create: Joi.object({
            allowedRoles: Joi.array(),
            isEnabled: Joi.boolean().default(true)
        }).default(),
        update: Joi.object({
            allowedRoles: Joi.array(),
            isEnabled: Joi.boolean().default(true)
        }).default(),
        delete: Joi.object({
            allowedRoles: Joi.array(),
            isEnabled: Joi.boolean().default(true)
        }).default()
    }).default()
}).default();

module.exports = schema;