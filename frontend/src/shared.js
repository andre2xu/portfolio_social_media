function resolveBackendRoute(path) {
    if (typeof path !== 'string' || path[0] !== '/') {
        throw TypeError("Invalid path. Must be a string that starts with a /");
    }

    return `${window.location.protocol}//${window.location.hostname}:8010${path}`;
};

const shared = {
    resolveBackendRoute
};

export default shared;
