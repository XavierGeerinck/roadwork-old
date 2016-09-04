# Features
* Create CRUD routes for the passed models
* Add `Bearer` authentication to the individual routes
* Turn of the generation of specified routes

# Usage
## Installation
1. Require the library `const Api = require('rest-crud-generator')`
2. Pass the `Bookshelf` models to the generate method to create the API calls, with: `Api.generate(User)`

## Authentication
### Enable
To enable authentication, the only thing you need to do is call the `Api.addAuthentication(authenticationLibrary)` object. This will automatically create the user and user_session tables if they do not exist yet.

### Configure route access
As soon as the authentication has been enabled, you will be able to fine tune access towards a single route. This can be done by specifying the `allowedRoles` in the configuration object (see `API generate(model, options)`).

This will also create a new **dynamic** role called *$owner* which will allow access to the requested resource only if the currently authenticated user owns it. This is usefull in cases such as updating the user\'s own model, ... 

Example:

```json
{
    routes: {
        update: {
            allowedRoles: [ '$owner' ]
        }
    }
}
```

# API
## generate(model, options)
generates the CRUD routes for the given model

```json
{
    routes: {
        findOne: {
            allowedRoles: [],
            isEnabled: true
        },
        findAll: {
            allowedRoles: [],
            isEnabled: true
        },
        create: {
            allowedRoles: [],
            isEnabled: true
        },
        delete: {
            allowedRoles: [],
            isEnabled: true
        },
        update: {
            allowedRoles: [],
            isEnabled: true
        }
    }
}
```

## addBearerAuthentication(validateFunction)
Adds the bearer authentication to the server authentication. This requires the route to have a `Bearer: <token>` header that specifies if the user is allowed access to the route.

The `validateFunction` specifies if this given `<token>` is correct and access is allowed (boolean). You will want to check this against the UserSession table to see if the token matches an entry.

An example of a fully fledged authentication function:

```javascript
exports.validateFunction = function (token, callback) {
    UserSessionModel
    .where({ token: token })
    .fetch()
    .then(function (userSession) {
        if (!userSession) {
            return Promise.reject(Boom.badRequest('INVALID_TOKEN'));
        }

        return UserModel.where({ id: userSession.get('user_id') })
        .fetch();
    })
    .then(function (user) {
        if (!user) {
            return Promise.reject(Boom.badRequest('INVALID_TOKEN'));
        }

        var userObj = user;
        userObj.scope = [ user.get('scope') ];

        return callback(null, true, userObj);
    })
    .catch(function (err) {
        return callback(err);
    });
};
```

# Route scheme
Routes are generated on the plural name of the base model separated by _ on the capital letters.

> Example: User becomes /user
> Example: BaseUnit becomes /base_units

# Patterns used
* **adapter:** Allows us to create a top level interface on an already existing library, ...
    * Example: Create an adapter to be able to use different SQL Engines (postgres, mysql, ...) while keeping the method the same
* **facade:** Provides a simplified interface to a larger body of code (such as a class library)
    * Example: the classes `CarEngine`, `CarModel`, `CarBody`, ... that we combine in the `Car Facade` which has a method: `assembleCar``
* **spies:** Are used to confirm that a function is called, these are used in the tests.
    * Example: Did we call the ORM functions, the Route registration functionsm ...
    
# TODO
Ultimate goal of the lib: connect a Database, and automatically get Rest endpoints

* High Priority
    * TODO: Only allow access to a specific resource (example: a user can only delete his/her own user object)
          * Probably by checking the user_id in a table and matching it to the current user
          * Will need user support in this lib then (atleast basic user support?)
          * current thinking: add dynamic role ($owner, ...) 
          * TODO: The validateFunction should check for the role == $owner, and should then check if the user_id == the current logged in user
    * TODO: Include the user functionality in the library (or maybe a separate library?)
* General Priority
    * TODO: Create option to get relations until a specified level (example 3)
    * TODO: Advanced filters
    * TODO: Add user support out of the box? (Could allow us for better roles, provide password on delete, ...)
    * TODO: Add exists route
    * TODO: Add count route
    * TODO: Specify base path of the routes (that way it can work with an already existing API)
    * TODO: Add password verification for certain routes (example: user update/delete)
* Backlog
    * DONE: Allow routes to be limited to specific roles
    * DONE: Add ability to turn off certain routes