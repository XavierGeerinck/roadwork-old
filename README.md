# Features
* Create CRUD routes for the passed models
* Add `Bearer` authentication to the individual routes
* Turn of the generation of specified routes

# Usage
## Installation
1. Require the library `const api = require('roadwork')(serverObject)`
2. Pass the `Bookshelf` models to the generate method to create the API calls, with: `api.generate(User)`

## Authentication
### Enable
To enable authentication, the only thing you need to do is call the `Api.addAuthentication(authenticationLibrary)` object. This will automatically create the user and user_session tables if they do not exist yet.

Once this is done, the addAuthentication will return a promise stating that it is done, whereafter you can generate the routings with their detailed permissions such as these routes:

```javascript
// Create API routes
var api = require('roadwork')(exports.server);
api.addAuthentication(require('roadwork-authentication'), require('./src/db'))
.then(function () {
    api.generate(require('./src/db/models/User'), {
        routes: {
            delete:  { allowedRoles: [ 'admin' ] },
            update:  { allowedRoles: [ 'admin' ] },
            findAll: { allowedRoles: [ 'admin', '$owner' ] },
            findOne: { allowedRoles: [ 'admin', '$owner' ] },
            count:   { allowedRoles: [ 'admin', '$owner' ] },
            findAllWithPagination: { allowedRoles: [ 'admin', '$owner' ] }
        }
    });
    api.generate(require('./src/db/models/UserSession'), {
        routes: {
            delete:  { allowedRoles: [ 'admin' ] },
            update:  { allowedRoles: [ 'admin' ] },
            findAll: { allowedRoles: [ 'admin', '$owner' ] },
            findOne: { allowedRoles: [ 'admin', '$owner' ] },
            count:   { allowedRoles: [ 'admin', '$owner' ] },
            findAllWithPagination: { allowedRoles: [ 'admin', '$owner' ] }
        }
    });

    return resolve();
})
.catch((err) => {
    console.error(err);
    return reject(err);
});
```

### Configure route access
As soon as the authentication has been enabled, you will be able to fine tune access towards a single route. This can be done by specifying the `allowedRoles` in the configuration object (see `API generate(model, options)`).

This will also create a new **dynamic** role called *$owner* which will allow access to the requested resource only if the currently authenticated user owns it. This is usefull in cases such as updating the user\'s own model, ... 

Example:

```json
{
    "routes": {
        "update": {
            "allowedRoles": [ '$owner' ]
        }
    }
}
```

# Generated Routes

|route|description|
|-|-|
|`GET /<model>`|Gets all the objects for the specific model, if the _$owner_ role has been added to rolesAllowed, then only the objects where the user has access to will be returned|
|`GET /<model>/{id}`|Gets the specified object for the given model, if the _$owner_ role has been added to rolesAllowed, then only if the user has access this object will be returned|
|`GET /<model>/pagination/{offset}?limit={limit}`|Gets all the objects for the specific model starting at a specific id offset and a certain limit, if the _$owner_ route has been added, only the objects where the user has access to will be returned|
|`POST /<model>`|Creates a specific item for the given model|
|`PUT /<model>/{id}`|Updates a specific item for the given model and id, if the _$owner_ role has been specified, only the owner can update his/her own object|
|`DELETE /<model>/{id}`|Deletes a specific item for the given model and id, if the _$owner_ role has been specified, only the owner can delete his/her own object|
|`GET /<model>/count`|Gets the number of items for the specific model, if the _$owner_ object has been specified, only the amount of items where the owner has access to will be returned|

# API
## generate(model, options)
generates the CRUD routes for the given model

```json
{
    "routes": {
        "findOne": {
            "allowedRoles": [],
            "isEnabled": true
        },
        "findAll": {
            "allowedRoles": [],
            "isEnabled": true
        },
        "findAllWithPagination": {
            "allowedRoles": [],
            "isEnabled": true
        },
        "create": {
            "allowedRoles": [],
            "isEnabled": true
        },
        "delete": {
            "allowedRoles": [],
            "isEnabled": true
        },
        "update": {
            "allowedRoles": [],
            "isEnabled": true
        }
    }
}
```

## addAuthentication(roadworkAuthentication, databaseConfiguration)
Adds the bearer authentication to the server authentication. This requires the route to have a `Bearer: <token>` header that specifies if the user is allowed access to the route.

The system will then look into the `user_session` table and confirm  the `user` object.

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