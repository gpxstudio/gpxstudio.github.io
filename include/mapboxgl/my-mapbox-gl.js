L.MapboxGL.prototype.onAdd = function (map) {
    if (!this._container) {
        this._initContainer();
    }

    var paneName = this.getPaneName();
    map.getPane(paneName).appendChild(this._container);

    this._initGL();

    this._offset = this._map.containerPointToLayerPoint([0, 0]);

    // work around https://github.com/mapbox/mapbox-gl-leaflet/issues/47
    if (map.options.zoomAnimation) {
        L.DomEvent.on(map._proxy, L.DomUtil.TRANSITION_END, this._transitionEnd, this);
    }
};

L.MapboxGL.prototype.onRemove = function (map) {
    if (this._map._proxy && this._map.options.zoomAnimation) {
        L.DomEvent.off(this._map._proxy, L.DomUtil.TRANSITION_END, this._transitionEnd, this);
    }
    var paneName = this.getPaneName();
    map.getPane(paneName).removeChild(this._container);
};

L.MapboxGL.prototype._initGL = function () {
    var center = this._map.getCenter();

    var options = L.extend({}, this.options, {
        container: this._container,
        center: [center.lng, center.lat],
        zoom: this._map.getZoom() - 1,
        attributionControl: false
    });

    if (!this._glMap) this._glMap = new mapboxgl.Map(options);
    else {
        this._glMap.setCenter(options.center);
        this._glMap.setZoom(options.zoom);
    }

    // allow GL base map to pan beyond min/max latitudes
    this._glMap.transform.latRange = null;
    this._transformGL(this._glMap);

    if (this._glMap._canvas.canvas) {
        // older versions of mapbox-gl surfaced the canvas differently
        this._glMap._actualCanvas = this._glMap._canvas.canvas;
    } else {
        this._glMap._actualCanvas = this._glMap._canvas;
    }

    // treat child <canvas> element like L.ImageOverlay
    var canvas = this._glMap._actualCanvas;
    L.DomUtil.addClass(canvas, 'leaflet-image-layer');
    L.DomUtil.addClass(canvas, 'leaflet-zoom-animated');
    if (this.options.interactive) {
        L.DomUtil.addClass(canvas, 'leaflet-interactive');
    }
    if (this.options.className) {
        L.DomUtil.addClass(canvas, this.options.className);
    }
}
