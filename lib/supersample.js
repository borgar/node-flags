/*
 * Image resampling methods
 *
 * Downsampler (supersampling) ported from Paint.NET
 * Supersampler original copyright (C) Rick Brewster, Tom Jackson, and past contributors.
 * JavaScript port copyright (C) Borgar Thorsteinsson
 *
 * Upsampler (bicubic interpolation) adapted from: http://jsperf.com/pixel-interpolation/
 * Bicublic calculation copyright (C) Daniel G. Taylor
 *
 * This software is licensed as per the terms and conditions of the MIT Software License.
 *
 */
"use strict";


function bicubic_value ( x, a, b, c, d ) {
  var v = 0.5 * (c - a + (2 * a - 5 * b + 4 * c - d + (3 * (b - c) + d - a) * x) * x) * x + b;
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function bicubic_pixel ( pixels, x, y, offset, width ) {
  var v = [ 0, 0, 0, 0 ]
    , fx = ~~x
    , fy = ~~y
    , percent_x = x - fx
    , percent_y = y - fy
    , max_y = ( ( pixels.length / 4 ) / width ) - 1
    , max_x = width - 1
    , _fy2
    , _offs
    ;
  for ( var i = -1; i < 3; i++ ) {
    _fy2 = ( fy + i ) < 0 ? 0 : ( fy + i ) > max_y ? max_y : ( fy + i );
    _offs = _fy2 * width * 4 + offset;
    v[ i + 1 ] = (
      bicubic_value(
        percent_x,
        pixels[ _offs + ( fx - 1 < 0 ? 0 : fx - 1 > max_x ? max_x : fx - 1 ) * 4 ],
        pixels[ _offs + ( fx + 0 < 0 ? 0 : fx + 0 > max_x ? max_x : fx + 0 ) * 4 ],
        pixels[ _offs + ( fx + 1 < 0 ? 0 : fx + 1 > max_x ? max_x : fx + 1 ) * 4 ],
        pixels[ _offs + ( fx + 2 < 0 ? 0 : fx + 2 > max_x ? max_x : fx + 2 ) * 4 ]
      )
    );
  }
  return ~~bicubic_value( percent_y, v[0], v[1], v[2], v[3] );
}

function bicubic_resample ( source_canvas, dest_canvas ) {

  var s_ctx = source_canvas.getContext( '2d' );
  var imageData = s_ctx.getImageData( 0, 0, source_canvas.width, source_canvas.height );

  var dw = dest_canvas.width; //Math.floor( w * scale );
  var dh = dest_canvas.height; //Math.floor( h * scale );
  var x_scale = dw / source_canvas.width;
  var y_scale = dh / source_canvas.height;

  var d_ctx = dest_canvas.getContext( '2d' );
  var cleanData = d_ctx.createImageData( dw, dh );

  var cleanData_data = cleanData.data;
  var imageData_data = imageData.data;

  var r, g, b, w = source_canvas.width;
  for ( var x=0; x<dw; x++ ) {
    for ( var y=0; y<dh; y++ ) {
      var d_offs = ( x * 4 + y * dw * 4 )
        , _x = x / x_scale
        , _y = y / y_scale
        ;
      cleanData_data[ d_offs + 0 ] = bicubic_pixel( imageData_data, _x, _y, 0, w );
      cleanData_data[ d_offs + 1 ] = bicubic_pixel( imageData_data, _x, _y, 1, w );
      cleanData_data[ d_offs + 2 ] = bicubic_pixel( imageData_data, _x, _y, 2, w );
      cleanData_data[ d_offs + 3 ] = 255;
    }
  }

  d_ctx.putImageData( cleanData, 0, 0 );

  return dest_canvas;
}






function superSamplingFitSurface ( s_canvas, d_width, gamma ) {

  var s_width   = s_canvas.width
    , s_height  = s_canvas.height
    , s_ctx     = s_canvas.getContext( '2d' )
    , s_imgData = s_ctx.getImageData( 0, 0, s_width, s_height )
    , s_data    = s_imgData.data
    , d_width   = ~~d_width
    , d_height  = Math.ceil( s_height * ( d_width / s_width ) )
    , d_imgData = s_ctx.createImageData( d_width, d_height )
    , d_data    = d_imgData.data
    , s_px
    , d_o
    , a
    ;

  if ( s_width === d_width && s_height === d_height ) {
    // copy
    return s_imgData;
  }
  else if ( s_width < d_width && s_height < d_height ) {
    // enlargement -- shift to bicubic resampling
    var x_scale = d_width / s_width
      , y_scale = d_height / s_height
      ;
    for ( var x=0; x<d_width; x++ ) {
      for ( var y=0; y<d_height; y++ ) {
        var d_offs = ( x * 4 + y * d_width * 4 )
          , _x = x / x_scale
          , _y = y / y_scale
          ;
        d_data[ d_offs + 0 ] = bicubic_pixel( s_data, _x, _y, 0, s_width );
        d_data[ d_offs + 1 ] = bicubic_pixel( s_data, _x, _y, 1, s_width );
        d_data[ d_offs + 2 ] = bicubic_pixel( s_data, _x, _y, 2, s_width );
        d_data[ d_offs + 3 ] = bicubic_pixel( s_data, _x, _y, 3, s_width ); // 255
      }
    }
    return d_imgData;
  }

  function getSourcePixel ( x, y ) {
    var o = ( ~~y * s_width * 4 ) + ( ~~x * 4 )
      , p = [ s_data[ o ], s_data[ o + 1], s_data[ o + 2 ], s_data[ o + 3 ] ]
      , a
      ;
    // gamma correction
    if ( gamma && gamma !== 1 ) {
      p[ 0 ] = ~~Math.pow( 255 * ( p[ 0 ] / 255 ), gammaCorrection );
      p[ 1 ] = ~~Math.pow( 255 * ( p[ 1 ] / 255 ), gammaCorrection );
      p[ 2 ] = ~~Math.pow( 255 * ( p[ 2 ] / 255 ), gammaCorrection );
    }
    return p;
  }

  for ( var d_y=0; d_y<d_height; ++d_y ) {
    var s_top            = ( d_y * s_height ) / d_height
      , s_top_int        = ~~( s_top )
      , s_top_weight     = 1 - ( s_top - s_top_int )
      , s_bottom         = ( ( d_y + 1 ) * s_height ) / d_height
      , s_bottom_int     = ~~( s_bottom - 0.00001 )
      , s_bottom_weight  = s_bottom - s_bottom_int
      ;
    for ( var d_x=0; d_x<d_width; ++d_x ) {
      var s_left         = ( d_x * s_width ) / d_width
        , s_left_int     = ~~( s_left )
        , s_left_weight  = 1 - ( s_left - s_left_int )
        , s_right        = ( ( d_x + 1 ) * s_width ) / d_width
        , s_right_int    = ~~( s_right - 0.00001 )
        , s_right_weight = s_right - s_right_int
        , blue_sum        = 0
        , green_sum       = 0
        , red_sum         = 0
        , alpha_sum       = 0
        ;

      // left fractional edge
      for ( var s_y=s_top_int+1; s_y<s_bottom_int; ++s_y ) {
        s_px = getSourcePixel( s_left_int, s_y );
        a = s_px[ 3 ] * s_left_weight;
        red_sum   += s_px[ 0 ] * a;
        green_sum += s_px[ 1 ] * a;
        blue_sum  += s_px[ 2 ] * a;
        alpha_sum += a;
      }

      // right fractional edge
      for ( var s_y=s_top_int+1; s_y<s_bottom_int; ++s_y ) {
        s_px = getSourcePixel( s_right_int, s_y );
        a = s_px[ 3 ] * s_right_weight;
        red_sum   += s_px[ 0 ] * a;
        green_sum += s_px[ 1 ] * a;
        blue_sum  += s_px[ 2 ] * a;
        alpha_sum += a;
      }

      // top fractional edge
      for ( var s_x=s_left_int+1; s_x<s_right_int; ++s_x ) {
        s_px = getSourcePixel( s_x, s_top_int );
        a = s_px[ 3 ] * s_top_weight;
        red_sum   += s_px[ 0 ] * a;
        green_sum += s_px[ 1 ] * a;
        blue_sum  += s_px[ 2 ] * a;
        alpha_sum += a;
      }

      // bottom fractional edge
      for ( var s_x = s_left_int+1; s_x<s_right_int; ++s_x ) {
        s_px = getSourcePixel( s_x, s_bottom_int );
        a = s_px[ 3 ] * s_bottom_weight;
        blue_sum  += s_px[ 2 ] * a;
        red_sum   += s_px[ 0 ] * a;
        green_sum += s_px[ 1 ] * a;
        alpha_sum += a;
      }

      // center area
      for ( var s_y = s_top_int + 1; s_y < s_bottom_int; ++s_y ) {
        for ( var s_x = s_left_int + 1; s_x < s_right_int; ++s_x ) {
          s_px = getSourcePixel( s_x, s_y );
          a = s_px[ 3 ];
          blue_sum  += s_px[ 2 ] * a;
          green_sum += s_px[ 1 ] * a;
          red_sum   += s_px[ 0 ] * a;
          alpha_sum += a;
        }
      }

      // four corner pixels
      s_px = getSourcePixel( s_left_int, s_top_int );
      a = s_px[ 3 ] * ( s_top_weight * s_left_weight );
      red_sum   += s_px[ 0 ] * a;
      green_sum += s_px[ 1 ] * a;
      blue_sum  += s_px[ 2 ] * a;
      alpha_sum += a;

      s_px = getSourcePixel( s_right_int, s_top_int );
      a = s_px[ 3 ] * ( s_top_weight * s_right_weight );
      red_sum   += s_px[ 0 ] * a;
      green_sum += s_px[ 1 ] * a;
      blue_sum  += s_px[ 2 ] * a;
      alpha_sum += a;

      s_px = getSourcePixel( s_left_int, s_bottom_int );
      a = s_px[ 3 ] * ( s_bottom_weight * s_left_weight );
      red_sum   += s_px[ 0 ] * a;
      green_sum += s_px[ 1 ] * a;
      blue_sum  += s_px[ 2 ] * a;
      alpha_sum += a;

      s_px = getSourcePixel( s_right_int, s_bottom_int );
      a = s_px[ 3 ] * ( s_bottom_weight * s_right_weight );
      red_sum   += s_px[ 0 ] * a;
      green_sum += s_px[ 1 ] * a;
      blue_sum  += s_px[ 2 ] * a;
      alpha_sum += a;

      var alpha = alpha_sum / (( s_right - s_left ) * ( s_bottom - s_top ));
      if ( alpha == 0 ) {
        blue_sum  = 0;
        green_sum = 0;
        red_sum   = 0;
      }
      else {
        blue_sum  = ( blue_sum  / alpha_sum ) + 0.5;
        green_sum = ( green_sum / alpha_sum ) + 0.5;
        red_sum   = ( red_sum   / alpha_sum ) + 0.5;
        alpha     += 0.5;
      }

      d_o = ( ~~d_y * d_width * 4 ) + ( ~~d_x * 4 );
      d_data[ d_o + 0 ] = ~~( red_sum   );
      d_data[ d_o + 1 ] = ~~( green_sum );
      d_data[ d_o + 2 ] = ~~( blue_sum  );
      d_data[ d_o + 3 ] = ~~( alpha_sum );

    }
  }

  return d_imgData;
}

if ( typeof exports !== undefined ) {
  exports.supersample = superSamplingFitSurface;
}
