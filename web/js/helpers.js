// PRISMS.digital
// Helper functions

// get a substring starting at a specific position
function GetSubstringIndex(str, substring, n) {
    var times = 0, index = null;
    while (times < n && index !== -1) {
        index = str.indexOf(substring, index+1);
        times++;
    }
    return index;
}

// retrieve a JSON object from jsonObject by its "id"
function filterById(jsonObject, id) {
    return jsonObject.filter( function(jsonObject) { return ( jsonObject['id'] == id ); } )[0];
}

// function to safely address IDs containing dots etc.
function jq( myid ) {
    if ( myid ) {
        return "#" + myid.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" );
    } else return '';
}
function jqu( myid ) {
    if ( myid ) {
        return myid.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" );
    } else return '';
}

// truncate a string
function truncateString(str, num) {
    if ( str ) {
        if (str.length <= num) {
	      return str;
	    }
	    return str.slice(0, num) + '...';
    } else return '';
}

// serialize form data to object
function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};
    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });
    return indexed_array;
}

function secondsToTime(e){
    const h = Math.floor(e / 3600).toString().padStart(2,'0'),
          m = Math.floor(e % 3600 / 60).toString().padStart(2,'0'),
          s = Math.floor(e % 60).toString().padStart(2,'0');
    
    return h + ':' + m + ':' + s;
    //return `${h}:${m}:${s}`;
}

// make strings JSON-safe
String.prototype.escapeSpecialChars = function() {
    return this.replace(/\\n/g, "\\n")
               .replace(/\\'/g, "\\'")
               .replace(/\\"/g, '\\"')
               .replace(/\\&/g, "\\&")
               .replace(/\\r/g, "\\r")
               .replace(/\\t/g, "\\t")
               .replace(/\\b/g, "\\b")
               .replace(/\\f/g, "\\f");
};

function updateDOM() {
    var genericCloseBtnHtml = '<button type="button" class="btn-close" aria-hidden="true" style="float:right;"></button>';
    // initialize tooltips and popovers
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    tooltipTriggerList2 = _.difference( tooltipTriggerList, done_tooltipTriggerList );
    done_tooltipTriggerList = tooltipTriggerList;
    var tooltipList = [...tooltipTriggerList2].map(function (tooltipTriggerEl) {
        return new bootstrap.Popover(tooltipTriggerEl, {
            html: true,
            placement: 'auto',
            container: 'body',
            sanitize: false,
            trigger: 'hover click',
            customClass: 'authorial note',
            title: function() {
                //https://github.com/twbs/bootstrap/issues/38720
                return "Authorial note"+genericCloseBtnHtml
            },
            content: function(e) {
                //https://github.com/twbs/bootstrap/issues/38720
                if ( $(e).next(".footy").length ) {
                    return $(e).next().clone().removeClass("hidden");
                } else {
                    return $(e).parent().next().clone().removeClass("hidden");
                }
            }
        });
    });
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    popoverTriggerList2 = _.difference( popoverTriggerList, done_popoverTriggerList );
    done_popoverTriggerList = popoverTriggerList;
    var popoverList = [...popoverTriggerList2].map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl, {
            html: true,
            placement: 'auto',
            container: 'body',
            sanitize: false,
            trigger: 'click',
            customClass: 'editorial note',
            title: function() {
                //https://github.com/twbs/bootstrap/issues/38720
                return "Editorial note"+genericCloseBtnHtml
                //$(this).attr("data-type")[0].toUpperCase() +
                //$(this).attr("data-type").slice(1)+
            },
            content: function(e) {
                //https://github.com/twbs/bootstrap/issues/38720
                if ( $(e).next(".footy").length ) {
                    return $(e).next().clone().removeClass("hidden");
                } else {
                    return $(e).parent().next().clone().removeClass("hidden");
                }
            }
        });
    });
    $( ".resizable" ).resizable({
        containment: ".globaltext-container",
        handles: "n, e, s, w, se"
        /*
        minWidth:500,
        minHeight:800
        */
    });
    $( ".draggable" ).draggable({
        handle: $('.nav-pills,.card-header'),
        containment: ".globaltext-container", 
        scroll: false 
    });
}

function randomColor(alpha) {
    return (
        'rgba(' +
        [
            ~~(Math.random() * 255),
            ~~(255),
            ~~(Math.random() * 255),
            alpha || 1
        ] +
        ')'
    );
}

function load_poet_overview( id ) {
    return new Promise(function(resolve, reject) {
      $.ajax({
          url: "/data/persons/"+id+".json",
          type: "GET",
          dataType: "json",
          success: function(data) {
              resolve(data)
          },
          error: function(err) {
              reject(err)
          }
      });
    });
}
function load_work_overview( id ) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/data/works/"+id+".json",
            type: "GET",
            dataType: "json",
            success: function(data) {
                resolve(data)
            },
            error: function(err) {
                reject(err)
            }
        });
    });
}

$( document ).on( "click", ".sso-sign-in", function(e) {
    var sso_modal=`
    <!-- welcome modal -->
    <div id="myModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Please sign into RPPA</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <p><i class="fas fa-door-open" style="font-size:28px;margin-bottom:15px;"></i><br>

                    <!-- ORCiD SSO -->
                    <script src="/js/orcid-auth-widget-master/orcid-widget.js"></script>
                    <div id="orcidWidget" style="margin:0 auto;"
                    data-size='lg' data-env='production'
                    data-clientid='APP-LOLR4JW8AREHAJ1I' data-redirecturi='https://www.romanticperiodpoetry.org/login/'></div>

                    <!-- FB SSO -->
                    <script>
                    window.fbAsyncInit = function() {
                        FB.init({
                            appId      : '1289578978503896',
                            cookie     : true,
                            xfbml      : true,
                            version    : 'v15.0'
                        });
                        FB.AppEvents.logPageView();
                    //    FB.getLoginStatus(function(response) {   // Called after the JS SDK has been initialized.
                    //        statusChangeCallback(response);      // Returns the login status.
                    //    });
                    };
                    (function(d, s, id){
                    var js, fjs = d.getElementsByTagName(s)[0];
                    if (d.getElementById(id)) {return;}
                    js = d.createElement(s); js.id = id;
                    js.src = "https://connect.facebook.net/en_US/sdk.js";
                    fjs.parentNode.insertBefore(js, fjs);
                    }(document, 'script', 'facebook-jssdk'));
                    </script>
                    <div class="fb-login-button" data-size="large" data-button-type="continue_with" data-layout="default" 
                        data-auto-logout-link="false" data-onlogin="checkLoginState();" data-scope="public_profile" data-use-continue-as="false"></div>

                    <!-- Google SSO -->
                    <script src="https://accounts.google.com/gsi/client"></script> 
                    <div id="g_id_onload"
                        data-client_id="1056047910768-826v0a41c0trtntqnkh6slfprjp3t4fr.apps.googleusercontent.com"
                        data-context="signin"
                        data-ux_mode="popup"
                        data-callback="handleCredentialResponse"
                        data-login_uri="https://www.romanticperiodpoetry.org/login/"
                        data-auto_prompt="false">
                    </div>
                    <div class="g_id_signin" style="margin-top: 20px;
                    margin-left: 110px;"
                        data-type="standard"
                        data-shape="rectangular"
                        data-theme="outline"
                        data-text="continue_with"
                        data-size="large"
                        data-logo_alignment="left"
                        data-width="248">
                    </div>

                    <br/>
                </div>
            </div>
        </div>
    </div>`;

    // create DOM
    if ( $( "#myModal" ).length == 0 ) {
        $( "body" ).append( sso_modal );
    }
    var myModalGTEl = document.getElementById( "myModal" );
    var myModalGT = new bootstrap.Modal(myModalGTEl, {
        backdrop: 'static',
        keyboard: false
    }).show();
    Cookies.set('RPPA-login-redirect', document.location.pathname+document.location.hash );
    var provider = Cookies.get( 'RPPA-login-provider' );
    if ( provider != undefined ) {
        if ( provider == 'google' ) {
            $( "#orcidWidget" ).hide()
            $( ".fb-login-button" ).hide()
        } else if ( provider == 'fb' ) {
            $( "#orcidWidget" ).hide()
            $( ".g_id_signin" ).hide()
        } else if ( provider == 'orcid' ) {
            $( ".fb-login-button" ).hide()
            $( ".g_id_signin" ).hide()
        }
    }
});

// FB SSO
function statusChangeCallback(response) {    // Called with the results from FB.getLoginStatus().
    if (response.status === 'connected') {   // Logged into your webpage and Facebook.
        testAPI();
    } else {                           // Not logged into your webpage or we are unable to tell.
//        FB.login();
    }
}
function checkLoginState() {               // Called when a person is finished with the Login Button.
    FB.getLoginStatus(function(response) {   // See the onlogin handler
        statusChangeCallback(response);
    });
}
function testAPI() {                      // Testing Graph API after login.  See statusChangeCallback() for when this call is made.
    FB.api('/me', async function(response) {
        var q=namespaces+` 
        SELECT * WHERE {
            GRAPH ?g {
            ?s a foaf:Agent ;
                foaf:name ?o ;
                foaf:accountName """https://www.facebook.com/`+response.id+`""" .
            } BIND( foaf:name AS ?p )
        }`;
        var usergraph = await getJSONLD( q, "quads" );
        console.log( usergraph );
        if ( usergraph.hasOwnProperty( 'id' ) ) {
            user = usergraph.id;
            username = usergraph["foaf:name"];
        } else {
            // new user
            user = "rppa:user-"+uuidv4();
            username = response.name;
            if ( user == undefined || username == 'undefined') { return; }
            var update = namespaces+"insert data {\n";
            update += `GRAPH `+user+` { `+user+` a foaf:Agent ;\n`;
            update += `foaf:name """`+response.name+`""" ;\n`;
            update += `foaf:accountName """https://www.facebook.com/`+response.id+`""" ;\n`;
            update += `. }\n}`;
        //            var updel = namespaces+`\nWITH `+user+` DELETE { `+user+` ?p ?o } WHERE { `+user+` ?p ?o } `;
        //            await putTRIPLES( updel );
            await putTRIPLES( update );
        }
        if ( user == undefined || username == 'undefined') { return; }
        Cookies.set( 'RPPA-login-provider','fb', { expires: 365 } );
        Cookies.set('RPPA-login-user', user );
        Cookies.set('RPPA-login-username', username );
        if ( $( "#myModal" ).length ) {
            $( "#myModal" ).hide();
            $( ".modal-backdrop" ).remove();
            var goto = Cookies.get( 'RPPA-login-redirect' ) || '/'
            window.location = goto, true;
            $( ".sso-sign-in" ).remove();
            $( "#username" ).html( username );
            provider_img = Cookies.get( 'RPPA-login-provider' );
            if ( provider_img == 'orcid' ) {
                provider_img = ` <i class="fa-brands fa-orcid"></i>`
            } else if ( provider_img == 'fb' ) {
                provider_img = ` <i class="fa-brands fa-facebook"></i>`
            } else if ( provider_img == 'google' ) {
                provider_img = ` <i class="fa-brands fa-google"></i>`
            }
            $( "#provider" ).html( provider_img );
            $( "a[data-mode='edit']" ).attr( "aria-disabled", "false" );
            $( "a[data-mode='edit']" ).attr( "role", "button" );
            $( "a[data-mode='edit']" ).css( "opacity", "1" );
        }
    });
    return false;
}

// Google SSO
async function handleCredentialResponse(response) {
    // decodeJwtResponse() is a custom function defined by you
    // to decode the credential response.
    var response = await KJUR.jws.JWS.readSafeJSONString(b64utoutf8(response.credential.split(".")[1]));

    var q=namespaces+` 
        SELECT * WHERE {
            GRAPH ?g {
            ?s a foaf:Agent ;
                foaf:name ?o ;
                foaf:accountName """https://www.google.com/`+response.sub+`""" .
            } BIND( foaf:name AS ?p )
        }`;
    var usergraph = await getJSONLD( q, "quads" );
    console.log( usergraph );
    if ( usergraph.hasOwnProperty( 'id' ) ) {
        user = usergraph.id;
        username = usergraph["foaf:name"];
    } else {
        // new user
        user = "rppa:user-"+uuidv4();
        username = response.name;
        if ( user == undefined || username == 'undefined') { return; }
        var update = namespaces+"insert data {\n";
        update += `GRAPH `+user+` { `+user+` a foaf:Agent ;\n`;
        update += `foaf:name """`+response.name+`""" ;\n`;
        update += `foaf:accountName """https://www.google.com/`+response.sub+`""" ;\n`;
        update += `. }\n}`;
    //            var updel = namespaces+`\nWITH `+user+` DELETE { `+user+` ?p ?o } WHERE { `+user+` ?p ?o } `;
    //            await putTRIPLES( updel );
        await putTRIPLES( update );
    }
    if ( user == undefined || username == 'undefined') { return; }
    Cookies.set( 'RPPA-login-provider','google', { expires: 365 } );
    Cookies.set('RPPA-login-user', user );
    Cookies.set('RPPA-login-username', username );
    if ( $( "#myModal" ).length ) {
        $( "#myModal" ).hide();
        $( ".modal-backdrop" ).remove();
        var goto = Cookies.get( 'RPPA-login-redirect' ) || '/'
        window.location = goto, true;
        $( ".sso-sign-in" ).remove();
        $( "#username" ).html( username );
        provider_img = Cookies.get( 'RPPA-login-provider' );
        if ( provider_img == 'orcid' ) {
            provider_img = ` <i class="fa-brands fa-orcid"></i>`
        } else if ( provider_img == 'fb' ) {
            provider_img = ` <i class="fa-brands fa-facebook"></i>`
        } else if ( provider_img == 'google' ) {
            provider_img = ` <i class="fa-brands fa-google"></i>`
        }
        $( "#provider" ).html( provider_img );
        $( "a[data-mode='edit']" ).attr( "aria-disabled", "false" );
        $( "a[data-mode='edit']" ).attr( "role", "button" );
        $( "a[data-mode='edit']" ).css( "opacity", "1" );
    }
    return false;
}
