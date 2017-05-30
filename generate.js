var AdmZip = require('adm-zip');
var fs = require('fs');
var path = require('path');

function generate(browser) {
  var archiver = require('archiver');
  var archive = archiver.create('zip', {});
  var output = fs.createWriteStream(__dirname + '/out/slackmoji-'+browser+'.zip');

  archive.pipe(output);

  if(browser == "chrome") {
    addFile(archive, 'background.js');
  }

  addFile(archive, 'slackmoji.js');
  addFile(archive, 'jquery.js');
  addFile(archive, 'style.css');

  archive.bulk([{
    expand: true,
    cwd: './files/icons/',
    src: ['**'],
    dest: 'icons/'
  }]);

  var manifest = JSON.parse(JSON.stringify(require('./files/manifest.json')));

  if(browser == "mozilla") {
    delete manifest['background'];
  }
  if(browser == "chrome") {
    delete manifest['applications'];
  }

  if(process.argv.length == 3) {
    manifest.version = process.argv[2];
  }

  archive.append(JSON.stringify(manifest, undefined, 2), { name: "manifest.json" });
  archive.finalize();

  function addFile(archive, file) {
    archive.append(fs.createReadStream(path.join(__dirname, 'files', file)), { name: file });
  }
}

generate('mozilla');
generate('chrome');

