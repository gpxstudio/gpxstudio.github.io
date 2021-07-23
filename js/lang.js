function getLanguage() {
    var lang = 'en';
    if (window.location.pathname.startsWith('/l/'))
        lang = window.location.pathname.substring(3,5);
    return lang;
}
