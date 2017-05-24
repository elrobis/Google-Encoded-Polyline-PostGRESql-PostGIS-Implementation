/*************************************************************
 * Pass in either a Polygon or MultiPolygon geometry. Returns
 * an array of ASCII-encoded Polygon feature parts, including
 * multi-part geometries and their interior rings.
 ************************************************************/

-- Function: GoogleEncodePolygon(geometry)

-- DROP FUNCTION GoogleEncodePolygon(geometry);

CREATE OR REPLACE FUNCTION GoogleEncodePolygon
(
  g1 geometry
)
RETURNS text AS
$BODY$
DECLARE
 ng INT;        -- Store number of Geometries in the Polygon.
 g INT;         -- Counter for the current geometry number during outer loop.
 g2 GEOMETRY;   -- Current geometry feature isolated by the outer loop.
 nr INT;        -- Store number of internal ring parts in the Polygon.
 r INT;         -- Counter for the current inner-ring part.
 r1 GEOMETRY;   -- Exterior ring part isolated BEFORE the inner loop.
 r2 GEOMETRY;   -- Inner-ring part isolated within the inner loop.
 gEncoded TEXT; -- Completed Google Encoding.
BEGIN
 gEncoded = '';
 ng = ST_NumGeometries(g1);
 g = 1;
 FOR g IN 1..ng BY 1 LOOP
     g2 = ST_GeometryN(g1, g);
     -- After the first pass (multi geometries), append † to delimit geoms..
     if g > 1 then gEncoded = gEncoded || chr(8224); END IF;
     -- Get ExteriorRing now, if there are inner rings get them in the next loop
     r1 = ST_ExteriorRing(g2);
     gEncoded = gEncoded || GoogleEncodeLine(r1);
     nr = ST_NRings(g2);
     if nr > 1 then
       -- One (1) is because interior rings is one-based
       -- And nr-1 is because ring count includes the boundary
       FOR r IN 1..(nr-1) BY 1 LOOP
         r2 = ST_InteriorRingN(g2, r);
         -- Append ‡ to delimit inner ring parts..
         gEncoded = gEncoded || chr(8225) || GoogleEncodeLine(r2);
       END LOOP;
     END IF;
 END LOOP;
 RETURN gEncoded;
End
$BODY$
  LANGUAGE plpgsql;



/*************************************************************
 * First of two methods. Pass in a geometry (line type only).
 * Returns ASCII-encoded point array for use in Google Maps.
 ************************************************************/

-- Function: GoogleEncodeLine(geometry)

-- DROP FUNCTION GoogleEncodeLine(geometry);

CREATE OR REPLACE FUNCTION GoogleEncodeLine
(
  g geometry -- geometry input (line type ONLY)
)
RETURNS text AS
$BODY$
DECLARE
  g2 GEOMETRY; -- g2 is the input geom after it is simplified, below
  pt1 GEOMETRY;
  pt2 GEOMETRY;
  p INT; 
  np INT;
  deltaX INT;
  deltaY INT;
  enX VARCHAR(255);
  enY VARCHAR(255);
  gEncoded TEXT;
BEGIN
  gEncoded = '';
  np = ST_NPoints(g);

  -- Valid input (i.e. A line representing a polygon) has a minimum 4 pts,
  -- but we should probably be handling np <= 3 pts somehow..
  IF np > 3 THEN
    -- I don't recall why we're simplifying all of these geoms in this manner..
    g2 = ST_SimplifyPreserveTopology(g, 0.00001); -- Every feature is being simplified?
    np = ST_NPoints(g2);
  END IF;

  pt1 = ST_SetSRID(ST_MakePoint(0, 0),4326);

  FOR p IN 1..np BY 1 LOOP
    pt2 = ST_PointN(g2, p);
    deltaX = (floor(ST_X(pt2)*1e5)-floor(ST_X(pt1)*1e5))::INT;
    deltaY = (floor(ST_Y(pt2)*1e5)-floor(ST_Y(pt1)*1e5))::INT;
    enX = GoogleEncodeSignedInteger(deltaX);
    enY = GoogleEncodeSignedInteger(deltaY);
    gEncoded = gEncoded || enY || enX;

    pt1 = ST_SetSRID(ST_MakePoint(ST_X(pt2), ST_Y(pt2)),4326);
  END LOOP;
RETURN gEncoded;
End
$BODY$
  LANGUAGE plpgsql;



/**************************************************************
 * Second of two methods. Accepts a signed integer (LON or LAT
 * by 1e5) and returns an ASCII-encoded coordinate expression.
 *************************************************************/

-- Function: GoogleEncodeSignedInteger(integer)

-- DROP FUNCTION GoogleEncodeSignedInteger(integer);

CREATE OR REPLACE FUNCTION GoogleEncodeSignedInteger
(
  c integer -- signed integer input
)
RETURNS character varying AS
$BODY$
DECLARE
  e VARCHAR(255);
  s BIT(32);
  b BIT(6);
  n INT;
BEGIN
 e = '';
 s = (c::BIT(32))<<1;

 IF s::INT < 0 THEN
   s = ~s;
   END IF;

 WHILE s::INT >= ('100000')::BIT(6)::INT LOOP
   b = ('100000')::BIT(6) | (('0'||substring(s, 28, 5))::BIT(6));
   n = b::INT + 63;
   e = e || chr(n);
   s = s >> 5;
 END LOOP;
 e = e || chr(s::INT+63);

RETURN e;
End
$BODY$
  LANGUAGE plpgsql;