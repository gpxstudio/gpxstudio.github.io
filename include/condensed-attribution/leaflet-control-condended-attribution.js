/*
 * @class Control.CondensedAttribution
 * @aka L.Control.CondensedAttribution
 * @inherits L.Control.Attribution
 */

L.Control.CondensedAttribution = L.Control.Attribution.extend({
  options: {
    emblem: '?',
  },
  onAdd: function (map) {
    var vMaj = parseInt(L.version.split('.')[0]);
    if (vMaj >= 1){
      // Leaflet 1
      map.attributionControl = this;
    }

    this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
    if (L.DomEvent) {
      L.DomEvent.disableClickPropagation(this._container);
    }

    for (var i in map._layers) {
      if (map._layers[i].getAttribution) {
        this.addAttribution(map._layers[i].getAttribution());
      }
    }

    if (vMaj < 1) {
      // Leaflet sub 1
      map
		    .on('layeradd', this._onLayerAdd, this)
		    .on('layerremove', this._onLayerRemove, this);
    }

    this._update();

    L.DomUtil.addClass(this._container, 'leaflet-condensed-attribution');

    return this._container;
	},
  _update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = '<div class="attributes-body">' +
                                prefixAndAttribs.join(' | ') +
                                '</div><div class="attributes-emblem">' +
                                this.options.emblem + '</div>';
	}
});

// override standard attribution if including the plugin
// set default to include CondensedAttribution
L.Map.mergeOptions({
  attributionControl: false,
  condensedAttributionControl: true
});

// if including, add to map
L.Map.addInitHook(function() {
  if (this.options.condensedAttributionControl) {
    new L.Control.CondensedAttribution().addTo(this);
  }
});

// @namespace Control.CondensedAttribution
// @factory L.control.condensedAttribution(options: Control.CondensedAttribution options)
// Creates a condensed attribution control.
L.control.condensedAttribution = function(options) {
  return new L.Control.CondensedAttribution(options);
};
