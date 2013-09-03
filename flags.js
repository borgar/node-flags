/*jshint node:true*/
"use strict";

var scrapertools = require("./lib/scrapertools")
  , get_or_load = scrapertools.get_or_load
  , open_data_repo = scrapertools.open_data_repo
  , mkdirSync = require("./lib/mkdir").mkdirSync
  , fs = require('fs')
  , canvg = require("./lib/canvg")
  , Canvas = require("canvas")
  , supersample = require('./lib/supersample').supersample
  , normalize_country_name = require('./lib/normalize_country_name').normalize_country_name
  ;


function okNum ( n ) { return ( typeof n === 'number' && isFinite( n ) ); }

var opts = require('optimist')
    .usage( 'Scrape and serve or write Wikipedia flags as bitmaps.\nUsage: $0 [options]\n\nSome options must be provided, either --server or -w or -h.' )
    .alias( 'w', 'width'  ).default( 'w', 1000 ).describe( 'w', 'Maximum allowed image width' )
    .alias( 'h', 'height' ).default( 'h', 1000 ).describe( 'h', 'Maximum allowed image height' )
    .describe( 'server', 'Start a simple test server' )
    .alias( 'p', 'port'   ).default( 'p', 8080 ).describe( 'p', 'Server port' )
    .alias('usage', 'help').describe( 'usage', 'Show usage' )
    .default( 'lowercase', false ).describe( 'lowercase', 'Filename should be lower case.' )
    .default( 'filenames', 'id' ).describe( 'filenames', 'What flag property to use as a filename for each written file.'+
'Available properties are "id" (name string), "iso2" (ISO 3166-1 alpha-2 only), "iso3" (ISO 3166-1 alpha-3 only), '+
'"fifa" (FIFA country codes), "ioc" (IOC country codes). Only flags with corresponding properties will be output. Multiple ID '+
'strings may be listed comma separated: "iso2,iso3" (try 2 char ISO, then 3 char, then ignore the flag).')
    .check(function( argv ){
      if ( argv.filename && !/^((iso[23]|id|fifa|ioc),?)+$/.test(argv.filename) ) { throw 'Oops! Incompatible filename argument.'; }
      if ( argv.h && !okNum(argv.h) ) { throw 'Oops! Height argument must be a number.'; }
      if ( argv.w && !okNum(argv.w) ) { throw 'Oops! Width argument must be a number.'; }
      if ( argv.p && !okNum(argv.p) ) { throw 'Oops! Port number argument must be a number.'; }
    })
    .wrap(80)
  , argv = opts.argv
  ;

// detect no-arguments
var a_test = require('optimist').argv;
var have_opts = ( a_test.w || a_test.h ) || a_test.server;

// arguments shortcuts
var whitelist_countries = null;
argv._.forEach(function( a ){
  // 20x20 dimensions shorthand
  var m = /^(\d+)x(\d+)$/.exec( a );
  if ( m ) {
    argv.w = parseInt( m[0], 10 );
    argv.h = parseInt( m[1], 10 );
    have_opts = true;
  }
  else {
    if ( !whitelist_countries ) { whitelist_countries = {}; }
    whitelist_countries[ normalize_country_name( a ) ] = a;
  }
});


if ( argv.help || !have_opts ) {
  console.log( opts.help() );
  process.exit(0);
}


var fnid_to_prop = {
  "id": "name"
, "fifa": "FIFA"
, "ioc": "IOC"
, "iso3": "ISO3166_a3"
, "iso2": "ISO3166_a2"
};
var filenames = argv.filenames.split( /,/ ).map(function ( d ) { return fnid_to_prop[ d ]; });
var countries = [];
var commons_url = 'http://upload.wikimedia.org/wikipedia/commons';
var max_height = Number( argv.h || 0 ) || Infinity;
var max_width  = Number( argv.w || 0)  || Infinity;
var bitmap_dest_dir = ( max_width || max_height ) + 'x' + ( max_height || max_width );

// SVG file cache
scrapertools.cache_dir = __dirname + '/_cache';
mkdirSync( scrapertools.cache_dir );

// PNG bitmap output dir
var bitmap_root_dir = 'flags';
mkdirSync( bitmap_root_dir );


// ============================================================
// pass 1 -- ensure we have all flags (we scrape them)
// ============================================================

var pending_read = [];

function fetch_next_flag () {
  if ( pending_read.length ) {
    var country = pending_read.pop();
    var url = commons_url + country.url;

    // passes filter?
    if ( whitelist_countries ) {
      if ( !(country.name in whitelist_countries) ) {
        return process.nextTick( fetch_next_flag );
      }
    }
    // TODO: add more filters here: --existing --sovreign

    countries.push( country );
    /*
     * So what happens if the filename/URL has changed?
     *
     * We should really be catching failures here, pulling the file info page,
     * altering the data.json accordingly, and save it back to disk...
     * 
     * https://en.wikipedia.org/wiki/File:Flag_of_the_So_and_So.svg
     *
     */
    get_or_load( url, fetch_next_flag, false, true );
  }
  else {
    // have all flags, moving on to stage 2 -- doing something with them
    stage_2();
  }
}

open_data_repo( 'data/flags.json', function ( err, c ) {
  if ( err ) { throw err; }
  pending_read = c;
  fetch_next_flag();
});



// ============================================================
// pass 2 -- render sizes
// ============================================================

function render_to_bitmap ( svg, writeStream, requested_max_width, requested_max_height ) {
  // render image to bitmap
  var canvas = new Canvas()
    , outCanvas = new Canvas()
    , ctx = canvas.getContext( '2d' )
    , dest_width
    , dest_height
    , scaled_width
    , resampled
    , stream
    ;
  ctx.patternQuality = 'best';
  ctx.filter = 'best';
  canvg( canvas, svg, { silent: true } );

  // contain the image withing the max dimensions
  dest_width = isFinite( requested_max_width ) && requested_max_width
      ? Math.min( requested_max_width, max_width )
      : max_width
      ;
  dest_height = isFinite( requested_max_height ) && requested_max_height
      ? Math.min( requested_max_height, max_height )
      : max_height
      ;
  scaled_width = Math.floor( canvas.width * ( dest_height / canvas.height ) );
  if ( scaled_width < dest_width ) { dest_width = scaled_width; }

  var _hh = Math.ceil( canvas.height * ( dest_width / canvas.width ) );
  if ( _hh > max_height ) {
    throw new Error( 'failed to calc height: ' + [dest_width, _hh].join('x') );
  }

  resampled = supersample( canvas, dest_width );

  outCanvas.width = dest_width;
  outCanvas.height = Math.ceil( canvas.height * ( dest_width / canvas.width ) );
  outCanvas.getContext( '2d' ).putImageData( resampled, 0, 0 );

  // save icon
  stream = outCanvas.createPNGStream();
  stream.on( 'data', function ( chunk ) { writeStream.write( chunk ); } );
  stream.on( 'end', function ( chunk ) { writeStream.end(); } );
  canvas = null;
  outCanvas = null;
  resampled = null;
}

function startServer ( port ) {
  var http = require("http")
    , url = require("url")
    , mime = { 'txt': 'text/plain', 'svg': 'image/svg+xml', 'png': 'image/png' }
    ;
  http.createServer(function( request, response ) {
    var uri = url.parse( request.url, true )
      , output_format
      , search_keys = []
      , not_found = true
      , uri_error = null
      , matches = []
      , m = /\/(flag|[^\.]+)\.(svg|png)/.exec( uri.pathname )
      , w = parseInt( uri.query.width, 10 )
      , h = parseInt( uri.query.height, 10 )
      ;
    delete uri.query.width;
    delete uri.query.height;
    if ( m ) {
      output_format = m[2];
      if ( m[1] === 'flag' ) {
        for ( var key in uri.query ) {
          search_keys.push([ key, uri.query[key] ]);
        }
      }
      else {
        var name = normalize_country_name( decodeURIComponent( m[1].replace( /\+/g, ' ' ) ) );
        search_keys.push([ 'name', name ]);
        if ( m[1].length < 6 ) {
          search_keys.push([ 'iso', m[1] ]);
          search_keys.push([ 'fifa', m[1] ]);
        }
      }
    }
    if ( !search_keys.length || request.method !== 'GET' ) {
      response.writeHead( 400, { 'Content-Type': mime.txt } );
      response.write( "400 Bad Request\n" );
      response.end();
      console.log( request.method, 400, request.url );
      return;
    }
    else {
      // scan for a match
      matches = countries.filter(function( country ){
        for (var ki=0,kl=search_keys.length; ki<kl; ki++) {
          var pair = search_keys[ki];
          if ( pair[0] in country && country[ pair[0] ].toLowerCase() === pair[1].toLowerCase() ) {
            return true;
          }
        }
        return false;
      });
    }
    if ( !matches.length || !/\.svg$/.test( matches[0].url ) ) {
      response.writeHead( 404, { 'Content-Type': mime.txt } );
      response.write( "404 Not Found\n" );
      response.end();
      console.log( request.method, 404, request.url );
      return;
    }
    else {
      var country = matches[0];
      get_or_load( commons_url + country.url, function ( svg ){
        response.writeHead( 200, { 'Content-Type': mime[ output_format ] } );
        if ( output_format === 'svg' ) {
          response.write( svg );
          response.end();
        }
        else {
          render_to_bitmap( svg, response, w, h );
        }
        console.log( request.method, 200, request.url );
      }, false, true );
    }
  }).listen( port );

  console.log( 'Listening on port ' + port );
  console.log( 'Usage: http://localhost:8080/[country name|flag].[svg|png]?[code]=[ID]' );
  console.log( '' );
  console.log( '  http://localhost:8080/flag.svg?ISO=fr' );
  console.log( '  http://localhost:8080/flag.svg?IOC=fr' );
  console.log( '  http://localhost:8080/flag.svg?FIFA=fr' );
  console.log( '  http://localhost:8080/flag.svg?country=france' );
  console.log( '  http://localhost:8080/flag.svg?country=france' );
  console.log( '  http://localhost:8080/france.svg' );
  console.log( '  http://localhost:8080/france.png?width=64&height=40' );
  console.log( '' );
}

function stage_2 () {
  
  if ( argv.server ) {
    startServer( ~~argv.p );
  }
  else {

    var basepath = require('path').join( bitmap_root_dir, bitmap_dest_dir );
    mkdirSync( basepath );

    console.info( 'Writing bitmaps to ' + basepath );
    console.info( 'This may take a minute...' );
    
    var write_countries = countries.concat()
      , get_filename = function ( flag ) {
          for (var fi=0,fl=filenames.length; fi<fl; fi++) {
            if ( filenames[ fi ] in flag ) {
              if ( argv.lowercase ) {
                return flag[ filenames[ fi ] ].toLowerCase();
              }
              return flag[ filenames[ fi ] ];
            }
          }
        }
      , render_next = function () {
          if ( write_countries.length ) {
            var country = write_countries.pop();

            // filename
            var filename = get_filename( country );
            if ( filename ) {

              if ( !/\.svg$/.test( country.url ) ) {
                console.info( 'Skipping non-SVG file:', country.url );
                return process.nextTick( render_next );
              }

              get_or_load( commons_url + country.url, function ( svg ) {
                var stream = fs.createWriteStream( require('path').join( basepath, filename + '.png' ) );
                render_to_bitmap( svg, stream );
                render_next();
              }, false, true );
            }
            else {
              return process.nextTick( render_next );
            }

          }
          else {
            console.info( 'Done!' );
          }
        }
      ;
    render_next();

  }

}





