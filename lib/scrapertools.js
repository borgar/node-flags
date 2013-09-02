/*jshint node:true*/
"use strict";


var http = require("http")
  , path = require("path")
  , url = require('url')
  , fs = require("fs")
  ;


exports.COOKIE_JAR = [];
exports.USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36';
exports.cache_dir = '_cache';


function hash_from ( str ) {
  var hash = require('crypto').createHash( 'sha1' );
  return hash.update( str, 'utf8' ).digest( 'hex' );
}
exports.hash_from = hash_from;



function get_request ( req_url, xheaders, callback ) {
  if ( arguments.length === 2 ) {
    callback = xheaders;
    xheaders = {};
  }
  var opts = url.parse( req_url );
  opts.headers = xheaders || {};
  return http.get( opts, function ( res ) {
    var body = '';
    res.on( 'error', function ( err ) {
      callback( err );
    });
    res.on( 'end', function () {
      ;;;console.info( 'GET', req_url, body.length );
      callback( null, res, body );
    });
    res.on( 'data', function ( chunk ) {
      body += chunk;
    });
  })
  .on('error', function ( e ) {
    callback( e.message );
  })
  ;
}
exports.get_request = get_request;



function get_cache_file_name ( dest_url, use_filename ) {
  var id = ( !!use_filename )
          ? dest_url.replace( /\/$/, '' ).replace( /^.*\//, '' )
          : hash_from( dest_url ) /* + '.html' */
    , cache_file_name = path.join( exports.cache_dir, id )
    ;
  return cache_file_name;
}
exports.get_cache_file_name = get_cache_file_name;




function get_or_load ( dest_url, callback, delay, use_filename ) {
  var cache_file_name = get_cache_file_name( dest_url, use_filename )
    , cached_file_exists = fs.existsSync( cache_file_name )
    ;
  if ( cached_file_exists ) {
    // load from disc
    fs.readFile( cache_file_name, 'utf8', function ( err, body ) {
      if ( err ) throw err;
      callback( body, true );
    });
  }
  else {
    var opts = {
      'Cookie': exports.COOKIE_JAR.join('; '),
      'User-Agent': exports.USER_AGENT
    };
    return get_request( dest_url, opts, function ( err, res, body ) {
      if ( err ) { throw err; }
      if ( res.statusCode !== 200 ) {
        throw new Error( res.statusCode + ' returned for ' + dest_url );
      }
      fs.writeFile( cache_file_name, body, 'utf8', function ( err ) {
        if ( err ) { throw err; }
        if ( delay ) {
          var _delay = Math.ceil( delay / proxies.length );
          setTimeout(function () {
            callback( body, false );
            callback = body = null;
          }, _delay );
        }
        else {
          callback( body, false );
          callback = body = null;
        }
      });
    });
  }
}
exports.get_or_load = get_or_load;





function open_data_repo ( data_file, callback ) {
  if ( fs.existsSync( data_file ) ) {
    return fs.readFile( data_file, 'utf8', function ( err, body ) {
      if (err) throw err;
      callback( undefined, JSON.parse( body ) );
    });
  }
  callback( new Error('No data file found (' + data_file + ').') );
}
exports.open_data_repo = open_data_repo;

