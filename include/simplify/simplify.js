/**
 * (c) 2015, Anders Goettsche
 *
 * https://github.com/geonome/simplify2-js

Copyright (c) 2012, Anders Goettsche
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */
(function (name, definition) {
    if (typeof module !== 'undefined') {
        module.exports = definition.apply();
    } else if (typeof define === 'function' && define.amd) {
        define(name, [], definition);
    } else {
        window[name] = definition.apply();
    }
})('simplify', function () {
    'use strict';

    function _appendIfNotSame(points, point) {
        var p = points[points.length - 1];
        if (p.lat != point.lat || p.lng != point.lng) {
            points.push(point);
        }
    }

    function _simplifyRadialDist(points, simplifiedPoints, tolerance2) {
        var length = points.length,
            i,
            pl = points[0],
            pi,
            dx,
            dy,
            r;

        simplifiedPoints.push(pl);
        for (i = 1; i < length; i++) {
            pi = points[i];

            dx = pl.lat - pi.lat;
            r = tolerance2 - dx * dx;
            if (r >= 0) {
                dy = pl.lng - pi.lng;
                if (r - dy * dy < 0) {
                    simplifiedPoints.push(pi);
                    pl = pi;
                }
            } else {
                simplifiedPoints.push(pi);
                pl = pi;
            }
        }

        _appendIfNotSame(simplifiedPoints, pi);

        return simplifiedPoints;
    }

    function _simplifyDouglasPeucker(points, simplifiedPoints, tolerance2, t0, t1) {
        var maxD = tolerance2,
            p0 = points[t0],
            p1 = points[t1],
            x0 = p0.lat,
            y0 = p0.lng,
            dx = p1.lat - x0,
            dy = p1.lng - y0,
            d2,
            id2,
            maxIdx,
            d,
            p,
            i,
            s;

        if (dx === 0 && dy === 0) {
            if (t1 > t0 + 1) {
                var m = (t0 + t1) >> 1;
                _simplifyDouglasPeucker(points, simplifiedPoints, tolerance2, t0, m);
                _appendIfNotSame(simplifiedPoints, points[m]);
                _simplifyDouglasPeucker(points, simplifiedPoints, tolerance2, m, t1);
            }
            return;
        }

        d2 = dx * dx + dy * dy;
        id2 = 1 / d2;
        for (i = t0; i <= t1; i++) {
            p = points[i];
            s = dx * (y0 - p.lng) + dy * (p.lat - x0);
            d = s * s * id2;

            if (d > maxD) {
                maxIdx = i;
                maxD = d;
            }
        }

        if (maxD > tolerance2) {
            _simplifyDouglasPeucker(points, simplifiedPoints, tolerance2, t0, maxIdx);
            simplifiedPoints.push(points[maxIdx]);
            _simplifyDouglasPeucker(points, simplifiedPoints, tolerance2, maxIdx, t1);
        }
    }

    return {
        /**
         * Simplifies the input points by only picking the ones separated by the specified tolerance distance.
         *
         * @param points the input points.
         * @param tolerance the tolerance distance.
         * @returns {[]} a new array holding the simplified points.
         */
        radialDistance: function (points, tolerance) {
            return (points && points.length > 1 && tolerance > 0) ? _simplifyRadialDist(points, [], tolerance * tolerance) : points;
        },

        /**
         * Simplifies the input points using the Ramer-Douglas-Peucker algorithm using the specified tolerance distance.
         *
         * @param points the input points.
         * @param tolerance the tolerance distance.
         * @returns {[]} a new array holding the simplified points.
         */
        douglasPeucker: function (points, tolerance) {
            if (points && points.length > 1 && tolerance > 0) {
                var sPoints = [];
                sPoints.push(points[0]);
                _simplifyDouglasPeucker(points, sPoints, tolerance * tolerance, 0, points.length - 1);
                _appendIfNotSame(sPoints, points[points.length - 1]);
                return sPoints;
            }
            return points;
        },

        /**
         * Simplifies the input points first using a radial distance simplification followed by a
         * douglas-peucker simplification.
         *
         * @param points the input points.
         * @param tolerance the tolerance distance.
         * @returns {[]} a new array holding the simplified points.
         */
        radialDistanceAndDouglasPeucker: function (points, tolerance) {
            return this.douglasPeucker(this.radialDistance(points, tolerance), tolerance);
        }
    };
});
