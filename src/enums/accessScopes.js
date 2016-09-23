module.exports = {
    NO_ACCESS: 0, // No access, should return unauthorized
    OWNER_ACCESS: 1, // Only $owner access, return the objects where the current user has access to
    ALL_ACCESS: 2 // All access, the role item matches the one in the user scope column, return all objects
};