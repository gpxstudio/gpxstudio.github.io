import Total from './total.js';
import Slider from './slider.js';
import Google from './google.js';

export default class Buttons {
    constructor() {
        // SETTINGS
        this.km = localStorage.hasOwnProperty('km') ? localStorage.getItem('km') == 'true' : true;
        this.speed_units = localStorage.hasOwnProperty('speed') ? localStorage.getItem('speed') == 'true' : true;
        this.activity = localStorage.hasOwnProperty('activity') ? localStorage.getItem('activity') : document.getElementById('activity-input').children[0].value;
        this.routing = localStorage.hasOwnProperty('routing') ? localStorage.getItem('routing') == 'true' : true;
        this.private = localStorage.hasOwnProperty('private') ? localStorage.getItem('private') == 'true' : false;
        this.strava_color = localStorage.hasOwnProperty('strava-color') ? localStorage.getItem('strava-color') : 'bluered';
        this.poi_min_zoom = localStorage.hasOwnProperty('poi-min-zoom') ? parseInt(localStorage.getItem('poi-min-zoom')) : 14;
        this.keep_timestamps = false;
        this.disable_trace = false;
        this.show_direction = false;
        this.show_distance = false;
        this.custom_layers = localStorage.hasOwnProperty('custom-layers') ? JSON.parse(localStorage.getItem('custom-layers')) : [];
        this.custom_layers_object = [];

        this.terrain_cache = new Map();
        this.tilebelt = require('/include/tilebelt/index.js');
        this.PNGReader = require('/include/png/PNGReader.js');

        // EMBEDDING
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        this.embedding = urlParams.has('embed');
        if (this.embedding) {
            if (urlParams.has('imperial')) this.km = false;
            if (urlParams.has('running')) this.speed_units = false;
            if (urlParams.has('direction')) this.show_direction = true;
            if (urlParams.has('distance')) this.show_distance = true;
        }

        // MAIN MAP
        this.map = L.map('mapid', {
            zoomControl: false,
            minZoom: 2,
            worldCopyJump: true,
            toggleableAttributionControl: false,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
        }).setView([0, 0], 2);

        if (!this.embedding && !urlParams.has('state') && !localStorage.hasOwnProperty('traces')) {
            var locationFound = false;
            this.map.addEventListener("locationfound", function (e) {
                if (!locationFound) {
                    e.target.setView(e.latlng, 12);
                    locationFound = true;
                }
            });
            this.map.locate({ setView: true, maximumAge: 100000 });
        }

        // BUTTONS
        this.input = document.getElementById("input-file");
        this.load = document.getElementById("load");
        this.load2 = document.getElementById("load2");
        this.load_drive = document.getElementById("load-drive");
        this.load_error_ok = document.getElementById("load-error-ok");
        this.draw = document.getElementById("manual");
        this.undo = document.getElementById("undo");
        this.redo = document.getElementById("redo");
        this.clear = document.getElementById("clear");
        this.clear2 = document.getElementById("clear2");
        this.cancel_clear = document.getElementById("cancelclear");
        this.help = document.getElementById("help");
        this.about = document.getElementById("about");
        this.account = document.getElementById("account");
        this.donate = document.getElementById("donate");
        this.donate2 = document.getElementById("donate-2");
        this.delete = document.getElementById("delete");
        this.delete2 = document.getElementById("delete2");
        this.zone_delete = document.getElementById("zone-delete");
        this.zone_delete_ok = document.getElementById("zone-delete-ok");
        this.zone_delete_cancel = document.getElementById("zone-delete-cancel");
        this.zone_delete_pts = document.getElementById("zone-delete-points");
        this.zone_delete_wpts = document.getElementById("zone-delete-waypoints");
        this.zone_delete_inside = document.getElementById("zone-delete-inside");
        this.zone_delete_inside.value = 'inside';
        this.zone_delete_outside = document.getElementById("zone-delete-outside");
        this.zone_delete_outside.value = 'outside';
        this.hide = document.getElementById("hide");
        this.reverse = document.getElementById("reverse");
        this.split_ok = document.getElementById("split-ok");
        this.split_cancel = document.getElementById("split-cancel");
        this.split_as_files = document.getElementById("split-as-files");
        this.split_as_tracks = document.getElementById("split-as-tracks");
        this.split_as_segments = document.getElementById("split-as-segments");
        this.extract = document.getElementById("extract");
        this.extract_ok = document.getElementById("extract-ok");
        this.extract_cancel = document.getElementById("extract-cancel");
        this.extract_as_segments = document.getElementById("extract-segment");
        this.structure = document.getElementById("structure");
        this.reduce = document.getElementById("reduce");
        this.reduce_ok = document.getElementById("reduce-ok");
        this.reduce_cancel = document.getElementById("reduce-cancel");
        this.reduce_slider = document.getElementById("reduce-slider");
        this.cancel_delete = document.getElementById("canceldelete");
        this.time = document.getElementById("edit-time");
        this.combine = document.getElementById("combine");
        this.duplicate = document.getElementById("duplicate");
        this.add_wpt = document.getElementById("add-wpt");
        this.color = document.getElementById("color");
        this.color_ok = document.getElementById("validate-color");
        this.color_cancel = document.getElementById("cancel-color");
        this.color_picker = document.getElementById("color-picker");
        this.color_checkbox = document.getElementById("color-checkbox");
        this.opacity_slider = document.getElementById("opacity-slider");
        this.opacity_checkbox = document.getElementById("opacity-checkbox");
        this.width_slider = document.getElementById("width-slider");
        this.width_checkbox = document.getElementById("width-checkbox");
        this.edit = document.getElementById("edit");
        this.editing_options = document.getElementById("editing-options");
        this.toggle_editing_options = document.getElementById("toggle-editing-options");
        this.validate = document.getElementById("validate");
        this.crop_container = document.getElementById("crop-container");
        this.crop_ok = document.getElementById("crop-ok");
        this.crop_cancel = document.getElementById("crop-cancel");
        this.crop_keep = document.getElementById("crop-keep");
        this.layer_selection_ok = document.getElementById("layer-selection-ok");
        this.export = document.getElementById("export");
        this.export2 = document.getElementById("export-2");
        this.save_drive = document.getElementById("save-drive");
        this.chevrons = document.getElementById("chevrons");
        this.show_chevrons = document.getElementById("show-chevrons");
        this.dist_markers = document.getElementById("dist-markers");
        this.show_dist_markers = document.getElementById("show-dist-markers");
        this.merge = document.getElementById("merge");
        this.include_time = document.getElementById("include-time");
        this.include_hr = document.getElementById("include-hr");
        this.include_cad = document.getElementById("include-cad");
        this.include_atemp = document.getElementById("include-atemp");
        this.include_power = document.getElementById("include-power");
        this.include_surface = document.getElementById("include-surface");
        this.copy_link = document.getElementById("copy-link");
        this.copy_embed = document.getElementById("copy-embed");
        this.merge_as_points = document.getElementById("merge-as-points");
        this.merge_as_segments = document.getElementById("merge-as-segments");
        this.merge_as_tracks = document.getElementById("merge-as-tracks");
        this.merge_keep_time = document.getElementById("merge-keep");
        this.merge_stick_time = document.getElementById("merge-stick");
        this.edit_keep_avg = document.getElementById("edit-avg");
        this.edit_keep_time = document.getElementById("edit-keep");
        this.buttons_bar = document.getElementById('buttons-bar');

        // DISPLAYS
        this.distance_info = document.getElementById("distance");
        this.distance = document.getElementById("distance-val");
        this.elevation_info = document.getElementById("elevation");
        this.elevation = document.getElementById("elevation-val");
        this.duration_info = document.getElementById("duration");
        this.duration = document.getElementById("duration-val");
        this.speed_info = document.getElementById("speed");
        this.speed = document.getElementById("speed-val");
        this.points_info = document.getElementById("points");
        this.points = document.getElementById("points-val");
        this.segments_info = document.getElementById("segments");
        this.segments = document.getElementById("segments-val");
        this.tracks_info = document.getElementById("tracks");
        this.tracks = document.getElementById("tracks-val");
        this.activity_input = document.getElementById("activity-input");
        this.routing_input = document.getElementById("routing-input");
        this.private_input = document.getElementById("private-input");
        this.strava_color_input = document.getElementById("strava-color-input");
        this.poi_min_zoom_input = document.getElementById("poi-min-zoom-input");
        this.units_input = document.getElementById("units-input");
        this.units_text = document.getElementById("units-text");
        this.speed_units_input = document.getElementById("speed-units-input");
        this.speed_units_text = document.getElementById("speed-units-text");
        this.elevation_input = document.getElementById("elevation-input");
        this.trace_info_grid = document.getElementById('info-grid');
        this.slide_container = document.getElementById('slide-container');
        this.start_slider = document.getElementById('start-point');
        this.end_slider = document.getElementById('end-point');
        this.total_tab = document.getElementById('total-tab');
        this.tabs = document.getElementById('sortable-tabs');
        this.help_text = document.getElementById('help-text');
        this.export_content = document.getElementById('export-content');
        this.clear_content = document.getElementById('clear-content');
        this.delete_content = document.getElementById('delete-content');
        this.zone_delete_content = document.getElementById("zone-delete-content");
        this.color_content = document.getElementById('color-content');
        this.reduce_content = document.getElementById('reduce-content');
        this.reduce_npoints = document.getElementById('reduce-npoints');
        this.load_content = document.getElementById('load-content');
        this.share_content = document.getElementById('share-content');
        this.merge_content = document.getElementById('merge-content');
        this.split_content = document.getElementById('split-content');
        this.extract_content = document.getElementById('extract-content');
        this.structure_content = document.getElementById('structure-content');
        this.file_structure = document.getElementById('file-structure');
        this.merge_selection = document.getElementById('merge-selection');
        this.delete_selection = document.getElementById('delete-selection');
        this.segment_text = document.getElementById('segment-text');
        this.track_text = document.getElementById('track-text');
        this.merge_time_options = document.getElementById('merge-time-options');
        this.crop_content = document.getElementById('crop-content');
        this.layer_selection_content = document.getElementById('layer-selection-content');
        this.layer_selection = document.getElementById('layer-selection-area');
        this.layer_creation = document.getElementById('layer-creation-ok');
        this.layer_name = document.getElementById('layer-name');
        this.layer_url = document.getElementById('layer-url');
        this.layer_max_zoom = document.getElementById('layer-max-zoom');
        this.layer_type = document.getElementById('layer-type');
        this.load_error_content = document.getElementById('load-error-content');
        this.embed_content = document.getElementById('embed-content');
        this.trace_info_content = document.getElementById('info');
        this.toolbar_content = document.getElementById('toolbar');
        this.street_view_content = document.getElementById('street-view-content');
        this.street_view_button = document.getElementById('street-view');
        this.street_view_google = document.getElementById('street-view-provider-google');
        this.street_view_mapillary = document.getElementById('street-view-provider-mapillary');
        this.mapillary_container = document.getElementById('mly');
        this.mapillary_move = document.getElementById('mly-move');
        this.mapillary_close = document.getElementById('mly-close');

        // TRANSLATED TEXT
        this.ok_button_text = document.getElementById('ok-button-text').textContent;
        this.cancel_button_text = document.getElementById('cancel-button-text').textContent;
        this.unit_kilometers_text = document.getElementById('unit-kilometers-text').textContent;
        this.unit_miles_text = document.getElementById('unit-miles-text').textContent;
        this.unit_meters_text = document.getElementById('unit-meters-text').textContent;
        this.unit_feet_text = document.getElementById('unit-feet-text').textContent;
        this.unit_hours_text = document.getElementById('unit-hours-text').textContent;
        this.unit_minutes_text = document.getElementById('unit-minutes-text').textContent;
        this.edit_info_text = document.getElementById('edit-info-text').textContent;
        this.duplicate_text = document.getElementById('duplicate-text').textContent;
        this.delete_text = document.getElementById('delete-text').textContent;
        this.split_text = document.getElementById('split-text').textContent;
        this.start_loop_text = document.getElementById('start-loop-text').textContent;
        this.remove_pt_text = document.getElementById('remove-pt-text').textContent;
        this.speed_text = document.getElementById('speed-text').textContent;
        this.pace_text = document.getElementById('pace-text').textContent;
        this.start_text = document.getElementById('start-text').textContent;
        this.experimental_info_text = document.getElementById('experimental-info-text').innerHTML;
        this.name_text = document.getElementById('name-text').textContent;
        this.comment_text = document.getElementById('comment-text').textContent;
        this.description_text = document.getElementById('description-text').textContent;
        this.symbol_text = document.getElementById('symbol-text').textContent;
        this.search_input_text = document.getElementById('search-input-text').textContent;
        this.search_button_text = document.getElementById('search-button-text').textContent;
        this.locate_button_text = document.getElementById('locate-button-text').textContent;
        this.empty_title_text = document.getElementById('empty-title-text').textContent;
        this.basemaps_text = document.getElementById('basemaps-text').textContent;
        this.overlays_text = document.getElementById('overlays-text').textContent;
        this.world_text = document.getElementById('world-text').textContent;
        this.countries_text = document.getElementById('countries-text').textContent;
        this.bulgaria_text = document.getElementById('bulgaria-text').textContent;
        this.finland_text = document.getElementById('finland-text').textContent;
        this.france_text = document.getElementById('france-text').textContent;
        this.new_zealand_text = document.getElementById('new-zealand-text').textContent;
        this.norway_text = document.getElementById('norway-text').textContent;
        this.spain_text = document.getElementById('spain-text').textContent;
        this.sweden_text = document.getElementById('sweden-text').textContent;
        this.switzerland_text = document.getElementById('switzerland-text').textContent;
        this.united_kingdom_text = document.getElementById('united-kingdom-text').textContent;
        this.united_states_text = document.getElementById('united-states-text').textContent;
        this.poi_text = document.getElementById('poi-text').textContent;
        this.custom_text = document.getElementById('custom-text').textContent;

        // WINDOWS
        this.help_window = L.control.window(this.map, { title: '', content: this.help_text, className: 'panels-container' });
        this.export_window = L.control.window(this.map, { title: '', content: this.export_content, className: 'panels-container' });
        this.clear_window = L.control.window(this.map, { title: '', content: this.clear_content, className: 'panels-container', closeButton: false });
        this.delete_window = L.control.window(this.map, { title: '', content: this.delete_content, className: 'panels-container', closeButton: false });
        this.zone_delete_window = L.control.window(this.map, { title: '', content: this.zone_delete_content, className: 'panels-container', closeButton: false });
        this.color_window = L.control.window(this.map, { title: '', content: this.color_content, className: 'panels-container', closeButton: false });
        this.reduce_window = L.control.window(this.map, { title: '', content: this.reduce_content, className: 'panels-container', closeButton: false });
        this.load_window = L.control.window(this.map, { title: '', content: this.load_content, className: 'panels-container' });
        this.load_error_window = L.control.window(this.map, { title: '', content: this.load_error_content, className: 'panels-container', closeButton: false });
        this.share_window = L.control.window(this.map, { title: '', content: this.share_content, className: 'panels-container' });
        this.merge_window = L.control.window(this.map, { title: '', content: this.merge_content, className: 'panels-container' });
        this.split_window = L.control.window(this.map, { title: '', content: this.split_content, className: 'panels-container' });
        this.extract_window = L.control.window(this.map, { title: '', content: this.extract_content, className: 'panels-container', closeButton: false });
        this.structure_window = L.control.window(this.map, { title: '', content: this.structure_content, className: 'panels-container' });
        this.crop_window = L.control.window(this.map, { title: '', content: this.crop_content, className: 'panels-container', closeButton: false });
        this.layer_selection_window = L.control.window(this.map, { title: '', content: this.layer_selection_content, className: 'panels-container' });

        this.zoom = L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        var _this = this;

        // ELEVATION PROFILE
        this.elev = L.control.heightgraph({
            width: 100,
            height: 100,
            margins: {
                top: 15,
                right: 10,
                bottom: 30,
                left: 60
            },
            expandControls: false,
            translation: {
                distance: this.distance_info.innerText,
                elevation: document.getElementById('altitude-text').innerText,
                segment_length: document.getElementById('segment-text').innerText,
                type: document.getElementById('type-text').innerText
            },
            selectedAttributeIdx: ((this.embedding && urlParams.has('slope')) ? 1 : 0)
        }).addTo(this.map);
        this.elev.buttons = this;

        this.elevation_profile = document.getElementsByClassName('heightgraph')[0];
        this.elevation_profile.style.gridColumn = '3 / span 1';
        this.elevation_profile.style.gridRow = '1 / span 6';

        // OVERLAY COMPONENTS
        if (this.embedding) {
            this.buttons_bar.style.display = 'none';
            this.toolbar_content.style.display = 'none';
            this.units_input.style.display = 'none';
            this.units_text.style.display = 'none';
            this.speed_units_input.style.display = 'none';
            this.speed_units_text.style.display = 'none';
            this.elevation_input.style.display = 'none';
            this.chevrons.style.display = 'none';
            this.dist_markers.style.display = 'none';
            this.crop_container.style.display = 'none';
            this.slide_container.style.display = 'none';
            this.elevation_profile.style.gridRow = '1 / span 4';

            var nTraces = 0;
            const params = JSON.parse(urlParams.get('state'));
            if (params) {
                if (params.urls) nTraces += params.urls.length;
                if (params.ids) nTraces += params.ids.length;
                if (nTraces == 1) this.tabs.style.display = 'none';
                else this.multipleEmbedding = true;
            }

            this.toolbar = L.control({ position: 'topleft' });
            this.toolbar.onAdd = function (map) {
                var div = _this.embed_content;
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            this.toolbar.addTo(this.map);

            this.embed_content.addEventListener('click', function () {
                window.open(queryString.replace('&embed', '').replace('embed&', '').replace('embed', ''));
            });
        } else {
            this.toolbar = L.control({ position: 'topleft' });
            this.toolbar.onAdd = function (map) {
                var div = _this.toolbar_content;
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            this.toolbar.addTo(this.map);

            this.buttonbar = L.control({ position: 'topleft' });
            this.buttonbar.onAdd = function (map) {
                var div = _this.buttons_bar;
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            this.buttonbar.addTo(this.map);

            this.embed_content.style.display = 'none';

        }

        this.trace_info = L.control({ position: 'bottomleft' });
        this.trace_info.onAdd = function (map) {
            var div = _this.trace_info_content;
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        this.trace_info.addTo(this.map);
        this.trace_info_grid.appendChild(this.elevation_profile);

        this.slider = new Slider(this);

        this.scale = L.control.scale({
            metric: this.km,
            imperial: !this.km,
            position: 'bottomleft'
        }).addTo(this.map);

        L.control.toggleableAttribution({
            position: 'bottomleft',
            icon: '<i class="fas fa-circle-info"></i>',
        }).addTo(this.map);

        this.hideTraceButtons();

        this.addHandlers();

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                const keys = JSON.parse(xhr.responseText);
                _this.routing_url = keys.routing_url;
                _this.mapbox_style = 'mapbox://styles/mapbox/outdoors-v12';

                if (_this.embedding && urlParams.has('token')) {
                    _this.mapbox_token = urlParams.get('token');
                    if (urlParams.has('mapbox-style')) {
                        _this.mapbox_style = urlParams.get('mapbox-style');
                        _this.custom_style = true;
                    }
                } else if (window.location.hostname != "localhost") _this.mapbox_token = keys.mapbox;
                else _this.mapbox_token = keys.mapbox_dev;

                // TILES

                if (_this.embedding) {
                    if (urlParams.has('token') && _this.supportsWebGL()) {
                        _this.mapboxMap = L.mapboxGL({
                            attribution: '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                            maxZoom: MAX_ZOOM,
                            accessToken: _this.mapbox_token,
                            style: _this.mapbox_style,
                            projection: 'mercator',
                            interactive: true,
                            minZoom: 1,
                            dragRotate: false,
                            touchZoomRotate: false,
                            boxZoom: false,
                            dragPan: false,
                            touchPitch: false,
                            doubleClickZoom: false,
                            scrollZoom: false,
                            boxZoom: false
                        }).addTo(_this.map);

                        _this.mapboxSKUToken = _this.mapboxMap.getMapboxMap()._requestManager._skuToken;

                        _this.mapboxMap.remove();
                    }

                    if (urlParams.has('source')) {
                        const mapSource = urlParams.get('source');
                        if (mapSource == 'osm') layers.openStreetMap.addTo(_this.map);
                        else if (mapSource == 'otm') layers.openTopoMap.addTo(_this.map);
                        else if (mapSource == 'ohm') layers.openHikingMap.addTo(_this.map);
                        else if (mapSource == 'outdoors' && urlParams.has('token') && _this.supportsWebGL()) _this.mapboxMap.addTo(_this.map);
                        else if (mapSource == 'satellite' && urlParams.has('token') && _this.supportsWebGL()) {
                            _this.mapboxMap.addTo(_this.map);
                            _this.mapboxMap.options.style = "mapbox://styles/mapbox/satellite-v9";
                            _this.mapboxMap.getMapboxMap().setStyle("mapbox://styles/mapbox/satellite-v9", { diff: false });
                        } else layers.openStreetMap.addTo(_this.map);
                    } else if (urlParams.has('token') && _this.supportsWebGL()) _this.mapboxMap.addTo(_this.map);
                    else layers.openStreetMap.addTo(_this.map);

                    if (urlParams.has('token') && _this.supportsWebGL()) {
                        _this.controlLayers = L.control.layers({
                            [_this.custom_style ? "Mapbox" : "Mapbox Outdoors"]: _this.mapboxMap,
                            "Mapbox Satellite": _this.mapboxMap,
                            "OpenStreetMap": layers.openStreetMap,
                            "OpenTopoMap": layers.openTopoMap,
                            "OpenHikingMap": layers.openHikingMap,
                        }).addTo(_this.map);

                        _this.addSwitchMapboxLayers();
                    } else {
                        _this.controlLayers = L.control.layers({
                            "OpenStreetMap": layers.openStreetMap,
                            "OpenTopoMap": layers.openTopoMap,
                            "OpenHikingMap": layers.openHikingMap,
                        }).addTo(_this.map);
                    }
                } else {
                    _this.geocoderControl = L.Control.geocoder({
                        defaultMarkGeocode: false,
                        placeholder: _this.search_input_text
                    }).on('markgeocode', function (e) {
                        var bbox = e.geocode.bbox;
                        _this.map.fitBounds(bbox);
                    }).addTo(_this.map);
                    _this.geocoderControl.getContainer().children[0].title = _this.search_button_text;

                    L.control.locate({
                        position: 'topright',
                        icon: 'fas fa-crosshairs',
                        iconLoading: 'fas fa-spinner spinner',
                        setView: 'always',
                        keepCurrentZoomLevel: true,
                        showPopup: false,
                        strings: { title: _this.locate_button_text }
                    }).addTo(_this.map);

                    _this.streetView = L.control({
                        position: 'topright'
                    });
                    _this.streetView.onAdd = function (map) {
                        var div = L.DomUtil.create('div', 'leaflet-control-street-view leaflet-control-layers leaflet-bar');
                        div.appendChild(_this.street_view_content);
                        L.DomEvent.disableClickPropagation(div);
                        return div;
                    };
                    _this.streetView.addTo(_this.map);

                    layers.stravaHeatmapAll.on('tileerror', function () {
                        _this.updateStravaCookies();
                    });

                    layers.stravaHeatmapRide.on('tileerror', function () {
                        _this.updateStravaCookies();
                    });

                    layers.stravaHeatmapRun.on('tileerror', function () {
                        _this.updateStravaCookies();
                    });

                    layers.stravaHeatmapWater.on('tileerror', function () {
                        _this.updateStravaCookies();
                    });

                    layers.stravaHeatmapWinter.on('tileerror', function () {
                        _this.updateStravaCookies();
                    });

                    var baselayersHierarchy = {};
                    baselayersHierarchy[_this.basemaps_text] = {};
                    baselayersHierarchy[_this.basemaps_text][_this.world_text] = {
                        "Mapbox Outdoors": null,
                        "Mapbox Satellite": null,
                        "OpenStreetMap": layers.openStreetMap,
                        "OpenTopoMap": layers.openTopoMap,
                        "OpenHikingMap": layers.openHikingMap,
                        "CyclOSM": layers.cyclOSM
                    };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text] = {};
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.bulgaria_text] = {
                        "BGMountains": layers.bgMountains
                    };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.finland_text] = { "Lantmäteriverket Terrängkarta": layers.finlandTopo };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.france_text] = {
                        "IGN SCAN25": layers.ignFrScan25,
                        "IGN Plan": layers.ignPlanV2,
                        "IGN Satellite": layers.ignSatellite
                    };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.new_zealand_text] = {
                        "Linz Topo": layers.linz,
                        "Linz Topo50": layers.linzTopo
                    };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.norway_text] = { "Topografisk Norgeskart 4": layers.norwayTopo };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.spain_text] = { "IGN": layers.ignEs };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.sweden_text] = { "Lantmäteriet Topo": layers.swedenTopo };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.switzerland_text] = { "swisstopo": layers.swisstopo };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.united_kingdom_text] = { "Ordnance Survey": layers.ordnanceSurvey };
                    baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.united_states_text] = { "USGS": layers.usgs };

                    var overlaysHierarchy = {};
                    overlaysHierarchy[_this.overlays_text] = {};
                    overlaysHierarchy[_this.overlays_text][_this.world_text] = {
                        "CyclOSM Lite": layers.cyclOSMLite,
                        "Strava Heatmap": {
                            "All": layers.stravaHeatmapAll,
                            "Ride": layers.stravaHeatmapRide,
                            "Run": layers.stravaHeatmapRun,
                            "Water": layers.stravaHeatmapWater,
                            "Winter": layers.stravaHeatmapWinter
                        },
                        "Waymarked Trails": {
                            "Hiking": layers.waymarkedTrailsHiking,
                            "Cycling": layers.waymarkedTrailsCycling,
                            "MTB": layers.waymarkedTrailsMTB,
                            "Skating": layers.waymarkedTrailsSkating,
                            "Horse riding": layers.waymarkedTrailsHorseRiding,
                            "Slopes": layers.waymarkedTrailsWinter
                        },
                    };
                    overlaysHierarchy[_this.overlays_text][_this.world_text][_this.poi_text] = pointsOfInterestLayers;
                    overlaysHierarchy[_this.overlays_text][_this.countries_text] = {};
                    overlaysHierarchy[_this.overlays_text][_this.countries_text][_this.france_text] = {
                        "IGN Slope": layers.ignSlope,
                        "IGN Cadastre": layers.ignFrCadastre
                    };
                    overlaysHierarchy[_this.overlays_text][_this.countries_text][_this.switzerland_text] = {
                        "swisstopo Slope": layers.swisstopoSlope,
                        "swisstopo Cycling": layers.swisstopoCycling,
                        "swisstopo Mountain Bike": layers.swisstopoMountainBike,
                    };

                    var baselayerSelection = {};
                    baselayerSelection[_this.basemaps_text] = {};
                    baselayerSelection[_this.basemaps_text][_this.world_text] = {
                        "OpenStreetMap": true,
                        "OpenTopoMap": true,
                        "OpenHikingMap": true,
                        "CyclOSM": true
                    };

                    var overlaySelection = {};
                    overlaySelection[_this.overlays_text] = {};
                    overlaySelection[_this.overlays_text][_this.world_text] = {
                        "Strava Heatmap": {
                            "All": true,
                            "Ride": true,
                            "Run": true,
                            "Water": true,
                            "Winter": true
                        },
                        "Waymarked Trails": {
                            "Hiking": true,
                            "Cycling": true,
                            "MTB": true,
                            "Skating": true,
                            "Horse riding": true,
                            "Slopes": true
                        },
                    };
                    overlaySelection[_this.overlays_text][_this.world_text][_this.poi_text] = pointsOfInterestLayerSelection;

                    if (_this.supportsWebGL()) {
                        _this.mapboxMap = L.mapboxGL({
                            attribution: '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
                            maxZoom: MAX_ZOOM,
                            accessToken: _this.mapbox_token,
                            style: 'mapbox://styles/mapbox/outdoors-v12',
                            projection: 'mercator',
                            interactive: true,
                            minZoom: 1,
                            dragRotate: false,
                            touchZoomRotate: false,
                            boxZoom: false,
                            dragPan: false,
                            touchPitch: false,
                            doubleClickZoom: false,
                            scrollZoom: false,
                            boxZoom: false
                        }).addTo(_this.map);

                        _this.mapboxMap.getMapboxMap().addControl(new MapboxLanguage({
                            defaultLanguage: getLanguage() == 'zh' ? 'zh-Hans' : getLanguage()
                        }));

                        _this.mapbox_logo = _this.mapboxMap._container.querySelector('.mapboxgl-ctrl');
                        if (_this.mapbox_logo) {
                            const attribution_control = document.querySelector('.leaflet-bottom.leaflet-left');
                            attribution_control.insertBefore(_this.mapbox_logo, attribution_control.firstChild);
                        }

                        _this.mapboxMap.getMapboxMap().on('load', () => {
                            _this.mapboxSKUToken = _this.mapboxMap.getMapboxMap()._requestManager._skuToken;
                            _this.mapboxgl_canvas = _this.mapboxMap._container.querySelector('.mapboxgl-canvas');
                        });

                        baselayersHierarchy[_this.basemaps_text][_this.world_text]["Mapbox Outdoors"] = _this.mapboxMap;
                        baselayersHierarchy[_this.basemaps_text][_this.world_text]["Mapbox Satellite"] = _this.mapboxMap;
                        baselayerSelection[_this.basemaps_text][_this.world_text]["Mapbox Outdoors"] = true;
                        baselayerSelection[_this.basemaps_text][_this.world_text]["Mapbox Satellite"] = true;

                        _this.mapillary_coverageZoomed = L.vectorGrid.protobuf('https://tiles.mapillary.com/maps/vtp/mly1_computed_public/2/{z}/{x}/{y}?access_token=MLY|4381405525255083|3204871ec181638c3c31320490f03011', {
                            minZoom: 14,
                            maxNativeZoom: 14,
                            pane: 'overlayPane',
                            attribution: '&copy; <a href="https://www.mapillary.com" target="_blank">Mapillary</a>',
                            vectorTileLayerStyles: {
                                sequence: {
                                    color: 'rgb(53, 175, 109)',
                                    weight: 1,
                                    opacity: 0.6
                                },
                                image: []
                            }
                        });

                        _this.mapillary_coverage = L.vectorGrid.protobuf('https://tiles.mapillary.com/maps/vtp/mly1_computed_public/2/{z}/{x}/{y}?access_token=MLY|4381405525255083|3204871ec181638c3c31320490f03011', {
                            minZoom: 6,
                            maxZoom: 14,
                            pane: 'overlayPane',
                            attribution: '&copy; <a href="https://www.mapillary.com" target="_blank">Mapillary</a>',
                            vectorTileLayerStyles: {
                                sequence: {
                                    color: 'rgb(53, 175, 109)',
                                    weight: 1,
                                    opacity: 0.6
                                },
                                image: []
                            },
                            rendererFactory: L.canvas.tile
                        });
                    } else {
                        delete baselayersHierarchy[_this.basemaps_text][_this.world_text]["Mapbox Outdoors"];
                        delete baselayersHierarchy[_this.basemaps_text][_this.world_text]["Mapbox Satellite"];
                        delete baselayersHierarchy[_this.basemaps_text][_this.countries_text][_this.new_zealand_text];

                        layers.openStreetMap.addTo(_this.map);
                    }

                    for (var i = 0; i < _this.custom_layers.length; i++) {
                        const newLayer = L.tileLayer(_this.custom_layers[i].url, {
                            maxNativeZoom: _this.custom_layers[i].maxZoom,
                            maxZoom: MAX_ZOOM
                        });
                        _this.custom_layers_object.push(newLayer);
                        layers[_this.custom_layers[i].id] = newLayer;

                        const overlay = _this.custom_layers[i].type == "overlay";
                        if (overlay) {
                            if (!overlaysHierarchy[_this.overlays_text].hasOwnProperty(_this.custom_text)) overlaysHierarchy[_this.overlays_text][_this.custom_text] = {};
                            overlaysHierarchy[_this.overlays_text][_this.custom_text][_this.custom_layers[i].name] = newLayer;
                        } else {
                            if (!baselayersHierarchy[_this.basemaps_text].hasOwnProperty(_this.custom_text)) baselayersHierarchy[_this.basemaps_text][_this.custom_text] = {};
                            baselayersHierarchy[_this.basemaps_text][_this.custom_text][_this.custom_layers[i].name] = newLayer;
                        }
                    }

                    _this.controlLayers = L.control.layers(baselayersHierarchy, overlaysHierarchy, { editable: true }).addTo(_this.map);

                    if (localStorage.hasOwnProperty('lastbasemap')) {
                        const basemap_key = localStorage.getItem('lastbasemap');
                        if (_this.mapbox_logo && !basemap_key.includes('mapbox')) _this.mapbox_logo.firstChild.style.display = 'none';
                        const basemap = layers[basemap_key];
                        const basemapId = _this.controlLayers.getLayerId(basemap);
                        if (basemapId) {
                            _this.controlLayers._layerControlInputs[basemapId].click();
                            _this.controlLayers.showLayer(basemapId);
                        }
                    }
                    if (localStorage.hasOwnProperty('lastoverlays')) {
                        const overlays = JSON.parse(localStorage.getItem('lastoverlays'));
                        for (var i = 0; i < overlays.length; i++) {
                            const overlayId = _this.controlLayers.getLayerId(layers[overlays[i]]);
                            if (overlayId) _this.controlLayers.showLayer(overlayId);
                        }
                    }
                    if (localStorage.hasOwnProperty('baselayer-selection')) baselayerSelection = JSON.parse(localStorage.getItem('baselayer-selection'));
                    else localStorage.setItem('baselayer-selection', JSON.stringify(baselayerSelection));
                    if (localStorage.hasOwnProperty('overlay-selection')) overlaySelection = JSON.parse(localStorage.getItem('overlay-selection'));
                    else localStorage.setItem('overlay-selection', JSON.stringify(overlaySelection));
                    _this.controlLayers.applySelections(baselayerSelection, overlaySelection);

                    if (_this.supportsWebGL()) _this.addSwitchMapboxLayers();
                }

                const toggle = document.getElementsByClassName('leaflet-control-layers-toggle')[0];
                toggle.removeAttribute("href");
                toggle.classList.add('fas', 'fa-layer-group', 'custom-button');

                if (!_this.embedding) {
                    const settings_container = document.getElementsByClassName('leaflet-control-layers-list')[0];
                    const base = settings_container.childNodes[0];
                    const separator = settings_container.childNodes[1];
                    const overlays = settings_container.childNodes[2];

                    settings_container.appendChild(separator); // move separator after maps

                    const settings_list = document.createElement('div');

                    settings_list.appendChild(_this.chevrons);
                    settings_list.appendChild(_this.dist_markers);

                    settings_container.appendChild(settings_list);
                }

                _this.total = new Total(_this);
                _this.setElevationProfileWidth();
                _this.openURLs();
                _this.openLocalStorage();
            }
        }
        xhr.open('GET', '/res/config.json');
        xhr.send();
    }

    addSwitchMapboxLayers(update) {
        const _this = this;
        const layerSelectors = _this.controlLayers._layerControlInputs;
        for (var i = 0; i < layerSelectors.length; i++) {
            const span = layerSelectors[i].nextSibling;
            if (span.textContent.endsWith("Mapbox Satellite")) {
                _this.mapboxSatelliteSelector = layerSelectors[i];
                _this.mapboxSatelliteSelector.checked = this.mapboxMap._map && (_this.mapboxMap.options.style == "mapbox://styles/mapbox/satellite-v9");
                _this.mapboxSatelliteSelector.addEventListener('click', function (e) {
                    _this.mapboxMap.getMapboxMap().setStyle("mapbox://styles/mapbox/satellite-v9", { diff: false });
                });
                if (!update && localStorage.hasOwnProperty('lastbasemap') && localStorage.getItem('lastbasemap') == 'mapbox-satellite') {
                    _this.mapboxSatelliteSelector.click();
                    _this.controlLayers.showLayer(i);
                }
            } else if (span.textContent.includes("Mapbox")) {
                _this.mapboxOutdoorsSelector = layerSelectors[i];
                _this.mapboxOutdoorsSelector.checked = this.mapboxMap._map && (_this.mapboxMap.options.style == _this.mapbox_style);
                _this.mapboxOutdoorsSelector.addEventListener('click', function (e) {
                    _this.mapboxMap.getMapboxMap().setStyle(_this.mapbox_style, { diff: false });
                });
                if (!update && localStorage.hasOwnProperty('lastbasemap') && localStorage.getItem('lastbasemap') == 'mapbox') {
                    _this.mapboxOutdoorsSelector.click();
                    _this.controlLayers.showLayer(i);
                }
            }
        }
    }

    updateStravaCookies() {
        if (this.updatingStravaCookies) {
            return;
        }
        this.updatingStravaCookies = true;
        const _this = this;

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                _this.stravaCookies = JSON.parse(xhr.response);
                _this.updateStravaColor();
                _this.updatingStravaCookies = false;
            }
        }
        xhr.open('GET', 'https://s.gpx.studio');
        xhr.send();
    }

    updateStravaColor() {
        if (!this.stravaCookies) return;
        layers.stravaHeatmapAll.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/all/${this.strava_color}/{z}/{x}/{y}@2x.png?Signature=${this.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${this.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${this.stravaCookies['CloudFront-Policy']}`);
        layers.stravaHeatmapRide.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/ride/${this.strava_color}/{z}/{x}/{y}@2x.png?Signature=${this.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${this.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${this.stravaCookies['CloudFront-Policy']}`);
        layers.stravaHeatmapRun.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/run/${this.strava_color}/{z}/{x}/{y}@2x.png?Signature=${this.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${this.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${this.stravaCookies['CloudFront-Policy']}`);
        layers.stravaHeatmapWater.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/water/${this.strava_color}/{z}/{x}/{y}@2x.png?Signature=${this.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${this.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${this.stravaCookies['CloudFront-Policy']}`);
        layers.stravaHeatmapWinter.setUrl(`https://heatmap-external-{s}.strava.com/tiles-auth/winter/${this.strava_color}/{z}/{x}/{y}@2x.png?Signature=${this.stravaCookies['CloudFront-Signature']}&Key-Pair-Id=${this.stravaCookies['CloudFront-Key-Pair-Id']}&Policy=${this.stravaCookies['CloudFront-Policy']}`);
    }

    hideTraceButtons() {
        this.slider.hide();
        this.delete.classList.add('unselected', 'no-click');
        this.zone_delete.classList.add('unselected', 'no-click');
        this.reverse.classList.add('unselected', 'no-click');
        this.edit.classList.add('unselected', 'no-click');
        this.time.classList.add('unselected', 'no-click');
        this.duplicate.classList.add('unselected', 'no-click');
        this.combine.classList.add('unselected', 'no-click');
        this.extract.classList.add('unselected', 'no-click');
        this.color.classList.add('unselected', 'no-click');
        this.add_wpt.classList.add('unselected', 'no-click');
        this.reduce.classList.add('unselected', 'no-click');
        this.structure.classList.add('unselected', 'no-click');
        this.hide.classList.add('unselected', 'no-click');
    }

    showTraceButtons() {
        this.slider.show();
        this.delete.classList.remove('unselected', 'no-click');
        this.zone_delete.classList.remove('unselected', 'no-click');
        this.reverse.classList.remove('unselected', 'no-click');
        this.edit.classList.remove('unselected', 'no-click');
        this.time.classList.remove('unselected', 'no-click');
        this.duplicate.classList.remove('unselected', 'no-click');
        this.extract.classList.remove('unselected', 'no-click');
        this.color.classList.remove('unselected', 'no-click');
        this.add_wpt.classList.remove('unselected', 'no-click');
        this.reduce.classList.remove('unselected', 'no-click');
        this.structure.classList.remove('unselected', 'no-click');
        this.hide.classList.remove('unselected', 'no-click');
        if (this.total.traces.length > 1) this.combine.classList.remove('unselected', 'no-click');
    }

    greyTraceButtons() {
        this.slider.hide();
        this.delete.classList.add('unselected', 'no-click');
        this.zone_delete.classList.add('unselected', 'no-click');
        this.reverse.classList.add('unselected', 'no-click');
        this.time.classList.add('unselected', 'no-click');
        this.duplicate.classList.add('unselected', 'no-click');
        this.combine.classList.add('unselected', 'no-click');
        this.extract.classList.add('unselected', 'no-click');
        this.color.classList.add('unselected', 'no-click');
        this.add_wpt.classList.add('unselected', 'no-click');
        this.reduce.classList.add('unselected', 'no-click');
        this.structure.classList.add('unselected', 'no-click');
    }

    blackTraceButtons() {
        this.slider.show();
        this.delete.classList.remove('unselected', 'no-click');
        this.zone_delete.classList.remove('unselected', 'no-click');
        this.reverse.classList.remove('unselected', 'no-click');
        this.time.classList.remove('unselected', 'no-click');
        this.duplicate.classList.remove('unselected', 'no-click');
        this.extract.classList.remove('unselected', 'no-click');
        this.color.classList.remove('unselected', 'no-click');
        this.add_wpt.classList.remove('unselected', 'no-click');
        this.reduce.classList.remove('unselected', 'no-click');
        this.structure.classList.remove('unselected', 'no-click');
        if (this.total.traces.length > 1) this.combine.classList.remove('unselected', 'no-click');
    }

    hideToolbars() {
        this.toolbar.getContainer().style.visibility = 'hidden';
        this.trace_info.getContainer().style.visibility = 'hidden';
        this.elev.hide();
        this.hideTraceButtons();
    }

    showToolbars() {
        this.elev.show();
        this.toolbar.getContainer().style.visibility = 'visible';
        this.trace_info.getContainer().style.visibility = 'visible';
        if (!this.total.hasFocus) {
            if (!this.total.traces[this.total.focusOn].isEdited) this.showTraceButtons();
        }
    }

    disableMap() {
        this.map.dragging.disable();
        this.map.touchZoom.disable();
        this.map.doubleClickZoom.disable();
        this.map.scrollWheelZoom.disable();
        this.map.boxZoom.disable();
        this.zoom.disable();
        if (this.map.tap) this.map.tap.disable();
    }

    enableMap() {
        this.map.dragging.enable();
        this.map.touchZoom.enable();
        this.map.doubleClickZoom.enable();
        this.map.scrollWheelZoom.enable();
        this.map.boxZoom.enable();
        this.zoom.enable();
        if (this.map.tap) this.map.tap.enable();
    }

    editToValidate() {
        this.edit.childNodes[0].classList.remove('fa-pencil-alt');
        this.edit.childNodes[0].classList.add('fa-check');
    }

    validateToEdit() {
        this.edit.childNodes[0].classList.remove('fa-check');
        this.edit.childNodes[0].classList.add('fa-pencil-alt');
    }

    hideToUnhide() {
        this.hide.childNodes[0].classList.remove('fa-eye-slash');
        this.hide.childNodes[0].classList.add('fa-eye');
    }

    unhideToHide() {
        this.hide.childNodes[0].classList.remove('fa-eye');
        this.hide.childNodes[0].classList.add('fa-eye-slash');
    }

    circlesToFront() {
        if (this.elev._startCircle) {
            this.elev._startCircle.bringToFront();
            this.elev._endCircle.bringToFront();
        }
    }

    setElevationProfileWidth() {
        if (!this.elevation_input.checked) return;

        if (this.elevation_profile) this.elevation_profile.style.display = 'none';
        this.slide_container.style.display = 'none';
        this.trace_info_grid.style.width = 'max-content';

        var map_width = this.map._container.offsetWidth;
        var info_width = this.trace_info_grid.offsetWidth;
        var info_height = this.trace_info_grid.offsetHeight;
        var elevation_profile_width = Math.min(map_width - info_width, map_width * 4 / 5);
        var elevation_profile_height = Math.min(info_height, this.embedding ? 120 : 160);

        if (elevation_profile_width != this.elev._width || elevation_profile_height != this.elev._height) {
            this.elev.resize({ width: elevation_profile_width, height: elevation_profile_height });
        }

        if (this.elevation_profile) this.elevation_profile.style.display = '';
        if (!this.embedding) this.slide_container.style.display = '';
        this.trace_info_grid.style.width = '';

    };

    addHandlers() {
        const buttons = this;
        const map = this.map;
        this.input.oninput = function () {
            buttons.loadFiles(this.files)
        };
        this.load.addEventListener("click", function () {
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.load_window;
            buttons.load_window.show();
        });
        this.load2.addEventListener("click", function () {
            buttons.input.click();
            buttons.load_window.hide();
        });
        this.load_drive.addEventListener("click", function () {
            buttons.google.loadPicker(false);
            buttons.load_window.hide();
        });
        this.load_error_ok.addEventListener("click", function () {
            buttons.load_error_window.hide();
        });
        this.donate.addEventListener("click", function () {
            buttons.donation();
        });
        this.donate2.addEventListener("click", function () {
            buttons.donation();
        });
        this.toolbar_content.addEventListener("click", function () {
            if (window.getComputedStyle(buttons.load).display == 'none') {
                buttons.toolbar_content.classList.add('maximized');
            } else {
                buttons.toolbar_content.classList.remove('maximized');
            }
        });

        window.addEventListener('dragover', function (e) {
            e.preventDefault();
        });
        window.addEventListener('drop', function (e) {
            e.preventDefault();
            buttons.loadFiles(e.dataTransfer.files);
        });
        window.addEventListener('resize', buttons.setElevationProfileWidth.bind(this));
    }

    showOrHideEditingOptions() {
        var total = this.total;
        if (total.hasFocus) return;
        var trace = total.traces[total.focusOn];
        if (trace.isEdited) {
            this.toggle_editing_options.style.display = 'block';
            if (!this.editing_options.hidden) this.editing_options.style.display = 'block';
        } else {
            this.editing_options.style.display = '';
            this.toggle_editing_options.style.display = '';
        }
    }

    addHandlersWithTotal(total) {
        this.total = total;
        this.elev.total = total;
        const buttons = this;
        const map = this.map;

        this.sortable = Sortable.create(this.tabs, {
            group: {
                name: "tabs",
                pull: ["tracks"],
                put: ["tracks", "segments"]
            },
            draggable: ".tab-draggable",
            direction: "horizontal",
            setData: function (dataTransfer, dragEl) {
                const avgData = dragEl.trace.getAverageAdditionalData();
                const data = total.outputGPX(false, true, avgData.hr, avgData.atemp, avgData.cad, avgData.power, true, dragEl.trace.index);

                dataTransfer.setData('DownloadURL', 'application/gpx+xml:' + data[0].name + ':data:text/octet-stream;charset=utf-8,' + encodeURIComponent(data[0].text));
                dataTransfer.dropEffect = 'copy';
                dataTransfer.effectAllowed = 'copy';
            },
            onUpdate: function (e) {
                const order = total.buttons.tabs.childNodes;
                const offset = 3;

                for (var i = offset; i < order.length; i++)
                    total.swapTraces(i - offset, order[i].trace.index);

                if (total.hasFocus) total.update();
            },
            onAdd: function (e) {
                var trace, newTrace;
                if (e.items.length > 0) {
                    trace = e.items[0].trace;
                    if (e.items[0].segment) newTrace = trace.extractSelection([e.items[0].track], e.items.map(x => x.segment));
                    else newTrace = trace.extractSelection(e.items.map(x => x.track));
                    for (var i = 0; i < e.items.length; i++) {
                        buttons.tabs.removeChild(e.items[i]);
                    }
                    total.setTraceIndex(newTrace.index, e.newIndicies[0].index - 1);
                } else {
                    trace = e.item.trace;
                    if (e.item.segment) newTrace = trace.extractSelection([e.item.track], [e.item.segment]);
                    else newTrace = trace.extractSelection([e.item.track]);
                    buttons.tabs.removeChild(e.item);
                    total.setTraceIndex(newTrace.index, e.newIndex - 1);
                }

                trace.focus();
            },
            onMove: function (e) {
                const trace = e.dragged.trace;
                if (trace == buttons.structure.trace) return false;

                if (e.to.id == buttons.tabs.id) {
                    e.dragged.classList.add('tab');
                    e.dragged.children[0].style.display = '';
                    if (e.dragged.children.length > 1) e.dragged.removeChild(e.dragged.children[1]);
                } else {
                    e.dragged.classList.remove('tab');
                    e.dragged.children[0].style.display = 'none';
                    if (e.dragged.children.length == 1) e.dragged.appendChild(trace.getFileStructure(false));
                }
            }
        });
        this.tabs.addEventListener('wheel', function (e) {
            if (e.type != 'wheel') {
                return;
            }
            let delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;
            delta = delta * (-100);
            buttons.tabs.scrollLeft -= delta;
            e.stopPropagation();
            e.preventDefault();
        });
        this.draw.addEventListener("click", function () {
            if (buttons.window_open) buttons.window_open.hide();
            const newTrace = total.addTrace(undefined, "new.gpx");
            newTrace.draw();
        });
        this.add_wpt.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (!trace.visible) trace.hideUnhide();
            buttons.disable_trace = true;
            map._container.style.cursor = 'crosshair';
            if (buttons.mapboxgl_canvas) buttons.mapboxgl_canvas.style.cursor = 'crosshair';
            buttons.add_wpt.active = true;
        });
        this.clear.addEventListener("click", function () {
            if (total.traces.length == 0) return;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.clear_window;
            buttons.clear_window.show();
        });
        this.clear2.addEventListener("click", function () {
            total.clear();
            buttons.clear_window.hide();
        });
        this.cancel_clear.addEventListener("click", function () {
            buttons.clear_window.hide();
        });
        this.delete.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.delete_window;
            buttons.delete_window.show();
        });
        this.delete2.addEventListener("click", function () {
            total.removeTrace(total.focusOn);
            buttons.delete_window.hide();
        });
        this.cancel_delete.addEventListener("click", function () {
            buttons.delete_window.hide();
        });
        this.zone_delete.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.zone_delete_window;

            map._container.style.cursor = 'crosshair';
            if (buttons.mapboxgl_canvas) buttons.mapboxgl_canvas.style.cursor = 'crosshair';
            map.dragging.disable();

            var start_pt = null;

            const createRect = function (e) {
                map._container.style.cursor = '';
                if (buttons.mapboxgl_canvas) buttons.mapboxgl_canvas.style.cursor = '';
                if (buttons.window_open != buttons.zone_delete_window) {
                    map.removeEventListener("mousedown", createRect);
                    map.removeEventListener("mousemove", extendRect);
                    map.removeEventListener("click", endRect);
                    map.dragging.enable();
                    return;
                }
                buttons.zone_delete.rect = L.rectangle([
                    [e.latlng.lat, e.latlng.lng],
                    [e.latlng.lat, e.latlng.lng]
                ]).addTo(map);
                start_pt = e.latlng;
            };
            const extendRect = function (e) {
                if (buttons.zone_delete.rect) {
                    buttons.zone_delete.rect.setBounds(L.latLngBounds(start_pt, e.latlng));
                }
            };
            const endRect = function (e) {
                if (buttons.zone_delete.rect) {
                    map.removeEventListener("mousedown", createRect);
                    map.removeEventListener("mousemove", extendRect);
                    map.removeEventListener("mouseup", endRect);
                    map.dragging.enable();

                    buttons.zone_delete_window.show();
                    buttons.zone_delete_window.addEventListener('hide', function (e) {
                        if (buttons.zone_delete.rect) buttons.zone_delete.rect.remove();
                        buttons.zone_delete.rect = null;
                    });
                }
            };

            map.addEventListener("mousedown", createRect);
            map.addEventListener("mousemove", extendRect);
            map.addEventListener("mouseup", endRect);
        });
        this.zone_delete_ok.addEventListener("click", function () {
            if (total.hasFocus) return;
            var trace = total.traces[total.focusOn];
            trace.deleteZone(buttons.zone_delete.rect.getBounds(),
                buttons.zone_delete_pts.checked,
                buttons.zone_delete_wpts.checked,
                buttons.zone_delete_inside.checked);
            buttons.zone_delete_window.hide();
        });
        this.zone_delete_cancel.addEventListener("click", function () {
            buttons.zone_delete_window.hide();
        });
        this.export.addEventListener("click", function () {
            if (total.traces.length > 0) {
                if (total.traces.length == 1) {
                    buttons.merge.checked = false;
                    buttons.merge.disabled = true;
                } else {
                    buttons.merge.disabled = false;
                }
                if (total.getMovingTime() == 0) {
                    buttons.include_time.checked = false;
                    buttons.include_time.disabled = true;
                } else {
                    buttons.include_time.checked = true;
                    buttons.include_time.disabled = false;
                }
                const additionalData = total.getAverageAdditionalData();
                if (!additionalData.hr) {
                    buttons.include_hr.checked = false;
                    buttons.include_hr.disabled = true;
                } else {
                    buttons.include_hr.checked = true;
                    buttons.include_hr.disabled = false;
                }
                if (!additionalData.cad) {
                    buttons.include_cad.checked = false;
                    buttons.include_cad.disabled = true;
                } else {
                    buttons.include_cad.checked = true;
                    buttons.include_cad.disabled = false;
                }
                if (!additionalData.power) {
                    buttons.include_power.checked = false;
                    buttons.include_power.disabled = true;
                } else {
                    buttons.include_power.checked = true;
                    buttons.include_power.disabled = false;
                }
                if (!additionalData.atemp) {
                    buttons.include_atemp.checked = false;
                    buttons.include_atemp.disabled = true;
                } else {
                    buttons.include_atemp.checked = true;
                    buttons.include_atemp.disabled = false;
                }
                if (!additionalData.surface) {
                    buttons.include_surface.checked = false;
                    buttons.include_surface.disabled = true;
                } else {
                    buttons.include_surface.checked = true;
                    buttons.include_surface.disabled = false;
                }
                if (buttons.window_open) buttons.window_open.hide();
                buttons.window_open = buttons.export_window;
                buttons.export_window.show();
            }
        });
        this.export2.addEventListener("click", async function () {
            const mergeAll = buttons.merge.checked;
            const time = buttons.include_time.checked;
            const hr = buttons.include_hr.checked;
            const atemp = buttons.include_atemp.checked;
            const cad = buttons.include_cad.checked;
            const power = buttons.include_power.checked;
            const surface = buttons.include_surface.checked;

            const output = total.outputGPX(mergeAll, time, hr, atemp, cad, power, surface);
            for (var i = 0; i < output.length; i++) {
                if (i > 0) await buttons.pause(200);
                buttons.download(output[i].name, output[i].text);
            }

            buttons.export_window.hide();
        });
        this.save_drive.addEventListener("click", function () {
            buttons.export_window.hide();
            buttons.google.loadPicker(true);
        });
        this.validate.addEventListener("click", function () {
            if (total.hasFocus) return;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.crop_window;
            buttons.crop_window.show();
        });
        this.crop_ok.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            const start = Math.max(0, total.buttons.slider.getIndexStart());
            const end = Math.min(trace.getPoints().length - 1, total.buttons.slider.getIndexEnd());
            total.traces[total.focusOn].crop(start, end, !buttons.crop_keep.checked);
            buttons.crop_window.hide();
        });
        this.crop_cancel.addEventListener("click", function () {
            buttons.crop_window.hide();
        });
        this.units_input.addEventListener("change", function (e) {
            buttons.km = buttons.units_input.value == 'km';
            localStorage.setItem('km', buttons.km);
            const focus = total.hasFocus ? total : total.traces[total.focusOn];
            focus.showData();
            focus.showElevation();
            if (!total.hasFocus) focus.showDistanceMarkers();
            buttons.scale.remove();
            buttons.scale.options.metric = buttons.km;
            buttons.scale.options.imperial = !buttons.km;
            buttons.scale.addTo(buttons.map);
        });
        this.units_input.value = this.km ? "km" : "mi";
        this.speed_units_input.addEventListener("change", function (e) {
            buttons.speed_units = buttons.speed_units_input.value == 'speed';
            localStorage.setItem('speed', buttons.speed_units);
            const focus = total.hasFocus ? total : total.traces[total.focusOn];
            focus.showData();
            focus.showElevation();
            if (!total.hasFocus) focus.showDistanceMarkers();
        });
        this.speed_units_input.value = this.speed_units ? "speed" : "pace";
        this.activity_input.addEventListener("change", function (e) {
            buttons.activity = buttons.activity_input.value;
            localStorage.setItem('activity', buttons.activity);
            if (total.hasFocus) total.showData();
            else total.traces[total.focusOn].showData();
        });
        this.activity_input.value = this.activity;
        this.routing_input.addEventListener("change", function (e) {
            buttons.routing = buttons.routing_input.checked;
            localStorage.setItem('routing', buttons.routing);
        });
        this.routing_input.checked = buttons.routing;
        this.private_input.addEventListener("change", function (e) {
            buttons.private = buttons.private_input.checked;
            localStorage.setItem('private', buttons.private);
        });
        this.private_input.checked = buttons.private;
        this.strava_color_input.addEventListener("change", function (e) {
            buttons.strava_color = buttons.strava_color_input.value;
            localStorage.setItem('strava-color', buttons.strava_color);
            buttons.updateStravaColor();
        });
        this.strava_color_input.value = this.strava_color;
        const change_poi_min_zoom = function (min_zoom) {
            buttons.poi_min_zoom = min_zoom;
            localStorage.setItem('poi-min-zoom', min_zoom);
            Object.keys(layers).forEach(function (layer) {
                if (layer.startsWith('poi')) {
                    layers[layer].buttons = buttons;
                    layers[layer].options.minZoom = buttons.poi_min_zoom;
                    if (buttons.map.hasLayer(layers[layer])) {
                        buttons.map.removeLayer(layers[layer]);
                        buttons.map.addLayer(layers[layer]);
                    }
                }
            });
        }
        this.poi_min_zoom_input.addEventListener("change", function (e) {
            change_poi_min_zoom(buttons.poi_min_zoom_input.value);
        });
        this.poi_min_zoom_input.value = this.poi_min_zoom;
        change_poi_min_zoom(this.poi_min_zoom);
        const editing_time_option = function () {
            buttons.keep_timestamps = buttons.edit_keep_time.checked;
        };
        this.edit_keep_avg.addEventListener('change', editing_time_option);
        this.edit_keep_time.addEventListener('change', editing_time_option);
        this.map.addEventListener("zoomend", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) trace.updateEditMarkers();
        });
        this.edit.addEventListener("click", function () {
            if (total.hasFocus) {
                buttons.draw.click();
                return;
            }
            if (buttons.window_open) buttons.window_open.hide();
            var trace = total.traces[total.focusOn];
            if (trace.isEdited) {
                trace.stopEdit();
                if (trace.drawing) trace.stopDraw();
            } else {
                trace.draw();
            }
        });
        this.toggle_editing_options.addEventListener('click', function () {
            buttons.editing_options.hidden = !buttons.editing_options.hidden;
            if (buttons.editing_options.hidden) {
                buttons.toggle_editing_options.classList.remove('fa-minus', 'toggle-on');
                buttons.toggle_editing_options.classList.add('fa-gears', 'toggle-off', 'panels', 'panels-container');
                buttons.toggle_editing_options.style.display = 'block';
                buttons.editing_options.style.display = '';
                buttons.buttons_bar.appendChild(buttons.toggle_editing_options);
            } else {
                buttons.toggle_editing_options.classList.remove('fa-gears', 'toggle-off', 'panels', 'panels-container');
                buttons.toggle_editing_options.classList.add('fa-minus', 'toggle-on');
                buttons.toggle_editing_options.style.display = 'block';
                buttons.editing_options.style.display = 'block';
                buttons.editing_options.insertBefore(buttons.toggle_editing_options, buttons.editing_options.firstChild);
            }
        });
        const saveLayers = function (unload) {
            const activeLayers = [];
            for (var layerName in layers) {
                const layer = layers[layerName];
                if (buttons.map.hasLayer(layer)) {
                    const layerId = buttons.controlLayers.getLayerId(layer);
                    if (layerId) {
                        if (buttons.controlLayers._layers[layerId].overlay) {
                            buttons.controlLayers._layerControlInputs[layerId].click();
                            activeLayers.push(layerName);
                        }
                    }
                }
            }
            if (activeLayers.length > 0) {
                localStorage.setItem('lastoverlays', JSON.stringify(activeLayers));
            }
        };
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                if (buttons.window_open) buttons.window_open.hide();
                if (total.hasFocus) return;
                var trace = total.traces[total.focusOn];
                if (trace.isEdited) buttons.edit.click();
                e.preventDefault();
            } else if (e.key === "F1") {
                if (localStorage.hasOwnProperty('beforelastbasemap')) {
                    const basemapName = localStorage.getItem('beforelastbasemap');
                    if (basemapName == "mapbox-satellite") buttons.mapboxSatelliteSelector.click();
                    else if (basemapName == 'mapbox') buttons.mapboxOutdoorsSelector.click();
                    else {
                        const basemap = layers[basemapName];
                        const basemapId = buttons.controlLayers.getLayerId(basemap);
                        if (basemapId) {
                            buttons.controlLayers._layerControlInputs[basemapId].click();
                            buttons.controlLayers.showLayer(basemapId);
                        }
                    }
                }
                e.preventDefault();
            } else if (e.key === "F2") {
                var hasOverlay = false;
                for (var i = 0; i < buttons.controlLayers._layers.length; i++) {
                    if (buttons.controlLayers._layers[i].overlay &&
                        buttons.map.hasLayer(buttons.controlLayers._layers[i].layer)) {
                        hasOverlay = true;
                        break;
                    }
                }
                if (hasOverlay) {
                    saveLayers();
                } else if (localStorage.hasOwnProperty('lastoverlays')) {
                    const activeLayers = JSON.parse(localStorage.getItem('lastoverlays'));
                    for (var i = 0; i < activeLayers.length; i++) {
                        const layerId = buttons.controlLayers.getLayerId(layers[activeLayers[i]]);
                        if (layerId) buttons.controlLayers._layerControlInputs[layerId].click();
                    }
                    localStorage.removeItem('lastoverlays');
                }
                e.preventDefault();
            } else if (e.key === "F3") {
                buttons.routing = !buttons.routing;
                buttons.routing_input.checked = buttons.routing;
                e.preventDefault();
            } else if (e.key == "h" && (e.ctrlKey || e.metaKey)) {
                buttons.elevation_input.click();
                e.preventDefault();
            } else if (e.key == "z" && (e.ctrlKey || e.metaKey)) {
                buttons.undo.click();
                e.preventDefault();
            } else if (e.key == "y" && (e.ctrlKey || e.metaKey)) {
                buttons.redo.click();
                e.preventDefault();
            } else if (e.key == "s" && (e.ctrlKey || e.metaKey)) {
                buttons.export.click();
                e.preventDefault();
            } else if (e.key == "k" && (e.ctrlKey || e.metaKey)) {
                buttons.clear.click();
                e.preventDefault();
            } else if (e.key == "o" && (e.ctrlKey || e.metaKey)) {
                buttons.load.click();
                e.preventDefault();
            } else if (e.key == "d" && (e.ctrlKey || e.metaKey)) {
                buttons.draw.click();
                e.preventDefault();
            }
        });
        this.reverse.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            trace.reverse();
        });
        this.extract.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.can_extract) return;

            var newTraces = null;
            var ntracks = trace.getTracks().length;
            var nsegments = trace.getSegments().length;
            if (ntracks == 1) newTraces = trace.extract(true);
            else if (ntracks == nsegments) newTraces = trace.extract(false);
            else {
                if (buttons.window_open) buttons.window_open.hide();
                buttons.window_open = buttons.extract_window;
                buttons.extract_window.show();
                buttons.extract.trace = trace;
            }

            if (newTraces) {
                for (var i = 0; i < newTraces.length; i++) {
                    total.setTraceIndex(newTraces[i].index, trace.index + 1 + i);
                }
            }
        });
        this.extract_ok.addEventListener("click", function () {
            const newTraces = buttons.extract.trace.extract(buttons.extract_as_segments.checked);
            for (var i = 0; i < newTraces.length; i++) {
                total.setTraceIndex(newTraces[i].index, buttons.extract.trace.index + 1 + i);
            }
            buttons.extract_window.hide();
        });
        this.extract_cancel.addEventListener("click", function () {
            buttons.extract_window.hide();
        });
        const sliderCallback = function () {
            const npoints = buttons.reduce.trace.previewSimplify(buttons.reduce_slider.value);
            buttons.reduce_npoints.innerHTML = npoints + '/' + buttons.reduce.trace.getPoints().length;
        };
        this.reduce.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            buttons.reduce.trace = total.traces[total.focusOn];
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.reduce_window;
            buttons.reduce_window.show();
            buttons.reduce_window.addEventListener('hide', function (e) {
                buttons.reduce.trace.cancelSimplify();
            });
            buttons.reduce_slider.value = 500;
            sliderCallback();
        });
        this.reduce_ok.addEventListener("click", function () {
            buttons.reduce.trace.simplify();
            buttons.reduce_window.hide();
        });
        this.reduce_cancel.addEventListener("click", function () {
            buttons.reduce_window.hide();
        });
        this.reduce_slider.addEventListener("input", sliderCallback);
        L.DomEvent.on(this.reduce_slider, "mousedown", L.DomEvent.stopPropagation);
        const structure_callback = function () {
            buttons.file_structure.innerHTML = '';
            buttons.file_structure.appendChild(buttons.structure.trace.getFileStructure(true, structure_callback));
        };
        L.DomEvent.on(this.file_structure, "mousedown", L.DomEvent.stopPropagation);
        this.structure.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            if (buttons.window_open) buttons.window_open.hide();

            buttons.structure.trace = trace;
            structure_callback();

            buttons.window_open = buttons.structure_window;
            buttons.structure_window.show();
        });
        this.merge_selection.addEventListener("mousedown", function () {
            const items = buttons.file_structure.getElementsByClassName('multidrag-selected');
            var tracks = [], segments = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].segment) {
                    segments.push(items[i].segment);
                    if (tracks.length == 0) tracks.push(items[i].track);
                } else {
                    tracks.push(items[i].track);
                }
            }
            if (segments.length > 0) buttons.structure.trace.mergeSelection(tracks, segments);
            else buttons.structure.trace.mergeSelection(tracks);
            structure_callback();
        });
        this.delete_selection.addEventListener("mousedown", function () {
            const items = buttons.file_structure.getElementsByClassName('multidrag-selected');
            var tracks = [], segments = [];
            for (var i = 0; i < items.length; i++) {
                if (items[i].segment) {
                    segments.push(items[i].segment);
                    if (tracks.length == 0) tracks.push(items[i].track);
                } else {
                    tracks.push(items[i].track);
                }
            }
            if (segments.length > 0) buttons.structure.trace.deleteSelection(tracks, segments);
            else buttons.structure.trace.deleteSelection(tracks);
            structure_callback();
        });
        this.time.addEventListener("click", function (e) {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();

            var content = `<div id="speed-change" style="padding-bottom:4px;">`;

            if (buttons.speed_units) {
                content += buttons.speed_text + ` <input type="number" id="speed-input" min="1.0" max="99.9" step="0.1" lang="en-150"> `;
                if (buttons.km) content += buttons.unit_kilometers_text + '/' + buttons.unit_hours_text + `</div>`;
                else content += buttons.unit_miles_text + '/' + buttons.unit_hours_text + `</div>`;
            } else {
                content += buttons.pace_text + ` <input type="number" id="minutes" min="1" max="59" step="1">
                            :
                            <input type="number" id="seconds" min="0" max="59" step="1"> `;
                if (buttons.km) content += buttons.unit_minutes_text + '/' + buttons.unit_kilometers_text + `</div>`;
                else content += buttons.unit_minutes_text + '/' + buttons.unit_miles_text + `</div>`;
            }

            content += `<div id="start-change">` + buttons.start_text + `
                        <input type="datetime-local" id="start-time" step="1"></div></div><br>
                        <div style="display: flex;align-items: center; padding: 10px; border: dashed;"><div style="max-width: 200px;display: inline-block;white-space: normal;">`+ buttons.experimental_info_text + `</div><input type="checkbox" id="slope-speed" style="vertical-align:super"></div><br>
                        <div id="edit-speed" class="panels custom-button normal-button">`+ buttons.ok_button_text + `</div>
                        <div id="cancel-speed" class="panels custom-button normal-button"><b>`+ buttons.cancel_button_text + `</b></div>`;

            if (buttons.window_open) buttons.window_open.hide();
            buttons.time.window = L.control.window(map, { title: '', 'content': content, className: 'panels-container', visible: true, closeButton: false });
            buttons.window_open = buttons.time.window;
            buttons.time.window.addEventListener('hide', function () {
                buttons.time.window.remove();
            });

            var offset = -(new Date().getTimezoneOffset() / 60);

            var speed = document.getElementById("speed-input");
            var minutes = document.getElementById("minutes");
            var seconds = document.getElementById("seconds");
            var slope_speed = document.getElementById("slope-speed");

            var speedChange = false;

            if (buttons.speed_units) {
                speed.value = Math.max(1, trace.getMovingSpeed().toFixed(1));
                speed.addEventListener("change", function () {
                    speedChange = true;
                });
            } else {
                var pace = Math.floor(trace.getMovingPace() / 1000);
                minutes.value = Math.floor(pace / 60);
                seconds.value = pace % 60;
                minutes.addEventListener("change", function () {
                    speedChange = true;
                });
                seconds.addEventListener("change", function () {
                    speedChange = true;
                });
            }

            var start = document.getElementById("start-time");
            if (trace.hasPoints()) {
                const points = trace.getPoints();
                if (points[0].meta.time) start.value = (new Date(points[0].meta.time.getTime() + offset * 60 * 60 * 1000)).toISOString().substring(0, 19);
                else start.value = new Date().toISOString().substring(0, 19);
            }

            const ok = document.getElementById("edit-speed");
            ok.addEventListener("click", function () {
                var v = trace.getMovingSpeed(true);
                if (speedChange) {
                    if (buttons.speed_units) {
                        v = Number(speed.value);
                        if (!buttons.km) v *= 1.609344;
                    } else {
                        v = Number(minutes.value) * 60 + Number(seconds.value);
                        v = Math.max(v, 1);
                        if (!buttons.km) v /= 1.609344;
                        v = 1 / v; // km/s
                        v *= 3600;
                    }
                }

                const startTime = new Date(new Date(start.value).getTime());

                if (slope_speed.checked) trace.generateTimeData(startTime, v);

                trace.changeTimeData(startTime, v);
                trace.recomputeStats();
                trace.showData();

                buttons.time.window.close();
            });
            const cancel = document.getElementById("cancel-speed");
            cancel.addEventListener("click", function () {
                buttons.time.window.close();
            });
        });
        this.color.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();

            buttons.color_picker.value = trace.style.color;
            buttons.opacity_slider.value = trace.style.opacity;
            buttons.width_slider.value = trace.style.weight;
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.color_window;
            buttons.color_window.show();
        });
        this.color_ok.addEventListener("click", function () {
            const trace = total.traces[total.focusOn];
            const color = buttons.color_picker.value;
            const opacity = parseFloat(buttons.opacity_slider.value);
            const weight = parseInt(buttons.width_slider.value);
            trace.style.color = color;
            trace.style.opacity = opacity;
            trace.style.weight = weight;
            if (buttons.color_checkbox.checked || buttons.opacity_checkbox.checked || buttons.width_checkbox.checked) {
                for (var i = 0; i < total.traces.length; i++) {
                    if (buttons.color_checkbox.checked) total.traces[i].style.color = color;
                    if (buttons.opacity_checkbox.checked) total.traces[i].style.opacity = opacity;
                    if (buttons.width_checkbox.checked) total.traces[i].style.weight = weight;
                    total.traces[i].updateStyle();
                    total.traces[i].updateTab();
                }
                if (buttons.color_checkbox.checked) {
                    total.same_color = true;
                    total.style.color = color;
                }
                if (buttons.opacity_checkbox.checked) total.style.opacity = opacity;
                if (buttons.width_checkbox.checked) total.style.weight = weight;
            }
            trace.updateStyle();
            trace.showChevrons();
            trace.showDistanceMarkers();
            trace.updateTab();
            buttons.color_window.hide();
        });
        this.color_cancel.addEventListener("click", function () {
            buttons.color_window.hide();
        });
        L.DomEvent.on(this.opacity_slider, "mousedown", L.DomEvent.stopPropagation);
        L.DomEvent.on(this.width_slider, "mousedown", L.DomEvent.stopPropagation);
        this.layer_selection_ok.addEventListener('click', function () {
            const baselayerSelection = buttons.controlLayers._getSelectedBaselayersHierarchy();
            const overlaySelection = buttons.controlLayers._getSelectedOverlaysHierarchy();
            localStorage.setItem('baselayer-selection', JSON.stringify(baselayerSelection));
            localStorage.setItem('overlay-selection', JSON.stringify(overlaySelection));
            buttons.controlLayers.applySelections(baselayerSelection, overlaySelection);
            buttons.layer_selection_window.hide();
        });
        this.layer_url.addEventListener('change', function () {
            buttons.layer_map.eachLayer(function (layer) {
                buttons.layer_map.removeLayer(layer);
            });
            const maxZoom = parseInt(buttons.layer_max_zoom.value);
            if (buttons.layer_map.getZoom() > maxZoom) buttons.layer_map.setZoom(maxZoom);
            L.tileLayer(buttons.layer_url.value, {
                maxNativeZoom: maxZoom,
                maxZoom: MAX_ZOOM
            }).addTo(buttons.layer_map);
        });
        this.layer_max_zoom.addEventListener('change', function () {
            buttons.layer_map.eachLayer(function (layer) {
                buttons.layer_map.removeLayer(layer);
            });
            const maxZoom = parseInt(buttons.layer_max_zoom.value);
            if (buttons.layer_map.getZoom() > maxZoom) buttons.layer_map.setZoom(maxZoom);
            L.tileLayer(buttons.layer_url.value, {
                maxNativeZoom: maxZoom,
                maxZoom: MAX_ZOOM
            }).addTo(buttons.layer_map);
        });
        this.layer_creation.addEventListener('click', function () {
            if (buttons.layer_name.value.length == 0) return;

            const maxZoom = parseInt(buttons.layer_max_zoom.value);
            const newLayer = L.tileLayer(buttons.layer_url.value, {
                maxNativeZoom: maxZoom,
                maxZoom: MAX_ZOOM
            });

            const id = 'custom-' + Math.random().toString(16).slice(2);

            layers[id] = newLayer;
            buttons.custom_layers.push({
                name: buttons.layer_name.value,
                url: buttons.layer_url.value,
                type: buttons.layer_type.value,
                maxZoom: maxZoom,
                id: id
            });
            buttons.custom_layers_object.push(newLayer);
            localStorage.setItem('custom-layers', JSON.stringify(buttons.custom_layers));

            const overlay = buttons.layer_type.value == "overlay";
            const parents = [overlay ? buttons.overlays_text : buttons.basemaps_text, buttons.custom_text, buttons.layer_name.value];
            buttons.controlLayers.addLayer(newLayer, parents, overlay);
            if (buttons.supportsWebGL()) buttons.addSwitchMapboxLayers(true);

            const baselayerSelection = JSON.parse(localStorage.getItem('baselayer-selection'));
            const overlaySelection = JSON.parse(localStorage.getItem('overlay-selection'));
            var current = overlay ? overlaySelection : baselayerSelection;
            for (var i = 0; i < parents.length; i++) {
                if (i == parents.length - 1) current[parents[i]] = true;
                else if (!current.hasOwnProperty(parents[i])) current[parents[i]] = {};
                current = current[parents[i]];
            }
            buttons.controlLayers.applySelections(baselayerSelection, overlaySelection);
            localStorage.setItem('baselayer-selection', JSON.stringify(baselayerSelection));
            localStorage.setItem('overlay-selection', JSON.stringify(overlaySelection));

            buttons.layer_name.value = '';
            buttons.layer_url.value = '';
            buttons.layer_map.eachLayer(function (layer) {
                buttons.layer_map.removeLayer(layer);
            });

            buttons.controlLayers._layer_selection_button.click();
        });
        this.about.addEventListener("click", function () {
            window.open('./about.html');
        });
        this.help.addEventListener("click", function () {
            if (buttons.window_open) buttons.window_open.hide();
            buttons.window_open = buttons.help_window;
            buttons.help_window.show();
        });
        this.duplicate.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            const clone = trace.clone();
            total.setTraceIndex(clone.index, trace.index + 1);
        });
        this.combine.addEventListener("click", function () {
            if (total.traces.length <= 1) return;
            const trace = total.traces[total.focusOn];
            if (trace.isEdited) return;
            if (!trace.visible) trace.hideUnhide();
            if (buttons.window_open) buttons.window_open.hide();
            total.to_merge = trace;
            buttons.merge_time_options.style.display = trace.hasTimeData() ? '' : 'none';
            buttons.window_open = buttons.merge_window;
            buttons.merge_window.show();
            buttons.merge_window.addEventListener('hide', function (e) {
                total.to_merge = null;
            });
        });
        this.hide.addEventListener("click", function () {
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            trace.hideUnhide();
        });
        if (!this.embedding) {
            this.layer_map = L.map('preview-map', {
                zoomControl: false,
                toggleableAttributionControl: false
            });
            this.controlLayers._layer_selection_button.addEventListener('click', function () {
                if (buttons.window_open) buttons.window_open.hide();
                buttons.window_open = buttons.layer_selection_window;
                buttons.layer_selection_window.show();
                buttons.layer_selection.innerHTML = '';
                buttons.controlLayers._addLayerSelectionContent(buttons.layer_selection);
                buttons.layer_map.fitBounds(buttons.map.getBounds());

                for (var i = 0; i < buttons.custom_layers.length; i++) {
                    var span;
                    if (buttons.custom_layers[i].type == "baselayer") span = buttons.controlLayers._baselayersCheckboxHierarchy[buttons.basemaps_text][buttons.custom_text][buttons.custom_layers[i].name].span;
                    else span = buttons.controlLayers._overlaysCheckboxHierarchy[buttons.overlays_text][buttons.custom_text][buttons.custom_layers[i].name].span;

                    const delete_layer = L.DomUtil.create('i', 'fas fa-trash-alt');
                    delete_layer.style.paddingLeft = '15px';
                    span.appendChild(delete_layer);

                    const layerIndex = i;
                    delete_layer.addEventListener('click', function () {
                        const overlay = buttons.custom_layers[layerIndex].type == "overlay";
                        const parents = [overlay ? buttons.overlays_text : buttons.basemaps_text, buttons.custom_text, buttons.custom_layers[layerIndex].name];
                        const layer = buttons.custom_layers_object[layerIndex];

                        if (buttons.map.hasLayer(layer)) buttons.map.removeLayer(layer);

                        buttons.controlLayers.removeLayer(parents, overlay);
                        delete layers[buttons.custom_layers[layerIndex].id];
                        buttons.custom_layers.splice(layerIndex, 1);
                        buttons.custom_layers_object.splice(layerIndex, 1);
                        localStorage.setItem('custom-layers', JSON.stringify(buttons.custom_layers));

                        buttons.controlLayers._layer_selection_button.click();

                        if (buttons.supportsWebGL()) buttons.addSwitchMapboxLayers(true);
                    });
                }
            });
            this.street_view_button.mapillary = true;
            this.street_view_mapillary.addEventListener('change', function () {
                var switchProvider = buttons.street_view_button.open;
                if (switchProvider) buttons.street_view_button.click();
                buttons.street_view_button.mapillary = true;
                if (switchProvider) buttons.street_view_button.click();
            });
            this.street_view_google.addEventListener('change', function () {
                var switchProvider = buttons.street_view_button.open;
                if (switchProvider) buttons.street_view_button.click();
                buttons.street_view_button.mapillary = false;
                if (switchProvider) buttons.street_view_button.click();
            });
            const openStreetView = function (e) {
                if (buttons.street_view_button.mapillary) {
                    if (!buttons.mapillary) {
                        var { Viewer } = mapillary;
                        buttons.mapillary = new Viewer({
                            accessToken: 'MLY|4381405525255083|3204871ec181638c3c31320490f03011',
                            container: buttons.mapillary_container,
                            component: { cover: false }
                        });

                        buttons.mapillary.on('position', async (event) => {
                            if (buttons.street_view_button.open) {
                                const ll = await buttons.mapillary.getPosition();

                                if (!buttons.mapillary.marker) {
                                    buttons.mapillary.marker = L.circleMarker(ll, {
                                        className: 'position-marker',
                                        radius: 8
                                    });
                                    buttons.mapillary.marker.addTo(buttons.map);
                                } else {
                                    buttons.mapillary.marker.setLatLng(ll);
                                }

                                buttons.map.setView(ll);
                            }
                        });
                    }

                    var url = 'https://graph.mapillary.com/images?access_token=MLY|4381405525255083|3204871ec181638c3c31320490f03011&bbox=';
                    url += e.latlng.toBounds(50).toBBoxString();

                    var Http = new XMLHttpRequest();
                    Http.open("GET", url);
                    Http.send();
                    Http.onreadystatechange = function () {
                        if (Http.readyState == 4 && Http.status == 200) {
                            var ans = JSON.parse(this.responseText);
                            if (ans.data) {
                                var dist = Infinity, imageId = null, ll = null;
                                for (var i = 0; i < ans.data.length; i++) {
                                    const imgLatlng = L.latLng([ans.data[i].geometry.coordinates[1], ans.data[i].geometry.coordinates[0]]);
                                    if (imageId == null || e.latlng.distanceTo(imgLatlng) < dist) {
                                        imageId = ans.data[i].id;
                                        dist = e.latlng.distanceTo(imgLatlng);
                                        ll = imgLatlng;
                                    }
                                }
                                if (imageId != null) {
                                    buttons.mapillary.moveTo(imageId).then(function () {
                                        buttons.mapillary.resize();
                                    });

                                    if (!buttons.mapillary.marker) {
                                        buttons.mapillary.marker = L.circleMarker(ll, {
                                            className: 'position-marker',
                                            radius: 8
                                        });
                                        buttons.mapillary.marker.addTo(buttons.map);
                                    } else {
                                        buttons.mapillary.marker.setLatLng(ll);
                                    }

                                    buttons.map.setView(ll);
                                    buttons.mapillary_container.style.display = 'block';
                                }
                            }
                        }
                    }
                } else {
                    window.open('https://maps.google.com/maps?q=&layer=c&cbll=' + e.latlng.lat + ',' + e.latlng.lng + '&cbp=11,0,0,0,0');
                }
            };
            const closeStreetView = function (e) {
                buttons.mapillary_container.style.display = 'none';
                if (buttons.mapillary) {
                    if (buttons.mapillary.marker) {
                        buttons.mapillary.marker.remove();
                        buttons.mapillary.marker = null;
                    }
                    const sequenceComponent = buttons.mapillary.getComponent('sequence');
                    sequenceComponent.stop();
                }
            };
            this.street_view_button.addEventListener('click', function () {
                if (buttons.street_view_button.open) {
                    if (total.hasFocus || !total.traces[total.focusOn].isEdited) {
                        map._container.style.cursor = '';
                        if (buttons.mapboxgl_canvas) buttons.mapboxgl_canvas.style.cursor = '';
                    }
                    buttons.disable_trace = false;
                    buttons.street_view_button.style.color = '';
                    if (buttons.street_view_button.mapillary) {
                        closeStreetView();
                        buttons.mapillary_coverage.remove();
                        buttons.mapillary_coverageZoomed.remove();
                    }
                    buttons.street_view_button.open = false;
                } else {
                    if (!buttons.mapboxMap.getMapboxMap().isStyleLoaded()) {
                        return;
                    }
                    buttons.disable_trace = true;
                    map._container.style.cursor = 'crosshair';
                    if (buttons.mapboxgl_canvas) buttons.mapboxgl_canvas.style.cursor = 'crosshair';
                    if (buttons.street_view_button.mapillary) {
                        buttons.mapillary_coverage.addTo(map);
                        buttons.mapillary_coverageZoomed.addTo(map);
                    }
                    buttons.street_view_button.style.color = '#247827';
                    buttons.street_view_button.open = true;
                }
            });
            this.mapillary_move.addEventListener('mousedown', function (e) {
                buttons.mapillary_move.startX = e.clientX;
                buttons.mapillary_move.startY = e.clientY;
                buttons.mapillary_move.startTop = buttons.mapillary_container.offsetTop;
                buttons.mapillary_move.startLeft = buttons.mapillary_container.offsetLeft;
                buttons.mapillary_move.dragging = true;
            });
            document.addEventListener('mousemove', function (e) {
                if (buttons.mapillary_move.dragging) {
                    e.preventDefault();
                    buttons.mapillary_container.style.top = (buttons.mapillary_move.startTop + e.clientY - buttons.mapillary_move.startY) + "px";
                    buttons.mapillary_container.style.left = (buttons.mapillary_move.startLeft + e.clientX - buttons.mapillary_move.startX) + "px";
                }
            });
            document.addEventListener('mouseup', function (e) {
                buttons.mapillary_move.dragging = false;
            });
            this.mapillary_close.addEventListener('click', closeStreetView);
            map.addEventListener('click', function (e) {
                if (buttons.street_view_button.open) {
                    openStreetView(e);
                    return;
                }
                if (window.getComputedStyle(buttons.load).display != 'none') {
                    buttons.toolbar_content.classList.remove('maximized');
                }
                if (!total.hasFocus) {
                    const trace = total.traces[total.focusOn];

                    if (buttons.add_wpt.active) {
                        trace.addWaypoint(e.latlng);
                        if (!trace.isEdited) {
                            map._container.style.cursor = '';
                            if (buttons.mapboxgl_canvas) buttons.mapboxgl_canvas.style.cursor = '';
                        }
                        buttons.disable_trace = false;
                        buttons.add_wpt.active = false;
                        return;
                    } else if (trace.drawing) {
                        if (buttons.disable_trace) return;
                        if (buttons.lastUpdatePointTime && Date.now() - buttons.lastUpdatePointTime < 100) return;
                        trace.addEndPoint(e.latlng.lat, e.latlng.lng);
                    }
                }
            });
            map.on('baselayerchange', function (e) {
                if (localStorage.hasOwnProperty('lastbasemap')) {
                    localStorage.setItem('beforelastbasemap', localStorage.getItem('lastbasemap'));
                }
                for (var layerName in layers) {
                    const layer = layers[layerName];
                    if (layer == e.layer) {
                        localStorage.setItem('lastbasemap', layerName);
                    }
                }
                if (buttons.map.hasLayer(buttons.mapboxMap)) {
                    if (buttons.mapboxSatelliteSelector.checked) localStorage.setItem('lastbasemap', 'mapbox-satellite');
                    else localStorage.setItem('lastbasemap', 'mapbox');
                    if (buttons.mapbox_logo) buttons.mapbox_logo.firstChild.style.display = '';
                } else {
                    if (buttons.mapbox_logo) buttons.mapbox_logo.firstChild.style.display = 'none';
                }
            });
            window.addEventListener('beforeunload', function (e) {
                if (buttons.embedding) return;
                if (buttons.total.traces.length > 0) {
                    localStorage.setItem('traces', buttons.total.traces.length);
                    for (var i = 0; i < buttons.total.traces.length; i++) {
                        const avgData = buttons.total.traces[i].getAverageAdditionalData();
                        const data = total.outputGPX(false, true, avgData.hr, avgData.atemp, avgData.cad, avgData.power, true, i);
                        try {
                            localStorage.setItem(i, JSON.stringify(data[0]));
                        } catch (err) {
                            e.preventDefault();
                            e.returnValue = true;
                            break;
                        }
                    }
                }
                saveLayers(true);
            });
        }
        this.show_chevrons.addEventListener('input', function (e) {
            buttons.show_direction = buttons.show_chevrons.checked;
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (buttons.show_direction) trace.showChevrons();
            else trace.hideChevrons();
        });
        this.show_dist_markers.addEventListener('input', function (e) {
            buttons.show_distance = buttons.show_dist_markers.checked;
            if (total.hasFocus) return;
            const trace = total.traces[total.focusOn];
            if (buttons.show_distance) trace.showDistanceMarkers();
            else trace.hideDistanceMarkers();
        });
        buttons.elevation_input.checked = true;
        this.elevation_input.addEventListener('click', function (e) {
            buttons.elevation_input.checked = !buttons.elevation_input.checked;
            if (buttons.elevation_input.checked) {
                buttons.trace_info_grid.classList.remove('minimized');
                buttons.trace_info_grid.classList.add('maximized');
                buttons.elevation_input.children[0].classList.remove('fa-chart-area');
                buttons.elevation_input.children[0].classList.add('fa-minus');
                buttons.setElevationProfileWidth();
            } else {
                buttons.trace_info_grid.classList.remove('maximized');
                buttons.trace_info_grid.classList.add('minimized');
                buttons.elevation_input.children[0].classList.remove('fa-minus');
                buttons.elevation_input.children[0].classList.add('fa-chart-area');
            }
        });
        this.google = new Google(this);
    }

    focusTabElement(tab) {
        document.querySelectorAll('.tab').forEach(item => { item.classList.remove('tab-focus'); });
        tab.classList.add('tab-focus');
    }

    updateBounds() {
        this.map.fitBounds(this.total.getBounds());
    }

    loadFiles(files) {
        var total = this.total;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.name.split('.').pop().toLowerCase() != 'gpx') continue;
            var reader = new FileReader();
            reader.onload = (function (f, name) {
                return function (e) {
                    total.addTrace(e.target.result, name)
                };
            })(file, file.name);
            reader.readAsDataURL(file);
        }
        this.input.value = "";
    }

    openURLs() {
        const _this = this;
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        if (!urlParams.has('state')) return;
        const params = JSON.parse(urlParams.get('state'));
        if (!params.urls) return;

        params.urls = [...new Set(params.urls)];

        const sortable = this.sortable;
        const total = this.total;
        var countDone = 0, countOk = 0;
        const onFinish = function () {
            for (var j = 1; j < sortable.el.children.length; j++) {
                const tab = sortable.el.children[j];
                const trace = tab.trace;
                trace.index = j - 1;
                trace.key = null;
                total.traces[trace.index] = trace;
                if (trace.hasFocus) {
                    total.focusOn = trace.index;
                }
            }
        };

        const index = {};
        for (var i = 0; i < params.urls.length; i++) {
            index[params.urls[i]] = i;
        }

        for (var i = 0; i < params.urls.length; i++) {
            const file_url = params.urls[i];
            const href = decodeURIComponent(file_url);
            if (href) {
                const xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        const path = href.split('/');
                        const name = path.length ? path[path.length - 1] : href;
                        _this.total.addTrace(xhr.responseText, name, function (trace) {
                            trace.key = file_url;
                            countOk++;
                            countDone++;
                            for (var j = total.traces.length - countOk; j < total.traces.length - 1; j++) {
                                if (index[total.traces[j].key] > index[file_url]) {
                                    sortable.el.appendChild(total.traces[j].tab);
                                }
                            }
                            if (countDone == params.urls.length) onFinish();
                        });
                    } else if (xhr.readyState == 4 && xhr.status != 200) {
                        countDone++;
                        if (countDone == params.urls.length) onFinish();
                    }
                }
                xhr.open('GET', href);
                xhr.send();
            }
        }
    }

    openLocalStorage() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        if (urlParams.has('state')) return;
        if (this.embedding) return;

        if (!localStorage.hasOwnProperty('traces')) return;

        var length = localStorage.getItem('traces');
        for (var i = 0; i < length; i++) {
            if (!localStorage.hasOwnProperty(i)) continue;
            const data = JSON.parse(localStorage.getItem(i));
            this.total.addTrace(data.text, data.name);
            localStorage.removeItem(i);
        }
        localStorage.removeItem('traces');
    }

    showLoadErrorPopup() {
        if (this.window_open) this.window_open.hide();
        this.window_open = this.load_error_window;
        this.load_error_window.show();
    }

    donation() {
        window.open('https://ko-fi.com/gpxstudio');
    }

    pause(msec) {
        return new Promise(
            (resolve, reject) => {
                setTimeout(resolve, msec || 1000);
            }
        );
    }

    download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/octet-stream;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    isMobile() {
        return window.innerWidth < 600 || window.innerHeight < 600;
    }

    supportsWebGL() {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return false;
        else return true;
    };
}
