var _ = require('lodash');
var apidoc = require('apidoc-core');
var winston = require('winston');
var path = require('path');
var markdown = require('markdown-it');
var fs = require('fs-extra');
var PackageInfo = require('./package_info');

var apidocSwagger = require('./apidocToSwagger');

var defaults = {
  dest: path.join(__dirname, '../doc/'),
  template: path.join(__dirname, '../template/'),

  debug: false,
  silent: false,
  verbose: false,
  simulate: false,
  parse: false, // only parse and return the data, no file creation
  colorize: true,
  markdown: true
};

var app = {
  log: {},
  markdown: false,
  options: {}
};

// uncaughtException
process.on('uncaughtException', function (err) {
  console.error((new Date()).toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});

function createApidocSwagger(options) {
  var api;
  var apidocPath = path.join(options.src, './');
  var packageInfo;

  options = _.defaults({}, options, defaults);

  // paths
  options.dest = path.join(options.dest, './');

  // options
  app.options = options;

  // logger
  app.log = winston.createLogger({
    level: app.options.debug ? 'debug' : app.options.verbose ? 'verbose' : 'info',
    prettyPrint: true,
    transports: [
      new winston.transports.File({ filename: 'debug.log' })
    ]
  });

  // markdown
  if (app.options.markdown === true) {
    app.markdown = new markdown({
      breaks: false,
      html: true,
      linkify: false,
      typographer: false
    });
  }

  try {
    packageInfo = new PackageInfo(app);

    // generator information
    var json = JSON.parse(fs.readFileSync(apidocPath + 'apidoc.json', 'utf8'));
    apidoc.setGeneratorInfos({
      name: json.name,
      time: new Date(),
      url: json.homepage,
      version: json.version
    });
    apidoc.setLogger(app.log);
    apidoc.setMarkdownParser(app.markdown);
    apidoc.setPackageInfos(packageInfo.get());

    api = apidoc.parse(app.options);


    if (api === true) {
      app.log.info('Nothing to do.');
      return true;
    }
    if (api === false) {
      return false;
    }

    fs.writeFileSync('apidoc-data.json', JSON.stringify(JSON.parse(api.data), null, 2));
    fs.writeFileSync('apidoc-project.json', JSON.stringify(JSON.parse(api.project), null, 2));

    if (app.options.parse !== true) {
      var apidocData = JSON.parse(api.data);
      var projectData = JSON.parse(api.project);
      api["swaggerData"] = JSON.stringify(apidocSwagger.toSwagger(apidocData, projectData), null, 2);
      createOutputFile(api);
    }

    app.log.info('Done.');
    return api;
  } catch (e) {
    app.log.error(e.message);
    if (e.stack)
      app.log.debug(e.stack);
    return false;
  }
}

function createOutputFile(api) {
  fs.mkdirsSync(app.options.dest);
  fs.writeFileSync(app.options.dest + '/swagger.json', api.swaggerData);
  
}

module.exports = {
  createApidocSwagger: createApidocSwagger
};
