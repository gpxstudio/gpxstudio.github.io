const options = {
    async: true,
    marker_options: {
        startIconUrl: '',
        endIconUrl: '',
        shadowUrl: '',
        wptIconUrls: { '': './res/favicon.png' }
    },
    max_point_interval: 10 * 60000,
    gpx_options: {
        joinTrackSegments: false
    }
};
const ELEVATION_ZOOM = 14;
const HOVER_STYLE = 'drop-shadow(1px 0 1px lightblue) drop-shadow(-1px 0 1px lightblue) drop-shadow(0 1px 1px lightblue) drop-shadow(0 -1px 1px lightblue)';
const getSurface = function (message) {
    const fields = message.split(" ");
    for (var i = 0; i < fields.length; i++) if (fields[i].startsWith("surface=")) {
        return fields[i].substr(8);
    }
    return "missing";
};

export default class Trace {
    constructor(file, name, map, total, callback) {
        name = name.split('.');
        if (name.length > 1) name = name.slice(0, -1).join('.');
        else name = name[0];
        this.name = name;
        this.map = map;
        this.total = total;
        this.buttons = total.buttons;
        this.hasFocus = false;
        this.isEdited = false;
        this.drawing = false;
        this.visible = true;
        this.popup = L.popup({ closeButton: false });
        this.renaming = false;
        this.style = { weight: total.style.weight, opacity: total.style.opacity };

        this.memory = [];
        this.at = -1;
        this.lastSaveIsNew = true;
        this.backToZero = false;

        this.gpx = new L.GPX(file, options, this).addTo(map);
        this.gpx.trace = this;

        this.index = total.traces.length;
        total.traces.push(this);

        const trace = this;
        const mergeTrace = function () {
            total.to_merge.merge(trace, total.buttons.merge_as_points.checked, total.buttons.merge_as_segments.checked, total.buttons.merge_as_tracks.checked, total.buttons.merge_stick_time.checked);
            total.removeTrace(trace.index);
            total.to_merge.focus();
        };

        this.gpx.on('error', function (e) {
            console.log(e);
            total.removeTrace(trace.index);
            total.buttons.showLoadErrorPopup();
        }).on('loaded', function (e) {
            var wpts = trace.getWaypoints();
            var wptMissingEle = [];
            for (var i = 0; i < wpts.length; i++) {
                if (wpts[i]._latlng.meta && wpts[i]._latlng.meta.ele == -1) wptMissingEle.push(wpts[i]._latlng);
            }
            if (wptMissingEle.length > 0 && !trace.buttons.embedding) trace.askElevation(wptMissingEle);
            if (this.getLayers().length > 0) total.buttons.updateBounds();

            var colors = trace.getTrackColors();
            if (colors.length == 0) trace.style.color = total.getColor();
            else trace.style.color = colors[0];

            var ul = total.buttons.tabs;
            var li = document.createElement("li");
            li.title = name;
            li.classList.add('tab', 'tab-draggable');
            li.trace = trace;
            li.addEventListener('click', function (e) {
                if (total.to_merge && total.to_merge != trace && total.buttons.window_open == total.buttons.merge_window) mergeTrace();
                else if (!trace.hasFocus) {
                    trace.focus();
                    if (total.buttons.window_open == total.buttons.structure_window && total.buttons.structure_window._wrapper.classList.contains('visible')) total.buttons.structure.click();
                }
            });
            li.addEventListener('dblclick', function (e) {
                if (trace.buttons.embedding) return;
                if (trace.renaming) return;
                trace.renaming = true;

                trace.nameInput = trace.getNameInput(trace.name, function () {
                    trace.rename();
                    trace.tab.children[0].children[1].style.display = '';
                });
                li.appendChild(trace.nameInput);
                trace.nameInput.focus();

                trace.tab.children[0].children[1].style.display = 'none';
            });
            li.addEventListener('mouseover', function () {
                const segments = trace.getSegments();
                for (var s = 0; s < segments.length; s++) {
                    segments[s]._path.style.filter = HOVER_STYLE;
                }
            });
            li.addEventListener('mouseout', function () {
                const segments = trace.getSegments();
                for (var s = 0; s < segments.length; s++) {
                    segments[s]._path.style.filter = '';
                }
            });
            ul.appendChild(li);
            trace.tab = li;
            trace.updateTab();

            total.buttons.circlesToFront();

            trace.extendTimeData(true);
            trace.focus();

            if (total.buttons.multipleEmbedding) trace.updateFocus();

            if (trace.gpx.missing_elevation && (!trace.buttons.embedding || trace.buttons.mapboxSKUToken)) trace.askElevation(trace.getPoints());

            if (callback) callback(trace);
        }).on('click', function (e) {
            if (e.layer.sym) return;
            if (trace.buttons.disable_trace) return;
            if (total.to_merge && total.to_merge != trace && total.buttons.window_open == total.buttons.merge_window) {
                mergeTrace();
                return;
            }
            if (!trace.total.hasFocus && trace.total.focusOn != trace.index && trace.total.traces[trace.total.focusOn].isEdited) return;
            if (!trace.isEdited) {
                trace.updateFocus();
                if (total.buttons.window_open == total.buttons.structure_window && total.buttons.structure_window._wrapper.classList.contains('visible')) total.buttons.structure.click();
            }
            if (trace.isEdited && !trace.buttons.disable_trace) {
                const marker = trace.newEditMarker(e.latlng, e.layer);
                trace.insertEditMarker(marker, e.latlng);
                L.DomEvent.stopPropagation(e);
            }
        }).on('mouseover', function (e) {
            if (trace.buttons.disable_trace) return;
            if (trace.isEdited) {
                if (e.originalEvent.which == 3) return;
                if (e.layer._latlng) return;
                if (!trace.tmpEditMarker) {
                    trace.tmpEditMarker = trace.newEditMarker(e.latlng, e.layer);
                    trace.tmpEditMarker.setZIndexOffset(-10);
                    const layer = e.layer;
                    map.on('mousemove', function (e) {
                        var pt = layer.closestLayerPoint(e.layerPoint);
                        if (pt.distance > 12) {
                            trace.tmpEditMarker.remove();
                            trace.tmpEditMarker = null;
                            map.off('mousemove');
                        } else {
                            trace.tmpEditMarker.setLatLng(map.layerPointToLatLng(pt));
                        }
                    });
                }
            }
        });
        L.DomEvent.on(this.gpx, 'dblclick', L.DomEvent.stopPropagation);

        if (file === undefined) this.gpx.fire('loaded');
    }

    getNameInput(name, callback) {
        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.classList.add("input-minimal");
        nameInput.minlength = 1;
        nameInput.size = name.length;
        nameInput.value = name;
        nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                nameInput.style.display = 'none';
                callback();
            }
        });
        nameInput.addEventListener('focusout', function (e) {
            nameInput.style.display = 'none';
            callback();
        });
        return nameInput;
    }

    rename(name) {
        var newname = name ? name : this.nameInput.value;
        if (newname.length > 0) this.name = newname;
        const tracks = this.getTracks();
        if (tracks.length == 1 && tracks[0].name) tracks[0].name = this.name;
        this.updateTab();
        this.renaming = false;
    }

    updateTab() {
        this.tab.innerHTML = '';
        this.tab.appendChild(this.getTabHTML());
    }

    clone() {
        const newTrace = this.total.addTrace(undefined, this.name);
        newTrace.gpx.addLayer(new L.FeatureGroup());
        newTrace.gpx._info.creator = this.gpx._info.creator;

        const tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) {
            const segments = this.getSegments(tracks[t]);
            var segs = [];
            for (var l = 0; l < segments.length; l++) {
                const points = segments[l]._latlngs;
                const cpy = [];
                for (var i = 0; i < points.length; i++) {
                    const pt = points[i].clone();
                    pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                    if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                    pt.index = points[i].index;
                    pt.routing = points[i].routing;
                    cpy.push(pt);
                }

                if (cpy.length > 0) segs.push(new L.Polyline(cpy));
            }
            if (segs.length > 0) {
                var trk = new L.FeatureGroup(segs);
                trk.style = tracks[t].style;
                if (tracks[t].name) trk.name = tracks[t].name;
                newTrace.gpx.getLayers()[0].addLayer(trk);
            }
        }

        newTrace.recomputeStats();
        newTrace.update();
        newTrace.setStyle(true);
        newTrace.updateTab();
        newTrace.showChevrons();
        newTrace.showDistanceMarkers();

        const waypoints = this.getWaypoints();
        var wpts = [];
        for (var i = 0; i < waypoints.length; i++) {
            const marker = waypoints[i];
            wpts.push(newTrace.gpx._get_marker(marker._latlng, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options));
        }
        if (wpts.length > 0) newTrace.gpx.getLayers()[0].addLayer(new L.FeatureGroup(wpts));

        return newTrace;
    }

    /*** LOGIC ***/

    remove() {
        this.unfocus();
        this.gpx.clearLayers();
        if (this.buttons.tabs.contains(this.tab)) this.buttons.tabs.removeChild(this.tab);
    }

    /*** DISPLAY ***/

    focus() {
        this.total.unfocusAll();
        this.hasFocus = true;
        this.total.focusOn = this.index;
        this.total.hasFocus = false;
        this.setStyle(true);
        this.gpx.bringToFront();
        this.buttons.focusTabElement(this.tab);
        this.showData();
        this.showElevation();
        this.updateExtract();
        if (this.visible) {
            this.buttons.unhideToHide();
            this.showWaypoints();
            this.showChevrons();
            this.showDistanceMarkers();
        } else this.buttons.hideToUnhide();
        if (!this.buttons.embedding) this.tab.scrollIntoView();
    }

    unfocus() {
        this.hasFocus = false;
        this.setStyle(false);
        this.closePopup();
        this.hideWaypoints();
        this.hideChevrons();
        this.hideDistanceMarkers();
        if (this.isEdited) this.stopEdit();
        if (this.drawing) this.stopDraw();
        if (this.renaming) this.rename();
        if (this.buttons.slider.isActive()) this.buttons.slider.reset();
    }

    setStyle(focus) {
        var tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) {
            tracks[t].setStyle(this.getTrackStyle(tracks[t], focus));
        }
    }

    updateStyle() {
        var tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) {
            tracks[t].style = this.gpx._merge_objs(tracks[t].style, this.style);
        }
        this.setStyle(this.hasFocus);
    }

    updateFocus() {
        if (this.hasFocus) {
            this.unfocus();
            this.total.focus();
        } else this.focus();
    }

    update() {
        if (this.hasFocus) {
            this.showData();
            this.showElevation();
            this.updateExtract();
        }
    }

    hideUnhide() {
        this.visible = !this.visible;
        if (this.visible) {
            this.buttons.unhideToHide();
            this.showSegments();
            this.showWaypoints();
            this.showChevrons();
            this.showDistanceMarkers();
            if (this.isEdited) this.updateEditMarkers();
            else this.buttons.elev._addSliderCircles();
        } else {
            this.buttons.hideToUnhide();
            this.hideSegments();
            this.hideWaypoints();
            this.hideChevrons();
            this.hideDistanceMarkers();
            this.removeEditMarkers();
            if (this.buttons.slider.isActive()) this.buttons.slider.reset();
            this.buttons.elev._removeSliderCircles();
        }
    }

    updateUndoRedo() {
        if (this.at >= 0 && !this.backToZero) this.buttons.undo.classList.remove('unselected', 'no-click2');
        else this.buttons.undo.classList.add('unselected', 'no-click2');
        if (this.at < this.memory.length - 1) this.buttons.redo.classList.remove('unselected', 'no-click2');
        else this.buttons.redo.classList.add('unselected', 'no-click2');
    }

    updateExtract() {
        const count = this.getSegments().length;
        if (count < 2) {
            this.buttons.extract.classList.add('unselected', 'no-click');
            this.can_extract = false;
        } else {
            this.buttons.extract.classList.remove('unselected', 'no-click');
            this.can_extract = true;
        }
    }

    showSegments() {
        const segments = this.getSegments();
        for (var i = 0; i < segments.length; i++) {
            segments[i]._path.style.display = '';
        }
    }

    hideSegments() {
        const segments = this.getSegments();
        for (var i = 0; i < segments.length; i++) {
            segments[i]._path.style.display = 'none';
        }
    }

    showWaypoints() {
        const waypoints = this.getWaypoints();
        for (var i = 0; i < waypoints.length; i++) {
            waypoints[i]._icon.style.display = '';
        }
    }

    hideWaypoints() {
        const waypoints = this.getWaypoints();
        for (var i = 0; i < waypoints.length; i++) {
            waypoints[i]._icon.style.display = 'none';
        }
    }

    edit() {
        this.isEdited = true;
        this.updateEditMarkers();
        this.buttons.greyTraceButtons();
        if (this.buttons.slider.isActive()) this.buttons.slider.reset();
        this.buttons.elev._removeSliderCircles();
        this.buttons.editToValidate();
        this.closePopup();

        this.buttons.undo.addEventListener('click', this.undoListener = this.undo.bind(this));
        this.buttons.redo.addEventListener('click', this.redoListener = this.redo.bind(this));
        this.updateUndoRedo();
        this.buttons.showOrHideEditingOptions();
    }

    stopEdit() {
        this.isEdited = false;
        this.removeEditMarkers();
        this.buttons.blackTraceButtons();
        if (this.visible) this.buttons.elev._addSliderCircles();
        this.buttons.validateToEdit();
        this.closePopup();
        this.updateExtract();

        this.buttons.undo.classList.add('unselected');
        this.buttons.redo.classList.add('unselected');
        this.buttons.undo.removeEventListener('click', this.undoListener);
        this.buttons.redo.removeEventListener('click', this.redoListener);
        this.buttons.showOrHideEditingOptions();

        this.memory = [];
        this.at = -1;
    }

    draw() {
        this.edit();
        this.drawing = true;
        this.buttons.map._container.style.cursor = 'crosshair';
        if (this.buttons.mapboxgl_canvas) this.buttons.mapboxgl_canvas.style.cursor = 'crosshair';
    }

    stopDraw() {
        this.buttons.map._container.style.cursor = '';
        if (this.buttons.mapboxgl_canvas) this.buttons.mapboxgl_canvas.style.cursor = '';
        this.drawing = false;
        if (this.getPoints().length == 0) {
            this.total.removeTrace(this.index);
        }
    }

    closePopup() {
        if (this.popup) {
            this.popup.remove();
        }
    }

    redraw() {
        const segments = this.getSegments();
        for (var i = 0; i < segments.length; i++) {
            segments[i].redraw();
        }
    }

    showData() {
        this.buttons.distance.innerHTML = (this.getDistance() / 1000).toFixed(2).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.elevation.innerHTML = '<i class="fas fa-angle-up"></i> ' + this.getElevationGain().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text) +
            ' <i class="fas fa-angle-down"></i> ' + this.getElevationLoss().toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text);
        if (this.buttons.speed_units) this.buttons.speed.innerHTML = this.getMovingSpeed().toFixed(1).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text) + '/' + this.buttons.unit_hours_text;
        else this.buttons.speed.innerHTML = this.total.msToTimeMin(this.getMovingPace()) + ' ' + this.buttons.unit_minutes_text + '/' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        this.buttons.duration.innerHTML = this.total.msToTime(this.getMovingTime());
        this.buttons.points.innerHTML = this.gpx._info.npoints;
        this.buttons.segments.innerHTML = this.gpx._info.nsegments;
        this.buttons.tracks.innerHTML = this.gpx._info.ntracks;
    }

    showElevation() {
        this.buttons.elev.clear();
        this.buttons.elev.options.imperial = !this.buttons.km;
        this.addElevation();
        this.buttons.setElevationProfileWidth();
        if (this.isEdited || !this.visible) this.buttons.elev._removeSliderCircles();
    }

    addElevation(total_points) {
        const segments = this.getSegments();
        var points = [];
        for (var i = 0; i < segments.length; i++) points.push(segments[i]._latlngs);
        this.buttons.elev.addData(points);
    }

    showChevrons() {
        if (this.buttons.show_direction) {
            this.hideChevrons();

            var tracks = this.getTracks();
            for (var t = 0; t < tracks.length; t++) {
                var style = this.getTrackStyle(tracks[t]);
                tracks[t].setText('     ➜     ', {
                    repeat: true,
                    attributes: {
                        fill: style.color,
                        opacity: style.opacity,
                        dy: '5px',
                        'font-size': '14px',
                        style: `text-shadow: 1px 1px 0 white, -1px 1px 0 white, 1px -1px 0 white, -1px -1px 0 white, 0px 1px 0 white, 0px -1px 0 white, -1px 0px 0 white, 1px 0px 0 white, 2px 2px 0 white, -2px 2px 0 white, 2px -2px 0 white, -2px -2px 0 white, 0px 2px 0 white, 0px -2px 0 white, -2px 0px 0 white, 2px 0px 0 white, 1px 2px 0 white, -1px 2px 0 white, 1px -2px 0 white, -1px -2px 0 white, 2px 1px 0 white, -2px 1px 0 white, 2px -1px 0 white, -2px -1px 0 white;
                                -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;`
                    }
                });
            }
        }
    }

    hideChevrons() {
        this.gpx.setText(null);
    }

    showDistanceMarkers() {
        if (this.buttons.show_distance) {
            if (this.buttons.km) this.gpx.addDistanceMarkers();
            else this.gpx.addDistanceMarkers({ offset: 1609.344 });
        }
    }

    hideDistanceMarkers() {
        this.gpx.removeDistanceMarkers();
    }

    getBounds() {
        return this.gpx.getBounds();
    }

    newEditMarker(point, layer) {
        const trace = this;
        const map = this.map;
        const size = this.buttons.isMobile() ? 14 : 9;
        const marker = L.marker([point.lat, point.lng], {
            icon: L.icon({
                iconUrl: '/res/circle.svg',
                iconSize: [size, size]
            }),
            draggable: true
        }).addTo(map);
        marker._pt = point;
        marker._prec = point;
        marker._succ = point;
        marker._layer = layer;
        const insertTmpEditMarker = function () {
            if (marker == trace.tmpEditMarker) {
                trace.insertEditMarker(marker, marker._latlng);
                marker.setZIndexOffset(0);
                trace.tmpEditMarker = null;
                map.off('mousemove');
            }
        };
        const open_popup = function (e) {
            if (trace._editMarkers.length == 1) return;
            insertTmpEditMarker();
            var content = '<div id="close-popup" class="custom-button" style="float: right;"><i class="fas fa-times"></i></div>';
            if (marker != trace._editMarkers[0] && marker != trace._editMarkers[trace._editMarkers.length - 1]) {
                content += `<div id="split-waypoint" class="custom-button popup-action"><i class="fas fa-cut"></i> ` + trace.buttons.split_text + `</div>
                            <div id="start-loop-waypoint" class="custom-button popup-action"><i class="fas fa-undo"></i> `+ trace.buttons.start_loop_text + `</div>`;
            }
            content += `<div id="remove-waypoint" class="custom-button popup-action"><i class="fas fa-trash-alt"></i> ` + trace.buttons.remove_pt_text + `</div>`;

            trace.popup.setContent(content);
            trace.popup.setLatLng(e.latlng);
            trace.popup.openOn(map);
            trace.popup.addEventListener('remove', function (e) {
                trace.closePopup();
            });

            var button = document.getElementById("remove-waypoint");
            button.addEventListener("click", function () {
                trace.deletePoint(marker);
                marker.remove();
                trace.closePopup();
            });

            if (marker != trace._editMarkers[0] && marker != trace._editMarkers[trace._editMarkers.length - 1]) {
                var split = function () {
                    trace.buttons.split_ok.removeEventListener('click', split);
                    trace.buttons.split_cancel.removeEventListener('click', cancel);

                    trace.buttons.split_window.hide();

                    if (trace.buttons.split_as_files.checked) {
                        const copy = trace.clone();
                        copy.total.setTraceIndex(copy.index, trace.index + 1);
                        copy.crop(marker._pt.trace_index, copy.getPoints().length - 1, true);
                        trace.crop(0, marker._pt.trace_index, true);
                    } else if (trace.buttons.split_as_tracks.checked || trace.buttons.split_as_segments.checked) {
                        var tracks = trace.getTracks();
                        for (var t = 0; t < tracks.length; t++) {
                            var segments = trace.getSegments(tracks[t]);
                            var i = segments.indexOf(marker._layer);
                            if (i >= 0) {
                                const rem = segments[i]._latlngs.splice(marker._pt.index);
                                segments[i]._latlngs[segments[i]._latlngs.length - 1].routing = false;
                                rem[0].routing = false;

                                if (trace.buttons.split_as_segments.checked) {
                                    tracks[t].addLayer(new L.Polyline(rem));
                                    for (var j = i + 1; j < segments.length; j++) {
                                        tracks[t].removeLayer(segments[j]);
                                        tracks[t].addLayer(new L.Polyline(segments[j]._latlngs));
                                    }
                                } else {
                                    var segs = [new L.Polyline(rem)];
                                    for (var j = i + 1; j < segments.length; j++) {
                                        tracks[t].removeLayer(segments[j]);
                                        segs.push(new L.Polyline(segments[j]._latlngs));
                                    }
                                    trace.gpx.getLayers()[0].addLayer(new L.FeatureGroup(segs));

                                    for (var j = t + 1; j < tracks.length; j++) {
                                        trace.gpx.getLayers()[0].removeLayer(tracks[j]);
                                        var trk = new L.FeatureGroup(trace.getSegments(tracks[j]));
                                        trk.style = tracks[j].style;
                                        if (tracks[j].name) trk.name = tracks[j].name;
                                        trace.gpx.getLayers()[0].addLayer(trk);
                                    }
                                }

                                break;
                            }
                        }

                        trace.recomputeStats();
                        trace.focus();
                        trace.redraw();
                        trace.update();
                    }

                    trace.draw();
                };
                var cancel = function () {
                    trace.buttons.split_ok.removeEventListener('click', split);
                    trace.buttons.split_cancel.removeEventListener('click', cancel);

                    trace.buttons.split_window.hide();
                };

                var button2 = document.getElementById("split-waypoint");
                button2.addEventListener("click", function () {
                    if (trace.buttons.window_open) trace.buttons.window_open.hide();
                    trace.buttons.window_open = trace.buttons.split_window;
                    trace.buttons.split_window.show();
                    trace.closePopup();

                    trace.buttons.split_ok.addEventListener('click', split);
                    trace.buttons.split_cancel.addEventListener('click', cancel);
                });

                var button3 = document.getElementById("start-loop-waypoint");
                button3.addEventListener("click", function () {
                    trace.setStart(marker._pt.trace_index);
                    trace.closePopup();
                });
            }

            var close = document.getElementById("close-popup");
            close.addEventListener("click", function () {
                trace.closePopup();
            });

            return false;
        };
        marker.on({
            dragstart: function (e) {
                insertTmpEditMarker();
            },
            dragend: function (e) {
                trace.updatePoint(marker, marker._latlng.lat, marker._latlng.lng);
            },
            click: function (e) {
                insertTmpEditMarker();
                if (e.originalEvent.shiftKey) {
                    trace.deletePoint(marker);
                    marker.remove();
                } else {
                    open_popup(e);
                }
                L.DomEvent.stopPropagation(e);
            },
            contextmenu: open_popup
        });
        return marker;
    }

    insertEditMarker(marker, pt) {
        const layer = marker._layer;
        const layer_point = this.map.latLngToLayerPoint(pt);
        const points = layer._latlngs;
        var best_dist = -1, best_idx = -1;
        for (var i = 0; i < points.length - 1; i++) {
            const dist = L.LineUtil.pointToSegmentDistance(layer_point,
                this.map.latLngToLayerPoint(points[i]),
                this.map.latLngToLayerPoint(points[i + 1])
            );
            if (best_idx == -1 || dist < best_dist) {
                best_idx = i + 1;
                best_dist = dist;
            }
        }

        var newPt = new L.LatLng(pt.lat, pt.lng);
        newPt.meta = {
            time: null,
            original_time: false,
            ele: (points[best_idx - 1].meta.ele + points[best_idx].meta.ele) / 2,
            surface: "missing"
        };
        newPt.routing = false;
        if (points[best_idx - 1].meta.time != null && points[best_idx].meta.time != null) {
            newPt.meta.time = new Date((points[best_idx - 1].meta.time.getTime() + points[best_idx].meta.time.getTime()) / 2);
        }
        points.splice(best_idx, 0, newPt);

        this.recomputeStats();

        marker._pt = newPt;
        marker._prec = newPt;
        marker._succ = newPt;

        var marker_idx = -1;
        // find index for new marker (could binary search)
        for (var i = 0; i < this._editMarkers.length; i++) {
            if (this._editMarkers[i]._layer == layer && this._editMarkers[i]._pt.index >= best_idx) {
                marker_idx = i;
                break;
            }
        }

        // insert new marker
        this._editMarkers.splice(marker_idx, 0, marker);
        this._editMarkers[marker_idx]._prec = this._editMarkers[marker_idx - 1]._pt;
        this._editMarkers[marker_idx]._succ = this._editMarkers[marker_idx + 1]._pt;
        this._editMarkers[marker_idx - 1]._succ = this._editMarkers[marker_idx]._pt;
        this._editMarkers[marker_idx + 1]._prec = this._editMarkers[marker_idx]._pt;

        return marker;
    }

    removeEditMarkers() {
        if (this._editMarkers) {
            for (var i = 0; i < this._editMarkers.length; i++)
                this._editMarkers[i].remove();
        }
        this._editMarkers = [];
    }

    updateEditMarkers() {
        if (this.isEdited && this.visible) {
            this.removeEditMarkers();
            const bounds = this.map.getBounds();
            const dist = Math.abs(bounds._southWest.lat - bounds._northEast.lat);
            const segments = this.getSegments();
            for (var l = 0; l < segments.length; l++) {
                const points = segments[l]._latlngs;
                var start = -1, simplifiedPoints = [];
                for (var i = 0; i < points.length; i++) {
                    if (!points[i].routing && start == -1) start = i;
                    else if (points[i].routing && start != -1) {
                        if (start == i - 1) simplifiedPoints.push(points[start]);
                        else simplifiedPoints = simplifiedPoints.concat(simplify.douglasPeucker(points.slice(start, i), dist / 20));
                        start = -1;
                    }
                }
                if (start != -1) {
                    if (start == points.length - 1) simplifiedPoints.push(points[start]);
                    else simplifiedPoints = simplifiedPoints.concat(simplify.douglasPeucker(points.slice(start, points.length), dist / 20));
                }
                for (var i = 0; i < simplifiedPoints.length; i++) {
                    this._editMarkers.push(this.newEditMarker(simplifiedPoints[i], segments[l]));
                    if (i > 0) {
                        const len = this._editMarkers.length;
                        this._editMarkers[len - 1]._prec = this._editMarkers[len - 2]._pt;
                        this._editMarkers[len - 2]._succ = this._editMarkers[len - 1]._pt;
                    }
                }
            }
        }
    }

    previewSimplify(value) {
        value = value / 50;
        const bounds = this.getBounds();
        const dist = Math.abs(bounds._southWest.lat - bounds._northEast.lat);
        const tol = dist * Math.pow(2, -value);
        if (this.preview) this.preview.clearLayers();
        const color = this.style.color;
        const preview_style = {
            color: `#${color.substring(3, 7)}${color.substring(1, 3)}`,
            weight: 4
        };
        this.preview = new L.GPX(undefined, options, null).addTo(this.map);
        const segments = this.getSegments();
        var totalPoints = 0;
        for (var l = 0; l < segments.length; l++) {
            const simplifiedPoints = simplify.douglasPeucker(segments[l]._latlngs, tol);
            const preview_layer = new L.Polyline(simplifiedPoints, preview_style);
            this.preview.addLayer(preview_layer);
            preview_layer.segment = segments[l];
            totalPoints += simplifiedPoints.length;
        }
        return totalPoints;
    }

    cancelSimplify() {
        if (this.preview) {
            this.preview.clearLayers();
            this.preview = null;
        }
    }

    simplify() {
        const preview_layers = this.preview.getLayers();
        for (var l = 0; l < preview_layers.length; l++) preview_layers[l].segment._latlngs = preview_layers[l]._latlngs;

        const points = this.getPoints();
        for (var i = 0; i < points.length; i++) {
            points[i].routing = false;
        }

        this.buttons.slider.reset();
        this.update();
        this.redraw();

        this.preview.clearLayers();
        this.preview = null;
    }

    /*** GPX DATA ***/

    getLayers() {
        if (this.gpx.getLayers().length == 0) return [];

        var layers = [];
        var groups = this.gpx.getLayers()[0].getLayers();
        for (var i = 0; i < groups.length; i++) {
            layers.push(...groups[i].getLayers());
        }
        return layers;
    }

    getTracks() {
        if (this.gpx.getLayers().length == 0) return [];

        const tracks = [];
        var groups = this.gpx.getLayers()[0].getLayers();
        for (var i = 0; i < groups.length; i++) {
            var layers = groups[i].getLayers();
            for (var l = 0; l < layers.length; l++) {
                if (layers[l]._latlngs) { // layer is a segment so feature group is a track
                    tracks.push(groups[i]);
                    break;
                }
            }
        }
        return tracks;
    }

    getTrackStyle(track, focus) {
        var style = this.gpx._merge_objs(this.style, track.style);
        if (focus) style.weight += 2;
        return style;
    }

    getTrackColors() {
        if (this.gpx.getLayers().length == 0) {
            if (this.style.color) return [this.style.color];
            else return [];
        }

        var colors = [];
        var tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) {
            if (tracks[t].style && tracks[t].style.color) {
                if (!colors.includes(tracks[t].style.color)) colors.push(tracks[t].style.color);
            } else {
                if (!this.style.color) this.style.color = this.total.getColor();
                if (!colors.includes(this.style.color)) colors.push(this.style.color);
            }
        }
        return colors;
    }

    getSegments(track) {
        if (track) {
            return track.getLayers();
        } else {
            const layers = this.getLayers();
            const segments = [];
            for (var l = 0; l < layers.length; l++) if (layers[l]._latlngs) {
                segments.push(layers[l]);
            }
            return segments;
        }
    }

    getTabHTML(track) {
        var tabColor = document.createElement('div');
        tabColor.classList.add("tab-color");

        if (track) tabColor.style.background = (track.style && track.style.color) ? track.style.color : this.total.getColor();
        else tabColor.style.background = this.getLinearGradient(this.getTrackColors());

        var tabName = document.createElement('div');
        if (track) tabName.textContent = track.name ? track.name : this.name;
        else tabName.textContent = this.name;

        var tab = document.createElement('div');
        tab.title = tabName.textContent;
        tab.appendChild(tabColor);
        tab.appendChild(tabName);
        return tab;
    }

    getFileStructure(sortable, refreshCallback) {
        const _this = this;
        var trackList = document.createElement('ul');
        trackList.classList.add('file-structure');

        const tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) {
            var trackLi = document.createElement('li');
            trackList.appendChild(trackLi);
            var trackUl = document.createElement('ul');
            trackUl.classList.add('file-structure');
            trackLi.appendChild(trackUl);

            let track = tracks[t];
            const segments = this.getSegments(track);
            for (var s = 0; s < segments.length; s++) {
                var segmentLi = document.createElement('li');
                trackUl.appendChild(segmentLi);

                let segment = segments[s];

                var segmentDetails = this.getSegmentDetails(segment);
                segmentLi.appendChild(segmentDetails);

                if (sortable) {
                    segmentLi.trace = this;
                    segmentLi.track = track;
                    segmentLi.segment = segment;

                    segmentDetails.addEventListener('mouseover', function () {
                        segment._path.style.filter = HOVER_STYLE;
                    });
                    segmentDetails.addEventListener('mouseout', function () {
                        segment._path.style.filter = '';
                    });
                }
            }

            var trackDetails = this.getTrackDetails(tracks[t]);
            trackLi.insertBefore(trackDetails, trackUl);

            if (sortable) {
                trackLi.trace = this;
                trackLi.track = track;

                trackDetails.addEventListener('mouseover', function () {
                    const segments = _this.getSegments(track);
                    for (var s = 0; s < segments.length; s++) {
                        segments[s]._path.style.filter = HOVER_STYLE;
                    }
                });
                trackDetails.addEventListener('mouseout', function () {
                    const segments = _this.getSegments(track);
                    for (var s = 0; s < segments.length; s++) {
                        segments[s]._path.style.filter = '';
                    }
                });

                var segmentSortable = Sortable.create(trackUl, {
                    group: {
                        name: "segments",
                        pull: ["tabs", "tracks", "segments"]
                    },
                    fallbackOnBody: true,
                    multiDrag: true,
                    selectedClass: 'multidrag-selected',
                    onUpdate: function (e) {
                        if (e.items.length > 0) _this.setSelectionIndex(e.oldIndicies.map(x => x.index), e.newIndicies.map(x => x.index), e.items[0].track);
                        else _this.setSelectionIndex([e.oldIndex], [e.newIndex], e.item.track);
                        if (refreshCallback) refreshCallback();
                    },
                    onAdd: function (e) {
                        if (e.items.length > 0) {
                            var nsegments = _this.getSegments(e.to.track).length;
                            _this.moveSegmentsToTrack(e.from.track, e.to.track, e.items.map(x => x.segment));
                            var oldIndicies = [];
                            for (var s = 0; s < e.items.length; s++) {
                                oldIndicies.push(nsegments + s);
                            }
                            _this.setSelectionIndex(oldIndicies, e.newIndicies.map(x => x.index), e.to.track);
                        } else {
                            _this.moveSegmentsToTrack(e.item.track, e.to.track, [e.item.segment]);
                            var segments = _this.getSegments(e.to.track);
                            _this.setSelectionIndex([segments.length - 1], [e.newIndex], e.to.track);
                        }
                        if (refreshCallback) refreshCallback();
                    },
                    onMove: function (e) {
                        const trace = e.dragged.trace;
                        const track = e.dragged.track;
                        const segment = e.dragged.segment;

                        if (trace.getSegments().length == 1) return false;

                        e.dragged.children[0].style.display = '';
                        if (e.dragged.children.length > 1) e.dragged.removeChild(e.dragged.children[1]);
                        if (e.to.track) e.dragged.children[0].style.marginTop = '';
                        else e.dragged.children[0].style.marginTop = '10px';

                        if (e.to.id == _this.buttons.tabs.id) {
                            e.dragged.classList.add('tab');
                            e.dragged.classList.remove('file-structure-item');
                            e.dragged.children[0].style.display = 'none';
                            e.dragged.appendChild(trace.getTabHTML(track));
                        } else {
                            e.dragged.classList.remove('tab');
                            e.dragged.classList.add('file-structure-item');
                        }
                    },
                    onSelect: function (e) {
                        for (var i = 0; i < e.items.length; i++) {
                            if (!e.items[i].segment) {
                                Sortable.utils.deselect(e.items[i]);
                            }
                        }
                    }
                });
                segmentSortable.el.track = track;
            }
        }

        if (sortable) {
            Sortable.create(trackList, {
                group: {
                    name: "tracks",
                    pull: ["tabs"],
                    put: ["tabs", "segments"]
                },
                fallbackOnBody: true,
                multiDrag: true,
                selectedClass: 'multidrag-selected',
                onUpdate: function (e) {
                    if (e.items.length > 0) _this.setSelectionIndex(e.oldIndicies.map(x => x.index), e.newIndicies.map(x => x.index));
                    else _this.setSelectionIndex([e.oldIndex], [e.newIndex]);
                    if (refreshCallback) refreshCallback();
                },
                onAdd: function (e) {
                    if (e.from.id == _this.buttons.tabs.id) {
                        var ntracks = _this.getTracks().length;
                        var ntracks_new = e.item.trace.getTracks().length;
                        var oldIndicies = [], newIndicies = [];
                        for (var t = 0; t < ntracks_new; t++) {
                            oldIndicies.push(ntracks + t);
                            newIndicies.push(e.newIndex + t);
                        }
                        _this.merge(e.item.trace, false, false, true);
                        _this.setSelectionIndex(oldIndicies, newIndicies);
                        _this.total.removeTrace(e.item.trace.index);
                        _this.focus();
                    } else if (e.items.length > 0) {
                        _this.moveSegmentsToTrack(e.from.track, null, e.items.map(x => x.segment));
                        const tracks = _this.getTracks();
                        _this.setSelectionIndex([tracks.length - 1], [e.newIndicies[0].index]);
                    } else {
                        _this.moveSegmentsToTrack(e.item.track, null, [e.item.segment]);
                        const tracks = _this.getTracks();
                        _this.setSelectionIndex([tracks.length - 1], [e.newIndex]);
                    }
                    if (refreshCallback) refreshCallback();
                },
                onMove: function (e) {
                    const trace = e.dragged.trace;
                    const track = e.dragged.track;
                    if (trace.getTracks().length == 1) return false;

                    if (e.to.id == _this.buttons.tabs.id) {
                        e.dragged.classList.add('tab');
                        e.dragged.classList.remove('file-structure-item');
                        e.dragged.children[0].style.display = 'none';
                        e.dragged.children[1].style.display = 'none';
                        if (e.dragged.children.length == 2) e.dragged.appendChild(trace.getTabHTML(track));
                    } else {
                        e.dragged.classList.remove('tab');
                        e.dragged.classList.add('file-structure-item');
                        e.dragged.children[0].style.display = '';
                        e.dragged.children[1].style.display = '';
                        if (e.dragged.children.length > 2) e.dragged.removeChild(e.dragged.children[2]);
                    }
                },
                onSelect: function (e) {
                    for (var i = 0; i < e.items.length; i++) {
                        if (e.items[i].segment) {
                            Sortable.utils.deselect(e.items[i]);
                        }
                    }
                }
            });
        }

        return trackList;
    }

    getTrackDetails(track, fake, segment) {
        var trackDetails = document.createElement('div');
        trackDetails.classList.add('file-structure-track');

        var trackLabel = document.createElement('span');
        trackDetails.appendChild(trackLabel);
        trackLabel.textContent = this.buttons.track_text.textContent;
        trackLabel.style.fontWeight = 'bold';

        var trackColor = document.createElement('input');
        trackDetails.appendChild(trackColor);
        trackColor.type = 'color';
        trackColor.classList.add('input-minimal');
        trackColor.style.height = '18px';

        var trackStyle = this.getTrackStyle(track);
        trackColor.value = trackStyle.color;

        var trackName = document.createElement('span');
        trackDetails.appendChild(trackName);
        trackName.textContent = track.name ? track.name : this.name;

        var trackLength = document.createElement('span');
        trackDetails.appendChild(trackLength);
        trackLength.textContent = (track._dist / 1000 / (this.buttons.km ? 1 : 1.609344)).toFixed(2).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        trackLength.style.marginLeft = 'auto';
        trackLength.classList.add('info');

        var trackElevation = document.createElement('span');
        trackDetails.appendChild(trackElevation);
        trackElevation.innerHTML = '<i class="fas fa-angle-up"></i> ' + (track._elevation.gain * (this.buttons.km ? 1 : 3.280839895)).toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text) +
            ' <i class="fas fa-angle-down"></i> ' + (track._elevation.loss * (this.buttons.km ? 1 : 3.280839895)).toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text);
        trackElevation.classList.add('info');

        if (this.hasTimeData()) {
            var trackTime = document.createElement('span');
            trackDetails.appendChild(trackTime);
            trackTime.textContent = this.total.msToTime(track._duration);
            trackTime.classList.add('time-info');
        }

        if (fake) {
            var trackUl = document.createElement('ul');
            trackUl.classList.add('file-structure');
            trackDetails.appendChild(trackUl);
            trackUl.style.width = "100%";

            if (segment) {
                var segmentLi = document.createElement('li');
                trackUl.appendChild(segmentLi);
                segmentLi.classList.add('file-structure-item');
                segmentLi.appendChild(this.getSegmentDetails(segment));
            } else {
                const segments = this.getSegments(track);
                for (var s = 0; s < segments.length; s++) {
                    var segmentLi = document.createElement('li');
                    trackUl.appendChild(segmentLi);
                    segmentLi.classList.add('file-structure-item');
                    segmentLi.appendChild(this.getSegmentDetails(segments[s]));
                }
            }
        } else {
            const _this = this;
            trackName.addEventListener('dblclick', function () {
                var nameInput = _this.getNameInput(track.name ? track.name : _this.name, function () {
                    track.name = nameInput.value;
                    trackName.textContent = track.name;
                    trackName.style.display = '';
                    try {
                        trackDetails.removeChild(nameInput);
                    } catch (e) { }
                });
                nameInput.style.marginLeft = '10px';
                trackDetails.insertBefore(nameInput, trackName);
                trackName.style.display = 'none';
                nameInput.focus();
            });
            trackColor.addEventListener('change', function () {
                if (track.style) track.style.color = trackColor.value;
                else track.style = { color: trackColor.value };
                _this.setStyle(_this.hasFocus);
                _this.updateTab();
            });
        }

        return trackDetails;
    }

    getSegmentDetails(segment) {
        var segmentDetails = document.createElement('div');
        segmentDetails.classList.add('file-structure-segment');

        var segmentLabel = document.createElement('span');
        segmentDetails.appendChild(segmentLabel);
        segmentLabel.textContent = this.buttons.segment_text.textContent;
        segmentLabel.style.fontWeight = 'bold';

        var segmentLength = document.createElement('span');
        segmentDetails.appendChild(segmentLength);
        segmentLength.textContent = (segment._dist / 1000 / (this.buttons.km ? 1 : 1.609344)).toFixed(2).toString() + ' ' + (this.buttons.km ? this.buttons.unit_kilometers_text : this.buttons.unit_miles_text);
        segmentLength.style.marginLeft = 'auto';
        segmentLength.classList.add('info');

        var segmentElevation = document.createElement('span');
        segmentDetails.appendChild(segmentElevation);
        segmentElevation.innerHTML = '<i class="fas fa-angle-up"></i> ' + (segment._elevation.gain * (this.buttons.km ? 1 : 3.280839895)).toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text) +
            ' <i class="fas fa-angle-down"></i> ' + (segment._elevation.loss * (this.buttons.km ? 1 : 3.280839895)).toFixed(0).toString() + (this.buttons.km ? this.buttons.unit_meters_text : this.buttons.unit_feet_text);
        segmentElevation.classList.add('info');

        if (this.hasTimeData()) {
            var segmentTime = document.createElement('span');
            segmentDetails.appendChild(segmentTime);
            segmentTime.textContent = this.total.msToTime(segment._duration);
            segmentTime.classList.add('time-info');
        }

        return segmentDetails;
    }

    getLinearGradient(colors) {
        if (colors.length == 0) return '#ffffff';

        var out = 'linear-gradient(to right';
        for (var i = 0; i < colors.length; i++) {
            out += ', ' + colors[i] + ' ' + Math.round(i / colors.length * 100) + '%' + ' ' + Math.round((i + 1) / colors.length * 100) + '%';
        }
        out += ')';

        return out;
    }

    getWaypointsGroup() {
        if (this.gpx.getLayers().length == 0) return null;

        var groups = this.gpx.getLayers()[0].getLayers();
        for (var i = 0; i < groups.length; i++) {
            var layers = groups[i].getLayers();
            for (var l = 0; l < layers.length; l++) {
                if (layers[l]._latlng) {
                    return groups[i];
                }
            }
        }

        return null;
    }

    getWaypoints() {
        const layers = this.getLayers();
        const waypoints = [];
        for (var l = 0; l < layers.length; l++) if (layers[l]._latlng) {
            waypoints.push(layers[l]);
        }
        return waypoints;
    }

    hasPoints() {
        const layers = this.getLayers();
        for (var i = 0; i < layers.length; i++) if (layers[i]._latlngs)
            return true;
        return false;
    }

    getPoints() {
        const segments = this.getSegments();
        var points = [];
        for (var i = 0; i < segments.length; i++)
            points = points.concat(segments[i]._latlngs);
        return points;
    }

    getDistance(noConversion) {
        if (this.buttons.km || noConversion) return this.gpx._info.length;
        else return this.gpx._info.length / 1.609344;
    }

    getMovingDistance(noConversion) {
        if (this.buttons.km || noConversion) return this.gpx._info.moving_length;
        else return this.gpx._info.moving_length / 1.609344;
    }

    getElevationGain() {
        if (this.buttons.km) return this.gpx._info.elevation.gain;
        else return this.gpx._info.elevation.gain * 3.280839895;
    }

    getElevationLoss() {
        if (this.buttons.km) return this.gpx._info.elevation.loss;
        else return this.gpx._info.elevation.loss * 3.280839895;
    }

    getMovingTime() {
        return this.gpx._info.duration.moving;
    }

    getMovingSpeed(noConversion) {
        const time = this.getMovingTime();
        if (time == 0) return 0;
        return this.getMovingDistance(noConversion) / (time / 3600);
    }

    getMovingPace() {
        const dist = this.getDistance();
        if (dist == 0) return 0;
        return this.getMovingTime() / (this.getDistance() / 1000);
    }

    getAverageAdditionalData() {
        var cntHr = 0, totHr = 0;
        var cntTemp = 0, totTemp = 0;
        var cntCad = 0, totCad = 0;
        var cntPower = 0, totPower = 0;
        var surface = false;

        const points = this.getPoints();

        for (var i = 0; i < points.length; i++) {
            if (points[i].meta.hasOwnProperty('hr') && points[i].meta.hr != null) {
                totHr += points[i].meta.hr;
                cntHr++;
            }
            if (points[i].meta.hasOwnProperty('atemp') && points[i].meta.atemp != null) {
                totTemp += points[i].meta.atemp;
                cntTemp++;
            }
            if (points[i].meta.hasOwnProperty('cad') && points[i].meta.cad != null) {
                totCad += points[i].meta.cad;
                cntCad++;
            }
            if (points[i].meta.hasOwnProperty('power') && points[i].meta.power != null) {
                totPower += points[i].meta.power;
                cntPower++;
            }
            if (points[i].meta.hasOwnProperty('surface') && points[i].meta.surface != "missing") {
                surface = true;
            }
        }

        this.additionalAvgData = {
            hr: cntHr > 0 ? Math.round(totHr / cntHr) : null,
            atemp: cntTemp > 0 ? Math.round((totTemp / cntTemp) * 10) / 10 : null,
            cad: cntCad > 0 ? Math.round(totCad / cntCad) : null,
            power: cntPower > 0 ? Math.round(totPower / cntPower) : null,
            surface: surface
        };
        return this.additionalAvgData;
    }

    /*** MODIFIERS ***/

    crop(start, end, no_recursion) {
        var copy = null;
        if (!no_recursion) {
            copy = this.clone();
        }

        const tracks = this.getTracks();
        var cumul = 0;
        for (var t = 0; t < tracks.length; t++) {
            const segments = this.getSegments(tracks[t]);
            for (var i = 0; i < segments.length; i++) {
                const len = segments[i]._latlngs.length;
                if (start >= cumul + len) tracks[t].removeLayer(segments[i]);
                else if (end < cumul) tracks[t].removeLayer(segments[i]);
                else if (start > cumul || end < cumul + len - 1) {
                    if (end < len + cumul + len - 1) segments[i]._latlngs.splice(end - cumul + 1);
                    if (start > cumul) segments[i]._latlngs.splice(0, start - cumul);
                    segments[i]._latlngs[0].routing = false;
                    segments[i]._latlngs[segments[i]._latlngs.length - 1].routing = false;
                }
                cumul += len;
            }
        }

        if (!no_recursion) {
            if (start > 0 && end < cumul - 1) {
                const copy2 = copy.clone();
                copy.crop(0, start - 1, true);
                this.total.setTraceIndex(copy.index, this.index);
                copy2.crop(end + 1, cumul, true);
                this.total.setTraceIndex(copy2.index, this.index + 1);
            } else if (start > 0) {
                copy.crop(0, start - 1, true);
                this.total.setTraceIndex(copy.index, this.index);
            } else if (end < cumul - 1) {
                copy.crop(end + 1, cumul, true);
                this.total.setTraceIndex(copy.index, this.index + 1);
            }
        }

        this.recomputeStats();
        this.redraw();
        this.update();
        this.updateTab();
        this.focus();
    }

    reverse() {
        const tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) {
            const segments = this.getSegments(tracks[t]);
            for (var l = 0; l < segments.length; l++)
                segments[l]._latlngs.reverse();

            for (var l = 0; l < segments.length; l++)
                tracks[t].removeLayer(segments[l]);

            for (var l = segments.length - 1; l >= 0; l--)
                tracks[t].addLayer(new L.Polyline(segments[l]._latlngs));
        }

        for (var t = 0; t < tracks.length; t++)
            this.gpx.getLayers()[0].removeLayer(tracks[t]);

        for (var t = tracks.length - 1; t >= 0; t--) {
            var trk = new L.FeatureGroup(this.getSegments(tracks[t]));
            trk.style = tracks[t].style;
            if (tracks[t].name) trk.name = tracks[t].name;
            this.gpx.getLayers()[0].addLayer(trk);
        }

        if (this.hasTimeData()) {
            const points = this.getPoints();
            var last = points[0].meta.time;
            points[0].meta.time = points[points.length - 1].meta.time;
            for (var i = 1; i < points.length; i++) {
                const tmp = new Date(points[i - 1].meta.time.getTime() + (last.getTime() - points[i].meta.time.getTime()));
                last = points[i].meta.time;
                points[i].meta.time = tmp;
            }
        }
        this.buttons.slider.reset();
        this.update();
        this.updateTab();
        this.redraw();
        this.focus();
    }

    setStart(index) {
        this.save();

        const tracks = this.getTracks();
        var cumul = 0, trackBefore = [], trackAfter = [], originalTrackBefore = [], originalTrackAfter = [];
        for (var t = 0; t < tracks.length; t++) {
            this.gpx.getLayers()[0].removeLayer(tracks[t]);

            const segments = this.getSegments(tracks[t]);
            var segmentBefore = [], segmentAfter = [];
            for (var s = 0; s < segments.length; s++) {
                if (index >= cumul + segments[s]._latlngs.length) segmentBefore.push(segments[s]._latlngs);
                else if (index < cumul) segmentAfter.push(segments[s]._latlngs);
                else { // split in this segment
                    const before = segments[s]._latlngs.slice(0, index - cumul);
                    const after = segments[s]._latlngs.slice(index - cumul);
                    const pt = after[0].clone();
                    pt.meta = JSON.parse(JSON.stringify(after[0].meta));
                    if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                    pt.routing = false;
                    before.push(pt)
                    if (tracks.length == 1 && segments.length == 1) {
                        segmentAfter.push(after.concat(before));
                    } else {
                        segmentBefore.push(before);
                        segmentAfter.push(after);
                    }
                }
                cumul += segments[s]._latlngs.length;
            }

            if (tracks.length == 1) {
                trackAfter.push(segmentAfter.concat(segmentBefore));
                originalTrackAfter.push(tracks[t]);
            } else {
                if (segmentBefore.length > 0) {
                    trackBefore.push(segmentBefore);
                    originalTrackBefore.push(tracks[t]);
                }
                if (segmentAfter.length > 0) {
                    trackAfter.push(segmentAfter);
                    originalTrackAfter.push(tracks[t]);
                }
            }
        }

        for (var i = 0; i < trackAfter.length; i++) {
            var segs = [];
            for (var j = 0; j < trackAfter[i].length; j++) {
                segs.push(new L.Polyline(trackAfter[i][j]));
            }
            if (segs.length > 0) {
                var trk = new L.FeatureGroup(segs);
                trk.style = originalTrackAfter[i].style;
                if (originalTrackAfter[i].name) trk.name = originalTrackAfter[i].name;
                this.gpx.getLayers()[0].addLayer(trk);
            }
        }

        for (var i = 0; i < trackBefore.length; i++) {
            var segs = [];
            for (var j = 0; j < trackBefore[i].length; j++) {
                segs.push(new L.Polyline(trackBefore[i][j]));
            }
            if (segs.length > 0) {
                var trk = new L.FeatureGroup(segs);
                trk.style = originalTrackBefore[i].style;
                if (originalTrackBefore[i].name) trk.name = originalTrackBefore[i].name;
                this.gpx.getLayers()[0].addLayer(trk);
            }
        }

        this.setStyle(true);
        this.redraw();

        this.recomputeStats();
        this.updateEditMarkers();
        this.update();
    }

    setSelectionIndex(oldIndicies, newIndicies, track) {
        if (track) {
            var segments = this.getSegments(track);
            for (var s = 0; s < segments.length; s++) {
                track.removeLayer(segments[s]);
            }

            var to_move = [];
            for (var i = oldIndicies.length - 1; i >= 0; i--) {
                to_move.splice(0, 0, segments.splice(oldIndicies[i], 1)[0]);
            }
            segments.splice(newIndicies[0], 0, ...to_move);

            for (var s = 0; s < segments.length; s++) {
                track.addLayer(new L.Polyline(segments[s]._latlngs));
            }
        } else {
            const tracks = this.getTracks();
            for (var t = 0; t < tracks.length; t++) {
                this.gpx.getLayers()[0].removeLayer(tracks[t]);
            }

            var to_move = [];
            for (var i = oldIndicies.length - 1; i >= 0; i--) {
                to_move.splice(0, 0, tracks.splice(oldIndicies[i], 1)[0]);
            }
            tracks.splice(newIndicies[0], 0, ...to_move);

            for (var t = 0; t < tracks.length; t++) {
                var trk = new L.FeatureGroup(this.getSegments(tracks[t]));
                trk.style = tracks[t].style;
                if (tracks[t].name) trk.name = tracks[t].name;
                this.gpx.getLayers()[0].addLayer(trk);
            }
        }

        this.setStyle(true);
        this.updateTab();
        this.timeConsistency();
        this.recomputeStats();
        this.update();
        this.redraw();
    }

    moveSegmentsToTrack(oldTrack, newTrack, segments) {
        if (newTrack) {
            for (var s = 0; s < segments.length; s++) {
                newTrack.addLayer(new L.Polyline(segments[s]._latlngs));
            }
        } else {
            var segs = [];
            for (var s = 0; s < segments.length; s++) {
                segs.push(new L.Polyline(segments[s]._latlngs));
            }
            var trk = new L.FeatureGroup(segs);
            trk.style = { ...oldTrack.style };
            if (oldTrack.name) trk.name = oldTrack.name;
            this.gpx.getLayers()[0].addLayer(trk);
        }
        for (var s = 0; s < segments.length; s++) {
            oldTrack.removeLayer(segments[s]);
        }
    }

    merge(trace, as_points, as_segments, as_tracks, stick_time) {
        this.gpx._info["creator"] = this.gpx._info["creator"] || trace.gpx._info["creator"];

        const points = this.getPoints();
        const otherPoints = trace.getPoints();

        const data = this.getAverageAdditionalData();
        const otherData = trace.getAverageAdditionalData();

        for (var i = 0; i < points.length; i++) {
            if (data.hr == null && otherData.hr != null) points[i].meta.hr = otherData.hr;
            if (data.atemp == null && otherData.atemp != null) points[i].meta.atemp = otherData.atemp;
            if (data.cad == null && otherData.cad != null) points[i].meta.cad = otherData.cad;
            if (data.power == null && otherData.power != null) points[i].meta.power = otherData.power;
        }
        for (var i = 0; i < otherPoints.length; i++) {
            if (data.hr != null && otherData.hr == null) otherPoints[i].meta.hr = data.hr;
            if (data.atemp != null && otherData.atemp == null) otherPoints[i].meta.atemp = data.atemp;
            if (data.cad != null && otherData.cad == null) otherPoints[i].meta.cad = data.cad;
            if (data.power != null && otherData.power == null) otherPoints[i].meta.power = data.power;
        }

        if (this.hasPoints() && trace.hasPoints()) {
            if (this.hasTimeData() && !trace.hasTimeData()) {
                const avg = this.getMovingSpeed();
                const a = points[points.length - 1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b);
                const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist / (1000 * avg));
                trace.changeTimeData(startTime, avg);
            } else if (!this.hasTimeData() && trace.hasTimeData()) {
                const avg = trace.getMovingSpeed();
                const a = points[points.length - 1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b) + this.getDistance(true);
                const startTime = new Date(b.meta.time.getTime() - 1000 * 60 * 60 * dist / (1000 * avg));
                this.changeTimeData(startTime, avg);
            } else if (this.hasTimeData() && trace.hasTimeData()) {
                const avg1 = this.getMovingSpeed();
                const avg2 = trace.getMovingSpeed();
                const dist1 = this.getMovingDistance();
                const dist2 = trace.getMovingDistance();
                const avg = (dist1 * avg1 + dist2 * avg2) / (dist1 + dist2);
                const a = points[points.length - 1];
                const b = otherPoints[0];
                const dist = this.gpx._dist2d(a, b);
                const startTime = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist / (1000 * avg));
                if (startTime > b.meta.time.getTime() || stick_time) trace.changeTimeData(startTime, avg2);
            }
        }

        if (as_points) {
            var tracks = this.getTracks();
            if (tracks.length > 0) {
                const segments = trace.getSegments(tracks[tracks.length - 1]);
                segments[segments.length - 1]._latlngs.push(...otherPoints);
            } else {
                tracks = trace.getTracks();
                var trk = new L.FeatureGroup([new L.Polyline(otherPoints)]);
                if (tracks.length > 0) {
                    trk.style = tracks[0].style;
                    if (tracks[0].name) trk.name = tracks[0].name;
                }
                this.gpx.getLayers()[0].addLayer(trk);
            }
        } else if (as_segments) {
            var tracks = this.getTracks();
            if (tracks.length > 0) {
                const segments = trace.getSegments();
                for (var l = 0; l < segments.length; l++)
                    tracks[tracks.length - 1].addLayer(new L.Polyline(segments[l]._latlngs));
            } else {
                tracks = trace.getTracks();
                for (var t = 0; t < tracks.length; t++) {
                    const segments = trace.getSegments(tracks[t]);
                    var segs = [];
                    for (var s = 0; s < segments.length; s++) {
                        segs.push(new L.Polyline(segments[s]._latlngs));
                    }
                    if (segs.length > 0) {
                        var trk = new L.FeatureGroup(segs);
                        trk.style = tracks[t].style;
                        if (tracks[t].name) trk.name = tracks[t].name;
                        this.gpx.getLayers()[0].addLayer(trk);
                    }
                }
            }
        } else {
            const tracks = trace.getTracks();
            for (var t = 0; t < tracks.length; t++) {
                const segments = trace.getSegments(tracks[t]);
                var segs = [];
                for (var s = 0; s < segments.length; s++) {
                    segs.push(new L.Polyline(segments[s]._latlngs));
                }
                if (segs.length > 0) {
                    var trk = new L.FeatureGroup(segs);
                    trk.style = tracks[t].style;
                    if (tracks[t].name) trk.name = tracks[t].name;
                    else trk.name = trace.name;
                    this.gpx.getLayers()[0].addLayer(trk);
                }
            }
        }

        this.setStyle(true);
        this.updateTab();

        const existing_waypoints = this.getWaypoints();
        const waypoints = trace.getWaypoints();
        for (var i = 0; i < waypoints.length; i++) {
            const marker = waypoints[i];

            // test if wpt already exists
            const same = existing_waypoints.filter(wpt => wpt._latlng.equals(marker._latlng) && wpt.name == marker.name && wpt.cmt == marker.cmt && wpt.desc == marker.desc && wpt.sym == marker.sym);
            if (same.length > 0) continue;

            const newMarker = this.gpx._get_marker(marker._latlng, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);

            var wpt_group = this.getWaypointsGroup();
            if (wpt_group) wpt_group.addLayer(newMarker);
            else this.gpx.getLayers()[0].addLayer(new L.FeatureGroup([newMarker]));
        }

        this.recomputeStats();
        this.update();
        this.redraw();
    }

    extract(as_segments) {
        var segments = this.getSegments();
        const waypoints = this.getWaypoints();
        var count = 1;
        var lastTrace = null;

        const traces = [];

        var closestSegments = [];
        for (var w = 0; w < waypoints.length; w++) {
            closestSegments.push({ distance: Infinity, segments: [] });
        }

        for (var l = 0; l < segments.length; l++) {
            const bounds = segments[l].getBounds().pad(0.2);
            for (var w = 0; w < waypoints.length; w++) if (bounds.contains(waypoints[w]._latlng)) {
                var pt = segments[l].closestLayerPoint(this.map.latLngToLayerPoint(waypoints[w]._latlng));
                if (!pt) pt = L.GeometryUtil.closest(this.map, segments[l]._latlngs, waypoints[w]._latlng, true);
                if (pt && pt.distance < closestSegments[w].distance) {
                    closestSegments[w] = { distance: pt.distance, segments: [segments[l]] };
                } else if (pt && pt.distance == closestSegments[w].distance) {
                    closestSegments[w].segments.push(segments[l]);
                }
            }
        }

        var tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) {
            var segments = this.getSegments(tracks[t]);
            var segs = [];
            for (var l = 0; l < segments.length; l++) {
                const points = segments[l]._latlngs;
                const cpy = [];
                for (var i = 0; i < points.length; i++) {
                    const pt = points[i].clone();
                    pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                    if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                    pt.index = points[i].index;
                    pt.routing = points[i].routing;
                    cpy.push(pt);
                }

                if (as_segments) {
                    const newTrace = this.total.addTrace(undefined, tracks[t].name ? tracks[t].name : this.name);
                    newTrace.gpx.addLayer(new L.FeatureGroup());
                    newTrace.gpx._info.creator = this.gpx._info.creator;

                    if (cpy.length > 0) {
                        var trk = new L.FeatureGroup([new L.Polyline(cpy)]);
                        trk.style = tracks[t].style;
                        if (tracks[t].name) trk.name = tracks[t].name;
                        newTrace.gpx.getLayers()[0].addLayer(trk);
                    }

                    for (var w = 0; w < waypoints.length; w++) if (closestSegments[w].segments.includes(segments[l])) {
                        const marker = waypoints[w];
                        const newMarker = newTrace.gpx._get_marker(marker._latlng, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
                        const wpt_group = newTrace.getWaypointsGroup();
                        if (wpt_group) wpt_group.addLayer(newMarker);
                        else newTrace.gpx.getLayers()[0].addLayer(new L.FeatureGroup([newMarker]));
                    }

                    newTrace.recomputeStats();
                    newTrace.updateTab();
                    count++;

                    lastTrace = newTrace;
                    traces.push(newTrace);
                } else if (cpy.length > 0) segs.push(new L.Polyline(cpy));
            }

            if (!as_segments) {
                const newTrace = this.total.addTrace(undefined, tracks[t].name ? tracks[t].name : this.name);
                newTrace.gpx.addLayer(new L.FeatureGroup());
                newTrace.gpx._info.creator = this.gpx._info.creator;

                if (segs.length > 0) {
                    var trk = new L.FeatureGroup(segs);
                    trk.style = tracks[t].style;
                    if (tracks[t].name) trk.name = tracks[t].name;
                    newTrace.gpx.getLayers()[0].addLayer(trk);
                }

                for (var w = 0; w < waypoints.length; w++) {
                    for (var s = 0; s < closestSegments[w].segments.length; s++) {
                        if (tracks[t].hasLayer(closestSegments[w].segments[s])) {
                            const marker = waypoints[w];
                            const newMarker = newTrace.gpx._get_marker(marker._latlng, marker.sym, marker.name, marker.desc, marker.cmt, this.gpx.options);
                            const wpt_group = newTrace.getWaypointsGroup();
                            if (wpt_group) wpt_group.addLayer(newMarker);
                            else newTrace.gpx.getLayers()[0].addLayer(new L.FeatureGroup([newMarker]));
                            break;
                        }
                    }
                }

                newTrace.recomputeStats();
                newTrace.updateTab();
                count++;

                lastTrace = newTrace;
                traces.push(newTrace);
            }
        }

        lastTrace.focus();

        return traces;
    }

    extractSelection(tracks, segments) {
        const newTrace = this.total.addTrace(undefined, segments ? (tracks[0].name ? tracks[0].name : this.name) : (tracks.length == 1 && tracks[0].name) ? tracks[0].name : this.name);
        newTrace.gpx.addLayer(new L.FeatureGroup());
        newTrace.gpx._info.creator = this.gpx._info.creator;

        var segs = [];
        if (segments) {
            const track = tracks[0];
            for (var s = 0; s < segments.length; s++) {
                segs.push(new L.Polyline(segments[s]._latlngs));
                track.removeLayer(segments[s]);
            }

            var trk = new L.FeatureGroup(segs);
            trk.style = track.style;
            if (track.name) trk.name = track.name;
            newTrace.gpx.getLayers()[0].addLayer(trk);
        } else {
            for (var t = 0; t < tracks.length; t++) {
                this.gpx.getLayers()[0].removeLayer(tracks[t]);
                var trk = new L.FeatureGroup(this.getSegments(tracks[t]));
                trk.style = tracks[t].style;
                if (tracks[t].name) trk.name = tracks[t].name;
                newTrace.gpx.getLayers()[0].addLayer(trk);
            }
        }

        newTrace.recomputeStats();
        newTrace.update();
        newTrace.updateTab();
        newTrace.setStyle(false);

        this.recomputeStats();
        this.update();
        this.updateTab();

        return newTrace;
    }

    mergeSelection(tracks, segments) {
        if (segments) {
            const track = tracks[0];

            for (var s = 1; s < segments.length; s++) {
                segments[0]._latlngs.push(...segments[s]._latlngs);
                track.removeLayer(segments[s]);
            }
        } else {
            for (var t = 1; t < tracks.length; t++) {
                const segments = this.getSegments(tracks[t]);
                this.gpx.getLayers()[0].removeLayer(tracks[t]);
                for (var s = 0; s < segments.length; s++) {
                    tracks[0].addLayer(new L.Polyline(segments[s]._latlngs));
                }
            }
        }

        this.timeConsistency();
        this.recomputeStats();
        this.update();
        this.updateTab();
        this.redraw();
        this.focus();
    }

    deleteSelection(tracks, segments) {
        if (segments) {
            const track = tracks[0];
            for (var s = 0; s < segments.length; s++) {
                track.removeLayer(segments[s]);
            }
        } else {
            for (var t = 0; t < tracks.length; t++) {
                this.gpx.getLayers()[0].removeLayer(tracks[t]);
            }
        }

        this.recomputeStats();
        this.update();
        this.updateTab();
        this.redraw();
    }

    addEndPoint(lat, lng) {
        if (!this.visible) this.hideUnhide();

        this.save();

        const pt = new L.LatLng(lat, lng);
        pt.meta = { time: null, original_time: false, ele: 0, surface: "missing" };
        var segment = null;

        if (!this.hasPoints()) {
            this.gpx.addLayer(new L.FeatureGroup([new L.FeatureGroup([new L.Polyline([pt])])]));
            this.setStyle(true);
            this.showChevrons();
            this.showDistanceMarkers();
            pt.index = 0;
            segment = this.getSegments()[0];
        } else {
            const segments = this.getSegments();
            segment = segments[segments.length - 1];
        }

        const len = this._editMarkers.length;
        if (len == 0) {
            this.askElevation([pt]);
            this.addRoute2([pt], pt, pt, segment);
        } else if (this.buttons.routing) {
            this.askRoute2(this._editMarkers[len - 1]._pt, pt, segment);
        } else {
            const new_points = this.getIntermediatePoints(this._editMarkers[len - 1]._pt, pt);
            this.askElevation(new_points);
            this.addRoute2(new_points, this._editMarkers[len - 1]._pt, pt, segment);
        }
    }

    updatePoint(marker, lat, lng) {
        this.buttons.lastUpdatePointTime = Date.now();
        this.save();

        if (this.buttons.routing) this.updatePointRouting(marker, lat, lng);
        else this.updatePointManual(marker, lat, lng);
    }

    deletePoint(marker) {
        this.save();

        const points = marker._layer._latlngs;

        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        if (this.buttons.routing && !marker._prec.equals(marker._pt) && !marker._succ.equals(marker._pt)) {
            this.askRoute(a, a, c, marker._layer);
        } else {
            this.deletePointManual(marker);
        }
    }

    addWaypoint(latlng) {
        latlng.meta = { ele: 0 };
        const marker = this.gpx._get_marker(
            latlng,
            this.buttons.clone_wpt ? this.buttons.clone_wpt.sym : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.name : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.desc : '',
            this.buttons.clone_wpt ? this.buttons.clone_wpt.cmt : '',
            this.gpx.options
        );

        var wpt_group = this.getWaypointsGroup();
        if (wpt_group) wpt_group.addLayer(marker);
        else this.gpx.getLayers()[0].addLayer(new L.FeatureGroup([marker]));

        marker.fire('click');
        const edit_marker = document.getElementById('edit' + marker._popup._leaflet_id);
        edit_marker.click();
        this.askElevation([marker._latlng]);
        this.buttons.clone_wpt = null;
    }

    deleteWaypoint(marker) {
        var wpt_group = this.getWaypointsGroup();
        if (wpt_group) wpt_group.removeLayer(marker);
    }

    deletePointManual(marker) {
        const points = marker._layer._latlngs;

        const prec_idx = marker._prec.index;
        const this_idx = marker._pt.index;
        const succ_idx = marker._succ.index;

        var res = [];
        if (prec_idx == this_idx) {
            res = points.splice(this_idx, succ_idx - this_idx);
        } else if (succ_idx == this_idx) {
            res = points.splice(prec_idx + 1, this_idx - prec_idx);
        } else {
            res = points.splice(prec_idx + 1, succ_idx - prec_idx - 1);
        }

        this.recomputeStats();

        // update markers indices
        var idx = -1;
        for (var i = 0; i < this._editMarkers.length; i++) {
            if (this._editMarkers[i] == marker) {
                idx = i;
                break;
            }
        }
        if (idx > 0) {
            if (idx < this._editMarkers.length - 1) this._editMarkers[idx - 1]._succ = this._editMarkers[idx + 1]._pt;
            else this._editMarkers[idx - 1]._succ = this._editMarkers[idx - 1]._pt;
        }
        if (idx < this._editMarkers.length - 1) {
            if (idx > 0) this._editMarkers[idx + 1]._prec = this._editMarkers[idx - 1]._pt;
            else this._editMarkers[idx + 1]._prec = this._editMarkers[idx + 1]._pt;
        }
        this._editMarkers.splice(idx, 1);

        this.update();
        this.redraw();
    }

    deleteZone(bounds, deletePts, deleteWpts, inside) {
        if (deletePts) {
            const tracks = this.getTracks();
            for (var t = 0; t < tracks.length; t++) {
                const segments = this.getSegments(tracks[t]);
                for (var s = 0; s < segments.length; s++) {
                    segments[s]._bounds = L.latLngBounds(segments[s]._latlngs);
                    if ((inside && bounds.intersects(segments[s].getBounds())) ||
                        (!inside && !bounds.contains(segments[s].getBounds()))) {
                        var remove = true;
                        var start = 0;
                        while (remove) {
                            const points = segments[s]._latlngs;
                            var first = -1;
                            remove = false;
                            for (var i = start; i < points.length; i++) {
                                const contains = bounds.contains(points[i]);
                                if (inside == contains) {
                                    if (first == -1) first = i;
                                } else if (first != -1) {
                                    points.splice(first, i - first);
                                    remove = true;
                                    start = first;
                                    break;
                                }
                            }
                            if (!remove && first != -1) {
                                if (first == 0) tracks[t].removeLayer(segments[s]);
                                else points.splice(first);
                            }
                        }
                        segments[s]._latlngs[0].routing = false;
                        segments[s]._latlngs[segments[s]._latlngs.length - 1].routing = false;
                    }
                }
                if (tracks[t].getLayers().length == 0) this.gpx.getLayers()[0].removeLayer(tracks[t]);
            }
        }

        if (deleteWpts) {
            const waypoints = this.getWaypoints();
            for (var i = 0; i < waypoints.length; i++) {
                const contains = bounds.contains(waypoints[i]._latlng);
                if (inside == contains) this.deleteWaypoint(waypoints[i]);
            }
        }

        if (this.getLayers().length == 0) {
            this.total.removeTrace(this.index);
        } else {
            this.buttons.slider.reset();
            this.update();
            this.redraw();
        }
    }

    updatePointManual(marker, lat, lng) {
        marker._pt.lat = lat;
        marker._pt.lng = lng;

        const new_points = [];
        if (marker._prec == marker._pt || marker._pt == marker._succ) { // start or end of line
            new_points.splice(0, 0, ...this.getIntermediatePoints(marker._prec, marker._succ));
        } else {
            new_points.splice(0, 0, ...this.getIntermediatePoints(marker._pt, marker._succ));
            new_points.splice(0, 1, ...this.getIntermediatePoints(marker._prec, marker._pt));
        }

        this.addRoute(new_points, marker._prec, marker._succ, marker._layer);
        this.askElevation(new_points);
    }

    getIntermediatePoints(a, b) {
        const pt1 = L.Projection.SphericalMercator.project(a);
        const pt2 = L.Projection.SphericalMercator.project(b);

        const origin = L.point(0, 0);
        const step = L.point(100, 100);
        var d_pt = pt2.subtract(pt1);
        d_pt = d_pt.divideBy(Math.max(2, d_pt.distanceTo(origin) / step.distanceTo(origin)));

        const pts = [];
        for (var i = 0; pt1.distanceTo(pt1.add(d_pt.multiplyBy(i))) < pt1.distanceTo(pt2); i++) {
            const pt = L.Projection.SphericalMercator.unproject(pt1.add(d_pt.multiplyBy(i)));
            pt.meta = { time: null, original_time: false, ele: 0, surface: "missing" };
            pt.routing = true;
            pts.push(pt);
        }

        const pt = new L.latLng(b.lat, b.lng);
        pt.meta = { time: null, original_time: false, ele: 0, surface: "missing" };

        pts.push(pt);

        pts[0].routing = false;
        pts[pts.length - 1].routing = false;

        return pts;
    }

    updatePointRouting(marker, lat, lng) {
        var a = marker._prec;
        var b = marker._pt;
        var c = marker._succ;

        b.lat = lat;
        b.lng = lng;

        if (a.equals(b) && b.equals(c)) return;

        this.askRoute(a, b, c, marker._layer);
    }

    hasTimeData() {
        const points = this.getPoints();
        if (points.length == 0) return false;
        else if (points[0].meta.time != null) return true;
        else return false;
    }

    changeTimeData(start, avg) {
        const points = this.getPoints();
        const curAvg = this.getMovingSpeed(true);
        if (this.hasTimeData() && curAvg > 0) {
            this.shiftAndCompressTime(start, avg);
        } else if (points.length > 0) {
            points[0].meta.time = start;
            points[0].meta.original_time = true;
            for (var i = 1; i < points.length; i++) {
                const dist = this.gpx._dist2d(points[i - 1], points[i]);
                points[i].meta.time = new Date(points[i - 1].meta.time.getTime() + 1000 * 60 * 60 * dist / (1000 * avg));
                points[i].meta.original_time = true;
            }
        }
    }

    shiftAndCompressTime(start, avg) {
        if (avg <= 0) return;
        const points = this.getPoints();
        const curAvg = this.getMovingSpeed(true);
        var last = points[0].meta.time;
        points[0].meta.time = start;
        for (var i = 1; i < points.length; i++) {
            const newTime = new Date(points[i - 1].meta.time.getTime() + (points[i].meta.time.getTime() - last.getTime()) * curAvg / avg);
            last = points[i].meta.time;
            points[i].meta.time = newTime;
        }
    }

    extendTimeData(keep_timestamps) {
        var avg = this.getMovingSpeed(true);
        if (avg <= 0) return;

        const points = this.getPoints();

        if (keep_timestamps) {
            var start = null, total_dist = 0;
            for (var i = 0; i < points.length; i++) {
                if (start == null && points[i].meta.time == null) start = i;
                else if (start != null) {
                    total_dist += this.gpx._dist2d(points[i - 1], points[i]);
                    if (points[i].meta.original_time) {
                        if (start == 0) {
                            const dist = this.gpx._dist2d(points[0], points[i]);
                            points[0].meta.time = new Date(points[i].meta.time.getTime() - 1000 * 60 * 60 * dist / (1000 * avg));
                            for (var j = 1; j < i; j++) {
                                const dist = this.gpx._dist2d(points[j - 1], points[j]);
                                points[j].meta.time = new Date(points[j - 1].meta.time.getTime() + 1000 * 60 * 60 * dist / (1000 * avg));
                            }
                        } else {
                            const delta = points[i].meta.time.getTime() - points[start - 1].meta.time.getTime();
                            for (var j = start; j < i; j++) {
                                const dist = this.gpx._dist2d(points[j - 1], points[j]);
                                points[j].meta.time = new Date(points[j - 1].meta.time.getTime() + delta * dist / total_dist);
                            }
                        }

                        start = null;
                        total_dist = 0;
                    }
                }
            }

            if (start != null && start > 0) {
                for (var i = start; i < points.length; i++) {
                    const dist = this.gpx._dist2d(points[i - 1], points[i]);
                    points[i].meta.time = new Date(points[i - 1].meta.time.getTime() + 1000 * 60 * 60 * dist / (1000 * avg));
                }
            }
        } else {
            var moving_length = 0, moving_time = 0, missing_length = 0;
            for (var i = 1; i < points.length; i++) {
                const dist = this.gpx._dist2d(points[i - 1], points[i]);
                if (points[i - 1].meta.time != null && points[i].meta.time != null) {
                    const t = points[i].meta.time - points[i - 1].meta.time;
                    if (this.gpx._moving_criterion(dist, t)) {
                        moving_length += dist / 1000;
                        moving_time += t / (1000 * 60 * 60);
                    }
                } else {
                    missing_length += dist / 1000;
                }
            }

            const total_length = moving_length + missing_length;
            const missing_time = total_length / avg - moving_time;
            const missing_avg = missing_length / missing_time;

            if (points[0].meta.time == null) {
                var total_dist = 0;
                for (var i = 1; i < points.length; i++) {
                    const dist = this.gpx._dist2d(points[i - 1], points[i]);
                    total_dist += dist;
                    if (points[i].meta.time != null) {
                        points[0].meta.time = new Date(points[i].meta.time.getTime() - 1000 * 60 * 60 * total_dist / (1000 * missing_avg));
                        points[0].meta.original_time = true;
                        break;
                    }
                }
            }

            var last = points[0].meta.time;
            for (var i = 1; i < points.length; i++) {
                if (points[i].meta.time == null || last == null) {
                    last = points[i].meta.time;
                    const dist = this.gpx._dist2d(points[i - 1], points[i]);
                    points[i].meta.time = new Date(points[i - 1].meta.time.getTime() + 1000 * 60 * 60 * dist / (1000 * missing_avg));
                    points[i].meta.original_time = true;
                } else {
                    const newTime = new Date(points[i - 1].meta.time.getTime() + points[i].meta.time.getTime() - last.getTime());
                    last = points[i].meta.time;
                    points[i].meta.time = newTime;
                    points[i].meta.original_time = true;
                }
            }
        }
    }

    slopeFactor(slope) {
        const max_slope = 100;
        slope = Math.max(-max_slope, Math.min(max_slope, slope));

        if (this.buttons.activity != 'hike') {
            if (slope < -30) {
                return 1.5;
            } else if (slope < 0) {
                return 1 + 2 * 0.7 / 13 * slope + 0.7 / Math.pow(13, 2) * Math.pow(slope, 2);
            } else if (slope <= 20) {
                return 1 + Math.pow(slope / 7, 2);
            } else {
                return 10;
            }
        } else {
            if (slope < -30) {
                return 4;
            } else if (slope < 0) {
                return 1 + 0.05 * slope + 0.005 * Math.pow(slope, 2);
            } else if (slope <= 20) {
                return 1 + Math.pow(slope / 12, 2);
            } else {
                return 4;
            }
        }
    }

    generateTimeData(start, avg) {
        const alpha = 0.15;
        var last_speed = avg;
        const points = this.getPoints();
        points[0].meta.time = start;
        points[0].meta.original_time = true;

        for (var i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const dist = b._dist - a._dist;
            const slope = dist == 0 ? 0 : (b.meta.smoothed_ele - a.meta.smoothed_ele) / (1000 * dist) * 100;
            const slope_factor = this.slopeFactor(slope);
            const speed = alpha * (avg / slope_factor) + (1 - alpha) * last_speed;
            points[i].meta.time = new Date(a.meta.time.getTime() + 1000 * 60 * 60 * dist / speed);
            points[i].meta.original_time = true;
            last_speed = speed;
        }

        this.recomputeStats();
    }

    timeConsistency() {
        if (!this.hasTimeData()) return;

        const avg = this.getMovingSpeed(true);
        const points = this.getPoints();
        if (avg <= 0) {
            for (var i = 0; i < points.length; i++) {
                points[i].meta.time = null;
                points[i].meta.original_time = false;
            }
        } else {
            var last = points[0].meta.time;
            for (var i = 1; i < points.length; i++) {
                if (points[i].meta.time <= points[i - 1].meta.time) {
                    var newTime = new Date(points[i - 1].meta.time.getTime() + (points[i].meta.time.getTime() - last.getTime()));
                    if (newTime <= points[i - 1].meta.time) {
                        const dist = this.gpx._dist2d(points[i - 1], points[i]);
                        newTime = new Date(points[i - 1].meta.time.getTime() + + 1000 * 60 * 60 * dist / (1000 * avg));
                    }
                    last = points[i].meta.time;
                    points[i].meta.time = newTime;
                } else last = points[i].meta.time;
            }
        }
    }

    recomputeStats() {
        var start = 0, end = this.getPoints().length - 1;
        if (this.buttons.slider.isActive()) {
            start = Math.max(start, this.buttons.slider.getIndexStart());
            end = Math.min(end, this.buttons.slider.getIndexEnd());
        }

        this.gpx._compute_stats(start, end);
    }

    /*** REQUESTS ***/

    askElevation(points) {
        const _this = this;

        const toID = function (tile) {
            var dim = 2 * (1 << tile[2]);
            return ((dim * tile[1] + tile[0]) * 32) + tile[2];
        }

        const decodeElevation = function (start) {
            for (var i = (start ? start : 0); i < points.length; i++) {
                const png = _this.buttons.terrain_cache.get(points[i].tile);
                if (png === true) { // request not ended
                    setTimeout(decodeElevation, 500);
                    return;
                } else if (png === false) { // tile not found (sea)
                    points[i].meta.ele = 0;
                } else { // decode
                    const x = points[i].tf[0] * png.width;
                    const _x = Math.floor(x);
                    const y = points[i].tf[1] * png.height;
                    const _y = Math.floor(y);

                    const dx = x - _x;
                    const dy = y - _y;

                    // bilinear interpolation
                    const p00 = png.getPixel(_x, _y);
                    const p01 = png.getPixel(_x, _y + (_y == 511 ? 0 : 1));
                    const p10 = png.getPixel(_x + (_x == 511 ? 0 : 1), _y);
                    const p11 = png.getPixel(_x + (_x == 511 ? 0 : 1), _y + (_y == 511 ? 0 : 1));

                    const ele00 = -10000 + ((p00[0] * 256 * 256 + p00[1] * 256 + p00[2]) * 0.1);
                    const ele01 = -10000 + ((p01[0] * 256 * 256 + p01[1] * 256 + p01[2]) * 0.1);
                    const ele10 = -10000 + ((p10[0] * 256 * 256 + p10[1] * 256 + p10[2]) * 0.1);
                    const ele11 = -10000 + ((p11[0] * 256 * 256 + p11[1] * 256 + p11[2]) * 0.1);

                    points[i].meta.ele = ele00 * (1 - dx) * (1 - dy) + ele01 * (1 - dx) * dy + ele10 * dx * (1 - dy) + ele11 * dx * dy;
                }
            }

            _this.recomputeStats();
            _this.update();
        };

        var found = 0;
        for (var i = 0; i < points.length; i++) {
            const tf = this.buttons.tilebelt.pointToTileFraction(points[i].lng, points[i].lat, ELEVATION_ZOOM);
            const tile = tf.map(Math.floor);
            const tile_id = toID(tile);
            points[i].tile = tile_id;
            points[i].tf = [tf[0] - tile[0], tf[1] - tile[1]];
            if (this.buttons.terrain_cache.has(tile_id)) { // check in cache
                found++;
                if (found == points.length) decodeElevation();
            } else { // request
                this.buttons.terrain_cache.set(tile_id, true); // already set so only one query
                const Http = new XMLHttpRequest();
                Http.responseType = 'arraybuffer';
                var url = 'https://api.mapbox.com/v4/mapbox.mapbox-terrain-dem-v1/' + tile[2] + '/' + tile[0] + '/' + tile[1] + '@2x.pngraw?access_token=' + this.buttons.mapbox_token;
                if (this.buttons.mapboxSKUToken) {
                    url += '&sku=' + this.buttons.mapboxSKUToken;
                }
                Http.open("GET", url);
                Http.send();
                Http.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        var reader = new _this.buttons.PNGReader(this.response);
                        reader.parse(function (err, png) {
                            if (err) console.log('Error parsing terrain PNG:', err);
                            else _this.buttons.terrain_cache.set(tile_id, png);
                            found++;
                            if (found == points.length) decodeElevation();
                        });
                    } else if (this.readyState == 4 && this.status == 404) {
                        found++;
                        _this.buttons.terrain_cache.set(tile_id, false);
                        if (found == points.length) decodeElevation();
                    }
                }
            }
        }
    }

    askRoute(a, b, c, layer) {
        const Http = new XMLHttpRequest();
        var url = this.buttons.routing_url + ((a.equals(b) || b.equals(c)) ?
            `?lonlats=${a.lng},${a.lat}|${c.lng},${c.lat}&profile=${this.buttons.activity}${this.buttons.private ? '-private' : ''}&alternativeidx=0&format=geojson` :
            `?lonlats=${a.lng},${a.lat}|${b.lng},${b.lat}|${c.lng},${c.lat}&profile=${this.buttons.activity}${this.buttons.private ? '-private' : ''}&alternativeidx=0&format=geojson`);
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                const new_points = [];
                const new_pts = ans.features[0].geometry.coordinates;
                const lngIdx = ans.features[0].properties.messages[0].indexOf("Longitude");
                const latIdx = ans.features[0].properties.messages[0].indexOf("Latitude");
                const tagIdx = ans.features[0].properties.messages[0].indexOf("WayTags");
                var messageIdx = 1;
                var surface = getSurface(ans.features[0].properties.messages[messageIdx][tagIdx]);

                var mid = -1, dist = -1, j = 0;
                for (var i = 0; i < new_pts.length; i++) {
                    if (new_pts[i].length == 2) { // unknown elevation (eg in tunnels)
                        for (var j = i - 1; j >= 0 && new_pts[i].length == 2; j--) {
                            if (new_pts[j].length == 3) new_pts[i].push(new_pts[j][2]);
                        }
                        for (var j = i + 1; j < new_pts.length && new_pts[i].length == 2; j++) {
                            if (new_pts[j].length == 3) new_pts[i].push(new_pts[j][2]);
                        }
                        if (new_pts[i].length == 2) new_pts[i].push(0);
                    }

                    new_points.push(L.latLng(new_pts[i][1], new_pts[i][0]));

                    if (messageIdx < ans.features[0].properties.messages.length &&
                        new_points[i].lng == Number(ans.features[0].properties.messages[messageIdx][lngIdx]) / 1000000 &&
                        new_points[i].lat == Number(ans.features[0].properties.messages[messageIdx][latIdx]) / 1000000) {
                        messageIdx++;
                        if (messageIdx == ans.features[0].properties.messages.length) surface = "missing";
                        else surface = getSurface(ans.features[0].properties.messages[messageIdx][tagIdx]);
                    }

                    new_points[i].meta = { time: null, original_time: false, ele: new_pts[i][2], surface: surface };
                    new_points[i].routing = true;

                    if (mid == -1 || new_points[i].distanceTo(b) < dist) {
                        dist = new_points[i].distanceTo(b);
                        mid = i;
                    }
                }
                new_points[0].routing = false;
                new_points[new_points.length - 1].routing = false;
                if (!a.equals(b) && !b.equals(c)) new_points[mid].routing = false;

                trace.addRoute(new_points, a, c, layer);
            } else if (this.readyState == 4) {
                trace.addRoute([a, b, c], a, c, layer);
            }
        }
    }

    addRoute(new_points, a, c, layer) {
        const pts = layer._latlngs;
        pts.splice(a.index, c.index - a.index + 1, ...new_points);
        this.extendTimeData(this.buttons.keep_timestamps);
        this.redraw();
        this.recomputeStats();
        this.updateEditMarkers();
        this.update();
    }

    askRoute2(a, b, layer) {
        const Http = new XMLHttpRequest();
        var url = this.buttons.routing_url + `?lonlats=${a.lng},${a.lat}|${b.lng},${b.lat}&profile=${this.buttons.activity}${this.buttons.private ? '-private' : ''}&alternativeidx=0&format=geojson`;
        Http.open("GET", url);
        Http.send();

        const trace = this;

        Http.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ans = JSON.parse(this.responseText);
                const new_pts = ans.features[0].geometry.coordinates;
                const lngIdx = ans.features[0].properties.messages[0].indexOf("Longitude");
                const latIdx = ans.features[0].properties.messages[0].indexOf("Latitude");
                const tagIdx = ans.features[0].properties.messages[0].indexOf("WayTags");
                var messageIdx = 1;
                var surface = getSurface(ans.features[0].properties.messages[messageIdx][tagIdx]);

                const new_points = [];
                var j = 0;
                for (var i = 0; i < new_pts.length; i++) {
                    if (new_pts[i].length == 2) { // unknown elevation (eg in tunnels)
                        for (var j = i - 1; j >= 0 && new_pts[i].length == 2; j--) {
                            if (new_pts[j].length == 3) new_pts[i].push(new_pts[j][2]);
                        }
                        for (var j = i + 1; j < new_pts.length && new_pts[i].length == 2; j++) {
                            if (new_pts[j].length == 3) new_pts[i].push(new_pts[j][2]);
                        }
                        if (new_pts[i].length == 2) new_pts[i].push(0);
                    }

                    new_points.push(L.latLng(new_pts[i][1], new_pts[i][0]));

                    if (messageIdx < ans.features[0].properties.messages.length &&
                        new_points[i].lng == Number(ans.features[0].properties.messages[messageIdx][lngIdx]) / 1000000 &&
                        new_points[i].lat == Number(ans.features[0].properties.messages[messageIdx][latIdx]) / 1000000) {
                        messageIdx++;
                        if (messageIdx == ans.features[0].properties.messages.length) surface = "missing";
                        else surface = getSurface(ans.features[0].properties.messages[messageIdx][tagIdx]);
                    }

                    new_points[i].meta = { time: null, original_time: false, ele: new_pts[i][2], surface: surface };
                    new_points[i].routing = true;
                }
                new_points[0].routing = false;
                new_points[new_points.length - 1].routing = false;
                trace.addRoute2(new_points, a, b, layer);
            } else if (this.readyState == 4) {
                trace.addRoute2([a, b], a, b, layer);
            }
        }
    }

    addRoute2(new_points, a, b, layer) {
        const pts = layer._latlngs;
        // add new
        pts.splice(a.index, 1, ...new_points);

        this.extendTimeData(this.buttons.keep_timestamps);
        this.redraw();
        this.recomputeStats();
        this.updateEditMarkers();
        this.update();
    }

    // UNDO REDO

    save(noUpdate) {
        // wipe all redo info on save
        if (this.at != this.memory.length - 1) this.memory.splice(this.at + 1, this.memory.length);
        if (this.lastSaveIsNew) {
            const mem = [];
            const tracks = this.getTracks();
            for (var t = 0; t < tracks.length; t++) {
                const segments = this.getSegments(tracks[t]);
                var segs = [];
                for (var s = 0; s < segments.length; s++) {
                    const points = segments[s]._latlngs;
                    var cpy = [];
                    for (var i = 0; i < points.length; i++) {
                        const pt = points[i].clone();
                        pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                        if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                        pt.index = points[i].index;
                        pt.routing = points[i].routing;
                        cpy.push(pt);
                    }
                    segs.push(cpy);
                }
                if (segs.length > 0) {
                    var trk = {
                        segments: segs,
                        style: tracks[t].style
                    };
                    if (tracks[t].name) trk.name = tracks[t].name;
                    mem.push(trk);
                }
            }
            this.memory.push(mem);
            this.at++;
        }

        this.backToZero = false;
        if (noUpdate) {
            this.lastSaveIsNew = false;
            return;
        }
        this.lastSaveIsNew = true;
        this.updateUndoRedo();
    }

    undo() {
        if (this.at == -1) return;
        if (this.at == this.memory.length - 1 && this.lastSaveIsNew) this.save(true);
        if (this.at <= 0) return;

        this.at--;
        if (this.at == 0) this.backToZero = true;
        else this.backToZero = false;
        this.do();
    }

    redo() {
        if (this.at >= this.memory.length - 1) return;

        this.backToZero = false;
        this.at++;
        this.do();
    }

    do() {
        const tracks = this.getTracks();
        for (var t = 0; t < tracks.length; t++) this.gpx.getLayers()[0].removeLayer(tracks[t]);

        const mem = this.memory[this.at];
        for (var t = 0; t < mem.length; t++) {
            const segments = mem[t].segments;
            var segs = [];
            for (var s = 0; s < segments.length; s++) {
                const points = segments[s];
                const cpy = [];
                for (var i = 0; i < points.length; i++) {
                    const pt = points[i].clone();
                    pt.meta = JSON.parse(JSON.stringify(points[i].meta));
                    if (pt.meta.time != null) pt.meta.time = new Date(pt.meta.time);
                    pt.index = points[i].index;
                    pt.routing = points[i].routing;
                    cpy.push(pt);
                }
                if (cpy.length > 0) segs.push(new L.Polyline(cpy));
            }
            if (segs.length > 0) {
                var trk = new L.FeatureGroup(segs);
                trk.style = mem[t].style;
                if (mem[t].name) trk.name = mem[t].name;
                this.gpx.getLayers()[0].addLayer(trk);
            }
        }

        this.setStyle(true);
        this.updateUndoRedo();
        this.recomputeStats();
        this.update();
        this.redraw();
        this.updateEditMarkers();
    }
}
