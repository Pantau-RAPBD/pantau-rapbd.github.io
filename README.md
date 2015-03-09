# Pantau RAPBD


## Technologies

No server side technology is used, intended to be easily improved by anyone with JS + HTML skills.

  - HTML
  - AngularJS
  - FireBase

## Getting started

To run this, you just need to register on [firebase](http://www.firebase.com) to get your own development server. 
Then follow the instruction in the first section of [guide](https://www.firebase.com/docs/web/guide/login/facebook.html). And replace the following line in `index-controller.js` with your server URL:

    var ref = new Firebase("https://vivid-torch-9223.firebaseio.com/");

Finally, run any HTTP server e.g.:

    git clone git@github.com:Pantau-RAPBD/pantau-rapbd.github.io.git
    cd pantau-rapbd.github.io.git
    python -m http.server
    
    #access http://localhost:8000
