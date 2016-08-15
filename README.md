# Features
* Create CRUD routes for the passed models
* Add `Bearer` authentication to the individual routes
* Turn of the generation of specified routes

# Usage
1. Require the library `const Api = require('rest-crud-generator')`
2. Pass the `Bookshelf` models to the generate method to create the API calls, with: `Api.generate(User)`

**Adding Authentication:**

To enable authentication and change the allowedRole array, run: `Api.addBearerAuthentication(validateFunction)`, the validateFunction looks like this:

```
function (token, callback) { 
    // correct authentication
    return callback(null, true, {});
    
    // error authenticating
    return callback(null, false);
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