L.Control.Heightgraph.include({
    originalAddData: L.Control.Heightgraph.prototype.addData,
    originalCreateFocus: L.Control.Heightgraph.prototype._createFocus,
    originalShowMapMarker: L.Control.Heightgraph.prototype._showMapMarker,
    originalResetDrag: L.Control.Heightgraph.prototype._resetDrag,
    addFeature: function(featureCollection, points, attributeType) {
        if (!this._mappings.Surface.hasOwnProperty(attributeType)) attributeType = 'other';
        featureCollection[0].features.push({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": points
            },
            "properties": {
                "attributeType": attributeType
            }
        });
        featureCollection[0].properties.records++;
    },
    addData: function(data) {
        this._originalData = [];
        const featureCollection = [{
            "type": "FeatureCollection",
            "features": [],
            "properties": {
                "records": 0,
                "summary": "Surface"
            }
        }];
        for (var i=0; i<data.length; i++) {
            var points = [], attributeType = null, lastPoint = null;
            for (var j=0; j<data[i].length; j++) {
                const latlng = data[i][j];
                if (attributeType == null) {
                    attributeType = latlng.meta.surface;
                    points.push([latlng.lng, latlng.lat, latlng.meta.ele]);
                    this._originalData.push(latlng);
                } else if (attributeType == latlng.meta.surface) {
                    points.push([latlng.lng, latlng.lat, latlng.meta.ele]);
                    this._originalData.push(latlng);
                } else {
                    this.addFeature(featureCollection, points, attributeType);
                    points = [points[points.length-1], [latlng.lng, latlng.lat, latlng.meta.ele]];
                    this._originalData.push(this._originalData[this._originalData.length-1]);
                    this._originalData.push(latlng);
                    attributeType = latlng.meta.surface;
                }
            }
            if (points.length > 0) this.addFeature(featureCollection, points, attributeType);
        }
        this.originalAddData(featureCollection);
        this._addSliderCircles();
    },
    _showMapMarker: function(ll, height, type) {
        this.originalShowMapMarker(ll, height, type);
        this._mouseHeightFocus.remove();
        this._mouseHeightFocusLabel.remove();
        this._pointG.style('fill','#33bbff');
        this._pointG.style('stroke','#ffffff');
        this._pointG.style('stroke-width','2');
        this._pointG.select('circle').attr('r',6);
    },
    _createFocus: function () {
        if (this._originalData && this._originalData.length > 0) {
            this.originalCreateFocus();
        }
    },
    _createHorizontalLine: function () {},
    _createLegend: function () {},
    _createSelectionBox: function () {},
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
                "summary": "Surface"
            }
        }]);
        this._removeSliderCircles();
    },
    _addSliderCircles:function(){
        if(this._originalData && this._originalData.length > 0) {
            const pt1 = this._originalData[0];
            const pt2 = this._originalData[this._originalData.length - 1];
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
    _drawRectangle: function (start,end) {
        if(this._originalData && this._startCircle) {
            const pt1 = this._originalData[start];
            const pt2 = this._originalData[end];
            this._startCircle.setLatLng(pt1);
            this._endCircle.setBounds([pt2, pt2]);
            this._drawDragRectangleHelper(
                start / (this._originalData.length-1) * this._svgWidth,
                end / (this._originalData.length-1) * this._svgWidth
            );
        }
    },
    _resetDrag: function() {
        this.originalResetDrag(true);
        if(this._originalData && this._originalData.length > 0) {
            const pt1 = this._originalData[0];
            const pt2 = this._originalData[this._originalData.length - 1];
            if (this._startCircle) {
                this._startCircle.setLatLng(pt1);
                this._endCircle.setBounds([pt2, pt2]);
            }
        }
    }
});
