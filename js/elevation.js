const surface_mapping = {
    'missing': { text: document.getElementById('missing-text').innerText, color: '#d1d1d1' },
    'paved': { text: document.getElementById('paved-text').innerText, color: '#8c8c8c' },
    'unpaved': { text: document.getElementById('unpaved-text').innerText, color: '#6b443a' },
    'asphalt': { text: document.getElementById('asphalt-text').innerText, color: '#8c8c8c' },
    'concrete': { text: document.getElementById('concrete-text').innerText, color: '#8c8c8c' },
    'chipseal': { text: document.getElementById('chipseal-text').innerText, color: '#8c8c8c' },
    'cobblestone': { text: document.getElementById('cobblestone-text').innerText, color: '#ffd991' },
    'unhewn_cobblestone': { text: document.getElementById('unhewn-cobblestone-text').innerText, color: '#ffd991' },
    'paving_stones': { text: document.getElementById('paving-stones-text').innerText, color: '#8c8c8c' },
    'stepping_stones': { text: document.getElementById('stepping-stones-text').innerText, color: '#c7b2db' },
    'sett': { text: document.getElementById('sett-text').innerText, color: '#ffd991' },
    'metal': { text: document.getElementById('metal-text').innerText, color: '#8c8c8c' },
    'wood': { text: document.getElementById('wood-text').innerText, color: '#6b443a' },
    'compacted': { text: document.getElementById('compacted-text').innerText, color: '#ffffa8' },
    'fine_gravel': { text: document.getElementById('fine-gravel-text').innerText, color: '#ffffa8' },
    'gravel': { text: document.getElementById('gravel-text').innerText, color: '#ffffa8' },
    'pebblestone': { text: document.getElementById('pebblestone-text').innerText, color: '#ffffa8' },
    'rock': { text: document.getElementById('rock-text').innerText, color: '#ffd991' },
    'dirt': { text: document.getElementById('dirt-text').innerText, color: '#ffffa8' },
    'ground': { text: document.getElementById('ground-text').innerText, color: '#6b443a' },
    'earth': { text: document.getElementById('earth-text').innerText, color: '#6b443a' },
    'snow': { text: document.getElementById('snow-text').innerText, color: '#bdfffc' },
    'ice': { text: document.getElementById('ice-text').innerText, color: '#bdfffc' },
    'salt': { text: document.getElementById('salt-text').innerText, color: '#b6c0f2' },
    'mud': { text: document.getElementById('mud-text').innerText, color: '#6b443a' },
    'sand': { text: document.getElementById('sand-text').innerText, color: '#ffffc4' },
    'woodchips': { text: document.getElementById('woodchips-text').innerText, color: '#6b443a' },
    'grass': { text: document.getElementById('grass-text').innerText, color: '#61b55c' },
    'grass_paver': { text: document.getElementById('grass-paver-text').innerText, color: '#61b55c' }
};

const slope_mapping = {
    '-6': { text: '<-25%', color: '#046307', min: -Infinity, max: -25.5 },
    '-5': { text: '[-25,-17]%', color: '#028306', min: -25.5, max: -16.5 },
    '-4': { text: '[-16,-13]%', color: '#2AA12E', min: -16.5, max: -12.5 },
    '-3': { text: '[-12,-9]%', color: '#53BF56', min: -12.5, max: -8.5 },
    '-2': { text: '[-8,-5]%', color: '#7BDD7E', min: -8.5, max: -4.5 },
    '-1': { text: '[-4,-2]%', color: '#A4FBA6', min: -4.5, max: -1.5 },
    '0': { text: '[-1,1]%', color: '#edf0bd', min: -1.5, max: 1.5 },
    '1': { text: '[2,4]%', color: '#ffcc99', min: 1.5, max: 4.5 },
    '2': { text: '[5,8]%', color: '#F29898', min: 4.5, max: 8.5 },
    '3': { text: '[9,12]%', color: '#E07575', min: 8.5, max: 12.5 },
    '4': { text: '[13,16]%', color: '#CF5352', min: 12.5, max: 16.5 },
    '5': { text: '[17,25]%', color: '#BE312F', min: 16.5, max: 25.5 },
    '6': { text: '>25%', color: '#AD0F0C', min: 25.5, max: Infinity }
};

const surface_key = document.getElementById('surface-text').innerText;
const slope_key = document.getElementById('slope-text').innerText;

const mappings = {};
mappings[surface_key] = surface_mapping;
mappings[slope_key] = slope_mapping;

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
    _drawRectangle: function (start,end) {
        if(this._originalData && this._startCircle) {
            const pt1 = this._originalData[this.options.selectedAttributeIdx][start];
            const pt2 = this._originalData[this.options.selectedAttributeIdx][end];
            this._startCircle.setLatLng(pt1);
            this._endCircle.setBounds([pt2, pt2]);
            this._drawDragRectangleHelper(
                start / (this._originalData[this.options.selectedAttributeIdx].length-1) * this._svgWidth,
                end / (this._originalData[this.options.selectedAttributeIdx].length-1) * this._svgWidth
            );
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
