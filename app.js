var apidocSwagger = require('./lib/index.js');


/**
 * Transform parameters to object
 *
 * @param {String|String[]} filters
 * @returns {Object}
 */
 function transformToObject(filters) {
    if ( ! filters)
        return;

    if (typeof(filters) === 'string')
        filters = [ filters ];

    var result = {};
    filters.forEach(function(filter) {
        var splits = filter.split('=');
        if (splits.length === 2) {
            var obj = {};
            result[splits[0]] = path.resolve(splits[1], '');
        }
    });
    return result;
}

var options = {
    src: "/Users/fabio/dev/subtonomy/polymer/subsearch/external_api",
    dest: "/Users/fabio/dev/subtonomy/polymer/subsearch/external_api/doc",
    //src: "subtonomy-test",
    //dest: "subtonomy-test/doc",
    verbose: true
};

apidocSwagger.createApidocSwagger(options);