function resolveBackendRoute(path) {
    if (typeof path !== 'string' || path[0] !== '/') {
        throw TypeError("Invalid path. Must be a string that starts with a /");
    }

    return `${window.location.protocol}//${window.location.hostname}:8010${path}`;
};

function getUserProfileStaticFileURI(filename) {
    return resolveBackendRoute(`/static/users/profile/${filename}`);
};

function getUserPostMediaURI(filename) {
    return resolveBackendRoute(`/static/users/posts/${filename}`);
};

function getWebSocketServerURI() {
    let protocol = 'ws';
    let port = '8011';

    if (window.location.protocol.toLowerCase().indexOf('https') !== -1) {
        protocol = 'wss';
        port = '8010';
    }

    return `${protocol}://${window.location.hostname}:${port}`;
};

const shared = {
    resolveBackendRoute,
    getUserProfileStaticFileURI,
    getUserPostMediaURI,
    getWebSocketServerURI
};

export default shared;
