const Joi = require('joi');

const schema = Joi.object({
    basePath: Joi.string().default('') // Should be /path, so no trailing '/' (thus the default is '')
}).default();

module.exports = schema;