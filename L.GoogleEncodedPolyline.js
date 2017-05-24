/**
 * Pass-in a Leaflet map object and an encoded text string created by either 
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
    
    var feature = 'undefined';
    
    var geoms = encoded_path.split("†");
    var polys = [];
    for (var i=0; i<geoms.length; i++)
    {
        var geom = geoms[i];
        var rings = geom.split("‡");
        var paths = [];
        for (var j=0; j<rings.length; j++)
        {
            paths.push(L.PolylineUtil.decode(rings[j]));
        }
        polys.push(paths);
    }
    
    feature = L.multiPolygon(polys, {
        stroke: true,
        color: stroke_hex,
        opacity: stroke_opacity,
        weight: stroke_weight
        // EXPAND HERE IF YOU WANT TO ADD FILL COLOR, FILL OPACITY, ETC
    });
    
    map.addLayer(feature);
    
    if( zoom_to_poly ){
        map.fitBounds(feature.getBounds(),{paddingBottomRight:[150,0]});
    }
    
    // Return a reference to the poly in case we need to put it in an array, etc
    return feature;
}