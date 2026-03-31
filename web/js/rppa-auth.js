// rppa-auth.js — better-auth client wrapper for RPPA
var RPPAAuth = (function () {
    // Auth server runs on data.prisms.digital, not the www host
    var authOrigin = /romanticperiodpoetry\.org/.test(window.location.href)
        ? "https://data.prisms.digital"
        : "";

    var cookieDefaults = { path: "/" };

    return {
        /**
         * Navigate the browser to the auth server to start the OAuth flow.
         * The auth server handles the OAuth dance and redirects back to www
         * with user info as query params.
         * @param {string} provider - "orcid", "google", or "facebook"
         */
        signIn: function (provider) {
            var redirect = encodeURIComponent(window.location.href);
            window.location.href = authOrigin + "/api/auth/rppa-login"
                + "?provider=" + provider
                + "&redirect=" + redirect;
        },

        /**
         * Sign out: clear legacy cookies.
         */
        signOut: function () {
            Cookies.remove("RPPA-login-user");
            Cookies.remove("RPPA-login-username");
            Cookies.remove("RPPA-login-provider");
            window.location.reload();
        },

        /**
         * Check URL for auth completion params (set by rppa-complete redirect).
         * If present, set legacy cookies and clean the URL.
         * @returns {{authenticated: boolean, user: string, username: string, provider: string}|null}
         */
        handleCallback: function () {
            var params = new URLSearchParams(window.location.search);
            var user = params.get("rppa_user");
            var username = params.get("rppa_username");
            var provider = params.get("rppa_provider");

            if (user && username && provider) {
                Cookies.set("RPPA-login-user", user, cookieDefaults);
                Cookies.set("RPPA-login-username", username, cookieDefaults);
                Cookies.set("RPPA-login-provider", provider,
                    Object.assign({ expires: 365 }, cookieDefaults));

                // Clean auth params from the URL
                params.delete("rppa_user");
                params.delete("rppa_username");
                params.delete("rppa_provider");
                var cleanUrl = window.location.pathname;
                var remaining = params.toString();
                if (remaining) cleanUrl += "?" + remaining;
                if (window.location.hash) cleanUrl += window.location.hash;
                window.history.replaceState(null, "", cleanUrl);

                return { authenticated: true, user: user, username: username, provider: provider };
            }
            return null;
        },
    };
})();
