//'use strict';

//var tilebelt = require('@mapbox/tilebelt');

import TileBelt from './tilebelt.js';

export default class TileCover {

    constructor() {
        this.tilebelt = new TileBelt();
    }

    /**
     * Given a geometry, create cells and return them in a format easily readable
     * by any software that reads GeoJSON.
     *
     * @alias geojson
     * @param {Object} geom GeoJSON geometry
     * @param {Object} limits an object with min_zoom and max_zoom properties
     * specifying the minimum and maximum level to be tiled.
     * @returns {Object} FeatureCollection of cells formatted as GeoJSON Features
     */
    geojson(geom, limits) {
        return {
            type: 'FeatureCollection',
            features: this.tiles(geom, limits).map(tileToFeature)
        };
    };

    tileToFeature(t) {
        return {
            type: 'Feature',
            geometry: this.tilebelt.tileToGeoJSON(t),
            properties: {}
        };
    }

    /**
     * Given a geometry, create cells and return them as
     * [quadkey](http://msdn.microsoft.com/en-us/library/bb259689.aspx) indexes.
     *
     * @alias indexes
     * @param {Object} geom GeoJSON geometry
     * @param {Object} limits an object with min_zoom and max_zoom properties
     * specifying the minimum and maximum level to be tiled.
     * @returns {Array<String>} An array of tiles given as quadkeys.
     */
    static indexes(geom, limits) {
        return this.tiles(geom, limits).map(this.tilebelt.tileToQuadkey);
    };

    /**
     * Given a geometry, create cells and return them in their raw form,
     * as an array of cell identifiers.
     *
     * @alias tiles
     * @param {Object} geom GeoJSON geometry
     * @param {Object} limits an object with min_zoom and max_zoom properties
     * specifying the minimum and maximum level to be tiled.
     * @returns {Array<Array<number>>} An array of tiles given as [x, y, z] arrays
     */
    tiles(geom, limits) {
        var i, tile,
            coords = geom.coordinates,
            maxZoom = limits.max_zoom,
            tileHash = {},
            tiles = [];

        if (geom.type === 'Point') {
            return [this.tilebelt.pointToTile(coords[0], coords[1], maxZoom)];

        } else if (geom.type === 'MultiPoint') {
            for (i = 0; i < coords.length; i++) {
                tile = this.tilebelt.pointToTile(coords[i][0], coords[i][1], maxZoom);
                tileHash[this.toID(tile[0], tile[1], tile[2])] = true;
            }
        } else if (geom.type === 'LineString') {
            this.lineCover(tileHash, coords, maxZoom);

        } else if (geom.type === 'MultiLineString') {
            for (i = 0; i < coords.length; i++) {
                this.lineCover(tileHash, coords[i], maxZoom);
            }
        } else if (geom.type === 'Polygon') {
            this.polygonCover(tileHash, tiles, coords, maxZoom);

        } else if (geom.type === 'MultiPolygon') {
            for (i = 0; i < coords.length; i++) {
                this.polygonCover(tileHash, tiles, coords[i], maxZoom);
            }
        } else {
            throw new Error('Geometry type not implemented');
        }

        if (limits.min_zoom !== maxZoom) {
            // sync tile hash and tile array so that both contain the same tiles
            var len = tiles.length;
            this.appendHashTiles(tileHash, tiles);
            for (i = 0; i < len; i++) {
                var t = tiles[i];
                tileHash[this.toID(t[0], t[1], t[2])] = true;
            }
            return this.mergeTiles(tileHash, tiles, limits);
        }

        this.appendHashTiles(tileHash, tiles);
        return tiles;
    }

    mergeTiles(tileHash, tiles, limits) {
        var mergedTiles = [];

        for (var z = limits.max_zoom; z > limits.min_zoom; z--) {

            var parentTileHash = {};
            var parentTiles = [];

            for (var i = 0; i < tiles.length; i++) {
                var t = tiles[i];

                if (t[0] % 2 === 0 && t[1] % 2 === 0) {
                    var id2 = this.toID(t[0] + 1, t[1], z),
                        id3 = this.toID(t[0], t[1] + 1, z),
                        id4 = this.toID(t[0] + 1, t[1] + 1, z);

                    if (tileHash[id2] && tileHash[id3] && tileHash[id4]) {
                        tileHash[this.toID(t[0], t[1], t[2])] = false;
                        tileHash[id2] = false;
                        tileHash[id3] = false;
                        tileHash[id4] = false;

                        var parentTile = [t[0] / 2, t[1] / 2, z - 1];

                        if (z - 1 === limits.min_zoom) mergedTiles.push(parentTile);
                        else {
                            parentTileHash[this.toID(t[0] / 2, t[1] / 2, z - 1)] = true;
                            parentTiles.push(parentTile);
                        }
                    }
                }
            }

            for (i = 0; i < tiles.length; i++) {
                t = tiles[i];
                if (tileHash[this.toID(t[0], t[1], t[2])]) mergedTiles.push(t);
            }

            tileHash = parentTileHash;
            tiles = parentTiles;
        }

        return mergedTiles;
    }

    polygonCover(tileHash, tileArray, geom, zoom) {
        var intersections = [];

        for (var i = 0; i < geom.length; i++) {
            var ring = [];
            this.lineCover(tileHash, geom[i], zoom, ring);

            for (var j = 0, len = ring.length, k = len - 1; j < len; k = j++) {
                var m = (j + 1) % len;
                var y = ring[j][1];

                // add interesction if it's not local extremum or duplicate
                if ((y > ring[k][1] || y > ring[m][1]) && // not local minimum
                    (y < ring[k][1] || y < ring[m][1]) && // not local maximum
                    y !== ring[m][1]) intersections.push(ring[j]);
            }
        }

        intersections.sort(compareTiles); // sort by y, then x

        for (i = 0; i < intersections.length; i += 2) {
            // fill tiles between pairs of intersections
            y = intersections[i][1];
            for (var x = intersections[i][0] + 1; x < intersections[i + 1][0]; x++) {
                var id = this.toID(x, y, zoom);
                if (!tileHash[id]) {
                    tileArray.push([x, y, zoom]);
                }
            }
        }
    }

    compareTiles(a, b) {
        return (a[1] - b[1]) || (a[0] - b[0]);
    }

    lineCover(tileHash, coords, maxZoom, ring) {
        var prevX, prevY;

        for (var i = 0; i < coords.length - 1; i++) {
            var start = this.tilebelt.pointToTileFraction(coords[i][0], coords[i][1], maxZoom),
                stop = this.tilebelt.pointToTileFraction(coords[i + 1][0], coords[i + 1][1], maxZoom),
                x0 = start[0],
                y0 = start[1],
                x1 = stop[0],
                y1 = stop[1],
                dx = x1 - x0,
                dy = y1 - y0;

            if (dy === 0 && dx === 0) continue;

            var sx = dx > 0 ? 1 : -1,
                sy = dy > 0 ? 1 : -1,
                x = Math.floor(x0),
                y = Math.floor(y0),
                tMaxX = dx === 0 ? Infinity : Math.abs(((dx > 0 ? 1 : 0) + x - x0) / dx),
                tMaxY = dy === 0 ? Infinity : Math.abs(((dy > 0 ? 1 : 0) + y - y0) / dy),
                tdx = Math.abs(sx / dx),
                tdy = Math.abs(sy / dy);

            if (x !== prevX || y !== prevY) {
                tileHash[this.toID(x, y, maxZoom)] = true;
                if (ring && y !== prevY) ring.push([x, y]);
                prevX = x;
                prevY = y;
            }

            while (tMaxX < 1 || tMaxY < 1) {
                if (tMaxX < tMaxY) {
                    tMaxX += tdx;
                    x += sx;
                } else {
                    tMaxY += tdy;
                    y += sy;
                }
                tileHash[this.toID(x, y, maxZoom)] = true;
                if (ring && y !== prevY) ring.push([x, y]);
                prevX = x;
                prevY = y;
            }
        }

        if (ring && y === ring[0][1]) ring.pop();
    }

    appendHashTiles(hash, tiles) {
        var keys = Object.keys(hash);
        for (var i = 0; i < keys.length; i++) {
            tiles.push(this.fromID(+keys[i]));
        }
    }

    toID(x, y, z) {
        var dim = 2 * (1 << z);
        return ((dim * y + x) * 32) + z;
    }

    fromID(id) {
        var z = id % 32,
            dim = 2 * (1 << z),
            xy = ((id - z) / 32),
            x = xy % dim,
            y = ((xy - x) / dim) % dim;
        return [x, y, z];
    }
}
