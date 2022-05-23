const icon_folded = '<i class="fas fa-caret-right"></i>';
const icon_unfolded = '<i class="fas fa-caret-down"></i>';

L.Control.Layers.include({
    __initialize: L.Control.Layers.prototype.initialize,
    __addItem: L.Control.Layers.prototype._addItem,
    __onAdd: L.Control.Layers.prototype.onAdd,

    initialize: function (baselayersHierarchy, overlaysHierarchy, options) {
        this._baselayersHierarchy = baselayersHierarchy;
        this._overlaysHierarchy = overlaysHierarchy;

        this.__initialize(this._getLayers(baselayersHierarchy), this._getLayers(overlaysHierarchy), options);
    },

    addLayer: function (layer, parents, overlay) {
        var current = overlay ? this._overlaysHierarchy : this._baselayersHierarchy;
        for (var i=0; i<parents.length; i++) {
            if (i == parents.length-1) current[parents[i]] = layer;
            else if (!current.hasOwnProperty(parents[i])) current[parents[i]] = {};
            current = current[parents[i]];
        }

        this.__initialize(this._getLayers(this._baselayersHierarchy), this._getLayers(this._overlaysHierarchy), this.options);
        this._update();
    },

    removeLayer: function (parents, overlay) {
        var current = overlay ? this._overlaysHierarchy : this._baselayersHierarchy;
        for (var i=0; i<parents.length; i++) {
            if (i == parents.length-1) delete current[parents[i]];
            else current = current[parents[i]];
        }
        current = current.parent;
        for (var i=parents.length-2; i>=0; i--) {
            if (Object.keys(current[parents[i]]).length == 1) delete current[parents[i]];
            else break;
            current = current.parent;
        }

        this.__initialize(this._getLayers(this._baselayersHierarchy), this._getLayers(this._overlaysHierarchy), this.options);
        this._update();
    },

    onAdd: function (map) {
        this.__onAdd(map);

        if (this.options.editable) this._addLayerSelectionButton();

        return this._container;
    },

    _getLayers: function (hierarchy) {
        return this._findLayers(hierarchy, []);
    },

    _findLayers: function (obj, parents) {
        const layers = {};

        if (obj) {
            Object.keys(obj).forEach(key => {
                if (key == 'parent') return;

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
        var parent = obj.overlay ? this._overlaysDivHierarchy : this._baselayersDivHierarchy;
        for (var i=0; i<obj.layer._parents.length; i++) {
            parent = parent[obj.layer._parents[i]];
            if (!parent.toggled) parent.div.children[0].click();
        }
    },

    _update: function () {
        if (!this._container) { return this; }

		L.DomUtil.empty(this._baseLayersList);
		L.DomUtil.empty(this._overlaysList);

        // >
        this._baselayersDivHierarchy = { toggled: true, visible: true };
        this._overlaysDivHierarchy = { toggled: true, visible: true };
        this._addHierarchy(this._baselayersHierarchy, this._baseLayersList, 0, this._baselayersDivHierarchy);
        this._addHierarchy(this._overlaysHierarchy, this._overlaysList, 0, this._overlaysDivHierarchy);
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

    _addHierarchy: function (obj, parent, count, hierarchy) {
        const _this = this;
        if (obj) {
            Object.keys(obj).forEach(key => {
                if (key == 'parent') return;

                if (!(obj[key] instanceof L.Layer)) {
                    const div = L.DomUtil.create('div');
                    if (count > 0) {
                        div.style.display = 'none';
                        div.style.paddingLeft = '10px';
                    }

                    const span = L.DomUtil.create('span', 'custom-button dontselect');
                    span.innerHTML = icon_folded + ' ' + key;

                    hierarchy[key] = { div: div, toggled: false, visible: true };

                    L.DomEvent.on(span, 'click', function () {
                        hierarchy[key].toggled = !hierarchy[key].toggled;
                        span.innerHTML = (hierarchy[key].toggled ? icon_unfolded : icon_folded) + ' ' + key;

                        Object.keys(obj[key]).forEach(child => {
                            if (child == 'parent') return;
                            if (hierarchy[key][child].visible) {
                                hierarchy[key][child].div.style.display = hierarchy[key].toggled ? '' : 'none';
                            }
                        });

                        if (_this._isExpanded()) _this.expand();
                    });

                    div.appendChild(span);
                    parent.appendChild(div);

                    this._addHierarchy(obj[key], div, count+1, hierarchy[key]);
                }
            });
        }
    },

    _addItem: function (obj) {
        const node = this.__addItem(obj);
        obj.domParents = [];
        if (obj.layer._parents.length > 0) node.style.display = 'none';

        var parent = obj.overlay ? this._overlaysDivHierarchy : this._baselayersDivHierarchy;
        for (var i=0; i<obj.layer._parents.length; i++) {
            parent = parent[obj.layer._parents[i]];
        }
        if (parent.div) parent.div.appendChild(node);
        parent[obj.name] = { div: node, visible: true };
    },

    _addLayerSelectionButton: function () {
        if (this._layer_selection_button) return;
        this._layer_selection_button = L.DomUtil.create('i', 'fa-solid fa-gear custom-button');
        this._layer_selection_button.style.position = 'absolute';
        this._layer_selection_button.style.top = '2px';
        this._layer_selection_button.style.right = '-3px';
        this._section.appendChild(this._layer_selection_button);
    },

    _addLayerSelectionContent: function (parent) {
        this._layerSelectionContainer = parent;
        this._checkboxCount = 0;
        this._baselayersCheckboxHierarchy = {};
        this._overlaysCheckboxHierarchy = {};
        this._addSelectionHierarchy(this._baselayersHierarchy, this._baselayersDivHierarchy, parent, 0, this._baselayersCheckboxHierarchy);
        this._addSelectionHierarchy(this._overlaysHierarchy, this._overlaysDivHierarchy, parent, 0, this._overlaysCheckboxHierarchy);

        parent.style.textAlign = 'left';
    },

    _addSelectionHierarchy: function (obj, divHierarchy, parent, count, hierarchy) {
        const _this = this;
        if (obj) {
            Object.keys(obj).forEach(key => {
                if (key == 'parent') return;

                const div = L.DomUtil.create('div');
                parent.appendChild(div);
                div.style.paddingLeft = '10px';
                if (count > 1) {
                    div.style.display = 'none';
                }

                const span = L.DomUtil.create('span', 'custom-button dontselect');
                div.appendChild(span);

                const checkbox = L.DomUtil.create('input');
                span.appendChild(checkbox);
                checkbox.type = 'checkbox';
                checkbox.id = 'checkbox-layer-'+this._checkboxCount++;
                checkbox.checked = (count == 0 || hierarchy.checkbox.checked) && divHierarchy[key].visible;

                const label = L.DomUtil.create('label');
                span.appendChild(label);
                label.innerText = key;
                label.htmlFor = checkbox.id;

                hierarchy[key] = { checkbox: checkbox, span: span, parent: hierarchy, toggled: false };
                obj[key].parent = obj;

                if (!(obj[key] instanceof L.Layer)) {
                    const icon = L.DomUtil.create('span');
                    span.insertBefore(icon, checkbox);
                    icon.innerHTML = count > 0 ? icon_folded : icon_unfolded;

                    L.DomEvent.on(icon, 'click', function () {
                        hierarchy[key].toggled = !hierarchy[key].toggled;
                        icon.innerHTML = hierarchy[key].toggled ? icon_unfolded : icon_folded;
                        for (var i=1; i<div.children.length; i++) {
                            div.children[i].style.display = hierarchy[key].toggled ? '' : 'none';
                        }
                    });

                    this._addSelectionHierarchy(obj[key], divHierarchy[key], div, count+1, hierarchy[key]);
                }

                L.DomEvent.on(checkbox, 'change', function () {
                    const children_boxes = div.getElementsByTagName('input');
                    for (var i=0; i<children_boxes.length; i++) children_boxes[i].checked = checkbox.checked;

                    var current = obj;
                    var currentCheckbox = hierarchy;
                    while (current.parent) {
                        var checked = false;
                        Object.keys(current).forEach(key => {
                            if (key == 'parent') return;
                            checked = checked || currentCheckbox[key].checkbox.checked;
                        });
                        currentCheckbox.checkbox.checked = checked;
                        current = current.parent;
                        currentCheckbox = currentCheckbox.parent;
                    }
                });
            });
        }
    },

    _getSelectedBaselayersHierarchy: function () {
        const hierarchy = {};
        this._getSelectedHierarchy(this._baselayersHierarchy, this._baselayersCheckboxHierarchy, hierarchy);
        return hierarchy;
    },

    _getSelectedOverlaysHierarchy: function () {
        const hierarchy = {};
        this._getSelectedHierarchy(this._overlaysHierarchy, this._overlaysCheckboxHierarchy, hierarchy);
        return hierarchy;
    },

    _getSelectedHierarchy: function (layersHierarchy, checkboxHierarchy, outputHierarchy) {
        if (layersHierarchy) {
            Object.keys(layersHierarchy).forEach(key => {
                if (key == 'parent') return;
                if (checkboxHierarchy[key].checkbox.checked) {
                    if (layersHierarchy[key] instanceof L.Layer) outputHierarchy[key] = true;
                    else {
                        outputHierarchy[key] = {};
                        this._getSelectedHierarchy(layersHierarchy[key], checkboxHierarchy[key], outputHierarchy[key]);
                    }
                }
            });
        }
    },

    applySelections: function (selectedBaselayersHierarchy, selectedOverlaysHierarchy) {
        this._applySelection(this._baselayersHierarchy, selectedBaselayersHierarchy, this._baselayersDivHierarchy);
        this._applySelection(this._overlaysHierarchy, selectedOverlaysHierarchy, this._overlaysDivHierarchy);
    },

    _applySelection: function (layersHierarchy, selectedHierarchy, divHierarchy, count) {
        Object.keys(layersHierarchy).forEach(key => {
            if (key == 'parent') return;
            if (selectedHierarchy.hasOwnProperty(key)) {
                divHierarchy[key].visible = true;
                divHierarchy[key].div.style.display = divHierarchy.toggled ? '' : 'none';
                if (!(layersHierarchy[key] instanceof L.Layer)) {
                    this._applySelection(layersHierarchy[key], selectedHierarchy[key], divHierarchy[key]);
                }
            } else {
                divHierarchy[key].visible = false;
                divHierarchy[key].div.style.display = 'none';
            }
        });
    },

    _isExpanded: function () {
        return this._container.classList.contains('leaflet-control-layers-expanded');
    }

});
