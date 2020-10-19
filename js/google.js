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
        if (urlParams.has('state')) _this.buttons.map.stopLocate();

        gapi.load('client:auth', {
            callback: function () {
                gapi.client.init({
                    apiKey: _this.developerKey,
                    clientId: _this.clientId,
                    scope: _this.scope2
                }).then(function () {
                    if (urlParams.has('state')) {
                        const params = JSON.parse(urlParams.get('state'));
                        gtag('event', 'button', {'event_category' : 'open-drive'});
                        if (params.hasOwnProperty('userId')) {
                            var oauth = gapi.auth2.getAuthInstance();
                            var user = oauth.currentUser.get();
                            var isAuthorized = user.hasGrantedScopes(_this.scope2);
                            if (!isAuthorized || params['userId'] != user.getId()) {
                                oauth.signIn({
                                    scope: _this.scope2
                                }).then(_this.downloadFiles.bind(_this));
                            } else _this.downloadFiles();
                        }
                    }
                });
            }
        });
    }

    downloadFiles() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const params = JSON.parse(urlParams.get('state'));
        for (var i=0; i<params.ids.length; i++)
            this.downloadFile({id:params.ids[i], name:'track.gpx'}, params.hasOwnProperty('userId'));
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

            buttons.export.popup.remove();

            this.fileIds = [];
            this.checkAllFilesInFolder(data.docs[0].id, buttons.total.outputGPX(mergeAll, time, hr, atemp, cad));

            gtag('event', 'button', {'event_category' : 'save-drive'});

            const popup = L.popup({
                className: "centered-popup custom-popup",
                closeButton: false,
                autoPan: false,
                closeOnEscapeKey: false,
                closeOnClick: false,
                autoClose: false
            });
            popup.setLatLng(buttons.map.getCenter());
            popup.setContent('Uploading...');
            popup.openOn(buttons.map);
            this.popup = popup;
        }
    }

    checkAllFilesInFolder(folderId, output) {
        const _this = this;
        gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': {'q': "'" + folderId + "' in parents and trashed=false"},
            callback: function (resp) {
                for (var i=0; i<output.length; i++) {
                    var replace = false;
                    for (var j=0; j<resp.items.length; j++) {
                        if (resp.items[j].title == output[i].name) {
                            _this.saveFile(output[i].name, output[i].text, folderId, output.length, resp.items[j].id);
                            replace = true;
                            break;
                        }
                    }
                    if (!replace) _this.saveFile(output[i].name, output[i].text,  folderId, output.length);
                }
            }
        });
    }

    saveFile(filename, filecontent, folderid, number, fileId) {
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
                _this.fileIds.push(ans.id);
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

                if (_this.fileIds.length == number) {
                    var url = 'https://gpxstudio.github.io/?state=%7B%22ids%22:%5B%22';
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

                    _this.popup.remove();
                    _this.popup = L.popup({
                        className: "centered-popup custom-popup",
                        closeButton: false,
                        autoPan: false
                    });
                    _this.buttons.share_content.style.display = 'block';
                    _this.popup.setContent(_this.buttons.share_content);
                    _this.popup.setLatLng(_this.buttons.map.getCenter());
                    _this.buttons.share_content.popup = _this.popup;
                    _this.buttons.disableMap();
                    _this.popup.addEventListener('remove', function (e) {
                        _this.buttons.share_content.style.display = 'none';
                        _this.buttons.enableMap();
                    });
                    _this.popup.openOn(_this.buttons.map);
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

    downloadFile(file, auth) {
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
                            buttons.total.addTrace(xhr.response, resp.title);
                        }
                    }
                    xhr.send();
                }
            }
        }
        request.send();
    }
}
