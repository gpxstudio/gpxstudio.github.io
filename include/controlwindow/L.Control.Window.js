L.Control.Window = L.Control.extend({

    includes: L.Evented.prototype || L.Mixin.Events,

    options: {
        element: 'map',
        className: 'control-window',
        visible: false,
        title: undefined,
        closeButton: true,
        content: undefined,
        prompt: undefined,
        maxWidth: 600,
        modal: false,
        position: 'center'
    },
    initialize: function (container, options) {
        var self = this;

        if (container.hasOwnProperty('options')) { container = container.getContainer(); }

        options.element = container;
        L.setOptions(this, options);

        var modality = 'nonmodal';

        if (this.options.modal){
            modality = 'modal'
        }

        // Create popup window container
        this._wrapper = L.DomUtil.create('div',modality+' leaflet-control-window-wrapper', L.DomUtil.get(this.options.element));

        this._container = L.DomUtil.create('div', 'leaflet-control leaflet-control-window '+this.options.className,this._wrapper);
        this._container.setAttribute('style','max-width:'+this.options.maxWidth+'px');

        this._containerTitleBar = L.DomUtil.create('div', 'titlebar',this._container);
        this.titleContent = L.DomUtil.create('h2', 'title',this._containerTitleBar);
        this._containerContent =  L.DomUtil.create('div', 'content' ,this._container);
        this._containerPromptButtons =  L.DomUtil.create('div', 'promptButtons' ,this._container);

        if (this.options.closeButton) {
            this._closeButton = L.DomUtil.create('a', 'close',this._containerTitleBar);
            this._closeButton.innerHTML = '&times;';
        }

        // Make sure we don't drag the map when we interact with the content
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .on(this._wrapper, 'contextmenu', stop)
            .on(this._wrapper, 'click', stop)
            .on(this._wrapper, 'mousedown', stop)
            .on(this._wrapper, 'touchstart', stop)
            .on(this._wrapper, 'dblclick', stop)
            .on(this._wrapper, 'mousewheel', stop)
            .on(this._wrapper, 'MozMousePixelScroll', stop)

        // Attach event to close button
        if (this.options.closeButton) {
            var close = this._closeButton;
            L.DomEvent.on(close, 'click', this.hide, this);
        }
        if (this.options.title){
            this.title(this.options.title);
        }
        if (this.options.content) {
            this.content(this.options.content);
        }
        if (typeof(this.options.prompt)=='object') {
            this.prompt(this.options.prompt);
        }
        if (this.options.visible){
            this.show();
        }

        //map.on('resize',function(){self.mapResized()});
    },
    disableBtn: function(){
			this._btnOK.disabled=true;
			this._btnOK.className='disabled';
	},
	enableBtn: function(){
			this._btnOK.disabled=false;
			this._btnOK.className='';
	},
    title: function(titleContent){
        if (titleContent==undefined){
            return this.options.title
        }

        this.options.title = titleContent;
        var title = titleContent || '';
        this.titleContent.innerHTML = title;
        return this;
    },
    remove: function () {

        L.DomUtil.get(this.options.element).removeChild(this._wrapper);

        // Unregister events to prevent memory leak
        var stop = L.DomEvent.stopPropagation;
        L.DomEvent
            .off(this._wrapper, 'contextmenu', stop)
            .off(this._wrapper, 'click', stop)
            .off(this._wrapper, 'mousedown', stop)
            .off(this._wrapper, 'touchstart', stop)
            .off(this._wrapper, 'dblclick', stop)
            .off(this._wrapper, 'mousewheel', stop)
            .off(this._wrapper, 'MozMousePixelScroll', stop);

       // map.off('resize',self.mapResized);

        if (this._closeButton && this._close) {
            var close = this._closeButton;
            L.DomEvent.off(close, 'click', this.close, this);
        }
        return this;
    },
    mapResized : function(){
      // this.show()
    },
    show: function (position) {

        if (position){
            this.options.position = position
        }

        L.DomUtil.addClass(this._wrapper, 'visible');


        this.setContentMaxHeight();
        var thisWidth = this._container.offsetWidth;
        var thisHeight = this._container.offsetHeight;
        var margin = 8;

        var el =  L.DomUtil.get(this.options.element);
        var rect = el.getBoundingClientRect();
        var width = rect.right -rect.left ||  Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var height = rect.bottom -rect.top ||  Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        var top = rect.top;
        var left = rect.left;
        var offset =0;

        // SET POSITION OF WINDOW
        if (this.options.position == 'topLeft'){
            this.showOn([left,top+offset])
            } else if (this.options.position == 'left') {
            this.showOn([left, top+height/2-thisHeight/2-margin+offset])
        } else if (this.options.position == 'bottomLeft') {
            this.showOn([left, top+height-thisHeight-margin*2-offset])
        } else if (this.options.position == 'top') {
            this.showOn([left+width/2-thisWidth/2-margin,top+offset])
        } else if (this.options.position == 'topRight') {
            this.showOn([left+width-thisWidth-margin*2,top+ offset])
        } else if (this.options.position == 'right') {
            this.showOn([left+width-thisWidth-margin*2, top+height/2-thisHeight/2-margin+offset])
        } else if (this.options.position == 'bottomRight') {
            this.showOn([left+width-thisWidth-margin*2,top+ height-thisHeight-margin*2-offset])
        } else if (this.options.position == 'bottom') {
            this.showOn([left+width/2-thisWidth/2-margin,top+ height-thisHeight-margin*2-offset])
        } else {
            this.showOn([left+width/2-thisWidth/2-margin, top+top+height/2-thisHeight/2-margin+offset])
        }

        return this;
    },
    showOn: function(point){

        this.setContentMaxHeight();
        L.DomUtil.setPosition(this._container, L.point(Math.round(point[0]),Math.round(point[1]),true));

        var draggable = new L.Draggable(this._container,this._containerTitleBar);
        draggable.enable();

        L.DomUtil.addClass(this._wrapper, 'visible');
        this.fire('show');
        return this;
    },
    hide: function (e) {

        L.DomUtil.removeClass(this._wrapper, 'visible');
        this.fire('hide');
        return this;
    },

    getContainer: function () {
        return this._containerContent;
    },
    content: function (content) {
        if (content==undefined){
            return this.options.content
        }
        this.options.content = content;
        this.getContainer().innerHTML = content;
        return this;
    },
    prompt : function(promptObject){

        if (promptObject==undefined){
            return this.options.prompt
        }

        this.options.prompt = promptObject;

        this.setPromptCallback(promptObject.callback);
        
        this.setActionCallback(promptObject.action);

        var cancel = this.options.prompt.buttonCancel || undefined;

        var ok = this.options.prompt.buttonOK || 'OK';

        var action = this.options.prompt.buttonAction || undefined;

        if (action != undefined) {
            var btnAction = L.DomUtil.create('button','',this._containerPromptButtons);
            L.DomEvent.on(btnAction, 'click',this.action, this);
            btnAction.innerHTML=action;
        }

        var btnOK= L.DomUtil.create('button','',this._containerPromptButtons);
        L.DomEvent.on(btnOK, 'click',this.promptCallback, this);
        btnOK.innerHTML=ok;
        
        this._btnOK=btnOK;
        
        if (cancel != undefined) {
	        var btnCancel= L.DomUtil.create('button','',this._containerPromptButtons);
	        L.DomEvent.on(btnCancel, 'click', this.close, this);
	        btnCancel.innerHTML=cancel
        }

        return this;
    },
    container : function(containerContent){
        if (containerContent==undefined){
            return this._container.innerHTML
        }

        this._container.innerHTML = containerContent;

        if (this.options.closeButton) {
            this._closeButton = L.DomUtil.create('a', 'close',this._container);
            this._closeButton.innerHTML = '&times;';
            L.DomEvent.on(this._closeButton, 'click', this.close, this);
        }
        return this;

    },
    setPromptCallback : function(callback){
        var self = this;
        if (typeof(callback)!= 'function') { callback = function() {console.warn('No callback function specified!');}}
        var cb = function() { self.close();callback();};
        this.promptCallback = cb;
        return this;
    },
    setActionCallback : function(callback){
        var self = this;
        if (typeof(callback)!= 'function') { callback = function() {console.warn('No callback function specified!');}}
        var cb = function() { self.hide();callback();};
        this.action = cb;
        return this;
    },

    setContentMaxHeight : function(){
        var margin = 68;

        if (this.options.title){
            margin += this._containerTitleBar.offsetHeight-36;
        }
        if (typeof(this.options.prompt) == 'object'){
            margin += this._containerPromptButtons.offsetHeight-20
        }

        var el =  L.DomUtil.get(this.options.element)
        var rect = el.getBoundingClientRect();
        var height = rect.bottom -rect.top;

        var maxHeight = height - margin;
        this._containerContent.setAttribute('style','max-height:'+maxHeight+'px')
    },
    close : function(){
        this.hide();
        this.remove();
        this.fire('close');
        return undefined;
    }
});

L.control.window = function (container,options) {
    return new L.Control.Window(container,options);
};
