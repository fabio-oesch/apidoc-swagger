var apidocSwagger = require('./lib/index.js');

var options = {
    src: "/Users/fabio/dev/subtonomy/polymer/subsearch/external_api",
    dest: "/Users/fabio/dev/subtonomy/polymer/subsearch/external_api/doc",
    //src: "subtonomy-test",
    //dest: "subtonomy-test/doc",
    verbose: false
};

apidocSwagger.createApidocSwagger(options);