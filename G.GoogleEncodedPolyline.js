/**
 * Pass-in a Google map object and an encoded text string created by either 
 * PostGIS method, GoogleEncodePolygon() or GoogleEncodeLine().
 * 
 * The function renders the geometry in the map and optionally zooms to it 
 * (defaults to false), and returns a reference to the poly object.
 * 
 * @param {type} map REQUIRED GOOGLE MAP OBJECT
 * @param {type} encoded_path REQUIRED ENCODED PATH TEXT STRING
 * @param {type} stroke_hex OPTIONAL STROKE HEX COLOR
 * @param {type} stroke_opacity OPTIONAL STROKE OPACITY
 * @param {type} stroke_weight OPTIONAL STROKE WEIGHT
 * @param {type} zoom_to_poly OPTIONAL ZOOM TO POLYGON ON RENDER, defaults to false
 * 
 * @returns {unresolved}
 */
function RenderGoogleEncodedPolyline( map,
                                      encoded_path,
                                      stroke_hex,
                                      stroke_opacity,
                                      stroke_weight,
                                      zoom_to_poly )
{
   // Assign some default values..
   stroke_hex = (typeof stroke_hex !== 'undefined') ? stroke_hex : '#890000';
   stroke_opacity = (typeof stroke_opacity !== 'undefined') ? stroke_opacity : 1.0;
   stroke_weight = (typeof stroke_weight !== 'undefined') ? stroke_weight : 2;
   zoom_to_poly = (typeof zoom_to_poly !== 'undefined') ? zoom_to_poly : false;
   
   // Don't instantiate bounds if we don't have to..
   var bounds = (zoom_to_poly === true) ? new google.maps.LatLngBounds() : 'undefined';
   
   var polygonObject = 'undefined';
   
   // Get array of encoded geoms by splitting on †
   // Only multipart geoms will have a length > 1..
   // 
   var encodedGeoms = encoded_path.split("†");
   for( var i=0; i<encodedGeoms.length; i++ )
   {
       var encodedGeom = encodedGeoms[i];
       
        // Get array of this geom's encoded ring parts by splitting on ‡
        // Only geoms with inner rings (holes) will have a length > 1..
        // 
        var encodedRings = encodedGeom.split("‡");
        var polyPaths = []; // Array of paths we'll pass into a google map polygon object
        
        for( var j=0; j<encodedRings.length; j++ ){
            var ptarray = google.maps.geometry.encoding.decodePath(encodedRings[j]);
            polyPaths.push(ptarray);
        }
        
        polygonObject = new google.maps.Polygon({
            paths: polyPaths,
            strokeColor: stroke_hex,
            strokeOpacity: stroke_opacity,
            strokeWeight: stroke_weight
            // EXPAND HERE IF YOU WANT TO ADD FILL COLOR, FILL OPACITY, ETC
        });
        polygonObject.setMap(map);
        
        if( zoom_to_poly ){
            polygonObject.getPath().forEach(function(e){
                bounds.extend(e);
            });
        }
    }
    
    if( zoom_to_poly ){
        map.fitBounds(bounds);
    }
    
    // Return a reference to the poly in case we need to put it in an array, etc
    return polygonObject;
}