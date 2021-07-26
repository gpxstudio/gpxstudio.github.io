firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log(user);
    // check if premium account
    const userId = user.uid;
  } else {
    // display ads
  }
});

firebase.auth().languageCode = getLanguage();

// FirebaseUI config.
var uiConfig = {
    signInFlow: 'popup',
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.GithubAuthProvider.PROVIDER_ID
    ],
    tosUrl: window.location.pathname+'about.html#terms',
    privacyPolicyUrl: window.location.pathname+'about.html#privacy',
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            return false;
        }
    }
};

var ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.start('#firebaseui-auth-container', uiConfig);
