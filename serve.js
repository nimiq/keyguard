#!/usr/bin/node

// Adapted from https://gist.github.com/fmal/d56384264eec583eda93

var http = require("http"),
    url  = require("url"),
    path = require("path"),
    fs   = require("fs"),
    port = process.argv[2] || 8000,

    mimeTypes = {
      'asc'   : 'text/plain',
      'au'    : 'audio/basic',
      'avi'   : 'video/x-msvideo',
      'bin'   : 'application/octet-stream',
      'class' : 'application/octet-stream',
      'css'   : 'text/css',
      'csv'   : 'application/vnd.ms-excel',
      'doc'   : 'application/msword',
      'dll'   : 'application/octet-stream',
      'dvi'   : 'application/x-dvi',
      'exe'   : 'application/octet-stream',
      'htm'   : 'text/html',
      'html'  : 'text/html',
      'json'  : 'application/json',
      'js'    : 'text/javascript',
      'txt'   : 'text/plain',
      'bmp'   : 'image/bmp',
      'rss'   : 'application/rss+xml',
      'atom'  : 'application/atom+xml',
      'gif'   : 'image/gif',
      'jpeg'  : 'image/jpeg',
      'jpg'   : 'image/jpeg',
      'jpe'   : 'image/jpeg',
      'png'   : 'image/png',
      'ico'   : 'image/vnd.microsoft.icon',
      'mpeg'  : 'video/mpeg',
      'mpg'   : 'video/mpeg',
      'mpe'   : 'video/mpeg',
      'qt'    : 'video/quicktime',
      'mjs'   : 'text/javascript',
      'mov'   : 'video/quicktime',
      'wmv'   : 'video/x-ms-wmv',
      'mp2'   : 'audio/mpeg',
      'mp3'   : 'audio/mpeg',
      'rm'    : 'audio/x-pn-realaudio',
      'ram'   : 'audio/x-pn-realaudio',
      'rpm'   : 'audio/x-pn-realaudio-plugin',
      'ra'    : 'audio/x-realaudio',
      'wav'   : 'audio/x-wav',
      'zip'   : 'application/zip',
      'pdf'   : 'application/pdf',
      'xls'   : 'application/vnd.ms-excel',
      'ppt'   : 'application/vnd.ms-powerpoint',
      'wbxml' : 'application/vnd.wap.wbxml',
      'wmlc'  : 'application/vnd.wap.wmlc',
      'wmlsc' : 'application/vnd.wap.wmlscriptc',
      'spl'   : 'application/x-futuresplash',
      'gtar'  : 'application/x-gtar',
      'gzip'  : 'application/x-gzip',
      'swf'   : 'application/x-shockwave-flash',
      'tar'   : 'application/x-tar',
      'xhtml' : 'application/xhtml+xml',
      'snd'   : 'audio/basic',
      'midi'  : 'audio/midi',
      'mid'   : 'audio/midi',
      'm3u'   : 'audio/x-mpegurl',
      'tiff'  : 'image/tiff',
      'tif'   : 'image/tiff',
      'rtf'   : 'text/rtf',
      'wml'   : 'text/vnd.wap.wml',
      'wmls'  : 'text/vnd.wap.wmlscript',
      'xsl'   : 'text/xml',
      'xml'   : 'text/xml',
      'svg'   : 'image/svg+xml'
    };

http.createServer(function(request, response) {
    if (path.normalize(decodeURI(request.url)) !== decodeURI(request.url)) {
        response.statusCode = 403;
        response.end();
        return;
    }

    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

    fs.exists(filename, function(exists) {
        if (exists && fs.statSync(filename).isDirectory()) {
            filename += `${filename.endsWith('/') ? '' : '/'}index.html`;
            exists = fs.existsSync(filename);
        }

        if(!exists) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.end("404 Not Found");
            return;
        }

        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.end(err.message);
                return;
            }

            var ext = filename.replace(/.*[\.\/\\]/, '').toLowerCase();

            response.writeHead(200, {"Content-Type": (mimeTypes[ext] || "text/plain")});
            response.end(file, "binary");
        });
    });

}).listen(parseInt(port, 10));

console.log("Keyguard running at http://localhost:" + port + "/\nCTRL + C to shutdown");
