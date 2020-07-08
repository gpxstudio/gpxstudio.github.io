export default class Google {

    constructor(buttons) {
        this.developerKey = 'AIzaSyAs_cICESbZdkknavgbOk623ouO3RG23Bs';
        this.clientId = "666808960580-0vssfd67o4l2oeirhnapdv2ej575pks7.apps.googleusercontent.com";
        this.appId = "666808960580";
        this.scope = ['https://www.googleapis.com/auth/drive.file',
                      'https://www.googleapis.com/auth/drive.install'];
        this.pickerApiLoaded = false;
        this.buttons = buttons;

        const _this = this;

        gapi.load('client:auth', {
            callback: function () {
                gapi.client.init({
                    apiKey: _this.developerKey,
                    clientId: _this.clientId,
                    scope: 'https://www.googleapis.com/auth/drive.file'
                }).then(function () {
                    const queryString = window.location.search;
                    const urlParams = new URLSearchParams(queryString);
                    if (urlParams.has('state')) {
                        _this.buttons.map.stopLocate();
                        const params = JSON.parse(urlParams.get('state'));
                        if (params.action == 'open') {
                            for (var i=0; i<params.ids.length; i++)
                                _this.downloadFile({id:params.ids[i], name:'track.gpx'});
                            gtag('event', 'button', {'event_category' : 'open-drive'});
                        }
                    }
                });
            }
        });
    }

    loadPicker(folderMode) {
        this.folderMode = folderMode;
        if (!this.oauthToken)
            gapi.load('auth', {'callback': this.onAuthApiLoad.bind(this)});
        gapi.load('picker', {'callback': this.onPickerApiLoad.bind(this)});
    }

    onAuthApiLoad() {
        window.gapi.auth.authorize(
            {
                'client_id': this.clientId,
                'scope': this.scope,
                'immediate': false
            },
            this.handleAuthResult.bind(this)
        );
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
                var view = new google.picker.DocsView()
                    .setIncludeFolders(true)
                    .setMimeTypes('application/vnd.google-apps.folder')
                    .setSelectFolderEnabled(true);
                var picker = new google.picker.PickerBuilder()
                    .enableFeature(google.picker.Feature.NAV_HIDDEN)
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
                this.downloadFile(data.docs[i]);
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
            const output = buttons.total.outputGPX(mergeAll, time, hr, atemp, cad);
            for (var i=0; i<output.length; i++)
                this.saveFile(output[i].name, output[i].text, data.docs[0].id);

            gtag('event', 'button', {'event_category' : 'save-drive'});

            var url = 'https://gpxstudio.github.io/?state=%7B"ids":%5B"';
            for (var i=0; i<this.fileIds.length; i++) {
                url += this.fileIds[i];
                if (i<this.fileIds.length-1) url += '","';
            }
            url += '"%5D,"action":"open"%7D';

            var copyText = document.getElementById("share-url");
            copyText.style.display = 'block';
            copyText.value = url;
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            document.execCommand("copy");
            copyText.style.display = 'none';

            const popup = L.popup({
                className: "centered-popup custom-popup",
                closeButton: false,
                autoPan: false
            });
            popup.setLatLng(buttons.map.getCenter());
            popup.setContent(buttons.share_content);
            buttons.share_content.style.display = 'block';
            buttons.share_content.popup = popup;
            popup.openOn(buttons.map);
            buttons.disableMap();
            popup.addEventListener('remove', function (e) {
                buttons.share_content.style.display = 'none';
                buttons.enableMap();
            });
        }
    }

    saveFile(filename, filecontent, folderid) {
        var file = new Blob([filecontent], {type: 'text/xml'});
        var metadata = {
            'name': filename,
            'mimeType': 'text/xml',
            'parents': [folderid],
        };

        var accessToken = gapi.auth.getToken().access_token;
        var form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        const _this = this;
        var xhr = new XMLHttpRequest();
        xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', false);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200 ) {
                const fileId = JSON.parse(xhr.response).id;
                _this.fileIds.push(fileId);
                var request = gapi.client.request({
                    'path': '/drive/v3/files/' + fileId + '/permissions',
                    'method': 'POST',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + _this.oauthToken
                    },
                    'body':{
                        'role': 'reader',
                        'type': 'anyone'
                    }
                });
                request.execute();
            }
        }
        xhr.send(form);
    }

    downloadFile(file) {
        if (file.name.split('.').pop() != 'gpx') return;
        const buttons = this.buttons;
        gapi.client.request({
            'path': '/drive/v2/files/'+file.id,
            'method': 'GET',
            callback: function (resp) {
                var xhr = new XMLHttpRequest();
                var file_url = resp.downloadUrl;
                file_url = file_url.replace('content.google','www.google');
                xhr.open('GET', file_url, true );
                const token = gapi.auth.getToken();
                if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token.access_token);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200 ) {
                        buttons.total.addTrace(xhr.response, resp.title);
                    }
                }
                xhr.send();
            }
        });
    }
}
