// gpx.studio is an online GPX file editor which can be found at https://gpx.studio
// Copyright (C) 2020  Vianney Coppé
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

export default class Google {

    constructor(buttons) {
        this.developerKey = 'AIzaSyA2ZadQob_hXiT2VaYIkAyafPvz_4ZMssk';
        this.clientId = "666808960580-0vssfd67o4l2oeirhnapdv2ej575pks7.apps.googleusercontent.com";
        this.appId = "666808960580";
        this.scope = ['https://www.googleapis.com/auth/drive.file',
                      'https://www.googleapis.com/auth/drive.install',
                      'https://www.googleapis.com/auth/drive.readonly'];
        this.scope2 = 'https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
        this.pickerApiLoaded = false;
        this.buttons = buttons;

        const _this = this;

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        gapi.load('client:auth', {
            callback: function () {
                gapi.client.init({
                    apiKey: _this.developerKey,
                    clientId: _this.clientId,
                    scope: _this.scope2
                }).then(function () {
                    if (urlParams.has('state')) {
                        const params = JSON.parse(urlParams.get('state'));
                        if (params.hasOwnProperty('userId')) {
                            var oauth = gapi.auth2.getAuthInstance();
                            var user = oauth.currentUser.get();
                            var isAuthorized = user.hasGrantedScopes(_this.scope2);
                            if (!isAuthorized || params['userId'] != user.getId()) {
                                oauth.signIn({
                                    scope: _this.scope2
                                }).then(_this.downloadFiles.bind(_this));
                            } else _this.downloadFiles();
                        } else _this.downloadFiles();
                        gtag('event', 'button', {'event_category' : 'open-drive'});
                    }
                }, function () {
                    // private browsing, try to retrieve public files without gapi
                    if (urlParams.has('state')) {
                        const params = JSON.parse(urlParams.get('state'));
                        _this.downloadFiles(true);
                        gtag('event', 'button', {'event_category' : 'open-drive'});
                    }
                });
            }
        });
    }

    downloadFiles(private_mode) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const params = JSON.parse(urlParams.get('state'));
        if (!params.ids) return;

        params.ids = [...new Set(params.ids)];

        const sortable = this.buttons.sortable;
        const total = this.buttons.total;
        var countDone = 0, countOk = 0;

        const index = {};
        for (var i=0; i<params.ids.length; i++) if (index[params.ids[i]] === undefined) {
            index[params.ids[i]] = i;
        }

        for (var i=0; i<params.ids.length; i++) {
            const file_id = params.ids[i];
            this.downloadFile(
                {id:file_id, name:'track.gpx'},
                params.hasOwnProperty('userId') && !private_mode,
                function (trace) {
                    countDone++;
                    if (trace) {
                        countOk++;
                        trace.key = file_id;
                        for (var j=total.traces.length-countOk; j<total.traces.length-1; j++) {
                            if (index[total.traces[j].key] > index[file_id]) {
                                sortable.el.appendChild(total.traces[j].tab);
                            }
                        }
                    }
                    if (countDone == params.ids.length) {
                        for (var j=1; j<sortable.el.children.length; j++) {
                            const tab = sortable.el.children[j];
                            const trace = tab.trace;
                            trace.index = j-1;
                            trace.key = null;
                            total.traces[trace.index] = trace;
                            if (trace.hasFocus) {
                                total.focusOn = trace.index;
                            }
                        }
                    }
                }
            );
        }
    }

    loadPicker(folderMode) {
        this.folderMode = folderMode;
        if (!this.oauthToken)
            gapi.load('auth', {'callback': this.onAuthApiLoad.bind(this)});
        gapi.load('picker', {'callback': this.onPickerApiLoad.bind(this)});
    }

    onAuthApiLoad() {
        const authResult = gapi.auth.getToken();
        if (authResult) {
            this.handleAuthResult(authResult);
        } else {
            window.gapi.auth.authorize(
                {
                    'client_id': this.clientId,
                    'scope': this.scope,
                    'immediate': false
                },
                this.handleAuthResult.bind(this)
            );
        }
    }

    onPickerApiLoad() {
        this.pickerApiLoaded = true;
        this.createPicker();
    }

    handleAuthResult(authResult) {
        if (authResult && !authResult.error) {
            this.oauthToken = authResult.access_token;
            this.createPicker();
        }
    }

    createPicker() {
        if (this.pickerApiLoaded && this.oauthToken) {
            if (this.folderMode) {
                var view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
                    .setSelectFolderEnabled(true);
                var picker = new google.picker.PickerBuilder()
                    .setAppId(this.appId)
                    .setOAuthToken(this.oauthToken)
                    .addView(view)
                    .setDeveloperKey(this.developerKey)
                    .setCallback(this.folderPickerCallback.bind(this))
                    .setTitle('Select a folder')
                    .build();
                picker.setVisible(true);
            } else {
                var view = new google.picker.View(google.picker.ViewId.DOCS).setQuery("*.gpx");
                var picker = new google.picker.PickerBuilder()
                    .enableFeature(google.picker.Feature.NAV_HIDDEN)
                    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                    .setAppId(this.appId)
                    .setOAuthToken(this.oauthToken)
                    .addView(view)
                    .setDeveloperKey(this.developerKey)
                    .setCallback(this.pickerCallback.bind(this))
                    .build();
                picker.setVisible(true);
            }
        }
    }

    pickerCallback(data) {
        if (data.action == google.picker.Action.PICKED) {
            for (var i=0; i<data.docs.length; i++)
                this.downloadFile(data.docs[i], true);
            gtag('event', 'button', {'event_category' : 'load-drive'});
        }
    }

    folderPickerCallback(data) {
        if (data.action == google.picker.Action.PICKED) {
            const buttons = this.buttons;
            const mergeAll = buttons.merge.checked;
            const time = buttons.include_time.checked;
            const hr = buttons.include_hr.checked;
            const atemp = buttons.include_atemp.checked;
            const cad = buttons.include_cad.checked;
            const power = buttons.include_power.checked;
            const surface = buttons.include_surface.checked;

            this.checkAllFilesInFolder(data.docs[0].id, buttons.total.outputGPX(mergeAll, time, hr, atemp, cad, power, surface));

            buttons.export_window.hide();
            this.window = L.control.window(this.buttons.map,{title:'',content:'Uploading...',className:'panels-container',closeButton:false,visible:true});

            gtag('event', 'button', {'event_category' : 'save-drive'});
        }
    }

    checkAllFilesInFolder(folderId, output) {
        const _this = this;
        gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "'" + folderId + "' in parents and trashed=false"},
            callback: function (resp) {
                _this.fileIds = [];
                _this.completed = 0;
                for (var i=0; i<output.length; i++) {
                    var replace = false;
                    for (var j=0; j<resp.items.length; j++) {
                        if (resp.items[j].title == output[i].name) {
                            _this.saveFile(output[i].name, output[i].text, folderId, i, output.length, resp.items[j].id);
                            replace = true;
                            break;
                        }
                    }
                    if (!replace) _this.saveFile(output[i].name, output[i].text,  folderId, i, output.length);
                }
            }
        });
    }

    saveFile(filename, filecontent, folderid, index, number, fileId) {
        var file = new Blob([filecontent], {type: 'text/xml'});
        var metadata = {
            'title': filename,
            'mimeType': 'application/gpx+xml',
            'parents': [{"kind": "drive#parentReference", "id": folderid}]
        };

        var accessToken = gapi.auth.getToken().access_token;

        const _this = this;
        const options = {
            file: file,
            token: accessToken,
            metadata: metadata,
            onComplete: function (resp) {
                const ans = JSON.parse(resp);
                _this.completed++;
                _this.fileIds[index] = ans.id;
                var request = gapi.client.request({
                    'path': '/drive/v3/files/' + ans.id + '/permissions',
                    'method': 'POST',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + accessToken
                    },
                    'body':{
                        'role': 'reader',
                        'type': 'anyone'
                    }
                });
                request.execute();

                if (_this.completed == number) {
                    var url = 'https://gpx.studio'+window.location.pathname.replace('index.html','')+'?state=%7B%22ids%22:%5B%22';
                    for (var i=0; i<_this.fileIds.length; i++) {
                        url += _this.fileIds[i];
                        if (i<_this.fileIds.length-1) url += '%22,%22';
                    }
                    url += '%22%5D%7D';

                    var code = '<iframe src="'+url+'&embed" width="100%" height="500" frameborder="0" allowfullscreen><p><a href="'+url+'"></a></p></iframe>';

                    _this.buttons.copy_link.addEventListener('click', function () {
                        navigator.clipboard.writeText(url);
                    });

                    _this.buttons.copy_embed.addEventListener('click', function () {
                        navigator.clipboard.writeText(code);
                    });

                    _this.window.close();
                    if (_this.buttons.window_open) _this.buttons.window_open.hide();
                    _this.buttons.window_open = _this.buttons.share_window;
                    _this.buttons.share_window.show();
                }
            }
        };
        if (fileId) {
            options.fileId = fileId;
            options.baseUrl = 'https://www.googleapis.com/upload/drive/v3/files/';
        }

        var uploader = new MediaUploader(options);
        uploader.upload();
    }

    downloadFile(file, auth, callback) {
        if (file.name.split('.').pop() != 'gpx') return;
        const buttons = this.buttons;

        const request = new XMLHttpRequest();
        var file_url = 'https://content.googleapis.com/drive/v2/files/'+file.id+'?key='+this.developerKey;
        request.open('GET', file_url, true);
        if (auth) {
            const token = gapi.auth.getToken();
            if (token) request.setRequestHeader('Authorization', 'Bearer ' + token.access_token);
        }
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                const xhr = new XMLHttpRequest();
                const resp = JSON.parse(request.response);
                var file_url = resp.downloadUrl;
                if (file_url) {
                    file_url = file_url.replace('content.google','www.google');
                    xhr.open('GET', file_url, true);
                    if (auth) {
                        const token = gapi.auth.getToken();
                        if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token.access_token);
                    }
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            const trace = buttons.total.addTrace(xhr.response, resp.title, callback);
                        } else if (xhr.readyState == 4 && xhr.status != 200) {
                            if (callback) callback();
                        }
                    }
                    xhr.send();
                }
            }
        }
        request.send();
    }
}
