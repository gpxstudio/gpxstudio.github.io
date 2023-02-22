/**
 * Copyright (C) 2011-2012 Pavel Shramov
 * Copyright (C) 2013-2017 Maxime Petazzoni <maxime.petazzoni@bulix.org>
 * All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Thanks to Pavel Shramov who provided the initial implementation and Leaflet
 * integration. Original code was at https://github.com/shramov/leaflet-plugins.
 *
 * It was then cleaned-up and modified to record and make available more
 * information about the GPX track while it is being parsed so that the result
 * can be used to display additional information about the track that is
 * rendered on the Leaflet map.
 */

//var L = L || require('leaflet');

const iconMap = new Map(window.icons);

var _MAX_POINT_INTERVAL_MS = 15000;
var _SECOND_IN_MILLIS = 1000;
var _MINUTE_IN_MILLIS = 60 * _SECOND_IN_MILLIS;
var _HOUR_IN_MILLIS = 60 * _MINUTE_IN_MILLIS;
var _DAY_IN_MILLIS = 24 * _HOUR_IN_MILLIS;

var _GPX_STYLE_NS = 'http://www.topografix.com/GPX/gpx_style/0/2';

var _DEFAULT_MARKER_OPTS = {
  startIconUrl: 'pin-icon-start.png',
  endIconUrl: 'pin-icon-end.png',
  shadowUrl: 'pin-shadow.png',
  wptIcons: [],
  wptIconUrls : {
    '': 'pin-icon-wpt.png',
  },
  pointMatchers: [],
  iconSize: [33, 50],
  shadowSize: [50, 50],
  iconAnchor: [16, 45],
  shadowAnchor: [16, 47],
  clickable: true
};
var _DEFAULT_POLYLINE_OPTS = {};
var _DEFAULT_GPX_OPTS = {
  parseElements: ['track', 'route', 'waypoint'],
  joinTrackSegments: true
};

L.GPX = L.FeatureGroup.extend({
  initialize: function(gpx, options, trace) {
    options.max_point_interval = options.max_point_interval || _MAX_POINT_INTERVAL_MS;
    options.marker_options = this._merge_objs(
      _DEFAULT_MARKER_OPTS,
      options.marker_options || {});
    options.polyline_options = options.polyline_options || {};
    options.gpx_options = this._merge_objs(
      _DEFAULT_GPX_OPTS,
      options.gpx_options || {});

    L.Util.setOptions(this, options);

    // Base icon class for track pins.
    L.GPXTrackIcon = L.Icon.extend({ options: options.marker_options });

    this._gpx = gpx;
    this._trace = trace;
    this._layers = {};
    this._init_info();

    if (gpx) {
      this._parse(gpx, options, this.options.async);
    }
  },

  get_duration_string: function(duration, hidems) {
    var s = '';

    if (duration >= _DAY_IN_MILLIS) {
      s += Math.floor(duration / _DAY_IN_MILLIS) + 'd ';
      duration = duration % _DAY_IN_MILLIS;
    }

    if (duration >= _HOUR_IN_MILLIS) {
      s += Math.floor(duration / _HOUR_IN_MILLIS) + ':';
      duration = duration % _HOUR_IN_MILLIS;
    }

    var mins = Math.floor(duration / _MINUTE_IN_MILLIS);
    duration = duration % _MINUTE_IN_MILLIS;
    if (mins < 10) s += '0';
    s += mins + '\'';

    var secs = Math.floor(duration / _SECOND_IN_MILLIS);
    duration = duration % _SECOND_IN_MILLIS;
    if (secs < 10) s += '0';
    s += secs;

    if (!hidems && duration > 0) s += '.' + Math.round(Math.floor(duration)*1000)/1000;
    else s += '"';

    return s;
  },

  get_duration_string_iso: function(duration, hidems) {
    var s = this.get_duration_string(duration, hidems);
    return s.replace("'",':').replace('"','');
  },

  // Public methods
  to_miles:            function(v) { return v / 1.609344; },
  to_ft:               function(v) { return v * 3.280839895; },
  m_to_km:             function(v) { return v / 1000; },
  m_to_mi:             function(v) { return v / 1609.34; },

  get_name:            function() { return this._info.name; },
  get_desc:            function() { return this._info.desc; },
  get_author:          function() { return this._info.author; },
  get_copyright:       function() { return this._info.copyright; },
  get_distance:        function() { return this._info.length; },
  get_distance_imp:    function() { return this.to_miles(this.m_to_km(this.get_distance())); },

  get_start_time:      function() { return this._info.duration.start; },
  get_end_time:        function() { return this._info.duration.end; },
  get_moving_time:     function() { return this._info.duration.moving; },
  get_total_time:      function() { return this._info.duration.total; },

  get_moving_pace:     function() { return this.get_moving_time() / this.m_to_km(this.get_distance()); },
  get_moving_pace_imp: function() { return this.get_moving_time() / this.get_distance_imp(); },

  get_moving_speed:    function() { return this.m_to_km(this.get_distance()) / (this.get_moving_time() / (3600 * 1000)) ; },
  get_moving_speed_imp:function() { return this.to_miles(this.m_to_km(this.get_distance())) / (this.get_moving_time() / (3600 * 1000)) ; },

  get_total_speed:     function() { return this.m_to_km(this.get_distance()) / (this.get_total_time() / (3600 * 1000)); },
  get_total_speed_imp: function() { return this.to_miles(this.m_to_km(this.get_distance())) / (this.get_total_time() / (3600 * 1000)); },

  get_elevation_gain:     function() { return this._info.elevation.gain; },
  get_elevation_loss:     function() { return this._info.elevation.loss; },
  get_elevation_gain_imp: function() { return this.to_ft(this.get_elevation_gain()); },
  get_elevation_loss_imp: function() { return this.to_ft(this.get_elevation_loss()); },
  get_elevation_data:     function() {
    var _this = this;
    return this._info.elevation._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' m'; });
      });
  },
  get_elevation_data_imp: function() {
    var _this = this;
    return this._info.elevation._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, _this.to_ft,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' ft'; });
      });
  },
  get_elevation_max:      function() { return this._info.elevation.max; },
  get_elevation_min:      function() { return this._info.elevation.min; },
  get_elevation_max_imp:  function() { return this.to_ft(this.get_elevation_max()); },
  get_elevation_min_imp:  function() { return this.to_ft(this.get_elevation_min()); },

  get_average_hr:         function() { return this._info.hr.avg; },
  get_average_temp:         function() { return this._info.atemp.avg; },
  get_average_cadence:         function() { return this._info.cad.avg; },
  get_heartrate_data:     function() {
    var _this = this;
    return this._info.hr._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' bpm'; });
      });
  },
  get_heartrate_data_imp: function() {
    var _this = this;
    return this._info.hr._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, null,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' bpm'; });
      });
  },
  get_cadence_data:     function() {
    var _this = this;
    return this._info.cad._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' rpm'; });
      });
  },
  get_temp_data:     function() {
    var _this = this;
    return this._info.atemp._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_km, null,
        function(a, b) { return a.toFixed(2) + ' km, ' + b.toFixed(0) + ' degrees'; });
      });
  },
  get_cadence_data_imp:     function() {
    var _this = this;
    return this._info.cad._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, null,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' rpm'; });
      });
  },
  get_temp_data_imp:     function() {
    var _this = this;
    return this._info.atemp._points.map(
      function(p) { return _this._prepare_data_point(p, _this.m_to_mi, null,
        function(a, b) { return a.toFixed(2) + ' mi, ' + b.toFixed(0) + ' degrees'; });
      });
  },

  reload: function() {
    this._init_info();
    this.clearLayers();
    this._parse(this._gpx, this.options, this.options.async);
  },

  // Private methods
  _merge_objs: function(a, b) {
    var _ = {};
    for (var attr in a) { _[attr] = a[attr]; }
    for (var attr in b) { _[attr] = b[attr]; }
    return _;
  },

  _prepare_data_point: function(p, trans1, trans2, trans_tooltip) {
    var r = [trans1 && trans1(p[0]) || p[0], trans2 && trans2(p[1]) || p[1]];
    r.push(trans_tooltip && trans_tooltip(r[0], r[1]) || (r[0] + ': ' + r[1]));
    return r;
  },

  _init_info: function() {
    this._info = {
      name: null,
      length: 0.0,
      moving_length: 0.0,
      elevation: {gain: 0.0, loss: 0.0, max: 0.0, min: Infinity, _points: []},
      hr: {avg: 0, _total: 0, _points: []},
      duration: {start: null, end: null, moving: 0, total: 0},
      atemp: {avg: 0, _total: 0, _points: []},
      cad: {avg: 0, _total: 0, _points: []},
      power: {avg: 0, _total: 0, _points: []},
      npoints: 0,
      nsegments: 0,
      ntracks: 0,
      creator: this._info ? this._info.creator : null,
    };
  },

  _load_xml: function(url, cb, options, async) {
    if (async == undefined) async = this.options.async;
    if (options == undefined) options = this.options;

    var _this = this;
    var req = new window.XMLHttpRequest();
    req.open('GET', url, async);
    try {
      req.overrideMimeType('text/xml'); // unsupported by IE
    } catch(e) {}
    req.onreadystatechange = function() {
      if (req.readyState != 4) return;
      if(req.status == 200) {
          if (req.responseXML) cb(req.responseXML, options);
          else  _this.fire('error', { err: 'Failed to parse file as XML.'});
      }
    };
    req.send(null);
  },

  _parse: function(input, options, async) {
    var _this = this;
    var cb = function(gpx, options) {
      var layers = _this._parse_gpx_data(gpx, options);
      if (!layers) {
        _this.fire('error', { err: 'No parseable layers of type(s) ' + JSON.stringify(options.gpx_options.parseElements) });
        return;
      }
      _this.addLayer(layers);
      _this._compute_stats();
      _this.fire('loaded', { layers: layers, element: gpx });
    }
    if (input.substr(0,1)==='<') { // direct XML has to start with a <
      var parser = new DOMParser();
      if (async) {
        setTimeout(function() {
          cb(parser.parseFromString(input, "text/xml"), options);
        });
      } else {
        cb(parser.parseFromString(input, "text/xml"), options);
      }
    } else {
      this._load_xml(input, cb, options, async);
    }
  },

  _parse_gpx_data: function(xml, options) {
    var i, j, t, l, el, layers = [];

    var name = xml.getElementsByTagName('name');
    if (name.length > 0) {
      this._info.name = name[0].textContent;
    }
    var desc = xml.getElementsByTagName('desc');
    if (desc.length > 0) {
      this._info.desc = desc[0].textContent;
    }
    var author = xml.getElementsByTagName('author');
    if (author.length > 0) {
      this._info.author = author[0].textContent;
    }
    var creator = xml.getElementsByTagName('gpx')[0].attributes.creator;
    if (creator) {
        this._info["creator"] = creator.value;
    }
    var copyright = xml.getElementsByTagName('copyright');
    if (copyright.length > 0) {
      this._info.copyright = copyright[0].textContent;
    }

    var parseElements = options.gpx_options.parseElements;
    if (parseElements.indexOf('route') > -1) {
      // routes are <rtept> tags inside <rte> sections
      var routes = xml.getElementsByTagName('rte');
      for (i = 0; i < routes.length; i++) {
        layers.push(new L.FeatureGroup(this._parse_segment(routes[i], options, {}, 'rtept')));
      }
    }

    if (parseElements.indexOf('track') > -1) {
      // tracks are <trkpt> tags in one or more <trkseg> sections in each <trk>
      var tracks = xml.getElementsByTagName('trk');
      for (i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var polyline_options = this._extract_styling(track);
        var trk = null;

        if (options.gpx_options.joinTrackSegments) {
          trk = new L.FeatureGroup(this._parse_segment(track, options, polyline_options, 'trkpt'));
        } else {
          var segments = track.getElementsByTagName('trkseg');
          var segs = [];
          for (j = 0; j < segments.length; j++) {
            segs = segs.concat(this._parse_segment(segments[j], options, polyline_options, 'trkpt'));
          }
          trk = new L.FeatureGroup(segs);
        }

        trk.style = polyline_options;

        var trkName = tracks[i].getElementsByTagName('name');
        if (trkName.length > 0) {
          trk.name = trkName[0].textContent
        }

        layers.push(trk);
      }
    }

    // parse waypoints and add markers for each of them
    if (parseElements.indexOf('waypoint') > -1) {
      el = xml.getElementsByTagName('wpt');
      var wpts = [];

      for (i = 0; i < el.length; i++) {
        var ll = new L.LatLng(
            el[i].getAttribute('lat'),
            el[i].getAttribute('lon'));

        var eleEl = el[i].getElementsByTagName('ele');
        var ele = -1;
        if (eleEl.length > 0) {
          ele = parseFloat(eleEl[0].textContent);
          if (Number.isNaN(ele)) ele = -1;
        }
        ll.meta = {'ele': ele};

        var nameEl = el[i].getElementsByTagName('name');
        var name = '';
        if (nameEl.length > 0) {
          name = nameEl[0].textContent;
        }

        var descEl = el[i].getElementsByTagName('desc');
        var desc = '';
        if (descEl.length > 0) {
          desc = descEl[0].textContent;
        }

        var cmtEl = el[i].getElementsByTagName('cmt');
        var cmt = '';
        if (cmtEl.length > 0) {
          cmt = cmtEl[0].textContent;
        }

        var symEl = el[i].getElementsByTagName('sym');
        var sym = '';
        if (symEl.length > 0) {
          sym = symEl[0].textContent;
        }

        wpts.push(this._get_marker(ll, sym, name, desc, cmt, options));
      }
      layers.push(new L.FeatureGroup(wpts));
    }

    if (layers.length == 0) return null;
    return new L.FeatureGroup(layers);
  },

  _get_marker: function(ll, sym, name, desc, cmt, options) {
      const trace = this._trace;
      const map = trace.map;

      var icon = iconMap.get(sym);
      if (!icon) {
          icon = {prefix: '', glyph: ''};
          sym = " ";
      }
      var marker = new L.Marker(ll, {
        clickable: options.marker_options.clickable,
        draggable: !trace.buttons.embedding,
        keyboard: false,
        title: name,
        icon: L.icon.glyph(icon)
      });

      marker.name = filterXSS(name);
      marker.desc = filterXSS(desc);
      marker.cmt = filterXSS(cmt);
      marker.sym = sym;

      marker.on({
          dragstart: function (e) {
              if (trace.buttons.embedding) return;
              if (trace.total.hasFocus) return;
              if (e.originalEvent !== undefined && e.originalEvent.which == 3) return false;
              marker._latlng_origin = marker._latlng;
          },
          drag: function (e) {
              const pt = map.latLngToLayerPoint(e.latlng);
              const segments = trace.getSegments();
              var best_pt = null;
              for (var s=0; s<segments.length; s++) {
                  const closest_pt = segments[s].closestLayerPoint(pt);
                  if (closest_pt && (!best_pt || closest_pt.distance < best_pt.distance)) {
                      best_pt = closest_pt;
                  }
              }
              if (best_pt && best_pt.distance < 15) {
                  marker.setLatLng(map.layerPointToLatLng(best_pt));
              }
          },
          dragend: function (e) {
              if (marker._latlng != marker._latlng_origin) {
                  marker._latlng.meta = {'ele': 0};
                  trace.askElevation([marker._latlng], true);
              }
          },
          click: function (e) {
              if (this.isPopupOpen()) {
                  this.closePopup();
              } else {
                  const popup = L.popup({
                      closeButton: false
                  });
                  marker.bindPopup(popup).openPopup();
                  popup.setContent(`<div style="width: 200px; display: inline-block; overflow-wrap: break-word;">
                                        `+(trace.buttons.embedding ? '' : (`<div style="float: right;"><i id="edit`+popup._leaflet_id+`" class="fas fa-pencil-alt custom-button" style="display: inline-block" title="`+trace.buttons.edit_info_text+`"></i> <i id="clone`+popup._leaflet_id+`" class="fas fa-copy custom-button" style="display: inline-block" title="`+trace.buttons.duplicate_text+`"></i> <i id="delete`+popup._leaflet_id+`" class="fas fa-trash-alt custom-button" style="display: inline-block" title="`+trace.buttons.delete_text+`"></i></div>`))+`
                                        <div class="wpt-cmt"><b>`+(marker.name.length > 0 ? marker.name : trace.buttons.empty_title_text)+`</b></div>
                                        <div class="wpt-cmt">`+marker._latlng.lat+', '+marker._latlng.lng+' ('+
                                        (trace.buttons.km ? (L.Util.formatNum(marker._latlng.meta.ele, 0) + trace.buttons.unit_meters_text) : (L.Util.formatNum(marker._latlng.meta.ele * 3.280839895, 0) + trace.buttons.unit_feet_text))
                                        +')<br>'+
                                        (marker.cmt.length > 0 ? (marker.cmt + '<br>') : '')+`<i class="wpt-cmt">`+marker.desc+`</i></div>
                                    </div>`);
                  if (!trace.buttons.embedding) {
                      if (e.originalEvent && e.originalEvent.shiftKey) {
                          trace.deleteWaypoint(marker);
                          popup.remove();
                          return;
                      }

                      const edit = document.getElementById('edit' + popup._leaflet_id);
                      edit.addEventListener('click', function () {
                          popup.setContent(`<div style="width: 300px; display: inline-block; overflow-wrap: break-word;">
                                         <div>`+trace.buttons.name_text+`</div>
                                         <div id="name`+popup._leaflet_id+`" contenteditable class="wpt-input"></div>
                                         <div>`+trace.buttons.comment_text+`</div>
                                         <div id="cmt`+popup._leaflet_id+`" contenteditable class="wpt-input"></div>
                                         <div>`+trace.buttons.description_text+`</div>
                                         <div id="desc`+popup._leaflet_id+`" contenteditable class="wpt-input"></div>
                                         <label for="sym`+popup._leaflet_id+`">`+trace.buttons.symbol_text+`</label><br>
                                         <select type="text" id="sym`+popup._leaflet_id+`" name="sym`+popup._leaflet_id+`" style="width: 100%"></select><br>
                                         <div style="text-align: center">
                                            <div id="change`+popup._leaflet_id+`" class="panels custom-button normal-button">`+trace.buttons.ok_button_text+`</div>
                                            <div id="cancel`+popup._leaflet_id+`" class="panels custom-button normal-button"><b>`+trace.buttons.cancel_button_text+`</b></div>
                                         </div></div>`);
                          const name = document.getElementById('name'+popup._leaflet_id);
                          const cmt = document.getElementById('cmt'+popup._leaflet_id);
                          const desc = document.getElementById('desc'+popup._leaflet_id);
                          const select = document.getElementById('sym'+popup._leaflet_id);
                          const change = document.getElementById('change'+popup._leaflet_id);
                          const cancel = document.getElementById('cancel'+popup._leaflet_id);

                          for (var i=0; i<icons.length; i++) {
                              var opt = document.createElement('option');
                              opt.value = icons[i][0];
                              opt.innerHTML = icons[i][0];
                              select.appendChild(opt);
                          }

                          name.innerHTML = trace.total.encodeString(marker.name);
                          cmt.innerHTML = trace.total.encodeString(marker.cmt);
                          desc.innerHTML = trace.total.encodeString(marker.desc);
                          select.value = iconMap.get(marker.sym) ? marker.sym : " ";

                          change.addEventListener('click', function () {
                              marker.name = filterXSS(name.innerText);
                              marker.cmt = filterXSS(cmt.innerText);
                              marker.desc = filterXSS(desc.innerText);
                              marker.sym = select.value;
                              marker.setIcon(L.icon.glyph(iconMap.get(marker.sym)));
                              marker._icon.title = filterXSS(name.innerText);

                              marker.closePopup();
                              marker.fire('click');
                          });
                          cancel.addEventListener('click', function () {
                              marker.closePopup();
                              marker.fire('click');
                          });
                      });
                      L.DomEvent.on(edit,"click",L.DomEvent.stopPropagation);

                      const clone = document.getElementById('clone' + popup._leaflet_id);
                      clone.addEventListener('click', function () {
                          trace.buttons.add_wpt.click();
                          trace.buttons.clone_wpt = marker;
                          popup.remove();
                      });

                      const remove = document.getElementById('delete' + popup._leaflet_id);
                      remove.addEventListener("click", function () {
                          trace.deleteWaypoint(marker);
                          popup.remove();
                      });
                  }

                  popup.addEventListener('remove', function () {
                      marker.unbindPopup();
                  });
              }
          }
      });

      L.DomEvent.on(marker,"click",L.DomEvent.stopPropagation);
      L.DomEvent.on(marker,"dblclick",L.DomEvent.stopPropagation);

      return marker;
  },

  _parse_segment: function(line, options, polyline_options, tag) {
    var el = line.getElementsByTagName(tag);
    if (!el.length) return [];

    var coords = [];
    var markers = [];
    var layers = [];

    for (var i = 0; i < el.length; i++) {
      var _, ll = new L.LatLng(
        el[i].getAttribute('lat'),
        el[i].getAttribute('lon'));
      ll.meta = { time: null, original_time: false, ele: null, hr: null, cad: null, atemp: null, surface: "missing" };

      _ = el[i].getElementsByTagName('time');
      if (_.length > 0) {
        ll.meta.time = new Date(Date.parse(_[0].textContent));
        ll.meta.original_time = true;
      }

      _ = el[i].getElementsByTagName('ele');
      if (_.length > 0) {
        ll.meta.ele = parseFloat(_[0].textContent);
      } else {
        ll.meta.ele = 0;
        this.missing_elevation = true;
      }

      _ = el[i].getElementsByTagName('name');
      if (_.length > 0) {
        var name = _[0].textContent;
        var ptMatchers = options.marker_options.pointMatchers || [];

        for (var j = 0; j < ptMatchers.length; j++) {
          if (ptMatchers[j].regex.test(name)) {
            markers.push({ label: name, coords: ll, icon: ptMatchers[j].icon, element: el[i] });
            break;
          }
        }
      }

      _ = el[i].getElementsByTagNameNS('*', 'hr');
      if (_.length > 0) {
        ll.meta.hr = parseInt(_[0].textContent);
        this._info.hr._points.push([this._info.length, ll.meta.hr]);
        this._info.hr._total += ll.meta.hr;
      }

      _ = el[i].getElementsByTagNameNS('*', 'cad');
      if (_.length > 0) {
        ll.meta.cad = parseInt(_[0].textContent);
        this._info.cad._points.push([this._info.length, ll.meta.cad]);
        this._info.cad._total += ll.meta.cad;
      }

      _ = el[i].getElementsByTagNameNS('*', 'atemp');
      if (_.length > 0) {
        ll.meta.atemp = parseInt(_[0].textContent);
        this._info.atemp._points.push([this._info.length, ll.meta.atemp]);
        this._info.atemp._total += ll.meta.atemp;
      }

      _ = el[i].getElementsByTagNameNS('*', 'surface');
      if (_.length > 0) {
        if (window.surface_mapping.hasOwnProperty(_[0].textContent)) {
          ll.meta.surface = _[0].textContent;
        }
      }

      _ = el[i].getElementsByTagNameNS('*', 'power');
      if (_.length > 0) {
        ll.meta.power = parseInt(_[0].textContent);
        this._info.power._points.push([this._info.length, ll.meta.power]);
        this._info.power._total += ll.meta.power;
      } else {
          _ = el[i].getElementsByTagNameNS('*', 'PowerInWatts');
          if (_.length > 0) {
            ll.meta.power = parseInt(_[0].textContent);
            this._info.power._points.push([this._info.length, ll.meta.power]);
            this._info.power._total += ll.meta.power;
          }
      }

      if (ll.meta.ele > this._info.elevation.max) {
        this._info.elevation.max = ll.meta.ele;
      }

      if (ll.meta.ele < this._info.elevation.min) {
        this._info.elevation.min = ll.meta.ele;
      }

      this._info.elevation._points.push([this._info.length, ll.meta.ele]);
      this._info.duration.end = ll.meta.time;

      coords.push(ll);
    }

    // add track
    var l = new L.Polyline(coords, options.polyline_options);
    this.fire('addline', { line: l, element: line });
    layers.push(l);

    if (options.marker_options.startIcon || options.marker_options.startIconUrl) {
      // add start pin
      var marker = new L.Marker(coords[0], {
        clickable: options.marker_options.clickable,
        icon: options.marker_options.startIcon || new L.GPXTrackIcon({iconUrl: options.marker_options.startIconUrl})
      });
      this.fire('addpoint', { point: marker, point_type: 'start', element: el[0] });
      layers.push(marker);
    }

    if (options.marker_options.endIcon || options.marker_options.endIconUrl) {
      // add end pin
      var marker = new L.Marker(coords[coords.length-1], {
        clickable: options.marker_options.clickable,
        icon: options.marker_options.endIcon || new L.GPXTrackIcon({iconUrl: options.marker_options.endIconUrl})
      });
      this.fire('addpoint', { point: marker, point_type: 'end', element: el[el.length-1] });
      layers.push(marker);
    }

    // add named markers
    for (var i = 0; i < markers.length; i++) {
      var marker = new L.Marker(markers[i].coords, {
        clickable: options.marker_options.clickable,
        title: markers[i].label,
        icon: markers[i].icon
      });
      this.fire('addpoint', { point: marker, point_type: 'label', element: markers[i].element });
      layers.push(marker);
    }

    return layers;
  },

  _moving_criterion: function(d, t) {
      return t < this.options.max_point_interval && (d/1000)/(t/1000/60/60) >= 0.5;
  },

  _compute_stats: function(start, end) {
      this._init_info();
      this._smooth_elevation();

      start = start || 0;
      end = end || Infinity;

      var in_bounds = function(i) {
          return i >= start && i <= end;
      }

      // recompute on remaining data
      var distance = 0.0, cumul = 0;

      const tracks = this._trace.getTracks();
      for (var ti=0; ti<tracks.length; ti++) {
          var inc = false;
          tracks[ti]._dist = distance;
          tracks[ti]._elevation = { gain: this._info.elevation.gain, loss: this._info.elevation.loss };
          tracks[ti]._duration = this._info.duration.moving;

          const segments = this._trace.getSegments(tracks[ti]);
          for (var l=0; l<segments.length; l++) {
              segments[l]._dist = distance;
              segments[l]._elevation = { gain: this._info.elevation.gain, loss: this._info.elevation.loss };
              segments[l]._duration = this._info.duration.moving;
              var ll = null, last = null, last_ele = null;
              var current_ele_window = 0, current_ele_sum = 0;
              const points = segments[l]._latlngs;

              if (start < cumul+points.length && end >= cumul) {
                  this._info.nsegments++;
                  if (!inc) {
                      inc = true;
                      this._info.ntracks++;
                  }
              }

              for (var i=0; i<points.length; i++) {
                  ll = points[i];
                  ll.index = i;
                  ll.trace_index = cumul + i;

                  if (in_bounds(cumul+i)) {
                      this._info.npoints++;
                      this._info.elevation.max = Math.max(ll.meta.ele, this._info.elevation.max);
                      this._info.elevation.min = Math.min(ll.meta.ele, this._info.elevation.min);
                      this._info.duration.end = ll.meta.time;
                  }

                  if (last != null) {
                      const dist = this._dist2d(last, ll);
                      if (in_bounds(cumul+i)) this._info.length += dist;
                      distance += dist;

                      var t = Math.abs(ll.meta.time - last.meta.time);
                      if (in_bounds(cumul+i) && last.meta.time != null && ll.meta.time != null) {
                          this._info.duration.total += t;
                          if (this._moving_criterion(dist, t)) {
                            this._info.duration.moving += t;
                            this._info.moving_length += dist;
                          }
                      }

                      t = ll.meta.smoothed_ele - last.meta.smoothed_ele;
                      if (in_bounds(cumul+i)) {
                          if (t > 0) {
                            this._info.elevation.gain += t;
                          } else {
                            this._info.elevation.loss += Math.abs(t);
                          }
                      }
                  }

                  if (this._info.duration.start == null) {
                      this._info.duration.start = ll.meta.time;
                  }

                  ll._dist = distance / 1000;
                  last = ll;
              }

              cumul += points.length;
              segments[l]._dist = distance - segments[l]._dist;
              segments[l]._elevation.gain = this._info.elevation.gain - segments[l]._elevation.gain;
              segments[l]._elevation.loss = this._info.elevation.loss - segments[l]._elevation.loss;
              segments[l]._duration = this._info.duration.moving - segments[l]._duration;
          }

          tracks[ti]._dist = distance - tracks[ti]._dist;
          tracks[ti]._elevation.gain = this._info.elevation.gain - tracks[ti]._elevation.gain;
          tracks[ti]._elevation.loss = this._info.elevation.loss - tracks[ti]._elevation.loss;
          tracks[ti]._duration = this._info.duration.moving - tracks[ti]._duration;
      }
  },

  _smooth_elevation: function() {
      const ELE_THRESHOLD = 100, SLOPE_THRESHOLD = 100;
      const tracks = this._trace.getTracks();
      for (var ti=0; ti<tracks.length; ti++) {
          const segments = this._trace.getSegments(tracks[ti]);
          for (var l=0; l<segments.length; l++) {
              const points = segments[l]._latlngs;

              var start = 0, end = -1, cumul = 0;
              for (var i=0; i<points.length; i++) {
                  while (start < i && this._dist2d(points[start], points[i]) > ELE_THRESHOLD) {
                      cumul -= points[start].meta.ele;
                      start++;
                  }
                  while (end+1 < points.length && this._dist2d(points[i], points[end+1]) <= ELE_THRESHOLD) {
                      cumul += points[end+1].meta.ele;
                      end++;
                  }
                  points[i].meta.smoothed_ele = cumul / (end - start + 1);
              }

              if (points.length > 0) {
                  points[0].meta.smoothed_ele = points[0].meta.ele;
                  points[points.length-1].meta.smoothed_ele = points[points.length-1].meta.ele;
              }

              start = 0, end = 0, cumul = 0;
              for (var i=0; i<points.length; i++) {
                  while (start < i && this._dist2d(points[start], points[i]) > SLOPE_THRESHOLD) {
                      cumul -= this._dist2d(points[start], points[start+1]);
                      start++;
                  }
                  while (end+1 < points.length && this._dist2d(points[i], points[end+1]) <= SLOPE_THRESHOLD) {
                      cumul += this._dist2d(points[end], points[end+1]);
                      end++;
                  }
                  points[i].meta.slope = cumul > 1e-3 ? 100 * (points[end].meta.ele - points[start].meta.ele) / cumul : 0;
              }
          }
      }
  },

  _extract_styling: function(el) {
    var style = {};
    var e = el.getElementsByTagNameNS(_GPX_STYLE_NS, 'line');
    if (e.length > 0) {
      var _ = e[0].getElementsByTagName('color');
      if (_.length > 0) style.color = '#' + _[0].textContent;
      var _ = e[0].getElementsByTagName('opacity');
      if (_.length > 0) style.opacity = parseFloat(_[0].textContent);
      var _ = e[0].getElementsByTagName('weight');
      if (_.length > 0) style.weight = parseInt(_[0].textContent);
    }
    return style;
  },

  _dist2d: function(a, b) {
    var R = 6371000;
    var dLat = this._deg2rad(b.lat - a.lat);
    var dLon = this._deg2rad(b.lng - a.lng);
    var r = Math.sin(dLat/2) *
      Math.sin(dLat/2) +
      Math.cos(this._deg2rad(a.lat)) *
      Math.cos(this._deg2rad(b.lat)) *
      Math.sin(dLon/2) *
      Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(r), Math.sqrt(1-r));
    var d = R * c;
    return d;
  },

  _dist3d: function(a, b) {
    var planar = this._dist2d(a, b);
    var height = Math.abs(b.meta.ele - a.meta.ele);
    return Math.sqrt(Math.pow(planar, 2) + Math.pow(height, 2));
  },

  _deg2rad: function(deg) {
    return deg * Math.PI / 180;
  }
});

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = L;
} else if (typeof define === 'function' && define.amd) {
  define(L);
}
