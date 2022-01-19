const surface_key = document.getElementById('surface-text').innerText;
const slope_key = document.getElementById('slope-text').innerText;

const mappings = {};
mappings[surface_key] = window.surface_mapping;
mappings[slope_key] = window.slope_mapping;

function slope_to_interval(slope) {
    for (const [key, value] of Object.entries(mappings[slope_key])) {
        if (slope >= value.min && slope < value.max) {
            return key;
        }
    }
}

L.Control.Heightgraph.include({
    originalAddData: L.Control.Heightgraph.prototype.addData,
    originalCreateFocus: L.Control.Heightgraph.prototype._createFocus,
    originalShowMapMarker: L.Control.Heightgraph.prototype._showMapMarker,
    originalResetDrag: L.Control.Heightgraph.prototype._resetDrag,
    addFeature: function(featureCollection, points, attributeType) {
        if (!this._mappings[surface_key].hasOwnProperty(attributeType) &&
            !this._mappings[slope_key].hasOwnProperty(attributeType)) attributeType = 'missing';
        featureCollection.features.push({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": points
            },
            "properties": {
                "attributeType": attributeType
            }
        });
        featureCollection.properties.records++;
    },
    addData: function(data) {
        this.options.mappings = mappings;

        if (data.length == 0) {
            this.clear();
            return;
        }

        this._originalData = [[],[]];
        const featureCollections = [{
            "type": "FeatureCollection",
            "features": [],
            "properties": {
                "records": 0,
                "summary": surface_key
            }
        },{
            "type": "FeatureCollection",
            "features": [],
            "properties": {
                "records": 0,
                "summary": slope_key
            }
        }];

        for (var i=0; i<data.length; i++) {
            var surfaceTypePoints = [], steepnessTypePoints = [], surfaceType = null, steepnessType = null;

            for (var j=0; j<data[i].length; j++) {
                const latlng = data[i][j];

                // surface
                if (surfaceType == null) {
                    surfaceType = latlng.meta.surface;
                    surfaceTypePoints.push([latlng.lng, latlng.lat, latlng.meta.ele]);
                    this._originalData[0].push(latlng);
                } else if (surfaceType == latlng.meta.surface) {
                    surfaceTypePoints.push([latlng.lng, latlng.lat, latlng.meta.ele]);
                    this._originalData[0].push(latlng);
                } else {
                    this.addFeature(featureCollections[0], surfaceTypePoints, surfaceType);
                    surfaceTypePoints = [surfaceTypePoints[surfaceTypePoints.length-1], [latlng.lng, latlng.lat, latlng.meta.ele]];
                    this._originalData[0].push(this._originalData[0][this._originalData[0].length-1]);
                    this._originalData[0].push(latlng);
                    surfaceType = latlng.meta.surface;
                }

                const steepness = slope_to_interval(latlng.meta.slope);
                // steepness
                if (steepnessType == null) {
                    steepnessType = steepness;
                    steepnessTypePoints.push([latlng.lng, latlng.lat, latlng.meta.ele]);
                    this._originalData[1].push(latlng);
                } else if (steepnessType == steepness) {
                    steepnessTypePoints.push([latlng.lng, latlng.lat, latlng.meta.ele]);
                    this._originalData[1].push(latlng);
                } else {
                    this.addFeature(featureCollections[1], steepnessTypePoints, steepnessType);
                    steepnessTypePoints = [steepnessTypePoints[steepnessTypePoints.length-1], [latlng.lng, latlng.lat, latlng.meta.ele]];
                    this._originalData[1].push(this._originalData[1][this._originalData[1].length-1]);
                    this._originalData[1].push(latlng);
                    steepnessType = steepness;
                }
            }

            if (surfaceTypePoints.length > 0) this.addFeature(featureCollections[0], surfaceTypePoints, surfaceType);
            if (steepnessTypePoints.length > 0) this.addFeature(featureCollections[1], steepnessTypePoints, steepnessType);
        }

        this.originalAddData(featureCollections);
        this._addSliderCircles();
    },
    _showMapMarker: function(ll, height, type) {
        if (ll.lat == 0 && ll.lng == 0) return;
        this.originalShowMapMarker(ll, height, type);
        this._mouseHeightFocus.remove();
        this._mouseHeightFocusLabel.remove();
        this._pointG.style('fill','#33bbff');
        this._pointG.style('stroke','#ffffff');
        this._pointG.style('stroke-width','2');
        this._pointG.select('circle').attr('r',6);
    },
    _createHorizontalLine: function () {},
    _createLegend: function () {},
    _dragHandler: function () {},
    _dragStartHandler: function () {},
    _dragEndHandler: function () {},
    clear: function() {
        this.originalAddData([{
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[0,0,0]]
                },
                "properties": {
                    "attributeType": "missing"
                }
            }],
            "properties": {
                "records": 1,
                "summary": surface_key
            }
        },{
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[0,0,0]]
                },
                "properties": {
                    "attributeType": "0"
                }
            }],
            "properties": {
                "records": 1,
                "summary": slope_key
            }
        }]);
        this._removeSliderCircles();
    },
    _addSliderCircles:function(){
        if(this._originalData && this._originalData[this.options.selectedAttributeIdx].length > 0) {
            const pt1 = this._originalData[this.options.selectedAttributeIdx][0];
            const pt2 = this._originalData[this.options.selectedAttributeIdx][this._originalData[this.options.selectedAttributeIdx].length - 1];
            if (!this._startCircle) {
                this._startCircle = L.circleMarker(pt1, {
                    className: 'start-marker',
                    radius: 6
                });
                this._startCircle.addTo(this._map);
                this._startCircle.bringToFront();
                this._endCircle = L.imageOverlay('/res/end.png', [pt2, pt2], {zIndex:1200});
                this._endCircle.addTo(this._map);
                this._endCircle.getElement().style.border = '2px solid white';
                this._endCircle.getElement().classList.add('dontselect','end-circle');
                this._endCircle.bringToFront();
            } else {
                this._endCircle.setBounds([pt2, pt2]);
            }
        }
    },
    _removeSliderCircles:function(){
        if (this._startCircle) {
            this._startCircle.remove();
            this._endCircle.remove();
            this._startCircle = null;
            this._endCircle = null;
        }
    },
    _drawRectangle: function (rectStart, rectEnd, start,end) {
        if(this._originalData && this._startCircle) {
            const pt1 = this._originalData[this.options.selectedAttributeIdx][start];
            const pt2 = this._originalData[this.options.selectedAttributeIdx][end];
            this._startCircle.setLatLng(pt1);
            this._endCircle.setBounds([pt2, pt2]);
            this._drawDragRectangleHelper(rectStart * this._svgWidth, rectEnd * this._svgWidth);
        }
    },
    _resetDrag: function() {
        this.originalResetDrag(true);
        if(this._originalData && this._originalData[this.options.selectedAttributeIdx].length > 0) {
            const pt1 = this._originalData[this.options.selectedAttributeIdx][0];
            const pt2 = this._originalData[this.options.selectedAttributeIdx][this._originalData[this.options.selectedAttributeIdx].length - 1];
            if (this._startCircle) {
                this._startCircle.setLatLng(pt1);
                this._endCircle.setBounds([pt2, pt2]);
            }
        }
    }
});
