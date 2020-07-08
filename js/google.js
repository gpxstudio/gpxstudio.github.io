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
            const mergeAll = this.buttons.merge.checked;
            const time = this.buttons.include_time.checked;
            const hr = this.buttons.include_hr.checked;
            const atemp = this.buttons.include_atemp.checked;
            const cad = this.buttons.include_cad.checked;

            this.buttons.export.popup.remove();

            const output = this.buttons.total.outputGPX(mergeAll, time, hr, atemp, cad);
            for (var i=0; i<output.length; i++)
                this.saveFile(output[i].name, output[i].text, data.docs[0].id);

            gtag('event', 'button', {'event_category' : 'save-drive'});
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
        xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&visibility="DEFAULT"');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.responseType = 'json';
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200 ) {
                const fileId = xhr.response.id;
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
                request.execute(function(resp) {
                    console.log(resp);
                });
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
