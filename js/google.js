export default class Google {

    constructor(buttons) {
        this.developerKey = 'AIzaSyAs_cICESbZdkknavgbOk623ouO3RG23Bs';
        this.clientId = "666808960580-0vssfd67o4l2oeirhnapdv2ej575pks7.apps.googleusercontent.com";
        this.appId = "666808960580";
        this.scope = ['https://www.googleapis.com/auth/drive.file'];
        this.pickerApiLoaded = false;
        this.buttons = buttons;
    }

    loadPicker() {
        if (!this.oauthToken)
            gapi.load('client:auth', {'callback': this.onAuthApiLoad.bind(this)});
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
            var view = new google.picker.View(google.picker.ViewId.DOCS).setQuery("*.gpx");
            var picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(this.appId)
            .setOAuthToken(this.oauthToken)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setDeveloperKey(this.developerKey)
            .setCallback(this.pickerCallback.bind(this))
            .build();
            picker.setVisible(true);
        }
    }

    pickerCallback(data) {
        if (data.action == google.picker.Action.PICKED) {
            for (var i=0; i<data.docs.length; i++)
                this.downloadFile(data.docs[i]);
        }
    }

    downloadFile(file) {
        if (file.name.split('.').pop() != 'gpx') return;
        const buttons = this.buttons;
        gapi.client.request({
            'path': '/drive/v2/files/'+file.id,
            'method': 'GET',
            callback: function (resp) {
                var token = gapi.auth.getToken().access_token;
                var xhr = new XMLHttpRequest();
                var file_url = resp.downloadUrl;
                file_url = file_url.replace('content.google','www.google');
                xhr.open('GET', file_url, true );
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                xhr.onreadystatechange = function( theProgressEvent ) {
                    if (xhr.readyState == 4 && xhr.status == 200 ) {
                        buttons.total.addTrace(xhr.response, file.name);
                    }
                }
                xhr.send();
            }
        });
    }
}
