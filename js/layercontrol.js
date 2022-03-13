const icon_folded = '<i class="fas fa-caret-right"></i>';
const icon_unfolded = '<i class="fas fa-caret-down"></i>';

L.Control.Layers.include({
    __initialize: L.Control.Layers.prototype.initialize,
    __addItem: L.Control.Layers.prototype._addItem,

    initialize: function (baselayersHierarchy, overlaysHierarchy, options) {
        this._baselayersHierarchy = baselayersHierarchy;
        this._overlaysHierarchy = overlaysHierarchy;

        this.__initialize(this._getLayers(baselayersHierarchy), this._getLayers(overlaysHierarchy), options);
    },

    _getLayers: function (hierarchy) {
        return this._findLayers(hierarchy, []);
    },

    _findLayers: function (obj, parents) {
        const layers = {};

        if (obj) {
            Object.keys(obj).forEach(key => {
                if (obj[key] instanceof L.Layer) {
                    layers[key] = obj[key];
                    layers[key]._parents = parents;
                } else {
                    const newParents = parents.slice(0);
                    newParents.push(key);
                    const otherLayers = this._findLayers(obj[key], newParents);

                    Object.keys(otherLayers).forEach(name => {
                        layers[name] = otherLayers[name];
                    });
                }
            });
        }

        return layers;
    },

    getLayerId: function(layer) {
        for (var i=0; i<this._layers.length; i++) {
            if (this._layers[i].layer == layer) {
                return i;
            }
        }
    },

    showLayer: function(layerId) {
        var obj = this._layers[layerId];
        for (var i=0; i<obj.domParents.length; i++) {
            if (!obj.domParents[i]._toggled) {
                var span = obj.domParents[i].children[0];
                span.click();
            }
        }
    },

    _update: function () {
        if (!this._container) { return this; }

		L.DomUtil.empty(this._baseLayersList);
		L.DomUtil.empty(this._overlaysList);

        // >
        this._addHierarchy(this._baselayersHierarchy, this._baseLayersList, 0);
        this._addHierarchy(this._overlaysHierarchy, this._overlaysList, 0);
        // <

		this._layerControlInputs = [];
		var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;

		for (i = 0; i < this._layers.length; i++) {
			obj = this._layers[i];
			const node = this._addItem(obj);
			overlaysPresent = overlaysPresent || obj.overlay;
			baseLayersPresent = baseLayersPresent || !obj.overlay;
			baseLayersCount += !obj.overlay ? 1 : 0;
		}

		// Hide base layers section if there's only one layer.
		if (this.options.hideSingleBase) {
			baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
			this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
		}

		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

		return this;
    },

    _addHierarchy: function (obj, parent, count) {
        if (obj) {
            Object.keys(obj).forEach(key => {
                if (!(obj[key] instanceof L.Layer)) {
                    const div = L.DomUtil.create('div');
                    div._toggled = false;
                    if (parent != this._baseLayersList && parent != this._overlaysList) {
                        div.style.display = 'none';
                        div.style.paddingLeft = '10px';
                    }

                    const span = L.DomUtil.create('span', 'custom-button dontselect');
                    span.innerHTML = icon_folded + ' ' + key;

                    L.DomEvent.on(span, 'click', function () {
                        div._toggled = !div._toggled;
                        span.innerHTML = (div._toggled ? icon_unfolded : icon_folded) + ' ' + key;
                        for (var i=0; i<div.children.length; i++) {
                            if (div.children[i].tagName == 'SPAN') continue;
                            div.children[i].style.display = div._toggled ? '' : 'none';
                        }
                    });

                    div.appendChild(span);
                    parent.appendChild(div);

                    this._addHierarchy(obj[key], div, count+1);
                }
            });
        }
    },

    _addItem: function (obj) {
        const node = this.__addItem(obj);
        obj.domParents = [];
        if (obj.layer._parents.length > 0) node.style.display = 'none';

        var parentNode = obj.overlay ? this._overlaysList : this._baseLayersList;
        for (var i=0; i<obj.layer._parents.length; i++) {
            const parentName = obj.layer._parents[i];

            for (var j=0; j<parentNode.children.length; j++) {
                if (parentNode.children[j].children.length == 0) continue;
                const elementName = parentNode.children[j].children[0].innerText.trimStart();
                if (parentName == elementName) {
                    parentNode = parentNode.children[j];
                    obj.domParents.push(parentNode);
                    break;
                }
            }
        }

        parentNode.appendChild(node);
    }
});
