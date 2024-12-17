function resolveBackendRoute(path) {
    if (typeof path !== 'string' || path[0] !== '/') {
        throw TypeError("Invalid path. Must be a string that starts with a /");
    }

    return `${window.location.protocol}//${window.location.hostname}:8010${path}`;
};

function getUserProfileStaticFileURI(filename) {
    return resolveBackendRoute(`/static/users/profile/${filename}`);
};

function getWebSocketServerURI() {
    return 'ws://localhost:8011';
};

const shared = {
    resolveBackendRoute,
    getUserProfileStaticFileURI,
    getWebSocketServerURI
};

export default shared;
