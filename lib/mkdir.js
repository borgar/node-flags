function mkdir ( dir, callback ) {
  require("fs").mkdir( dir, function ( e ) {
    if ( !e || ( e && e.code === 'EEXIST' ) ) {
      callback();
    }
    else {
      throw e;
    }
  });
}

function mkdirSync ( dir ) {
  try {
    require("fs").mkdirSync( dir );
  }
  catch ( e ) {
    if ( e && e.code === 'EEXIST' ) {
      // pass
    }
    else {
      throw e;
    }
  }
}

exports.mkdir = mkdir;
exports.mkdirSync = mkdirSync;
