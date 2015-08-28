/* jshint node:true */
var argv = require('yargs').argv;
var fs = require('fs');
var byline = require('byline');
var clf = require('clf-parser');
var qs = require('qs');

var ignore = argv.ignore ? [ argv.ignore ] : [];
var ignoreExtensions = argv['ignore-extensions'] ? argv['ignore-extensions'].split('/') : [];

if (argv.help) {
  console.error('Usage: cat /var/log/nginx/my-logfile.log | poptop [--ignore-static] [--ignore-extensions=gif,png] [--ignore=regexp] [--ignore-query] [-r] [--successful] [--notfound] [--search=url,parameter]');
  process.exit(1);
}

if (argv['ignore-static']) {
  ignoreExtensions.push('gif,jpg,png,js,xlx,pptx,docx,css,ico,pdf,eot,woff');
}

var ignore;

ignoreExtensions.forEach(function(list) {
  ignore.push('\\.(' + list.replace(/,/g, '|') + ')(\\?|$)');
});

ignore = ignore.map(function(regexp) {
  return new RegExp(regexp);
});

var popularity = {};

var search = false;
var searchUrl;
var searchParameter;
if (argv.search) {
  search = true;
  var components = (typeof(argv.search) === 'string') && argv.search.split(/,/);
  if (components.length !== 2) {
    console.error('The --search option looks like: --search=/search,q');
    process.exit(1);
  }
  searchUrl = components[0];
  searchParameter = components[1];
}

stream = byline.createStream(process.stdin);

stream.on('data', function(line) {
  var info = clf(line.toString('utf8'));
  if (!info) {
    return;
  }
  if (!info.path) {
    return;
  }
  if (argv.successful) {
    if ((info.status < 200) || (info.status > 399)) {
      return;
    }
  }
  if (argv.notfound) {
    if (info.status !== 404) {
      return;
    }
  }

  if (search) {
    if (info.path.indexOf(searchUrl) !== 0) {
      return;
    }
    var q = info.path.indexOf('?');
    if (q === -1) {
      return;
    }
    var query = info.path.substr(q + 1);
    query = qs.parse(query);
    if (!query[searchParameter]) {
      return;
    }
    var s = query[searchParameter];
    s = s.toLowerCase();
    if (!popularity[s]) {
      popularity[s] = 0;
    }
    popularity[s]++;
    return;
  }

  if (argv['ignore-query']) {
    info.path = info.path.replace(/\?.*$/, '');
  }
  var i;
  for (i = 0; (i < ignore.length); i++) {
    if (info.path.match(ignore[i])) {
      return;
    }
  }
  var components;
  var path;
  var paths;
  if (argv.folders && (info.path !== '/')) {
    components = info.path.substr(1).split(/\//);
    path = '';
    paths = [];
    components.forEach(function(c) {
      path += '/' + c;
      paths.push(path);
    });
  } else {
    paths = [ info.path ];
  }
  paths.forEach(function(path) {
    if (!popularity[path]) {
      popularity[path] = 0;
    }
    popularity[path]++;
  });
});


stream.on('end', function() {
  var urls = Object.keys(popularity);
  urls.sort(function(a, b) {
    if (popularity[a] < popularity[b]) {
      return 1;
    }
    if (popularity[a] > popularity[b]) {
      return -1;
    }
    return 0;
  });

  if (argv.r) {
    urls.reverse();
  }

  urls.forEach(function(url) {
    console.log(popularity[url] + ': ' + url);
  });
});


