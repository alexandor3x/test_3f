webpackJsonp([35783957827783],{

/***/ 127:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', { value: true });
	
	var util = __webpack_require__(128);
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var contains = function (obj, key) {
	    return Object.prototype.hasOwnProperty.call(obj, key);
	};
	var DEFAULT_ENTRY_NAME = '[DEFAULT]';
	// An array to capture listeners before the true auth functions
	// exist
	var tokenListeners = [];
	/**
	 * Global context object for a collection of services using
	 * a shared authentication state.
	 */
	var FirebaseAppImpl = /** @class */ (function () {
	    function FirebaseAppImpl(options, config, firebase_) {
	        this.firebase_ = firebase_;
	        this.isDeleted_ = false;
	        this.services_ = {};
	        this.name_ = config.name;
	        this._automaticDataCollectionEnabled =
	            config.automaticDataCollectionEnabled || false;
	        this.options_ = util.deepCopy(options);
	        this.INTERNAL = {
	            getUid: function () { return null; },
	            getToken: function () { return Promise.resolve(null); },
	            addAuthTokenListener: function (callback) {
	                tokenListeners.push(callback);
	                // Make sure callback is called, asynchronously, in the absence of the auth module
	                setTimeout(function () { return callback(null); }, 0);
	            },
	            removeAuthTokenListener: function (callback) {
	                tokenListeners = tokenListeners.filter(function (listener) { return listener !== callback; });
	            }
	        };
	    }
	    Object.defineProperty(FirebaseAppImpl.prototype, "automaticDataCollectionEnabled", {
	        get: function () {
	            this.checkDestroyed_();
	            return this._automaticDataCollectionEnabled;
	        },
	        set: function (val) {
	            this.checkDestroyed_();
	            this._automaticDataCollectionEnabled = val;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(FirebaseAppImpl.prototype, "name", {
	        get: function () {
	            this.checkDestroyed_();
	            return this.name_;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(FirebaseAppImpl.prototype, "options", {
	        get: function () {
	            this.checkDestroyed_();
	            return this.options_;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    FirebaseAppImpl.prototype.delete = function () {
	        var _this = this;
	        return new Promise(function (resolve) {
	            _this.checkDestroyed_();
	            resolve();
	        })
	            .then(function () {
	            _this.firebase_.INTERNAL.removeApp(_this.name_);
	            var services = [];
	            Object.keys(_this.services_).forEach(function (serviceKey) {
	                Object.keys(_this.services_[serviceKey]).forEach(function (instanceKey) {
	                    services.push(_this.services_[serviceKey][instanceKey]);
	                });
	            });
	            return Promise.all(services.map(function (service) {
	                return service.INTERNAL.delete();
	            }));
	        })
	            .then(function () {
	            _this.isDeleted_ = true;
	            _this.services_ = {};
	        });
	    };
	    /**
	     * Return a service instance associated with this app (creating it
	     * on demand), identified by the passed instanceIdentifier.
	     *
	     * NOTE: Currently storage is the only one that is leveraging this
	     * functionality. They invoke it by calling:
	     *
	     * ```javascript
	     * firebase.app().storage('STORAGE BUCKET ID')
	     * ```
	     *
	     * The service name is passed to this already
	     * @internal
	     */
	    FirebaseAppImpl.prototype._getService = function (name, instanceIdentifier) {
	        if (instanceIdentifier === void 0) { instanceIdentifier = DEFAULT_ENTRY_NAME; }
	        this.checkDestroyed_();
	        if (!this.services_[name]) {
	            this.services_[name] = {};
	        }
	        if (!this.services_[name][instanceIdentifier]) {
	            /**
	             * If a custom instance has been defined (i.e. not '[DEFAULT]')
	             * then we will pass that instance on, otherwise we pass `null`
	             */
	            var instanceSpecifier = instanceIdentifier !== DEFAULT_ENTRY_NAME
	                ? instanceIdentifier
	                : undefined;
	            var service = this.firebase_.INTERNAL.factories[name](this, this.extendApp.bind(this), instanceSpecifier);
	            this.services_[name][instanceIdentifier] = service;
	        }
	        return this.services_[name][instanceIdentifier];
	    };
	    /**
	     * Callback function used to extend an App instance at the time
	     * of service instance creation.
	     */
	    FirebaseAppImpl.prototype.extendApp = function (props) {
	        var _this = this;
	        // Copy the object onto the FirebaseAppImpl prototype
	        util.deepExtend(this, props);
	        /**
	         * If the app has overwritten the addAuthTokenListener stub, forward
	         * the active token listeners on to the true fxn.
	         *
	         * TODO: This function is required due to our current module
	         * structure. Once we are able to rely strictly upon a single module
	         * implementation, this code should be refactored and Auth should
	         * provide these stubs and the upgrade logic
	         */
	        if (props.INTERNAL && props.INTERNAL.addAuthTokenListener) {
	            tokenListeners.forEach(function (listener) {
	                _this.INTERNAL.addAuthTokenListener(listener);
	            });
	            tokenListeners = [];
	        }
	    };
	    /**
	     * This function will throw an Error if the App has already been deleted -
	     * use before performing API actions on the App.
	     */
	    FirebaseAppImpl.prototype.checkDestroyed_ = function () {
	        if (this.isDeleted_) {
	            error('app-deleted', { name: this.name_ });
	        }
	    };
	    return FirebaseAppImpl;
	}());
	// Prevent dead-code elimination of these methods w/o invalid property
	// copying.
	(FirebaseAppImpl.prototype.name && FirebaseAppImpl.prototype.options) ||
	    FirebaseAppImpl.prototype.delete ||
	    console.log('dc');
	/**
	 * Return a firebase namespace object.
	 *
	 * In production, this will be called exactly once and the result
	 * assigned to the 'firebase' global.  It may be called multiple times
	 * in unit tests.
	 */
	function createFirebaseNamespace() {
	    var apps_ = {};
	    var factories = {};
	    var appHooks = {};
	    // A namespace is a plain JavaScript Object.
	    var namespace = {
	        // Hack to prevent Babel from modifying the object returned
	        // as the firebase namespace.
	        __esModule: true,
	        initializeApp: initializeApp,
	        app: app,
	        apps: null,
	        Promise: Promise,
	        SDK_VERSION: '5.0.4',
	        INTERNAL: {
	            registerService: registerService,
	            createFirebaseNamespace: createFirebaseNamespace,
	            extendNamespace: extendNamespace,
	            createSubscribe: util.createSubscribe,
	            ErrorFactory: util.ErrorFactory,
	            removeApp: removeApp,
	            factories: factories,
	            useAsService: useAsService,
	            Promise: Promise,
	            deepExtend: util.deepExtend
	        }
	    };
	    // Inject a circular default export to allow Babel users who were previously
	    // using:
	    //
	    //   import firebase from 'firebase';
	    //   which becomes: var firebase = require('firebase').default;
	    //
	    // instead of
	    //
	    //   import * as firebase from 'firebase';
	    //   which becomes: var firebase = require('firebase');
	    util.patchProperty(namespace, 'default', namespace);
	    // firebase.apps is a read-only getter.
	    Object.defineProperty(namespace, 'apps', {
	        get: getApps
	    });
	    /**
	     * Called by App.delete() - but before any services associated with the App
	     * are deleted.
	     */
	    function removeApp(name) {
	        var app = apps_[name];
	        callAppHooks(app, 'delete');
	        delete apps_[name];
	    }
	    /**
	     * Get the App object for a given name (or DEFAULT).
	     */
	    function app(name) {
	        name = name || DEFAULT_ENTRY_NAME;
	        if (!contains(apps_, name)) {
	            error('no-app', { name: name });
	        }
	        return apps_[name];
	    }
	    util.patchProperty(app, 'App', FirebaseAppImpl);
	    function initializeApp(options, rawConfig) {
	        if (rawConfig === void 0) { rawConfig = {}; }
	        if (typeof rawConfig !== 'object' || rawConfig === null) {
	            var name_1 = rawConfig;
	            rawConfig = { name: name_1 };
	        }
	        var config = rawConfig;
	        if (config.name === undefined) {
	            config.name = DEFAULT_ENTRY_NAME;
	        }
	        var name = config.name;
	        if (typeof name !== 'string' || !name) {
	            error('bad-app-name', { name: name + '' });
	        }
	        if (contains(apps_, name)) {
	            error('duplicate-app', { name: name });
	        }
	        var app = new FirebaseAppImpl(options, config, namespace);
	        apps_[name] = app;
	        callAppHooks(app, 'create');
	        return app;
	    }
	    /*
	     * Return an array of all the non-deleted FirebaseApps.
	     */
	    function getApps() {
	        // Make a copy so caller cannot mutate the apps list.
	        return Object.keys(apps_).map(function (name) { return apps_[name]; });
	    }
	    /*
	     * Register a Firebase Service.
	     *
	     * firebase.INTERNAL.registerService()
	     *
	     * TODO: Implement serviceProperties.
	     */
	    function registerService(name, createService, serviceProperties, appHook, allowMultipleInstances) {
	        // Cannot re-register a service that already exists
	        if (factories[name]) {
	            error('duplicate-service', { name: name });
	        }
	        // Capture the service factory for later service instantiation
	        factories[name] = createService;
	        // Capture the appHook, if passed
	        if (appHook) {
	            appHooks[name] = appHook;
	            // Run the **new** app hook on all existing apps
	            getApps().forEach(function (app) {
	                appHook('create', app);
	            });
	        }
	        // The Service namespace is an accessor function ...
	        var serviceNamespace = function (appArg) {
	            if (appArg === void 0) { appArg = app(); }
	            if (typeof appArg[name] !== 'function') {
	                // Invalid argument.
	                // This happens in the following case: firebase.storage('gs:/')
	                error('invalid-app-argument', { name: name });
	            }
	            // Forward service instance lookup to the FirebaseApp.
	            return appArg[name]();
	        };
	        // ... and a container for service-level properties.
	        if (serviceProperties !== undefined) {
	            util.deepExtend(serviceNamespace, serviceProperties);
	        }
	        // Monkey-patch the serviceNamespace onto the firebase namespace
	        namespace[name] = serviceNamespace;
	        // Patch the FirebaseAppImpl prototype
	        FirebaseAppImpl.prototype[name] = function () {
	            var args = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                args[_i] = arguments[_i];
	            }
	            var serviceFxn = this._getService.bind(this, name);
	            return serviceFxn.apply(this, allowMultipleInstances ? args : []);
	        };
	        return serviceNamespace;
	    }
	    /**
	     * Patch the top-level firebase namespace with additional properties.
	     *
	     * firebase.INTERNAL.extendNamespace()
	     */
	    function extendNamespace(props) {
	        util.deepExtend(namespace, props);
	    }
	    function callAppHooks(app, eventName) {
	        Object.keys(factories).forEach(function (serviceName) {
	            // Ignore virtual services
	            var factoryName = useAsService(app, serviceName);
	            if (factoryName === null) {
	                return;
	            }
	            if (appHooks[factoryName]) {
	                appHooks[factoryName](eventName, app);
	            }
	        });
	    }
	    // Map the requested service to a registered service name
	    // (used to map auth to serverAuth service when needed).
	    function useAsService(app, name) {
	        if (name === 'serverAuth') {
	            return null;
	        }
	        var useService = name;
	        var options = app.options;
	        return useService;
	    }
	    return namespace;
	}
	function error(code, args) {
	    throw appErrors.create(code, args);
	}
	// TypeScript does not support non-string indexes!
	// let errors: {[code: AppError: string} = {
	var errors = {
	    'no-app': "No Firebase App '{$name}' has been created - " +
	        'call Firebase App.initializeApp()',
	    'bad-app-name': "Illegal App name: '{$name}",
	    'duplicate-app': "Firebase App named '{$name}' already exists",
	    'app-deleted': "Firebase App named '{$name}' already deleted",
	    'duplicate-service': "Firebase service named '{$name}' already registered",
	    'sa-not-supported': 'Initializing the Firebase SDK with a service ' +
	        'account is only allowed in a Node.js environment. On client ' +
	        'devices, you should instead initialize the SDK with an api key and ' +
	        'auth domain',
	    'invalid-app-argument': 'firebase.{$name}() takes either no argument or a ' +
	        'Firebase App instance.'
	};
	var appErrors = new util.ErrorFactory('app', 'Firebase', errors);
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var firebase = createFirebaseNamespace();
	
	exports.firebase = firebase;
	exports.default = firebase;


/***/ }),

/***/ 204:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', { value: true });
	
	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }
	
	var util = __webpack_require__(128);
	var tslib_1 = __webpack_require__(202);
	var firebase = _interopDefault(__webpack_require__(127));
	
	/**
	 * Copyright 2018 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var ERROR_CODES = {
	    AVAILABLE_IN_WINDOW: 'only-available-in-window',
	    AVAILABLE_IN_SW: 'only-available-in-sw',
	    SHOULD_BE_INHERITED: 'should-be-overriden',
	    BAD_SENDER_ID: 'bad-sender-id',
	    INCORRECT_GCM_SENDER_ID: 'incorrect-gcm-sender-id',
	    PERMISSION_DEFAULT: 'permission-default',
	    PERMISSION_BLOCKED: 'permission-blocked',
	    UNSUPPORTED_BROWSER: 'unsupported-browser',
	    NOTIFICATIONS_BLOCKED: 'notifications-blocked',
	    FAILED_DEFAULT_REGISTRATION: 'failed-serviceworker-registration',
	    SW_REGISTRATION_EXPECTED: 'sw-registration-expected',
	    GET_SUBSCRIPTION_FAILED: 'get-subscription-failed',
	    INVALID_SAVED_TOKEN: 'invalid-saved-token',
	    SW_REG_REDUNDANT: 'sw-reg-redundant',
	    TOKEN_SUBSCRIBE_FAILED: 'token-subscribe-failed',
	    TOKEN_SUBSCRIBE_NO_TOKEN: 'token-subscribe-no-token',
	    TOKEN_SUBSCRIBE_NO_PUSH_SET: 'token-subscribe-no-push-set',
	    TOKEN_UNSUBSCRIBE_FAILED: 'token-unsubscribe-failed',
	    TOKEN_UPDATE_FAILED: 'token-update-failed',
	    TOKEN_UPDATE_NO_TOKEN: 'token-update-no-token',
	    USE_SW_BEFORE_GET_TOKEN: 'use-sw-before-get-token',
	    INVALID_DELETE_TOKEN: 'invalid-delete-token',
	    DELETE_TOKEN_NOT_FOUND: 'delete-token-not-found',
	    DELETE_SCOPE_NOT_FOUND: 'delete-scope-not-found',
	    BG_HANDLER_FUNCTION_EXPECTED: 'bg-handler-function-expected',
	    NO_WINDOW_CLIENT_TO_MSG: 'no-window-client-to-msg',
	    UNABLE_TO_RESUBSCRIBE: 'unable-to-resubscribe',
	    NO_FCM_TOKEN_FOR_RESUBSCRIBE: 'no-fcm-token-for-resubscribe',
	    FAILED_TO_DELETE_TOKEN: 'failed-to-delete-token',
	    NO_SW_IN_REG: 'no-sw-in-reg',
	    BAD_SCOPE: 'bad-scope',
	    BAD_VAPID_KEY: 'bad-vapid-key',
	    BAD_SUBSCRIPTION: 'bad-subscription',
	    BAD_TOKEN: 'bad-token',
	    BAD_PUSH_SET: 'bad-push-set',
	    FAILED_DELETE_VAPID_KEY: 'failed-delete-vapid-key',
	    INVALID_PUBLIC_VAPID_KEY: 'invalid-public-vapid-key',
	    USE_PUBLIC_KEY_BEFORE_GET_TOKEN: 'use-public-key-before-get-token',
	    PUBLIC_KEY_DECRYPTION_FAILED: 'public-vapid-key-decryption-failed'
	};
	var ERROR_MAP = (_a = {}, _a[ERROR_CODES.AVAILABLE_IN_WINDOW] = 'This method is available in a Window context.', _a[ERROR_CODES.AVAILABLE_IN_SW] = 'This method is available in a service worker ' + 'context.', _a[ERROR_CODES.SHOULD_BE_INHERITED] = 'This method should be overriden by ' + 'extended classes.', _a[ERROR_CODES.BAD_SENDER_ID] = "Please ensure that 'messagingSenderId' is set " +
	        'correctly in the options passed into firebase.initializeApp().', _a[ERROR_CODES.PERMISSION_DEFAULT] = 'The required permissions were not granted and ' + 'dismissed instead.', _a[ERROR_CODES.PERMISSION_BLOCKED] = 'The required permissions were not granted and ' + 'blocked instead.', _a[ERROR_CODES.UNSUPPORTED_BROWSER] = "This browser doesn't support the API's " +
	        'required to use the firebase SDK.', _a[ERROR_CODES.NOTIFICATIONS_BLOCKED] = 'Notifications have been blocked.', _a[ERROR_CODES.FAILED_DEFAULT_REGISTRATION] = 'We are unable to register the ' +
	        'default service worker. {$browserErrorMessage}', _a[ERROR_CODES.SW_REGISTRATION_EXPECTED] = 'A service worker registration was the ' + 'expected input.', _a[ERROR_CODES.GET_SUBSCRIPTION_FAILED] = 'There was an error when trying to get ' +
	        'any existing Push Subscriptions.', _a[ERROR_CODES.INVALID_SAVED_TOKEN] = 'Unable to access details of the saved token.', _a[ERROR_CODES.SW_REG_REDUNDANT] = 'The service worker being used for push was made ' + 'redundant.', _a[ERROR_CODES.TOKEN_SUBSCRIBE_FAILED] = 'A problem occured while subscribing the ' + 'user to FCM: {$message}', _a[ERROR_CODES.TOKEN_SUBSCRIBE_NO_TOKEN] = 'FCM returned no token when subscribing ' + 'the user to push.', _a[ERROR_CODES.TOKEN_SUBSCRIBE_NO_PUSH_SET] = 'FCM returned an invalid response ' + 'when getting an FCM token.', _a[ERROR_CODES.TOKEN_UNSUBSCRIBE_FAILED] = 'A problem occured while unsubscribing the ' + 'user from FCM: {$message}', _a[ERROR_CODES.TOKEN_UPDATE_FAILED] = 'A problem occured while updating the ' + 'user from FCM: {$message}', _a[ERROR_CODES.TOKEN_UPDATE_NO_TOKEN] = 'FCM returned no token when updating ' + 'the user to push.', _a[ERROR_CODES.USE_SW_BEFORE_GET_TOKEN] = 'The useServiceWorker() method may only be called once and must be ' +
	        'called before calling getToken() to ensure your service worker is used.', _a[ERROR_CODES.INVALID_DELETE_TOKEN] = 'You must pass a valid token into ' +
	        'deleteToken(), i.e. the token from getToken().', _a[ERROR_CODES.DELETE_TOKEN_NOT_FOUND] = 'The deletion attempt for token could not ' +
	        'be performed as the token was not found.', _a[ERROR_CODES.DELETE_SCOPE_NOT_FOUND] = 'The deletion attempt for service worker ' +
	        'scope could not be performed as the scope was not found.', _a[ERROR_CODES.BG_HANDLER_FUNCTION_EXPECTED] = 'The input to ' + 'setBackgroundMessageHandler() must be a function.', _a[ERROR_CODES.NO_WINDOW_CLIENT_TO_MSG] = 'An attempt was made to message a ' + 'non-existant window client.', _a[ERROR_CODES.UNABLE_TO_RESUBSCRIBE] = 'There was an error while re-subscribing ' +
	        'the FCM token for push messaging. Will have to resubscribe the ' +
	        'user on next visit. {$message}', _a[ERROR_CODES.NO_FCM_TOKEN_FOR_RESUBSCRIBE] = 'Could not find an FCM token ' +
	        'and as a result, unable to resubscribe. Will have to resubscribe the ' +
	        'user on next visit.', _a[ERROR_CODES.FAILED_TO_DELETE_TOKEN] = 'Unable to delete the currently saved token.', _a[ERROR_CODES.NO_SW_IN_REG] = 'Even though the service worker registration was ' +
	        'successful, there was a problem accessing the service worker itself.', _a[ERROR_CODES.INCORRECT_GCM_SENDER_ID] = "Please change your web app manifest's " +
	        "'gcm_sender_id' value to '103953800507' to use Firebase messaging.", _a[ERROR_CODES.BAD_SCOPE] = 'The service worker scope must be a string with at ' +
	        'least one character.', _a[ERROR_CODES.BAD_VAPID_KEY] = 'The public VAPID key is not a Uint8Array with 65 bytes.', _a[ERROR_CODES.BAD_SUBSCRIPTION] = 'The subscription must be a valid ' + 'PushSubscription.', _a[ERROR_CODES.BAD_TOKEN] = 'The FCM Token used for storage / lookup was not ' +
	        'a valid token string.', _a[ERROR_CODES.BAD_PUSH_SET] = 'The FCM push set used for storage / lookup was not ' +
	        'not a valid push set string.', _a[ERROR_CODES.FAILED_DELETE_VAPID_KEY] = 'The VAPID key could not be deleted.', _a[ERROR_CODES.INVALID_PUBLIC_VAPID_KEY] = 'The public VAPID key must be a string.', _a[ERROR_CODES.PUBLIC_KEY_DECRYPTION_FAILED] = 'The public VAPID key did not equal ' + '65 bytes when decrypted.', _a);
	var errorFactory = new util.ErrorFactory('messaging', 'Messaging', ERROR_MAP);
	var _a;
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var DEFAULT_PUBLIC_VAPID_KEY = new Uint8Array([
	    0x04,
	    0x33,
	    0x94,
	    0xf7,
	    0xdf,
	    0xa1,
	    0xeb,
	    0xb1,
	    0xdc,
	    0x03,
	    0xa2,
	    0x5e,
	    0x15,
	    0x71,
	    0xdb,
	    0x48,
	    0xd3,
	    0x2e,
	    0xed,
	    0xed,
	    0xb2,
	    0x34,
	    0xdb,
	    0xb7,
	    0x47,
	    0x3a,
	    0x0c,
	    0x8f,
	    0xc4,
	    0xcc,
	    0xe1,
	    0x6f,
	    0x3c,
	    0x8c,
	    0x84,
	    0xdf,
	    0xab,
	    0xb6,
	    0x66,
	    0x3e,
	    0xf2,
	    0x0c,
	    0xd4,
	    0x8b,
	    0xfe,
	    0xe3,
	    0xf9,
	    0x76,
	    0x2f,
	    0x14,
	    0x1c,
	    0x63,
	    0x08,
	    0x6a,
	    0x6f,
	    0x2d,
	    0xb1,
	    0x1a,
	    0x95,
	    0xb0,
	    0xce,
	    0x37,
	    0xc0,
	    0x9c,
	    0x6e
	]);
	var ENDPOINT = 'https://fcm.googleapis.com';
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var MessageParameter;
	(function (MessageParameter) {
	    MessageParameter["TYPE_OF_MSG"] = "firebase-messaging-msg-type";
	    MessageParameter["DATA"] = "firebase-messaging-msg-data";
	})(MessageParameter || (MessageParameter = {}));
	var MessageType;
	(function (MessageType) {
	    MessageType["PUSH_MSG_RECEIVED"] = "push-msg-received";
	    MessageType["NOTIFICATION_CLICKED"] = "notification-clicked";
	})(MessageType || (MessageType = {}));
	
	/**
	 * Copyright 2018 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	function isArrayBufferEqual(a, b) {
	    if (a == null || b == null) {
	        return false;
	    }
	    if (a === b) {
	        return true;
	    }
	    if (a.byteLength !== b.byteLength) {
	        return false;
	    }
	    var viewA = new DataView(a);
	    var viewB = new DataView(b);
	    for (var i = 0; i < a.byteLength; i++) {
	        if (viewA.getUint8(i) !== viewB.getUint8(i)) {
	            return false;
	        }
	    }
	    return true;
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	function toBase64(arrayBuffer) {
	    var uint8Version = new Uint8Array(arrayBuffer);
	    return btoa(String.fromCharCode.apply(null, uint8Version));
	}
	function arrayBufferToBase64(arrayBuffer) {
	    var base64String = toBase64(arrayBuffer);
	    return base64String
	        .replace(/=/g, '')
	        .replace(/\+/g, '-')
	        .replace(/\//g, '_');
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var IidModel = /** @class */ (function () {
	    function IidModel() {
	    }
	    IidModel.prototype.getToken = function (senderId, subscription, publicVapidKey) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var p256dh, auth, fcmSubscribeBody, applicationPubKey, headers, subscribeOptions, responseData, response, err_1, message;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
	                        auth = arrayBufferToBase64(subscription.getKey('auth'));
	                        fcmSubscribeBody = "authorized_entity=" + senderId + "&" +
	                            ("endpoint=" + subscription.endpoint + "&") +
	                            ("encryption_key=" + p256dh + "&") +
	                            ("encryption_auth=" + auth);
	                        if (!isArrayBufferEqual(publicVapidKey.buffer, DEFAULT_PUBLIC_VAPID_KEY.buffer)) {
	                            applicationPubKey = arrayBufferToBase64(publicVapidKey);
	                            fcmSubscribeBody += "&application_pub_key=" + applicationPubKey;
	                        }
	                        headers = new Headers();
	                        headers.append('Content-Type', 'application/x-www-form-urlencoded');
	                        subscribeOptions = {
	                            method: 'POST',
	                            headers: headers,
	                            body: fcmSubscribeBody
	                        };
	                        _a.label = 1;
	                    case 1:
	                        _a.trys.push([1, 4, , 5]);
	                        return [4 /*yield*/, fetch(ENDPOINT + '/fcm/connect/subscribe', subscribeOptions)];
	                    case 2:
	                        response = _a.sent();
	                        return [4 /*yield*/, response.json()];
	                    case 3:
	                        responseData = _a.sent();
	                        return [3 /*break*/, 5];
	                    case 4:
	                        err_1 = _a.sent();
	                        throw errorFactory.create(ERROR_CODES.TOKEN_SUBSCRIBE_FAILED);
	                    case 5:
	                        if (responseData.error) {
	                            message = responseData.error.message;
	                            throw errorFactory.create(ERROR_CODES.TOKEN_SUBSCRIBE_FAILED, {
	                                message: message
	                            });
	                        }
	                        if (!responseData.token) {
	                            throw errorFactory.create(ERROR_CODES.TOKEN_SUBSCRIBE_NO_TOKEN);
	                        }
	                        if (!responseData.pushSet) {
	                            throw errorFactory.create(ERROR_CODES.TOKEN_SUBSCRIBE_NO_PUSH_SET);
	                        }
	                        return [2 /*return*/, {
	                                token: responseData.token,
	                                pushSet: responseData.pushSet
	                            }];
	                }
	            });
	        });
	    };
	    /**
	     * Update the underlying token details for fcmToken.
	     */
	    IidModel.prototype.updateToken = function (senderId, fcmToken, fcmPushSet, subscription, publicVapidKey) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var p256dh, auth, fcmUpdateBody, applicationPubKey, headers, updateOptions, responseData, response, err_2, message;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
	                        auth = arrayBufferToBase64(subscription.getKey('auth'));
	                        fcmUpdateBody = "push_set=" + fcmPushSet + "&" +
	                            ("token=" + fcmToken + "&") +
	                            ("authorized_entity=" + senderId + "&") +
	                            ("endpoint=" + subscription.endpoint + "&") +
	                            ("encryption_key=" + p256dh + "&") +
	                            ("encryption_auth=" + auth);
	                        if (!isArrayBufferEqual(publicVapidKey.buffer, DEFAULT_PUBLIC_VAPID_KEY.buffer)) {
	                            applicationPubKey = arrayBufferToBase64(publicVapidKey);
	                            fcmUpdateBody += "&application_pub_key=" + applicationPubKey;
	                        }
	                        headers = new Headers();
	                        headers.append('Content-Type', 'application/x-www-form-urlencoded');
	                        updateOptions = {
	                            method: 'POST',
	                            headers: headers,
	                            body: fcmUpdateBody
	                        };
	                        _a.label = 1;
	                    case 1:
	                        _a.trys.push([1, 4, , 5]);
	                        return [4 /*yield*/, fetch(ENDPOINT + '/fcm/connect/subscribe', updateOptions)];
	                    case 2:
	                        response = _a.sent();
	                        return [4 /*yield*/, response.json()];
	                    case 3:
	                        responseData = _a.sent();
	                        return [3 /*break*/, 5];
	                    case 4:
	                        err_2 = _a.sent();
	                        throw errorFactory.create(ERROR_CODES.TOKEN_UPDATE_FAILED);
	                    case 5:
	                        if (responseData.error) {
	                            message = responseData.error.message;
	                            throw errorFactory.create(ERROR_CODES.TOKEN_UPDATE_FAILED, {
	                                message: message
	                            });
	                        }
	                        if (!responseData.token) {
	                            throw errorFactory.create(ERROR_CODES.TOKEN_UPDATE_NO_TOKEN);
	                        }
	                        return [2 /*return*/, responseData.token];
	                }
	            });
	        });
	    };
	    /**
	     * Given a fcmToken, pushSet and messagingSenderId, delete an FCM token.
	     */
	    IidModel.prototype.deleteToken = function (senderId, fcmToken, fcmPushSet) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var fcmUnsubscribeBody, headers, unsubscribeOptions, response, responseData, message, err_3;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        fcmUnsubscribeBody = "authorized_entity=" + senderId + "&" +
	                            ("token=" + fcmToken + "&") +
	                            ("pushSet=" + fcmPushSet);
	                        headers = new Headers();
	                        headers.append('Content-Type', 'application/x-www-form-urlencoded');
	                        unsubscribeOptions = {
	                            method: 'POST',
	                            headers: headers,
	                            body: fcmUnsubscribeBody
	                        };
	                        _a.label = 1;
	                    case 1:
	                        _a.trys.push([1, 4, , 5]);
	                        return [4 /*yield*/, fetch(ENDPOINT + '/fcm/connect/unsubscribe', unsubscribeOptions)];
	                    case 2:
	                        response = _a.sent();
	                        return [4 /*yield*/, response.json()];
	                    case 3:
	                        responseData = _a.sent();
	                        if (responseData.error) {
	                            message = responseData.error.message;
	                            throw errorFactory.create(ERROR_CODES.TOKEN_UNSUBSCRIBE_FAILED, {
	                                message: message
	                            });
	                        }
	                        return [3 /*break*/, 5];
	                    case 4:
	                        err_3 = _a.sent();
	                        throw errorFactory.create(ERROR_CODES.TOKEN_UNSUBSCRIBE_FAILED);
	                    case 5: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    return IidModel;
	}());
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	function base64ToArrayBuffer(base64String) {
	    var padding = '='.repeat((4 - base64String.length % 4) % 4);
	    var base64 = (base64String + padding)
	        .replace(/\-/g, '+')
	        .replace(/_/g, '/');
	    var rawData = atob(base64);
	    var outputArray = new Uint8Array(rawData.length);
	    for (var i = 0; i < rawData.length; ++i) {
	        outputArray[i] = rawData.charCodeAt(i);
	    }
	    return outputArray;
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var OLD_DB_NAME = 'undefined';
	var OLD_OBJECT_STORE_NAME = 'fcm_token_object_Store';
	function handleDb(db) {
	    if (!db.objectStoreNames.contains(OLD_OBJECT_STORE_NAME)) {
	        // We found a database with the name 'undefined', but our expected object
	        // store isn't defined.
	        return;
	    }
	    var transaction = db.transaction(OLD_OBJECT_STORE_NAME);
	    var objectStore = transaction.objectStore(OLD_OBJECT_STORE_NAME);
	    var iidModel = new IidModel();
	    var openCursorRequest = objectStore.openCursor();
	    openCursorRequest.onerror = function (event) {
	        // NOOP - Nothing we can do.
	        console.warn('Unable to cleanup old IDB.', event);
	    };
	    openCursorRequest.onsuccess = function () {
	        var cursor = openCursorRequest.result;
	        if (cursor) {
	            // cursor.value contains the current record being iterated through
	            // this is where you'd do something with the result
	            var tokenDetails = cursor.value;
	            iidModel.deleteToken(tokenDetails.fcmSenderId, tokenDetails.fcmToken, tokenDetails.fcmPushSet);
	            cursor.continue();
	        }
	        else {
	            db.close();
	            indexedDB.deleteDatabase(OLD_DB_NAME);
	        }
	    };
	}
	function cleanV1() {
	    var request = indexedDB.open(OLD_DB_NAME);
	    request.onerror = function (event) {
	        // NOOP - Nothing we can do.
	    };
	    request.onsuccess = function (event) {
	        var db = request.result;
	        handleDb(db);
	    };
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var DbInterface = /** @class */ (function () {
	    function DbInterface() {
	        this.dbPromise = null;
	    }
	    /** Gets record(s) from the objectStore that match the given key. */
	    DbInterface.prototype.get = function (key) {
	        return this.createTransaction(function (objectStore) { return objectStore.get(key); });
	    };
	    /** Gets record(s) from the objectStore that match the given index. */
	    DbInterface.prototype.getIndex = function (index, key) {
	        function runRequest(objectStore) {
	            var idbIndex = objectStore.index(index);
	            return idbIndex.get(key);
	        }
	        return this.createTransaction(runRequest);
	    };
	    /** Assigns or overwrites the record for the given value. */
	    // tslint:disable-next-line:no-any IndexedDB values are of type "any"
	    DbInterface.prototype.put = function (value) {
	        return this.createTransaction(function (objectStore) { return objectStore.put(value); }, 'readwrite');
	    };
	    /** Deletes record(s) from the objectStore that match the given key. */
	    DbInterface.prototype.delete = function (key) {
	        return this.createTransaction(function (objectStore) { return objectStore.delete(key); }, 'readwrite');
	    };
	    /**
	     * Close the currently open database.
	     */
	    DbInterface.prototype.closeDatabase = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var db;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (!this.dbPromise) return [3 /*break*/, 2];
	                        return [4 /*yield*/, this.dbPromise];
	                    case 1:
	                        db = _a.sent();
	                        db.close();
	                        this.dbPromise = null;
	                        _a.label = 2;
	                    case 2: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    /**
	     * Creates an IndexedDB Transaction and passes its objectStore to the
	     * runRequest function, which runs the database request.
	     *
	     * @return Promise that resolves with the result of the runRequest function
	     */
	    DbInterface.prototype.createTransaction = function (runRequest, mode) {
	        if (mode === void 0) { mode = 'readonly'; }
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var db, transaction, request, result;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, this.getDb()];
	                    case 1:
	                        db = _a.sent();
	                        transaction = db.transaction(this.objectStoreName, mode);
	                        request = transaction.objectStore(this.objectStoreName);
	                        return [4 /*yield*/, promisify(runRequest(request))];
	                    case 2:
	                        result = _a.sent();
	                        return [2 /*return*/, new Promise(function (resolve, reject) {
	                                transaction.oncomplete = function () {
	                                    resolve(result);
	                                };
	                                transaction.onerror = function () {
	                                    reject(transaction.error);
	                                };
	                            })];
	                }
	            });
	        });
	    };
	    /** Gets the cached db connection or opens a new one. */
	    DbInterface.prototype.getDb = function () {
	        var _this = this;
	        if (!this.dbPromise) {
	            this.dbPromise = new Promise(function (resolve, reject) {
	                var request = indexedDB.open(_this.dbName, _this.dbVersion);
	                request.onsuccess = function () {
	                    resolve(request.result);
	                };
	                request.onerror = function () {
	                    _this.dbPromise = null;
	                    reject(request.error);
	                };
	                request.onupgradeneeded = function (event) { return _this.onDbUpgrade(request, event); };
	            });
	        }
	        return this.dbPromise;
	    };
	    return DbInterface;
	}());
	/** Promisifies an IDBRequest. Resolves with the IDBRequest's result. */
	function promisify(request) {
	    return new Promise(function (resolve, reject) {
	        request.onsuccess = function () {
	            resolve(request.result);
	        };
	        request.onerror = function () {
	            reject(request.error);
	        };
	    });
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var TokenDetailsModel = /** @class */ (function (_super) {
	    tslib_1.__extends(TokenDetailsModel, _super);
	    function TokenDetailsModel() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this.dbName = 'fcm_token_details_db';
	        _this.dbVersion = 3;
	        _this.objectStoreName = 'fcm_token_object_Store';
	        return _this;
	    }
	    TokenDetailsModel.prototype.onDbUpgrade = function (request, event) {
	        var db = request.result;
	        // Lack of 'break' statements is intentional.
	        switch (event.oldVersion) {
	            case 0: {
	                // New IDB instance
	                var objectStore = db.createObjectStore(this.objectStoreName, {
	                    keyPath: 'swScope'
	                });
	                // Make sure the sender ID can be searched
	                objectStore.createIndex('fcmSenderId', 'fcmSenderId', {
	                    unique: false
	                });
	                objectStore.createIndex('fcmToken', 'fcmToken', { unique: true });
	            }
	            case 1: {
	                // Prior to version 2, we were using either 'fcm_token_details_db'
	                // or 'undefined' as the database name due to bug in the SDK
	                // So remove the old tokens and databases.
	                cleanV1();
	            }
	            case 2: {
	                var objectStore = request.transaction.objectStore(this.objectStoreName);
	                var cursorRequest_1 = objectStore.openCursor();
	                cursorRequest_1.onsuccess = function () {
	                    var cursor = cursorRequest_1.result;
	                    if (cursor) {
	                        var value = cursor.value;
	                        var newValue = tslib_1.__assign({}, value);
	                        if (!value.createTime) {
	                            newValue.createTime = Date.now();
	                        }
	                        if (typeof value.vapidKey === 'string') {
	                            newValue.vapidKey = base64ToArrayBuffer(value.vapidKey);
	                        }
	                        if (typeof value.auth === 'string') {
	                            newValue.auth = base64ToArrayBuffer(value.auth).buffer;
	                        }
	                        if (typeof value.auth === 'string') {
	                            newValue.p256dh = base64ToArrayBuffer(value.p256dh).buffer;
	                        }
	                        cursor.update(newValue);
	                        cursor.continue();
	                    }
	                };
	            }
	        }
	    };
	    /**
	     * Given a token, this method will look up the details in indexedDB.
	     */
	    TokenDetailsModel.prototype.getTokenDetailsFromToken = function (fcmToken) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                if (!fcmToken) {
	                    throw errorFactory.create(ERROR_CODES.BAD_TOKEN);
	                }
	                validateInputs({ fcmToken: fcmToken });
	                return [2 /*return*/, this.getIndex('fcmToken', fcmToken)];
	            });
	        });
	    };
	    /**
	     * Given a service worker scope, this method will look up the details in
	     * indexedDB.
	     * @return The details associated with that token.
	     */
	    TokenDetailsModel.prototype.getTokenDetailsFromSWScope = function (swScope) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                if (!swScope) {
	                    throw errorFactory.create(ERROR_CODES.BAD_SCOPE);
	                }
	                validateInputs({ swScope: swScope });
	                return [2 /*return*/, this.get(swScope)];
	            });
	        });
	    };
	    /**
	     * Save the details for the fcm token for re-use at a later date.
	     * @param input A plain js object containing args to save.
	     */
	    TokenDetailsModel.prototype.saveTokenDetails = function (tokenDetails) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                if (!tokenDetails.swScope) {
	                    throw errorFactory.create(ERROR_CODES.BAD_SCOPE);
	                }
	                if (!tokenDetails.vapidKey) {
	                    throw errorFactory.create(ERROR_CODES.BAD_VAPID_KEY);
	                }
	                if (!tokenDetails.endpoint || !tokenDetails.auth || !tokenDetails.p256dh) {
	                    throw errorFactory.create(ERROR_CODES.BAD_SUBSCRIPTION);
	                }
	                if (!tokenDetails.fcmSenderId) {
	                    throw errorFactory.create(ERROR_CODES.BAD_SENDER_ID);
	                }
	                if (!tokenDetails.fcmToken) {
	                    throw errorFactory.create(ERROR_CODES.BAD_TOKEN);
	                }
	                if (!tokenDetails.fcmPushSet) {
	                    throw errorFactory.create(ERROR_CODES.BAD_PUSH_SET);
	                }
	                validateInputs(tokenDetails);
	                return [2 /*return*/, this.put(tokenDetails)];
	            });
	        });
	    };
	    /**
	     * This method deletes details of the current FCM token.
	     * It's returning a promise in case we need to move to an async
	     * method for deleting at a later date.
	     *
	     * @return Resolves once the FCM token details have been deleted and returns
	     * the deleted details.
	     */
	    TokenDetailsModel.prototype.deleteToken = function (token) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var details;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (typeof token !== 'string' || token.length === 0) {
	                            return [2 /*return*/, Promise.reject(errorFactory.create(ERROR_CODES.INVALID_DELETE_TOKEN))];
	                        }
	                        return [4 /*yield*/, this.getTokenDetailsFromToken(token)];
	                    case 1:
	                        details = _a.sent();
	                        if (!details) {
	                            throw errorFactory.create(ERROR_CODES.DELETE_TOKEN_NOT_FOUND);
	                        }
	                        return [4 /*yield*/, this.delete(details.swScope)];
	                    case 2:
	                        _a.sent();
	                        return [2 /*return*/, details];
	                }
	            });
	        });
	    };
	    return TokenDetailsModel;
	}(DbInterface));
	/**
	 * This method takes an object and will check for known arguments and
	 * validate the input.
	 * @return Promise that resolves if input is valid, rejects otherwise.
	 */
	function validateInputs(input) {
	    if (input.fcmToken) {
	        if (typeof input.fcmToken !== 'string' || input.fcmToken.length === 0) {
	            throw errorFactory.create(ERROR_CODES.BAD_TOKEN);
	        }
	    }
	    if (input.swScope) {
	        if (typeof input.swScope !== 'string' || input.swScope.length === 0) {
	            throw errorFactory.create(ERROR_CODES.BAD_SCOPE);
	        }
	    }
	    if (input.vapidKey) {
	        if (!(input.vapidKey instanceof Uint8Array) ||
	            input.vapidKey.length !== 65) {
	            throw errorFactory.create(ERROR_CODES.BAD_VAPID_KEY);
	        }
	    }
	    if (input.endpoint) {
	        if (typeof input.endpoint !== 'string' || input.endpoint.length === 0) {
	            throw errorFactory.create(ERROR_CODES.BAD_SUBSCRIPTION);
	        }
	    }
	    if (input.auth) {
	        if (!(input.auth instanceof ArrayBuffer)) {
	            throw errorFactory.create(ERROR_CODES.BAD_SUBSCRIPTION);
	        }
	    }
	    if (input.p256dh) {
	        if (!(input.p256dh instanceof ArrayBuffer)) {
	            throw errorFactory.create(ERROR_CODES.BAD_SUBSCRIPTION);
	        }
	    }
	    if (input.fcmSenderId) {
	        if (typeof input.fcmSenderId !== 'string' ||
	            input.fcmSenderId.length === 0) {
	            throw errorFactory.create(ERROR_CODES.BAD_SENDER_ID);
	        }
	    }
	    if (input.fcmPushSet) {
	        if (typeof input.fcmPushSet !== 'string' || input.fcmPushSet.length === 0) {
	            throw errorFactory.create(ERROR_CODES.BAD_PUSH_SET);
	        }
	    }
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var UNCOMPRESSED_PUBLIC_KEY_SIZE = 65;
	var VapidDetailsModel = /** @class */ (function (_super) {
	    tslib_1.__extends(VapidDetailsModel, _super);
	    function VapidDetailsModel() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this.dbName = 'fcm_vapid_details_db';
	        _this.dbVersion = 1;
	        _this.objectStoreName = 'fcm_vapid_object_Store';
	        return _this;
	    }
	    VapidDetailsModel.prototype.onDbUpgrade = function (request) {
	        var db = request.result;
	        db.createObjectStore(this.objectStoreName, { keyPath: 'swScope' });
	    };
	    /**
	     * Given a service worker scope, this method will look up the vapid key
	     * in indexedDB.
	     */
	    VapidDetailsModel.prototype.getVapidFromSWScope = function (swScope) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var result;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (typeof swScope !== 'string' || swScope.length === 0) {
	                            throw errorFactory.create(ERROR_CODES.BAD_SCOPE);
	                        }
	                        return [4 /*yield*/, this.get(swScope)];
	                    case 1:
	                        result = _a.sent();
	                        return [2 /*return*/, result ? result.vapidKey : undefined];
	                }
	            });
	        });
	    };
	    /**
	     * Save a vapid key against a swScope for later date.
	     */
	    VapidDetailsModel.prototype.saveVapidDetails = function (swScope, vapidKey) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var details;
	            return tslib_1.__generator(this, function (_a) {
	                if (typeof swScope !== 'string' || swScope.length === 0) {
	                    throw errorFactory.create(ERROR_CODES.BAD_SCOPE);
	                }
	                if (vapidKey === null || vapidKey.length !== UNCOMPRESSED_PUBLIC_KEY_SIZE) {
	                    throw errorFactory.create(ERROR_CODES.BAD_VAPID_KEY);
	                }
	                details = {
	                    swScope: swScope,
	                    vapidKey: vapidKey
	                };
	                return [2 /*return*/, this.put(details)];
	            });
	        });
	    };
	    /**
	     * This method deletes details of the current FCM VAPID key for a SW scope.
	     * Resolves once the scope/vapid details have been deleted and returns the
	     * deleted vapid key.
	     */
	    VapidDetailsModel.prototype.deleteVapidDetails = function (swScope) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var vapidKey;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, this.getVapidFromSWScope(swScope)];
	                    case 1:
	                        vapidKey = _a.sent();
	                        if (!vapidKey) {
	                            throw errorFactory.create(ERROR_CODES.DELETE_SCOPE_NOT_FOUND);
	                        }
	                        return [4 /*yield*/, this.delete(swScope)];
	                    case 2:
	                        _a.sent();
	                        return [2 /*return*/, vapidKey];
	                }
	            });
	        });
	    };
	    return VapidDetailsModel;
	}(DbInterface));
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var SENDER_ID_OPTION_NAME = 'messagingSenderId';
	// Database cache should be invalidated once a week.
	var TOKEN_EXPIRATION_MILLIS = 7 * 24 * 60 * 60 * 1000; // 7 days
	var BaseController = /** @class */ (function () {
	    /**
	     * An interface of the Messaging Service API
	     */
	    function BaseController(app) {
	        var _this = this;
	        if (!app.options[SENDER_ID_OPTION_NAME] ||
	            typeof app.options[SENDER_ID_OPTION_NAME] !== 'string') {
	            throw errorFactory.create(ERROR_CODES.BAD_SENDER_ID);
	        }
	        this.messagingSenderId = app.options[SENDER_ID_OPTION_NAME];
	        this.tokenDetailsModel = new TokenDetailsModel();
	        this.vapidDetailsModel = new VapidDetailsModel();
	        this.iidModel = new IidModel();
	        this.app = app;
	        this.INTERNAL = {
	            delete: function () { return _this.delete(); }
	        };
	    }
	    /**
	     * @export
	     */
	    BaseController.prototype.getToken = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var currentPermission, swReg, publicVapidKey, pushSubscription, tokenDetails;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        currentPermission = this.getNotificationPermission_();
	                        if (currentPermission === 'denied') {
	                            throw errorFactory.create(ERROR_CODES.NOTIFICATIONS_BLOCKED);
	                        }
	                        else if (currentPermission !== 'granted') {
	                            // We must wait for permission to be granted
	                            return [2 /*return*/, null];
	                        }
	                        return [4 /*yield*/, this.getSWRegistration_()];
	                    case 1:
	                        swReg = _a.sent();
	                        return [4 /*yield*/, this.getPublicVapidKey_()];
	                    case 2:
	                        publicVapidKey = _a.sent();
	                        return [4 /*yield*/, this.getPushSubscription(swReg, publicVapidKey)];
	                    case 3:
	                        pushSubscription = _a.sent();
	                        return [4 /*yield*/, this.tokenDetailsModel.getTokenDetailsFromSWScope(swReg.scope)];
	                    case 4:
	                        tokenDetails = _a.sent();
	                        if (tokenDetails) {
	                            return [2 /*return*/, this.manageExistingToken(swReg, pushSubscription, publicVapidKey, tokenDetails)];
	                        }
	                        return [2 /*return*/, this.getNewToken(swReg, pushSubscription, publicVapidKey)];
	                }
	            });
	        });
	    };
	    /**
	     * manageExistingToken is triggered if there's an existing FCM token in the
	     * database and it can take 3 different actions:
	     * 1) Retrieve the existing FCM token from the database.
	     * 2) If VAPID details have changed: Delete the existing token and create a
	     * new one with the new VAPID key.
	     * 3) If the database cache is invalidated: Send a request to FCM to update
	     * the token, and to check if the token is still valid on FCM-side.
	     */
	    BaseController.prototype.manageExistingToken = function (swReg, pushSubscription, publicVapidKey, tokenDetails) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var isTokenValid, now;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        isTokenValid = isTokenStillValid(pushSubscription, publicVapidKey, tokenDetails);
	                        if (isTokenValid) {
	                            now = Date.now();
	                            if (now < tokenDetails.createTime + TOKEN_EXPIRATION_MILLIS) {
	                                return [2 /*return*/, tokenDetails.fcmToken];
	                            }
	                            else {
	                                return [2 /*return*/, this.updateToken(swReg, pushSubscription, publicVapidKey, tokenDetails)];
	                            }
	                        }
	                        // If the token is no longer valid (for example if the VAPID details
	                        // have changed), delete the existing token from the FCM client and server
	                        // database. No need to unsubscribe from the Service Worker as we have a
	                        // good push subscription that we'd like to use in getNewToken.
	                        return [4 /*yield*/, this.deleteTokenFromDB(tokenDetails.fcmToken)];
	                    case 1:
	                        // If the token is no longer valid (for example if the VAPID details
	                        // have changed), delete the existing token from the FCM client and server
	                        // database. No need to unsubscribe from the Service Worker as we have a
	                        // good push subscription that we'd like to use in getNewToken.
	                        _a.sent();
	                        return [2 /*return*/, this.getNewToken(swReg, pushSubscription, publicVapidKey)];
	                }
	            });
	        });
	    };
	    BaseController.prototype.updateToken = function (swReg, pushSubscription, publicVapidKey, tokenDetails) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var updatedToken, allDetails, e_1;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 4, , 6]);
	                        return [4 /*yield*/, this.iidModel.updateToken(this.messagingSenderId, tokenDetails.fcmToken, tokenDetails.fcmPushSet, pushSubscription, publicVapidKey)];
	                    case 1:
	                        updatedToken = _a.sent();
	                        allDetails = {
	                            swScope: swReg.scope,
	                            vapidKey: publicVapidKey,
	                            fcmSenderId: this.messagingSenderId,
	                            fcmToken: updatedToken,
	                            fcmPushSet: tokenDetails.fcmPushSet,
	                            createTime: Date.now(),
	                            endpoint: pushSubscription.endpoint,
	                            auth: pushSubscription.getKey('auth'),
	                            p256dh: pushSubscription.getKey('p256dh')
	                        };
	                        return [4 /*yield*/, this.tokenDetailsModel.saveTokenDetails(allDetails)];
	                    case 2:
	                        _a.sent();
	                        return [4 /*yield*/, this.vapidDetailsModel.saveVapidDetails(swReg.scope, publicVapidKey)];
	                    case 3:
	                        _a.sent();
	                        return [2 /*return*/, updatedToken];
	                    case 4:
	                        e_1 = _a.sent();
	                        return [4 /*yield*/, this.deleteToken(tokenDetails.fcmToken)];
	                    case 5:
	                        _a.sent();
	                        throw e_1;
	                    case 6: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    BaseController.prototype.getNewToken = function (swReg, pushSubscription, publicVapidKey) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var tokenDetails, allDetails;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, this.iidModel.getToken(this.messagingSenderId, pushSubscription, publicVapidKey)];
	                    case 1:
	                        tokenDetails = _a.sent();
	                        allDetails = {
	                            swScope: swReg.scope,
	                            vapidKey: publicVapidKey,
	                            fcmSenderId: this.messagingSenderId,
	                            fcmToken: tokenDetails.token,
	                            fcmPushSet: tokenDetails.pushSet,
	                            createTime: Date.now(),
	                            endpoint: pushSubscription.endpoint,
	                            auth: pushSubscription.getKey('auth'),
	                            p256dh: pushSubscription.getKey('p256dh')
	                        };
	                        return [4 /*yield*/, this.tokenDetailsModel.saveTokenDetails(allDetails)];
	                    case 2:
	                        _a.sent();
	                        return [4 /*yield*/, this.vapidDetailsModel.saveVapidDetails(swReg.scope, publicVapidKey)];
	                    case 3:
	                        _a.sent();
	                        return [2 /*return*/, tokenDetails.token];
	                }
	            });
	        });
	    };
	    /**
	     * This method deletes tokens that the token manager looks after,
	     * unsubscribes the token from FCM  and then unregisters the push
	     * subscription if it exists. It returns a promise that indicates
	     * whether or not the unsubscribe request was processed successfully.
	     */
	    BaseController.prototype.deleteToken = function (token) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var registration, pushSubscription;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: 
	                    // Delete the token details from the database.
	                    return [4 /*yield*/, this.deleteTokenFromDB(token)];
	                    case 1:
	                        // Delete the token details from the database.
	                        _a.sent();
	                        return [4 /*yield*/, this.getSWRegistration_()];
	                    case 2:
	                        registration = _a.sent();
	                        if (!registration) return [3 /*break*/, 4];
	                        return [4 /*yield*/, registration.pushManager.getSubscription()];
	                    case 3:
	                        pushSubscription = _a.sent();
	                        if (pushSubscription) {
	                            return [2 /*return*/, pushSubscription.unsubscribe()];
	                        }
	                        _a.label = 4;
	                    case 4: 
	                    // If there's no SW, consider it a success.
	                    return [2 /*return*/, true];
	                }
	            });
	        });
	    };
	    /**
	     * This method will delete the token from the client database, and make a
	     * call to FCM to remove it from the server DB. Does not temper with the
	     * push subscription.
	     */
	    BaseController.prototype.deleteTokenFromDB = function (token) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var details;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, this.tokenDetailsModel.deleteToken(token)];
	                    case 1:
	                        details = _a.sent();
	                        return [4 /*yield*/, this.iidModel.deleteToken(details.fcmSenderId, details.fcmToken, details.fcmPushSet)];
	                    case 2:
	                        _a.sent();
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    /**
	     * Gets a PushSubscription for the current user.
	     */
	    BaseController.prototype.getPushSubscription = function (swRegistration, publicVapidKey) {
	        return swRegistration.pushManager.getSubscription().then(function (subscription) {
	            if (subscription) {
	                return subscription;
	            }
	            return swRegistration.pushManager.subscribe({
	                userVisibleOnly: true,
	                applicationServerKey: publicVapidKey
	            });
	        });
	    };
	    //
	    // The following methods should only be available in the window.
	    //
	    BaseController.prototype.requestPermission = function () {
	        throw errorFactory.create(ERROR_CODES.AVAILABLE_IN_WINDOW);
	    };
	    BaseController.prototype.useServiceWorker = function (registration) {
	        throw errorFactory.create(ERROR_CODES.AVAILABLE_IN_WINDOW);
	    };
	    BaseController.prototype.usePublicVapidKey = function (b64PublicKey) {
	        throw errorFactory.create(ERROR_CODES.AVAILABLE_IN_WINDOW);
	    };
	    BaseController.prototype.onMessage = function (nextOrObserver, error, completed) {
	        throw errorFactory.create(ERROR_CODES.AVAILABLE_IN_WINDOW);
	    };
	    BaseController.prototype.onTokenRefresh = function (nextOrObserver, error, completed) {
	        throw errorFactory.create(ERROR_CODES.AVAILABLE_IN_WINDOW);
	    };
	    //
	    // The following methods are used by the service worker only.
	    //
	    BaseController.prototype.setBackgroundMessageHandler = function (callback) {
	        throw errorFactory.create(ERROR_CODES.AVAILABLE_IN_SW);
	    };
	    //
	    // The following methods are used by the service themselves and not exposed
	    // publicly or not expected to be used by developers.
	    //
	    /**
	     * This method is required to adhere to the Firebase interface.
	     * It closes any currently open indexdb database connections.
	     */
	    BaseController.prototype.delete = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, Promise.all([
	                            this.tokenDetailsModel.closeDatabase(),
	                            this.vapidDetailsModel.closeDatabase()
	                        ])];
	                    case 1:
	                        _a.sent();
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    /**
	     * Returns the current Notification Permission state.
	     */
	    BaseController.prototype.getNotificationPermission_ = function () {
	        // TODO: Remove the cast when this issue is fixed:
	        // https://github.com/Microsoft/TypeScript/issues/14701
	        // tslint:disable-next-line no-any
	        return Notification.permission;
	    };
	    BaseController.prototype.getTokenDetailsModel = function () {
	        return this.tokenDetailsModel;
	    };
	    BaseController.prototype.getVapidDetailsModel = function () {
	        return this.vapidDetailsModel;
	    };
	    // Visible for testing
	    // TODO: make protected
	    BaseController.prototype.getIidModel = function () {
	        return this.iidModel;
	    };
	    return BaseController;
	}());
	/**
	 * Checks if the tokenDetails match the details provided in the clients.
	 */
	function isTokenStillValid(pushSubscription, publicVapidKey, tokenDetails) {
	    if (!tokenDetails.vapidKey ||
	        !isArrayBufferEqual(publicVapidKey.buffer, tokenDetails.vapidKey.buffer)) {
	        return false;
	    }
	    var isEndpointEqual = pushSubscription.endpoint === tokenDetails.endpoint;
	    var isAuthEqual = isArrayBufferEqual(pushSubscription.getKey('auth'), tokenDetails.auth);
	    var isP256dhEqual = isArrayBufferEqual(pushSubscription.getKey('p256dh'), tokenDetails.p256dh);
	    return isEndpointEqual && isAuthEqual && isP256dhEqual;
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var FCM_MSG = 'FCM_MSG';
	var SwController = /** @class */ (function (_super) {
	    tslib_1.__extends(SwController, _super);
	    function SwController(app) {
	        var _this = _super.call(this, app) || this;
	        _this.bgMessageHandler = null;
	        self.addEventListener('push', function (e) {
	            _this.onPush(e);
	        });
	        self.addEventListener('pushsubscriptionchange', function (e) {
	            _this.onSubChange(e);
	        });
	        self.addEventListener('notificationclick', function (e) {
	            _this.onNotificationClick(e);
	        });
	        return _this;
	    }
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.onPush = function (event) {
	        event.waitUntil(this.onPush_(event));
	    };
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.onSubChange = function (event) {
	        event.waitUntil(this.onSubChange_(event));
	    };
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.onNotificationClick = function (event) {
	        event.waitUntil(this.onNotificationClick_(event));
	    };
	    /**
	     * A handler for push events that shows notifications based on the content of
	     * the payload.
	     *
	     * The payload must be a JSON-encoded Object with a `notification` key. The
	     * value of the `notification` property will be used as the NotificationOptions
	     * object passed to showNotification. Additionally, the `title` property of the
	     * notification object will be used as the title.
	     *
	     * If there is no notification data in the payload then no notification will be
	     * shown.
	     */
	    SwController.prototype.onPush_ = function (event) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var msgPayload, hasVisibleClients, notificationDetails, notificationTitle, reg, actions, maxActions;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (!event.data) {
	                            return [2 /*return*/];
	                        }
	                        try {
	                            msgPayload = event.data.json();
	                        }
	                        catch (err) {
	                            // Not JSON so not an FCM message
	                            return [2 /*return*/];
	                        }
	                        return [4 /*yield*/, this.hasVisibleClients_()];
	                    case 1:
	                        hasVisibleClients = _a.sent();
	                        if (hasVisibleClients) {
	                            // App in foreground. Send to page.
	                            return [2 /*return*/, this.sendMessageToWindowClients_(msgPayload)];
	                        }
	                        notificationDetails = this.getNotificationData_(msgPayload);
	                        if (!notificationDetails) return [3 /*break*/, 3];
	                        notificationTitle = notificationDetails.title || '';
	                        return [4 /*yield*/, this.getSWRegistration_()];
	                    case 2:
	                        reg = _a.sent();
	                        actions = notificationDetails.actions;
	                        maxActions = Notification.maxActions;
	                        // tslint:enable no-any
	                        if (actions && maxActions && actions.length > maxActions) {
	                            console.warn("This browser only supports " + maxActions + " actions." +
	                                "The remaining actions will not be displayed.");
	                        }
	                        return [2 /*return*/, reg.showNotification(notificationTitle, notificationDetails)];
	                    case 3:
	                        if (!this.bgMessageHandler) return [3 /*break*/, 5];
	                        return [4 /*yield*/, this.bgMessageHandler(msgPayload)];
	                    case 4:
	                        _a.sent();
	                        return [2 /*return*/];
	                    case 5: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    SwController.prototype.onSubChange_ = function (event) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var registration, err_1, err_2, tokenDetailsModel, tokenDetails;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, this.getSWRegistration_()];
	                    case 1:
	                        registration = _a.sent();
	                        return [3 /*break*/, 3];
	                    case 2:
	                        err_1 = _a.sent();
	                        throw errorFactory.create(ERROR_CODES.UNABLE_TO_RESUBSCRIBE, {
	                            message: err_1
	                        });
	                    case 3:
	                        _a.trys.push([3, 5, , 8]);
	                        return [4 /*yield*/, registration.pushManager.getSubscription()];
	                    case 4:
	                        _a.sent();
	                        return [3 /*break*/, 8];
	                    case 5:
	                        err_2 = _a.sent();
	                        tokenDetailsModel = this.getTokenDetailsModel();
	                        return [4 /*yield*/, tokenDetailsModel.getTokenDetailsFromSWScope(registration.scope)];
	                    case 6:
	                        tokenDetails = _a.sent();
	                        if (!tokenDetails) {
	                            // This should rarely occure, but could if indexedDB
	                            // is corrupted or wiped
	                            throw err_2;
	                        }
	                        // Attempt to delete the token if we know it's bad
	                        return [4 /*yield*/, this.deleteToken(tokenDetails.fcmToken)];
	                    case 7:
	                        // Attempt to delete the token if we know it's bad
	                        _a.sent();
	                        throw err_2;
	                    case 8: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    SwController.prototype.onNotificationClick_ = function (event) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var msgPayload, link, windowClient, internalMsg;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (!event.notification ||
	                            !event.notification.data ||
	                            !event.notification.data[FCM_MSG]) {
	                            // Not an FCM notification, do nothing.
	                            return [2 /*return*/];
	                        }
	                        else if (event.action) {
	                            // User clicked on an action button.
	                            // This will allow devs to act on action button clicks by using a custom
	                            // onNotificationClick listener that they define.
	                            return [2 /*return*/];
	                        }
	                        // Prevent other listeners from receiving the event
	                        event.stopImmediatePropagation();
	                        event.notification.close();
	                        msgPayload = event.notification.data[FCM_MSG];
	                        if (!msgPayload.notification) {
	                            // Nothing to do.
	                            return [2 /*return*/];
	                        }
	                        link = (msgPayload.fcmOptions && msgPayload.fcmOptions.link) ||
	                            msgPayload.notification.click_action;
	                        if (!link) {
	                            // Nothing to do.
	                            return [2 /*return*/];
	                        }
	                        return [4 /*yield*/, this.getWindowClient_(link)];
	                    case 1:
	                        windowClient = _a.sent();
	                        if (!!windowClient) return [3 /*break*/, 3];
	                        return [4 /*yield*/, self.clients.openWindow(link)];
	                    case 2:
	                        // Unable to find window client so need to open one.
	                        windowClient = _a.sent();
	                        return [3 /*break*/, 5];
	                    case 3: return [4 /*yield*/, windowClient.focus()];
	                    case 4:
	                        windowClient = _a.sent();
	                        _a.label = 5;
	                    case 5:
	                        if (!windowClient) {
	                            // Window Client will not be returned if it's for a third party origin.
	                            return [2 /*return*/];
	                        }
	                        // Delete notification and fcmOptions data from payload before sending to
	                        // the page.
	                        delete msgPayload.notification;
	                        delete msgPayload.fcmOptions;
	                        internalMsg = createNewMsg(MessageType.NOTIFICATION_CLICKED, msgPayload);
	                        // Attempt to send a message to the client to handle the data
	                        // Is affected by: https://github.com/slightlyoff/ServiceWorker/issues/728
	                        return [2 /*return*/, this.attemptToMessageClient_(windowClient, internalMsg)];
	                }
	            });
	        });
	    };
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.getNotificationData_ = function (msgPayload) {
	        if (!msgPayload) {
	            return;
	        }
	        if (typeof msgPayload.notification !== 'object') {
	            return;
	        }
	        var notificationInformation = tslib_1.__assign({}, msgPayload.notification);
	        // Put the message payload under FCM_MSG name so we can identify the
	        // notification as being an FCM notification vs a notification from
	        // somewhere else (i.e. normal web push or developer generated
	        // notification).
	        notificationInformation.data = tslib_1.__assign({}, msgPayload.notification.data, (_a = {}, _a[FCM_MSG] = msgPayload, _a));
	        return notificationInformation;
	        var _a;
	    };
	    /**
	     * Calling setBackgroundMessageHandler will opt in to some specific
	     * behaviours.
	     * 1.) If a notification doesn't need to be shown due to a window already
	     * being visible, then push messages will be sent to the page.
	     * 2.) If a notification needs to be shown, and the message contains no
	     * notification data this method will be called
	     * and the promise it returns will be passed to event.waitUntil.
	     * If you do not set this callback then all push messages will let and the
	     * developer can handle them in a their own 'push' event callback
	     *
	     * @param callback The callback to be called when a push message is received
	     * and a notification must be shown. The callback will be given the data from
	     * the push message.
	     */
	    SwController.prototype.setBackgroundMessageHandler = function (callback) {
	        if (!callback || typeof callback !== 'function') {
	            throw errorFactory.create(ERROR_CODES.BG_HANDLER_FUNCTION_EXPECTED);
	        }
	        this.bgMessageHandler = callback;
	    };
	    /**
	     * @param url The URL to look for when focusing a client.
	     * @return Returns an existing window client or a newly opened WindowClient.
	     */
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.getWindowClient_ = function (url) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var parsedURL, clientList, suitableClient, i, parsedClientUrl;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        parsedURL = new URL(url, self.location.href).href;
	                        return [4 /*yield*/, getClientList()];
	                    case 1:
	                        clientList = _a.sent();
	                        suitableClient = null;
	                        for (i = 0; i < clientList.length; i++) {
	                            parsedClientUrl = new URL(clientList[i].url, self.location.href)
	                                .href;
	                            if (parsedClientUrl === parsedURL) {
	                                suitableClient = clientList[i];
	                                break;
	                            }
	                        }
	                        return [2 /*return*/, suitableClient];
	                }
	            });
	        });
	    };
	    /**
	     * This message will attempt to send the message to a window client.
	     * @param client The WindowClient to send the message to.
	     * @param message The message to send to the client.
	     * @returns Returns a promise that resolves after sending the message. This
	     * does not guarantee that the message was successfully received.
	     */
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.attemptToMessageClient_ = function (client, message) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                // NOTE: This returns a promise in case this API is abstracted later on to
	                // do additional work
	                if (!client) {
	                    throw errorFactory.create(ERROR_CODES.NO_WINDOW_CLIENT_TO_MSG);
	                }
	                client.postMessage(message);
	                return [2 /*return*/];
	            });
	        });
	    };
	    /**
	     * @returns If there is currently a visible WindowClient, this method will
	     * resolve to true, otherwise false.
	     */
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.hasVisibleClients_ = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var clientList;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, getClientList()];
	                    case 1:
	                        clientList = _a.sent();
	                        return [2 /*return*/, clientList.some(function (client) { return client.visibilityState === 'visible'; })];
	                }
	            });
	        });
	    };
	    /**
	     * @param msgPayload The data from the push event that should be sent to all
	     * available pages.
	     * @returns Returns a promise that resolves once the message has been sent to
	     * all WindowClients.
	     */
	    // Visible for testing
	    // TODO: Make private
	    SwController.prototype.sendMessageToWindowClients_ = function (msgPayload) {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var _this = this;
	            var clientList, internalMsg;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, getClientList()];
	                    case 1:
	                        clientList = _a.sent();
	                        internalMsg = createNewMsg(MessageType.PUSH_MSG_RECEIVED, msgPayload);
	                        return [4 /*yield*/, Promise.all(clientList.map(function (client) {
	                                return _this.attemptToMessageClient_(client, internalMsg);
	                            }))];
	                    case 2:
	                        _a.sent();
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    /**
	     * This will register the default service worker and return the registration.
	     * @return he service worker registration to be used for the push service.
	     */
	    SwController.prototype.getSWRegistration_ = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                return [2 /*return*/, self.registration];
	            });
	        });
	    };
	    /**
	     * This will return the default VAPID key or the uint8array version of the
	     * public VAPID key provided by the developer.
	     */
	    SwController.prototype.getPublicVapidKey_ = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var swReg, vapidKeyFromDatabase;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, this.getSWRegistration_()];
	                    case 1:
	                        swReg = _a.sent();
	                        if (!swReg) {
	                            throw errorFactory.create(ERROR_CODES.SW_REGISTRATION_EXPECTED);
	                        }
	                        return [4 /*yield*/, this.getVapidDetailsModel().getVapidFromSWScope(swReg.scope)];
	                    case 2:
	                        vapidKeyFromDatabase = _a.sent();
	                        if (vapidKeyFromDatabase == null) {
	                            return [2 /*return*/, DEFAULT_PUBLIC_VAPID_KEY];
	                        }
	                        return [2 /*return*/, vapidKeyFromDatabase];
	                }
	            });
	        });
	    };
	    return SwController;
	}(BaseController));
	function getClientList() {
	    return self.clients.matchAll({
	        type: 'window',
	        includeUncontrolled: true
	        // TS doesn't know that "type: 'window'" means it'll return WindowClient[]
	    });
	}
	function createNewMsg(msgType, msgData) {
	    return _a = {}, _a[MessageParameter.TYPE_OF_MSG] = msgType, _a[MessageParameter.DATA] = msgData, _a;
	    var _a;
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var DEFAULT_SW_PATH = '/firebase-messaging-sw.js';
	var DEFAULT_SW_SCOPE = '/firebase-cloud-messaging-push-scope';
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var WindowController = /** @class */ (function (_super) {
	    tslib_1.__extends(WindowController, _super);
	    /**
	     * A service that provides a MessagingService instance.
	     */
	    function WindowController(app) {
	        var _this = _super.call(this, app) || this;
	        _this.registrationToUse = null;
	        _this.publicVapidKeyToUse = null;
	        _this.manifestCheckPromise = null;
	        _this.messageObserver = null;
	        // @ts-ignore: Unused variable error, this is not implemented yet.
	        _this.tokenRefreshObserver = null;
	        _this.onMessageInternal = util.createSubscribe(function (observer) {
	            _this.messageObserver = observer;
	        });
	        _this.onTokenRefreshInternal = util.createSubscribe(function (observer) {
	            _this.tokenRefreshObserver = observer;
	        });
	        _this.setupSWMessageListener_();
	        return _this;
	    }
	    /**
	     * This method returns an FCM token if it can be generated.
	     * The return promise will reject if the browser doesn't support
	     * FCM, if permission is denied for notifications or it's not
	     * possible to generate a token.
	     *
	     * @return Returns a promise that resolves to an FCM token or null if
	     * permission isn't granted.
	     */
	    WindowController.prototype.getToken = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (!this.manifestCheckPromise) {
	                            this.manifestCheckPromise = manifestCheck();
	                        }
	                        return [4 /*yield*/, this.manifestCheckPromise];
	                    case 1:
	                        _a.sent();
	                        return [2 /*return*/, _super.prototype.getToken.call(this)];
	                }
	            });
	        });
	    };
	    /**
	     * Request permission if it is not currently granted
	     *
	     * @return Resolves if the permission was granted, otherwise rejects
	     */
	    WindowController.prototype.requestPermission = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            var permissionResult;
	            return tslib_1.__generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (this.getNotificationPermission_() === 'granted') {
	                            return [2 /*return*/];
	                        }
	                        return [4 /*yield*/, Notification.requestPermission()];
	                    case 1:
	                        permissionResult = _a.sent();
	                        if (permissionResult === 'granted') {
	                            return [2 /*return*/];
	                        }
	                        else if (permissionResult === 'denied') {
	                            throw errorFactory.create(ERROR_CODES.PERMISSION_BLOCKED);
	                        }
	                        else {
	                            throw errorFactory.create(ERROR_CODES.PERMISSION_DEFAULT);
	                        }
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    /**
	     * This method allows a developer to override the default service worker and
	     * instead use a custom service worker.
	     *
	     * @param registration The service worker registration that should be used to
	     * receive the push messages.
	     */
	    WindowController.prototype.useServiceWorker = function (registration) {
	        if (!(registration instanceof ServiceWorkerRegistration)) {
	            throw errorFactory.create(ERROR_CODES.SW_REGISTRATION_EXPECTED);
	        }
	        if (this.registrationToUse != null) {
	            throw errorFactory.create(ERROR_CODES.USE_SW_BEFORE_GET_TOKEN);
	        }
	        this.registrationToUse = registration;
	    };
	    /**
	     * This method allows a developer to override the default vapid key
	     * and instead use a custom VAPID public key.
	     *
	     * @param publicKey A URL safe base64 encoded string.
	     */
	    WindowController.prototype.usePublicVapidKey = function (publicKey) {
	        if (typeof publicKey !== 'string') {
	            throw errorFactory.create(ERROR_CODES.INVALID_PUBLIC_VAPID_KEY);
	        }
	        if (this.publicVapidKeyToUse != null) {
	            throw errorFactory.create(ERROR_CODES.USE_PUBLIC_KEY_BEFORE_GET_TOKEN);
	        }
	        var parsedKey = base64ToArrayBuffer(publicKey);
	        if (parsedKey.length !== 65) {
	            throw errorFactory.create(ERROR_CODES.PUBLIC_KEY_DECRYPTION_FAILED);
	        }
	        this.publicVapidKeyToUse = parsedKey;
	    };
	    /**
	     * @export
	     * @param nextOrObserver An observer object or a function triggered on
	     * message.
	     * @param error A function triggered on message error.
	     * @param completed function triggered when the observer is removed.
	     * @return The unsubscribe function for the observer.
	     */
	    WindowController.prototype.onMessage = function (nextOrObserver, error, completed) {
	        if (typeof nextOrObserver === 'function') {
	            return this.onMessageInternal(nextOrObserver, error, completed);
	        }
	        else {
	            return this.onMessageInternal(nextOrObserver);
	        }
	    };
	    /**
	     * @param nextOrObserver An observer object or a function triggered on token
	     * refresh.
	     * @param error A function triggered on token refresh error.
	     * @param completed function triggered when the observer is removed.
	     * @return The unsubscribe function for the observer.
	     */
	    WindowController.prototype.onTokenRefresh = function (nextOrObserver, error, completed) {
	        if (typeof nextOrObserver === 'function') {
	            return this.onTokenRefreshInternal(nextOrObserver, error, completed);
	        }
	        else {
	            return this.onTokenRefreshInternal(nextOrObserver);
	        }
	    };
	    /**
	     * Given a registration, wait for the service worker it relates to
	     * become activer
	     * @param registration Registration to wait for service worker to become active
	     * @return Wait for service worker registration to become active
	     */
	    // Visible for testing
	    // TODO: Make private
	    WindowController.prototype.waitForRegistrationToActivate_ = function (registration) {
	        var serviceWorker = registration.installing || registration.waiting || registration.active;
	        return new Promise(function (resolve, reject) {
	            if (!serviceWorker) {
	                // This is a rare scenario but has occured in firefox
	                reject(errorFactory.create(ERROR_CODES.NO_SW_IN_REG));
	                return;
	            }
	            // Because the Promise function is called on next tick there is a
	            // small chance that the worker became active or redundant already.
	            if (serviceWorker.state === 'activated') {
	                resolve(registration);
	                return;
	            }
	            if (serviceWorker.state === 'redundant') {
	                reject(errorFactory.create(ERROR_CODES.SW_REG_REDUNDANT));
	                return;
	            }
	            var stateChangeListener = function () {
	                if (serviceWorker.state === 'activated') {
	                    resolve(registration);
	                }
	                else if (serviceWorker.state === 'redundant') {
	                    reject(errorFactory.create(ERROR_CODES.SW_REG_REDUNDANT));
	                }
	                else {
	                    // Return early and wait to next state change
	                    return;
	                }
	                serviceWorker.removeEventListener('statechange', stateChangeListener);
	            };
	            serviceWorker.addEventListener('statechange', stateChangeListener);
	        });
	    };
	    /**
	     * This will register the default service worker and return the registration
	     * @return The service worker registration to be used for the push service.
	     */
	    WindowController.prototype.getSWRegistration_ = function () {
	        var _this = this;
	        if (this.registrationToUse) {
	            return this.waitForRegistrationToActivate_(this.registrationToUse);
	        }
	        // Make the registration null so we know useServiceWorker will not
	        // use a new service worker as registrationToUse is no longer undefined
	        this.registrationToUse = null;
	        return navigator.serviceWorker
	            .register(DEFAULT_SW_PATH, {
	            scope: DEFAULT_SW_SCOPE
	        })
	            .catch(function (err) {
	            throw errorFactory.create(ERROR_CODES.FAILED_DEFAULT_REGISTRATION, {
	                browserErrorMessage: err.message
	            });
	        })
	            .then(function (registration) {
	            return _this.waitForRegistrationToActivate_(registration).then(function () {
	                _this.registrationToUse = registration;
	                // We update after activation due to an issue with Firefox v49 where
	                // a race condition occassionally causes the service work to not
	                // install
	                registration.update();
	                return registration;
	            });
	        });
	    };
	    /**
	     * This will return the default VAPID key or the uint8array version of the public VAPID key
	     * provided by the developer.
	     */
	    WindowController.prototype.getPublicVapidKey_ = function () {
	        return tslib_1.__awaiter(this, void 0, void 0, function () {
	            return tslib_1.__generator(this, function (_a) {
	                if (this.publicVapidKeyToUse) {
	                    return [2 /*return*/, this.publicVapidKeyToUse];
	                }
	                return [2 /*return*/, DEFAULT_PUBLIC_VAPID_KEY];
	            });
	        });
	    };
	    /**
	     * This method will set up a message listener to handle
	     * events from the service worker that should trigger
	     * events in the page.
	     */
	    // Visible for testing
	    // TODO: Make private
	    WindowController.prototype.setupSWMessageListener_ = function () {
	        var _this = this;
	        navigator.serviceWorker.addEventListener('message', function (event) {
	            if (!event.data || !event.data[MessageParameter.TYPE_OF_MSG]) {
	                // Not a message from FCM
	                return;
	            }
	            var workerPageMessage = event.data;
	            switch (workerPageMessage[MessageParameter.TYPE_OF_MSG]) {
	                case MessageType.PUSH_MSG_RECEIVED:
	                case MessageType.NOTIFICATION_CLICKED:
	                    var pushMessage = workerPageMessage[MessageParameter.DATA];
	                    if (_this.messageObserver) {
	                        _this.messageObserver.next(pushMessage);
	                    }
	                    break;
	                default:
	                    // Noop.
	                    break;
	            }
	        }, false);
	    };
	    return WindowController;
	}(BaseController));
	/**
	 * The method checks that a manifest is defined and has the correct GCM
	 * sender ID.
	 * @return Returns a promise that resolves if the manifest matches
	 * our required sender ID
	 */
	// Exported for testing
	function manifestCheck() {
	    return tslib_1.__awaiter(this, void 0, void 0, function () {
	        var manifestTag, manifestContent, response, e_1;
	        return tslib_1.__generator(this, function (_a) {
	            switch (_a.label) {
	                case 0:
	                    manifestTag = document.querySelector('link[rel="manifest"]');
	                    if (!manifestTag) {
	                        return [2 /*return*/];
	                    }
	                    _a.label = 1;
	                case 1:
	                    _a.trys.push([1, 4, , 5]);
	                    return [4 /*yield*/, fetch(manifestTag.href)];
	                case 2:
	                    response = _a.sent();
	                    return [4 /*yield*/, response.json()];
	                case 3:
	                    manifestContent = _a.sent();
	                    return [3 /*break*/, 5];
	                case 4:
	                    e_1 = _a.sent();
	                    // If the download or parsing fails allow check.
	                    // We only want to error if we KNOW that the gcm_sender_id is incorrect.
	                    return [2 /*return*/];
	                case 5:
	                    if (!manifestContent || !manifestContent.gcm_sender_id) {
	                        return [2 /*return*/];
	                    }
	                    if (manifestContent.gcm_sender_id !== '103953800507') {
	                        throw errorFactory.create(ERROR_CODES.INCORRECT_GCM_SENDER_ID);
	                    }
	                    return [2 /*return*/];
	            }
	        });
	    });
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	function registerMessaging(instance) {
	    var messagingName = 'messaging';
	    var factoryMethod = function (app) {
	        if (!isSupported()) {
	            throw errorFactory.create(ERROR_CODES.UNSUPPORTED_BROWSER);
	        }
	        if (self && 'ServiceWorkerGlobalScope' in self) {
	            // Running in ServiceWorker context
	            return new SwController(app);
	        }
	        else {
	            // Assume we are in the window context.
	            return new WindowController(app);
	        }
	    };
	    var namespaceExports = {
	        isSupported: isSupported
	    };
	    instance.INTERNAL.registerService(messagingName, factoryMethod, namespaceExports);
	}
	registerMessaging(firebase);
	function isSupported() {
	    if (self && 'ServiceWorkerGlobalScope' in self) {
	        // Running in ServiceWorker context
	        return isSWControllerSupported();
	    }
	    else {
	        // Assume we are in the window context.
	        return isWindowControllerSupported();
	    }
	}
	/**
	 * Checks to see if the required APIs exist.
	 */
	function isWindowControllerSupported() {
	    return (navigator.cookieEnabled &&
	        'serviceWorker' in navigator &&
	        'PushManager' in window &&
	        'Notification' in window &&
	        'fetch' in window &&
	        ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification') &&
	        PushSubscription.prototype.hasOwnProperty('getKey'));
	}
	/**
	 * Checks to see if the required APIs exist within SW Context.
	 */
	function isSWControllerSupported() {
	    return ('PushManager' in self &&
	        'Notification' in self &&
	        ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification') &&
	        PushSubscription.prototype.hasOwnProperty('getKey'));
	}
	
	exports.registerMessaging = registerMessaging;
	exports.isSupported = isSupported;


/***/ }),

/***/ 205:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, global) {'use strict';
	
	__webpack_require__(498);
	
	// Store setTimeout reference so promise-polyfill will be unaffected by
	// other code modifying setTimeout (like sinon.useFakeTimers())
	var setTimeoutFunc = setTimeout;
	
	function noop() {}
	
	// Polyfill for Function.prototype.bind
	function bind(fn, thisArg) {
	  return function() {
	    fn.apply(thisArg, arguments);
	  };
	}
	
	function Promise(fn) {
	  if (!(this instanceof Promise))
	    throw new TypeError('Promises must be constructed via new');
	  if (typeof fn !== 'function') throw new TypeError('not a function');
	  this._state = 0;
	  this._handled = false;
	  this._value = undefined;
	  this._deferreds = [];
	
	  doResolve(fn, this);
	}
	
	function handle(self, deferred) {
	  while (self._state === 3) {
	    self = self._value;
	  }
	  if (self._state === 0) {
	    self._deferreds.push(deferred);
	    return;
	  }
	  self._handled = true;
	  Promise._immediateFn(function() {
	    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
	    if (cb === null) {
	      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
	      return;
	    }
	    var ret;
	    try {
	      ret = cb(self._value);
	    } catch (e) {
	      reject(deferred.promise, e);
	      return;
	    }
	    resolve(deferred.promise, ret);
	  });
	}
	
	function resolve(self, newValue) {
	  try {
	    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
	    if (newValue === self)
	      throw new TypeError('A promise cannot be resolved with itself.');
	    if (
	      newValue &&
	      (typeof newValue === 'object' || typeof newValue === 'function')
	    ) {
	      var then = newValue.then;
	      if (newValue instanceof Promise) {
	        self._state = 3;
	        self._value = newValue;
	        finale(self);
	        return;
	      } else if (typeof then === 'function') {
	        doResolve(bind(then, newValue), self);
	        return;
	      }
	    }
	    self._state = 1;
	    self._value = newValue;
	    finale(self);
	  } catch (e) {
	    reject(self, e);
	  }
	}
	
	function reject(self, newValue) {
	  self._state = 2;
	  self._value = newValue;
	  finale(self);
	}
	
	function finale(self) {
	  if (self._state === 2 && self._deferreds.length === 0) {
	    Promise._immediateFn(function() {
	      if (!self._handled) {
	        Promise._unhandledRejectionFn(self._value);
	      }
	    });
	  }
	
	  for (var i = 0, len = self._deferreds.length; i < len; i++) {
	    handle(self, self._deferreds[i]);
	  }
	  self._deferreds = null;
	}
	
	function Handler(onFulfilled, onRejected, promise) {
	  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
	  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
	  this.promise = promise;
	}
	
	/**
	 * Take a potentially misbehaving resolver function and make sure
	 * onFulfilled and onRejected are only called once.
	 *
	 * Makes no guarantees about asynchrony.
	 */
	function doResolve(fn, self) {
	  var done = false;
	  try {
	    fn(
	      function(value) {
	        if (done) return;
	        done = true;
	        resolve(self, value);
	      },
	      function(reason) {
	        if (done) return;
	        done = true;
	        reject(self, reason);
	      }
	    );
	  } catch (ex) {
	    if (done) return;
	    done = true;
	    reject(self, ex);
	  }
	}
	
	Promise.prototype['catch'] = function(onRejected) {
	  return this.then(null, onRejected);
	};
	
	Promise.prototype.then = function(onFulfilled, onRejected) {
	  var prom = new this.constructor(noop);
	
	  handle(this, new Handler(onFulfilled, onRejected, prom));
	  return prom;
	};
	
	Promise.prototype['finally'] = function(callback) {
	  var constructor = this.constructor;
	  return this.then(
	    function(value) {
	      return constructor.resolve(callback()).then(function() {
	        return value;
	      });
	    },
	    function(reason) {
	      return constructor.resolve(callback()).then(function() {
	        return constructor.reject(reason);
	      });
	    }
	  );
	};
	
	Promise.all = function(arr) {
	  return new Promise(function(resolve, reject) {
	    if (!arr || typeof arr.length === 'undefined')
	      throw new TypeError('Promise.all accepts an array');
	    var args = Array.prototype.slice.call(arr);
	    if (args.length === 0) return resolve([]);
	    var remaining = args.length;
	
	    function res(i, val) {
	      try {
	        if (val && (typeof val === 'object' || typeof val === 'function')) {
	          var then = val.then;
	          if (typeof then === 'function') {
	            then.call(
	              val,
	              function(val) {
	                res(i, val);
	              },
	              reject
	            );
	            return;
	          }
	        }
	        args[i] = val;
	        if (--remaining === 0) {
	          resolve(args);
	        }
	      } catch (ex) {
	        reject(ex);
	      }
	    }
	
	    for (var i = 0; i < args.length; i++) {
	      res(i, args[i]);
	    }
	  });
	};
	
	Promise.resolve = function(value) {
	  if (value && typeof value === 'object' && value.constructor === Promise) {
	    return value;
	  }
	
	  return new Promise(function(resolve) {
	    resolve(value);
	  });
	};
	
	Promise.reject = function(value) {
	  return new Promise(function(resolve, reject) {
	    reject(value);
	  });
	};
	
	Promise.race = function(values) {
	  return new Promise(function(resolve, reject) {
	    for (var i = 0, len = values.length; i < len; i++) {
	      values[i].then(resolve, reject);
	    }
	  });
	};
	
	// Use polyfill for setImmediate for performance gains
	Promise._immediateFn =
	  (typeof setImmediate === 'function' &&
	    function(fn) {
	      setImmediate(fn);
	    }) ||
	  function(fn) {
	    setTimeoutFunc(fn, 0);
	  };
	
	Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
	  if (typeof console !== 'undefined' && console) {
	    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
	  }
	};
	
	var globalNS = (function() {
	  // the only reliable means to get the global object is
	  // `Function('return this')()`
	  // However, this causes CSP violations in Chrome apps.
	  if (typeof self !== 'undefined') {
	    return self;
	  }
	  if (typeof window !== 'undefined') {
	    return window;
	  }
	  if (typeof global !== 'undefined') {
	    return global;
	  }
	  throw new Error('unable to locate global object');
	})();
	
	if (!globalNS.Promise) {
	  globalNS.Promise = Promise;
	}
	
	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}
	
	var _global = createCommonjsModule(function (module) {
	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self
	  // eslint-disable-next-line no-new-func
	  : Function('return this')();
	if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
	});
	
	var _core = createCommonjsModule(function (module) {
	var core = module.exports = { version: '2.5.5' };
	if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
	});
	var _core_1 = _core.version;
	
	var _isObject = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};
	
	var _anObject = function (it) {
	  if (!_isObject(it)) throw TypeError(it + ' is not an object!');
	  return it;
	};
	
	var _fails = function (exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};
	
	// Thank's IE8 for his funny defineProperty
	var _descriptors = !_fails(function () {
	  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
	});
	
	var document = _global.document;
	// typeof document.createElement is 'object' in old IE
	var is = _isObject(document) && _isObject(document.createElement);
	var _domCreate = function (it) {
	  return is ? document.createElement(it) : {};
	};
	
	var _ie8DomDefine = !_descriptors && !_fails(function () {
	  return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
	});
	
	// 7.1.1 ToPrimitive(input [, PreferredType])
	
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	var _toPrimitive = function (it, S) {
	  if (!_isObject(it)) return it;
	  var fn, val;
	  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};
	
	var dP = Object.defineProperty;
	
	var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
	  _anObject(O);
	  P = _toPrimitive(P, true);
	  _anObject(Attributes);
	  if (_ie8DomDefine) try {
	    return dP(O, P, Attributes);
	  } catch (e) { /* empty */ }
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};
	
	var _objectDp = {
		f: f
	};
	
	var _propertyDesc = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};
	
	var _hide = _descriptors ? function (object, key, value) {
	  return _objectDp.f(object, key, _propertyDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};
	
	var hasOwnProperty = {}.hasOwnProperty;
	var _has = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};
	
	var id = 0;
	var px = Math.random();
	var _uid = function (key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};
	
	var _redefine = createCommonjsModule(function (module) {
	var SRC = _uid('src');
	var TO_STRING = 'toString';
	var $toString = Function[TO_STRING];
	var TPL = ('' + $toString).split(TO_STRING);
	
	_core.inspectSource = function (it) {
	  return $toString.call(it);
	};
	
	(module.exports = function (O, key, val, safe) {
	  var isFunction = typeof val == 'function';
	  if (isFunction) _has(val, 'name') || _hide(val, 'name', key);
	  if (O[key] === val) return;
	  if (isFunction) _has(val, SRC) || _hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
	  if (O === _global) {
	    O[key] = val;
	  } else if (!safe) {
	    delete O[key];
	    _hide(O, key, val);
	  } else if (O[key]) {
	    O[key] = val;
	  } else {
	    _hide(O, key, val);
	  }
	// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	})(Function.prototype, TO_STRING, function toString() {
	  return typeof this == 'function' && this[SRC] || $toString.call(this);
	});
	});
	
	var _aFunction = function (it) {
	  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
	  return it;
	};
	
	// optional / simple context binding
	
	var _ctx = function (fn, that, length) {
	  _aFunction(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 1: return function (a) {
	      return fn.call(that, a);
	    };
	    case 2: return function (a, b) {
	      return fn.call(that, a, b);
	    };
	    case 3: return function (a, b, c) {
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};
	
	var PROTOTYPE = 'prototype';
	
	var $export = function (type, name, source) {
	  var IS_FORCED = type & $export.F;
	  var IS_GLOBAL = type & $export.G;
	  var IS_STATIC = type & $export.S;
	  var IS_PROTO = type & $export.P;
	  var IS_BIND = type & $export.B;
	  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] || (_global[name] = {}) : (_global[name] || {})[PROTOTYPE];
	  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
	  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
	  var key, own, out, exp;
	  if (IS_GLOBAL) source = name;
	  for (key in source) {
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    // export native or passed
	    out = (own ? target : source)[key];
	    // bind timers to global for call from export context
	    exp = IS_BIND && own ? _ctx(out, _global) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
	    // extend global
	    if (target) _redefine(target, key, out, type & $export.U);
	    // export
	    if (exports[key] != out) _hide(exports, key, exp);
	    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
	  }
	};
	_global.core = _core;
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library`
	var _export = $export;
	
	var toString = {}.toString;
	
	var _cof = function (it) {
	  return toString.call(it).slice(8, -1);
	};
	
	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	
	// eslint-disable-next-line no-prototype-builtins
	var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
	  return _cof(it) == 'String' ? it.split('') : Object(it);
	};
	
	// 7.2.1 RequireObjectCoercible(argument)
	var _defined = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on  " + it);
	  return it;
	};
	
	// 7.1.13 ToObject(argument)
	
	var _toObject = function (it) {
	  return Object(_defined(it));
	};
	
	// 7.1.4 ToInteger
	var ceil = Math.ceil;
	var floor = Math.floor;
	var _toInteger = function (it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};
	
	// 7.1.15 ToLength
	
	var min = Math.min;
	var _toLength = function (it) {
	  return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};
	
	// 7.2.2 IsArray(argument)
	
	var _isArray = Array.isArray || function isArray(arg) {
	  return _cof(arg) == 'Array';
	};
	
	var SHARED = '__core-js_shared__';
	var store = _global[SHARED] || (_global[SHARED] = {});
	var _shared = function (key) {
	  return store[key] || (store[key] = {});
	};
	
	var _wks = createCommonjsModule(function (module) {
	var store = _shared('wks');
	
	var Symbol = _global.Symbol;
	var USE_SYMBOL = typeof Symbol == 'function';
	
	var $exports = module.exports = function (name) {
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : _uid)('Symbol.' + name));
	};
	
	$exports.store = store;
	});
	
	var SPECIES = _wks('species');
	
	var _arraySpeciesConstructor = function (original) {
	  var C;
	  if (_isArray(original)) {
	    C = original.constructor;
	    // cross-realm fallback
	    if (typeof C == 'function' && (C === Array || _isArray(C.prototype))) C = undefined;
	    if (_isObject(C)) {
	      C = C[SPECIES];
	      if (C === null) C = undefined;
	    }
	  } return C === undefined ? Array : C;
	};
	
	// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
	
	
	var _arraySpeciesCreate = function (original, length) {
	  return new (_arraySpeciesConstructor(original))(length);
	};
	
	// 0 -> Array#forEach
	// 1 -> Array#map
	// 2 -> Array#filter
	// 3 -> Array#some
	// 4 -> Array#every
	// 5 -> Array#find
	// 6 -> Array#findIndex
	
	
	
	
	
	var _arrayMethods = function (TYPE, $create) {
	  var IS_MAP = TYPE == 1;
	  var IS_FILTER = TYPE == 2;
	  var IS_SOME = TYPE == 3;
	  var IS_EVERY = TYPE == 4;
	  var IS_FIND_INDEX = TYPE == 6;
	  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
	  var create = $create || _arraySpeciesCreate;
	  return function ($this, callbackfn, that) {
	    var O = _toObject($this);
	    var self = _iobject(O);
	    var f = _ctx(callbackfn, that, 3);
	    var length = _toLength(self.length);
	    var index = 0;
	    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
	    var val, res;
	    for (;length > index; index++) if (NO_HOLES || index in self) {
	      val = self[index];
	      res = f(val, index, O);
	      if (TYPE) {
	        if (IS_MAP) result[index] = res;   // map
	        else if (res) switch (TYPE) {
	          case 3: return true;             // some
	          case 5: return val;              // find
	          case 6: return index;            // findIndex
	          case 2: result.push(val);        // filter
	        } else if (IS_EVERY) return false; // every
	      }
	    }
	    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
	  };
	};
	
	// 22.1.3.31 Array.prototype[@@unscopables]
	var UNSCOPABLES = _wks('unscopables');
	var ArrayProto = Array.prototype;
	if (ArrayProto[UNSCOPABLES] == undefined) _hide(ArrayProto, UNSCOPABLES, {});
	var _addToUnscopables = function (key) {
	  ArrayProto[UNSCOPABLES][key] = true;
	};
	
	// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
	
	var $find = _arrayMethods(5);
	var KEY = 'find';
	var forced = true;
	// Shouldn't skip holes
	if (KEY in []) Array(1)[KEY](function () { forced = false; });
	_export(_export.P + _export.F * forced, 'Array', {
	  find: function find(callbackfn /* , that = undefined */) {
	    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});
	_addToUnscopables(KEY);
	
	var find = _core.Array.find;
	
	// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
	
	var $find$1 = _arrayMethods(6);
	var KEY$1 = 'findIndex';
	var forced$1 = true;
	// Shouldn't skip holes
	if (KEY$1 in []) Array(1)[KEY$1](function () { forced$1 = false; });
	_export(_export.P + _export.F * forced$1, 'Array', {
	  findIndex: function findIndex(callbackfn /* , that = undefined */) {
	    return $find$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});
	_addToUnscopables(KEY$1);
	
	var findIndex = _core.Array.findIndex;
	
	// to indexed object, toObject with fallback for non-array-like ES3 strings
	
	
	var _toIobject = function (it) {
	  return _iobject(_defined(it));
	};
	
	var max = Math.max;
	var min$1 = Math.min;
	var _toAbsoluteIndex = function (index, length) {
	  index = _toInteger(index);
	  return index < 0 ? max(index + length, 0) : min$1(index, length);
	};
	
	// false -> Array#indexOf
	// true  -> Array#includes
	
	
	
	var _arrayIncludes = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = _toIobject($this);
	    var length = _toLength(O.length);
	    var index = _toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare
	      if (value != value) return true;
	    // Array#indexOf ignores holes, Array#includes - not
	    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
	      if (O[index] === el) return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};
	
	var shared = _shared('keys');
	
	var _sharedKey = function (key) {
	  return shared[key] || (shared[key] = _uid(key));
	};
	
	var arrayIndexOf = _arrayIncludes(false);
	var IE_PROTO = _sharedKey('IE_PROTO');
	
	var _objectKeysInternal = function (object, names) {
	  var O = _toIobject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) if (key != IE_PROTO) _has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while (names.length > i) if (_has(O, key = names[i++])) {
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};
	
	// IE 8- don't enum bug keys
	var _enumBugKeys = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');
	
	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	
	
	
	var _objectKeys = Object.keys || function keys(O) {
	  return _objectKeysInternal(O, _enumBugKeys);
	};
	
	var f$1 = Object.getOwnPropertySymbols;
	
	var _objectGops = {
		f: f$1
	};
	
	var f$2 = {}.propertyIsEnumerable;
	
	var _objectPie = {
		f: f$2
	};
	
	// 19.1.2.1 Object.assign(target, source, ...)
	
	
	
	
	
	var $assign = Object.assign;
	
	// should work with symbols and should have deterministic property order (V8 bug)
	var _objectAssign = !$assign || _fails(function () {
	  var A = {};
	  var B = {};
	  // eslint-disable-next-line no-undef
	  var S = Symbol();
	  var K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function (k) { B[k] = k; });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
	  var T = _toObject(target);
	  var aLen = arguments.length;
	  var index = 1;
	  var getSymbols = _objectGops.f;
	  var isEnum = _objectPie.f;
	  while (aLen > index) {
	    var S = _iobject(arguments[index++]);
	    var keys = getSymbols ? _objectKeys(S).concat(getSymbols(S)) : _objectKeys(S);
	    var length = keys.length;
	    var j = 0;
	    var key;
	    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
	  } return T;
	} : $assign;
	
	// 19.1.3.1 Object.assign(target, source)
	
	
	_export(_export.S + _export.F, 'Object', { assign: _objectAssign });
	
	var assign = _core.Object.assign;
	
	// 7.2.8 IsRegExp(argument)
	
	
	var MATCH = _wks('match');
	var _isRegexp = function (it) {
	  var isRegExp;
	  return _isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : _cof(it) == 'RegExp');
	};
	
	// helper for String#{startsWith, endsWith, includes}
	
	
	
	var _stringContext = function (that, searchString, NAME) {
	  if (_isRegexp(searchString)) throw TypeError('String#' + NAME + " doesn't accept regex!");
	  return String(_defined(that));
	};
	
	var MATCH$1 = _wks('match');
	var _failsIsRegexp = function (KEY) {
	  var re = /./;
	  try {
	    '/./'[KEY](re);
	  } catch (e) {
	    try {
	      re[MATCH$1] = false;
	      return !'/./'[KEY](re);
	    } catch (f) { /* empty */ }
	  } return true;
	};
	
	var STARTS_WITH = 'startsWith';
	var $startsWith = ''[STARTS_WITH];
	
	_export(_export.P + _export.F * _failsIsRegexp(STARTS_WITH), 'String', {
	  startsWith: function startsWith(searchString /* , position = 0 */) {
	    var that = _stringContext(this, searchString, STARTS_WITH);
	    var index = _toLength(Math.min(arguments.length > 1 ? arguments[1] : undefined, that.length));
	    var search = String(searchString);
	    return $startsWith
	      ? $startsWith.call(that, search, index)
	      : that.slice(index, index + search.length) === search;
	  }
	});
	
	var startsWith = _core.String.startsWith;
	
	var _stringRepeat = function repeat(count) {
	  var str = String(_defined(this));
	  var res = '';
	  var n = _toInteger(count);
	  if (n < 0 || n == Infinity) throw RangeError("Count can't be negative");
	  for (;n > 0; (n >>>= 1) && (str += str)) if (n & 1) res += str;
	  return res;
	};
	
	_export(_export.P, 'String', {
	  // 21.1.3.13 String.prototype.repeat(count)
	  repeat: _stringRepeat
	});
	
	var repeat = _core.String.repeat;
	
	var _meta = createCommonjsModule(function (module) {
	var META = _uid('meta');
	
	
	var setDesc = _objectDp.f;
	var id = 0;
	var isExtensible = Object.isExtensible || function () {
	  return true;
	};
	var FREEZE = !_fails(function () {
	  return isExtensible(Object.preventExtensions({}));
	});
	var setMeta = function (it) {
	  setDesc(it, META, { value: {
	    i: 'O' + ++id, // object ID
	    w: {}          // weak collections IDs
	  } });
	};
	var fastKey = function (it, create) {
	  // return primitive with prefix
	  if (!_isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if (!_has(it, META)) {
	    // can't set metadata to uncaught frozen object
	    if (!isExtensible(it)) return 'F';
	    // not necessary to add metadata
	    if (!create) return 'E';
	    // add missing metadata
	    setMeta(it);
	  // return object ID
	  } return it[META].i;
	};
	var getWeak = function (it, create) {
	  if (!_has(it, META)) {
	    // can't set metadata to uncaught frozen object
	    if (!isExtensible(it)) return true;
	    // not necessary to add metadata
	    if (!create) return false;
	    // add missing metadata
	    setMeta(it);
	  // return hash weak collections IDs
	  } return it[META].w;
	};
	// add metadata on freeze-family methods calling
	var onFreeze = function (it) {
	  if (FREEZE && meta.NEED && isExtensible(it) && !_has(it, META)) setMeta(it);
	  return it;
	};
	var meta = module.exports = {
	  KEY: META,
	  NEED: false,
	  fastKey: fastKey,
	  getWeak: getWeak,
	  onFreeze: onFreeze
	};
	});
	var _meta_1 = _meta.KEY;
	var _meta_2 = _meta.NEED;
	var _meta_3 = _meta.fastKey;
	var _meta_4 = _meta.getWeak;
	var _meta_5 = _meta.onFreeze;
	
	var def = _objectDp.f;
	
	var TAG = _wks('toStringTag');
	
	var _setToStringTag = function (it, tag, stat) {
	  if (it && !_has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
	};
	
	var f$3 = _wks;
	
	var _wksExt = {
		f: f$3
	};
	
	var _library = false;
	
	var defineProperty = _objectDp.f;
	var _wksDefine = function (name) {
	  var $Symbol = _core.Symbol || (_core.Symbol = _library ? {} : _global.Symbol || {});
	  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: _wksExt.f(name) });
	};
	
	// all enumerable object keys, includes symbols
	
	
	
	var _enumKeys = function (it) {
	  var result = _objectKeys(it);
	  var getSymbols = _objectGops.f;
	  if (getSymbols) {
	    var symbols = getSymbols(it);
	    var isEnum = _objectPie.f;
	    var i = 0;
	    var key;
	    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
	  } return result;
	};
	
	var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
	  _anObject(O);
	  var keys = _objectKeys(Properties);
	  var length = keys.length;
	  var i = 0;
	  var P;
	  while (length > i) _objectDp.f(O, P = keys[i++], Properties[P]);
	  return O;
	};
	
	var document$1 = _global.document;
	var _html = document$1 && document$1.documentElement;
	
	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	
	
	
	var IE_PROTO$1 = _sharedKey('IE_PROTO');
	var Empty = function () { /* empty */ };
	var PROTOTYPE$1 = 'prototype';
	
	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function () {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = _domCreate('iframe');
	  var i = _enumBugKeys.length;
	  var lt = '<';
	  var gt = '>';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  _html.appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while (i--) delete createDict[PROTOTYPE$1][_enumBugKeys[i]];
	  return createDict();
	};
	
	var _objectCreate = Object.create || function create(O, Properties) {
	  var result;
	  if (O !== null) {
	    Empty[PROTOTYPE$1] = _anObject(O);
	    result = new Empty();
	    Empty[PROTOTYPE$1] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO$1] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : _objectDps(result, Properties);
	};
	
	// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
	
	var hiddenKeys = _enumBugKeys.concat('length', 'prototype');
	
	var f$4 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return _objectKeysInternal(O, hiddenKeys);
	};
	
	var _objectGopn = {
		f: f$4
	};
	
	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
	
	var gOPN = _objectGopn.f;
	var toString$1 = {}.toString;
	
	var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];
	
	var getWindowNames = function (it) {
	  try {
	    return gOPN(it);
	  } catch (e) {
	    return windowNames.slice();
	  }
	};
	
	var f$5 = function getOwnPropertyNames(it) {
	  return windowNames && toString$1.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(_toIobject(it));
	};
	
	var _objectGopnExt = {
		f: f$5
	};
	
	var gOPD = Object.getOwnPropertyDescriptor;
	
	var f$6 = _descriptors ? gOPD : function getOwnPropertyDescriptor(O, P) {
	  O = _toIobject(O);
	  P = _toPrimitive(P, true);
	  if (_ie8DomDefine) try {
	    return gOPD(O, P);
	  } catch (e) { /* empty */ }
	  if (_has(O, P)) return _propertyDesc(!_objectPie.f.call(O, P), O[P]);
	};
	
	var _objectGopd = {
		f: f$6
	};
	
	// ECMAScript 6 symbols shim
	
	
	
	
	
	var META = _meta.KEY;
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	var gOPD$1 = _objectGopd.f;
	var dP$1 = _objectDp.f;
	var gOPN$1 = _objectGopnExt.f;
	var $Symbol = _global.Symbol;
	var $JSON = _global.JSON;
	var _stringify = $JSON && $JSON.stringify;
	var PROTOTYPE$2 = 'prototype';
	var HIDDEN = _wks('_hidden');
	var TO_PRIMITIVE = _wks('toPrimitive');
	var isEnum = {}.propertyIsEnumerable;
	var SymbolRegistry = _shared('symbol-registry');
	var AllSymbols = _shared('symbols');
	var OPSymbols = _shared('op-symbols');
	var ObjectProto = Object[PROTOTYPE$2];
	var USE_NATIVE = typeof $Symbol == 'function';
	var QObject = _global.QObject;
	// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
	var setter = !QObject || !QObject[PROTOTYPE$2] || !QObject[PROTOTYPE$2].findChild;
	
	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDesc = _descriptors && _fails(function () {
	  return _objectCreate(dP$1({}, 'a', {
	    get: function () { return dP$1(this, 'a', { value: 7 }).a; }
	  })).a != 7;
	}) ? function (it, key, D) {
	  var protoDesc = gOPD$1(ObjectProto, key);
	  if (protoDesc) delete ObjectProto[key];
	  dP$1(it, key, D);
	  if (protoDesc && it !== ObjectProto) dP$1(ObjectProto, key, protoDesc);
	} : dP$1;
	
	var wrap = function (tag) {
	  var sym = AllSymbols[tag] = _objectCreate($Symbol[PROTOTYPE$2]);
	  sym._k = tag;
	  return sym;
	};
	
	var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
	  return typeof it == 'symbol';
	} : function (it) {
	  return it instanceof $Symbol;
	};
	
	var $defineProperty = function defineProperty(it, key, D) {
	  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
	  _anObject(it);
	  key = _toPrimitive(key, true);
	  _anObject(D);
	  if (_has(AllSymbols, key)) {
	    if (!D.enumerable) {
	      if (!_has(it, HIDDEN)) dP$1(it, HIDDEN, _propertyDesc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if (_has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
	      D = _objectCreate(D, { enumerable: _propertyDesc(0, false) });
	    } return setSymbolDesc(it, key, D);
	  } return dP$1(it, key, D);
	};
	var $defineProperties = function defineProperties(it, P) {
	  _anObject(it);
	  var keys = _enumKeys(P = _toIobject(P));
	  var i = 0;
	  var l = keys.length;
	  var key;
	  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
	  return it;
	};
	var $create = function create(it, P) {
	  return P === undefined ? _objectCreate(it) : $defineProperties(_objectCreate(it), P);
	};
	var $propertyIsEnumerable = function propertyIsEnumerable(key) {
	  var E = isEnum.call(this, key = _toPrimitive(key, true));
	  if (this === ObjectProto && _has(AllSymbols, key) && !_has(OPSymbols, key)) return false;
	  return E || !_has(this, key) || !_has(AllSymbols, key) || _has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
	};
	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
	  it = _toIobject(it);
	  key = _toPrimitive(key, true);
	  if (it === ObjectProto && _has(AllSymbols, key) && !_has(OPSymbols, key)) return;
	  var D = gOPD$1(it, key);
	  if (D && _has(AllSymbols, key) && !(_has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
	  return D;
	};
	var $getOwnPropertyNames = function getOwnPropertyNames(it) {
	  var names = gOPN$1(_toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (!_has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
	  } return result;
	};
	var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
	  var IS_OP = it === ObjectProto;
	  var names = gOPN$1(IS_OP ? OPSymbols : _toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (_has(AllSymbols, key = names[i++]) && (IS_OP ? _has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
	  } return result;
	};
	
	// 19.4.1.1 Symbol([description])
	if (!USE_NATIVE) {
	  $Symbol = function Symbol() {
	    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
	    var tag = _uid(arguments.length > 0 ? arguments[0] : undefined);
	    var $set = function (value) {
	      if (this === ObjectProto) $set.call(OPSymbols, value);
	      if (_has(this, HIDDEN) && _has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
	      setSymbolDesc(this, tag, _propertyDesc(1, value));
	    };
	    if (_descriptors && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
	    return wrap(tag);
	  };
	  _redefine($Symbol[PROTOTYPE$2], 'toString', function toString() {
	    return this._k;
	  });
	
	  _objectGopd.f = $getOwnPropertyDescriptor;
	  _objectDp.f = $defineProperty;
	  _objectGopn.f = _objectGopnExt.f = $getOwnPropertyNames;
	  _objectPie.f = $propertyIsEnumerable;
	  _objectGops.f = $getOwnPropertySymbols;
	
	  if (_descriptors && !_library) {
	    _redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
	  }
	
	  _wksExt.f = function (name) {
	    return wrap(_wks(name));
	  };
	}
	
	_export(_export.G + _export.W + _export.F * !USE_NATIVE, { Symbol: $Symbol });
	
	for (var es6Symbols = (
	  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
	  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
	).split(','), j = 0; es6Symbols.length > j;)_wks(es6Symbols[j++]);
	
	for (var wellKnownSymbols = _objectKeys(_wks.store), k = 0; wellKnownSymbols.length > k;) _wksDefine(wellKnownSymbols[k++]);
	
	_export(_export.S + _export.F * !USE_NATIVE, 'Symbol', {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function (key) {
	    return _has(SymbolRegistry, key += '')
	      ? SymbolRegistry[key]
	      : SymbolRegistry[key] = $Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(sym) {
	    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
	    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
	  },
	  useSetter: function () { setter = true; },
	  useSimple: function () { setter = false; }
	});
	
	_export(_export.S + _export.F * !USE_NATIVE, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: $create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: $defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: $defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: $getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});
	
	// 24.3.2 JSON.stringify(value [, replacer [, space]])
	$JSON && _export(_export.S + _export.F * (!USE_NATIVE || _fails(function () {
	  var S = $Symbol();
	  // MS Edge converts symbol values to JSON as {}
	  // WebKit converts symbol values to JSON as null
	  // V8 throws on boxed symbols
	  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
	})), 'JSON', {
	  stringify: function stringify(it) {
	    var args = [it];
	    var i = 1;
	    var replacer, $replacer;
	    while (arguments.length > i) args.push(arguments[i++]);
	    $replacer = replacer = args[1];
	    if (!_isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
	    if (!_isArray(replacer)) replacer = function (key, value) {
	      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
	      if (!isSymbol(value)) return value;
	    };
	    args[1] = replacer;
	    return _stringify.apply($JSON, args);
	  }
	});
	
	// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
	$Symbol[PROTOTYPE$2][TO_PRIMITIVE] || _hide($Symbol[PROTOTYPE$2], TO_PRIMITIVE, $Symbol[PROTOTYPE$2].valueOf);
	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	_setToStringTag($Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	_setToStringTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	_setToStringTag(_global.JSON, 'JSON', true);
	
	// getting tag from 19.1.3.6 Object.prototype.toString()
	
	var TAG$1 = _wks('toStringTag');
	// ES3 wrong here
	var ARG = _cof(function () { return arguments; }()) == 'Arguments';
	
	// fallback for IE11 Script Access Denied error
	var tryGet = function (it, key) {
	  try {
	    return it[key];
	  } catch (e) { /* empty */ }
	};
	
	var _classof = function (it) {
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = tryGet(O = Object(it), TAG$1)) == 'string' ? T
	    // builtinTag case
	    : ARG ? _cof(O)
	    // ES3 arguments fallback
	    : (B = _cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};
	
	// 19.1.3.6 Object.prototype.toString()
	
	var test = {};
	test[_wks('toStringTag')] = 'z';
	if (test + '' != '[object z]') {
	  _redefine(Object.prototype, 'toString', function toString() {
	    return '[object ' + _classof(this) + ']';
	  }, true);
	}
	
	_wksDefine('asyncIterator');
	
	_wksDefine('observable');
	
	var symbol = _core.Symbol;
	
	// true  -> String#at
	// false -> String#codePointAt
	var _stringAt = function (TO_STRING) {
	  return function (that, pos) {
	    var s = String(_defined(that));
	    var i = _toInteger(pos);
	    var l = s.length;
	    var a, b;
	    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};
	
	var _iterators = {};
	
	var IteratorPrototype = {};
	
	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	_hide(IteratorPrototype, _wks('iterator'), function () { return this; });
	
	var _iterCreate = function (Constructor, NAME, next) {
	  Constructor.prototype = _objectCreate(IteratorPrototype, { next: _propertyDesc(1, next) });
	  _setToStringTag(Constructor, NAME + ' Iterator');
	};
	
	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
	
	
	var IE_PROTO$2 = _sharedKey('IE_PROTO');
	var ObjectProto$1 = Object.prototype;
	
	var _objectGpo = Object.getPrototypeOf || function (O) {
	  O = _toObject(O);
	  if (_has(O, IE_PROTO$2)) return O[IE_PROTO$2];
	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto$1 : null;
	};
	
	var ITERATOR = _wks('iterator');
	var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
	var FF_ITERATOR = '@@iterator';
	var KEYS = 'keys';
	var VALUES = 'values';
	
	var returnThis = function () { return this; };
	
	var _iterDefine = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
	  _iterCreate(Constructor, NAME, next);
	  var getMethod = function (kind) {
	    if (!BUGGY && kind in proto) return proto[kind];
	    switch (kind) {
	      case KEYS: return function keys() { return new Constructor(this, kind); };
	      case VALUES: return function values() { return new Constructor(this, kind); };
	    } return function entries() { return new Constructor(this, kind); };
	  };
	  var TAG = NAME + ' Iterator';
	  var DEF_VALUES = DEFAULT == VALUES;
	  var VALUES_BUG = false;
	  var proto = Base.prototype;
	  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
	  var $default = $native || getMethod(DEFAULT);
	  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
	  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
	  var methods, key, IteratorPrototype;
	  // Fix native
	  if ($anyNative) {
	    IteratorPrototype = _objectGpo($anyNative.call(new Base()));
	    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
	      // Set @@toStringTag to native iterators
	      _setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if (!_library && typeof IteratorPrototype[ITERATOR] != 'function') _hide(IteratorPrototype, ITERATOR, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if (DEF_VALUES && $native && $native.name !== VALUES) {
	    VALUES_BUG = true;
	    $default = function values() { return $native.call(this); };
	  }
	  // Define iterator
	  if ((!_library || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
	    _hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  _iterators[NAME] = $default;
	  _iterators[TAG] = returnThis;
	  if (DEFAULT) {
	    methods = {
	      values: DEF_VALUES ? $default : getMethod(VALUES),
	      keys: IS_SET ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if (FORCED) for (key in methods) {
	      if (!(key in proto)) _redefine(proto, key, methods[key]);
	    } else _export(_export.P + _export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};
	
	var $at = _stringAt(true);
	
	// 21.1.3.27 String.prototype[@@iterator]()
	_iterDefine(String, 'String', function (iterated) {
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function () {
	  var O = this._t;
	  var index = this._i;
	  var point;
	  if (index >= O.length) return { value: undefined, done: true };
	  point = $at(O, index);
	  this._i += point.length;
	  return { value: point, done: false };
	});
	
	var _iterStep = function (done, value) {
	  return { value: value, done: !!done };
	};
	
	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	var es6_array_iterator = _iterDefine(Array, 'Array', function (iterated, kind) {
	  this._t = _toIobject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function () {
	  var O = this._t;
	  var kind = this._k;
	  var index = this._i++;
	  if (!O || index >= O.length) {
	    this._t = undefined;
	    return _iterStep(1);
	  }
	  if (kind == 'keys') return _iterStep(0, index);
	  if (kind == 'values') return _iterStep(0, O[index]);
	  return _iterStep(0, [index, O[index]]);
	}, 'values');
	
	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	_iterators.Arguments = _iterators.Array;
	
	_addToUnscopables('keys');
	_addToUnscopables('values');
	_addToUnscopables('entries');
	
	var ITERATOR$1 = _wks('iterator');
	var TO_STRING_TAG = _wks('toStringTag');
	var ArrayValues = _iterators.Array;
	
	var DOMIterables = {
	  CSSRuleList: true, // TODO: Not spec compliant, should be false.
	  CSSStyleDeclaration: false,
	  CSSValueList: false,
	  ClientRectList: false,
	  DOMRectList: false,
	  DOMStringList: false,
	  DOMTokenList: true,
	  DataTransferItemList: false,
	  FileList: false,
	  HTMLAllCollection: false,
	  HTMLCollection: false,
	  HTMLFormElement: false,
	  HTMLSelectElement: false,
	  MediaList: true, // TODO: Not spec compliant, should be false.
	  MimeTypeArray: false,
	  NamedNodeMap: false,
	  NodeList: true,
	  PaintRequestList: false,
	  Plugin: false,
	  PluginArray: false,
	  SVGLengthList: false,
	  SVGNumberList: false,
	  SVGPathSegList: false,
	  SVGPointList: false,
	  SVGStringList: false,
	  SVGTransformList: false,
	  SourceBufferList: false,
	  StyleSheetList: true, // TODO: Not spec compliant, should be false.
	  TextTrackCueList: false,
	  TextTrackList: false,
	  TouchList: false
	};
	
	for (var collections = _objectKeys(DOMIterables), i = 0; i < collections.length; i++) {
	  var NAME = collections[i];
	  var explicit = DOMIterables[NAME];
	  var Collection = _global[NAME];
	  var proto = Collection && Collection.prototype;
	  var key;
	  if (proto) {
	    if (!proto[ITERATOR$1]) _hide(proto, ITERATOR$1, ArrayValues);
	    if (!proto[TO_STRING_TAG]) _hide(proto, TO_STRING_TAG, NAME);
	    _iterators[NAME] = ArrayValues;
	    if (explicit) for (key in es6_array_iterator) if (!proto[key]) _redefine(proto, key, es6_array_iterator[key], true);
	  }
	}
	
	var iterator = _wksExt.f('iterator');
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(481).setImmediate, (function() { return this; }())))

/***/ }),

/***/ 128:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', { value: true });
	
	var tslib_1 = __webpack_require__(202);
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * @fileoverview Firebase constants.  Some of these (@defines) can be overridden at compile-time.
	 */
	var CONSTANTS = {
	    /**
	     * @define {boolean} Whether this is the client Node.js SDK.
	     */
	    NODE_CLIENT: false,
	    /**
	     * @define {boolean} Whether this is the Admin Node.js SDK.
	     */
	    NODE_ADMIN: false,
	    /**
	     * Firebase SDK Version
	     */
	    SDK_VERSION: '${JSCORE_VERSION}'
	};
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * Throws an error if the provided assertion is falsy
	 * @param {*} assertion The assertion to be tested for falsiness
	 * @param {!string} message The message to display if the check fails
	 */
	var assert = function (assertion, message) {
	    if (!assertion) {
	        throw assertionError(message);
	    }
	};
	/**
	 * Returns an Error object suitable for throwing.
	 * @param {string} message
	 * @return {!Error}
	 */
	var assertionError = function (message) {
	    return new Error('Firebase Database (' +
	        CONSTANTS.SDK_VERSION +
	        ') INTERNAL ASSERT FAILED: ' +
	        message);
	};
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var stringToByteArray = function (str) {
	    // TODO(user): Use native implementations if/when available
	    var out = [], p = 0;
	    for (var i = 0; i < str.length; i++) {
	        var c = str.charCodeAt(i);
	        if (c < 128) {
	            out[p++] = c;
	        }
	        else if (c < 2048) {
	            out[p++] = (c >> 6) | 192;
	            out[p++] = (c & 63) | 128;
	        }
	        else if ((c & 0xfc00) == 0xd800 &&
	            i + 1 < str.length &&
	            (str.charCodeAt(i + 1) & 0xfc00) == 0xdc00) {
	            // Surrogate Pair
	            c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
	            out[p++] = (c >> 18) | 240;
	            out[p++] = ((c >> 12) & 63) | 128;
	            out[p++] = ((c >> 6) & 63) | 128;
	            out[p++] = (c & 63) | 128;
	        }
	        else {
	            out[p++] = (c >> 12) | 224;
	            out[p++] = ((c >> 6) & 63) | 128;
	            out[p++] = (c & 63) | 128;
	        }
	    }
	    return out;
	};
	/**
	 * Turns an array of numbers into the string given by the concatenation of the
	 * characters to which the numbers correspond.
	 * @param {Array<number>} bytes Array of numbers representing characters.
	 * @return {string} Stringification of the array.
	 */
	var byteArrayToString = function (bytes) {
	    // TODO(user): Use native implementations if/when available
	    var out = [], pos = 0, c = 0;
	    while (pos < bytes.length) {
	        var c1 = bytes[pos++];
	        if (c1 < 128) {
	            out[c++] = String.fromCharCode(c1);
	        }
	        else if (c1 > 191 && c1 < 224) {
	            var c2 = bytes[pos++];
	            out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
	        }
	        else if (c1 > 239 && c1 < 365) {
	            // Surrogate Pair
	            var c2 = bytes[pos++];
	            var c3 = bytes[pos++];
	            var c4 = bytes[pos++];
	            var u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
	                0x10000;
	            out[c++] = String.fromCharCode(0xd800 + (u >> 10));
	            out[c++] = String.fromCharCode(0xdc00 + (u & 1023));
	        }
	        else {
	            var c2 = bytes[pos++];
	            var c3 = bytes[pos++];
	            out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
	        }
	    }
	    return out.join('');
	};
	// Static lookup maps, lazily populated by init_()
	var base64 = {
	    /**
	     * Maps bytes to characters.
	     * @type {Object}
	     * @private
	     */
	    byteToCharMap_: null,
	    /**
	     * Maps characters to bytes.
	     * @type {Object}
	     * @private
	     */
	    charToByteMap_: null,
	    /**
	     * Maps bytes to websafe characters.
	     * @type {Object}
	     * @private
	     */
	    byteToCharMapWebSafe_: null,
	    /**
	     * Maps websafe characters to bytes.
	     * @type {Object}
	     * @private
	     */
	    charToByteMapWebSafe_: null,
	    /**
	     * Our default alphabet, shared between
	     * ENCODED_VALS and ENCODED_VALS_WEBSAFE
	     * @type {string}
	     */
	    ENCODED_VALS_BASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789',
	    /**
	     * Our default alphabet. Value 64 (=) is special; it means "nothing."
	     * @type {string}
	     */
	    get ENCODED_VALS() {
	        return this.ENCODED_VALS_BASE + '+/=';
	    },
	    /**
	     * Our websafe alphabet.
	     * @type {string}
	     */
	    get ENCODED_VALS_WEBSAFE() {
	        return this.ENCODED_VALS_BASE + '-_.';
	    },
	    /**
	     * Whether this browser supports the atob and btoa functions. This extension
	     * started at Mozilla but is now implemented by many browsers. We use the
	     * ASSUME_* variables to avoid pulling in the full useragent detection library
	     * but still allowing the standard per-browser compilations.
	     *
	     * @type {boolean}
	     */
	    HAS_NATIVE_SUPPORT: typeof atob === 'function',
	    /**
	     * Base64-encode an array of bytes.
	     *
	     * @param {Array<number>|Uint8Array} input An array of bytes (numbers with
	     *     value in [0, 255]) to encode.
	     * @param {boolean=} opt_webSafe Boolean indicating we should use the
	     *     alternative alphabet.
	     * @return {string} The base64 encoded string.
	     */
	    encodeByteArray: function (input, opt_webSafe) {
	        if (!Array.isArray(input)) {
	            throw Error('encodeByteArray takes an array as a parameter');
	        }
	        this.init_();
	        var byteToCharMap = opt_webSafe
	            ? this.byteToCharMapWebSafe_
	            : this.byteToCharMap_;
	        var output = [];
	        for (var i = 0; i < input.length; i += 3) {
	            var byte1 = input[i];
	            var haveByte2 = i + 1 < input.length;
	            var byte2 = haveByte2 ? input[i + 1] : 0;
	            var haveByte3 = i + 2 < input.length;
	            var byte3 = haveByte3 ? input[i + 2] : 0;
	            var outByte1 = byte1 >> 2;
	            var outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
	            var outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
	            var outByte4 = byte3 & 0x3f;
	            if (!haveByte3) {
	                outByte4 = 64;
	                if (!haveByte2) {
	                    outByte3 = 64;
	                }
	            }
	            output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
	        }
	        return output.join('');
	    },
	    /**
	     * Base64-encode a string.
	     *
	     * @param {string} input A string to encode.
	     * @param {boolean=} opt_webSafe If true, we should use the
	     *     alternative alphabet.
	     * @return {string} The base64 encoded string.
	     */
	    encodeString: function (input, opt_webSafe) {
	        // Shortcut for Mozilla browsers that implement
	        // a native base64 encoder in the form of "btoa/atob"
	        if (this.HAS_NATIVE_SUPPORT && !opt_webSafe) {
	            return btoa(input);
	        }
	        return this.encodeByteArray(stringToByteArray(input), opt_webSafe);
	    },
	    /**
	     * Base64-decode a string.
	     *
	     * @param {string} input to decode.
	     * @param {boolean=} opt_webSafe True if we should use the
	     *     alternative alphabet.
	     * @return {string} string representing the decoded value.
	     */
	    decodeString: function (input, opt_webSafe) {
	        // Shortcut for Mozilla browsers that implement
	        // a native base64 encoder in the form of "btoa/atob"
	        if (this.HAS_NATIVE_SUPPORT && !opt_webSafe) {
	            return atob(input);
	        }
	        return byteArrayToString(this.decodeStringToByteArray(input, opt_webSafe));
	    },
	    /**
	     * Base64-decode a string.
	     *
	     * In base-64 decoding, groups of four characters are converted into three
	     * bytes.  If the encoder did not apply padding, the input length may not
	     * be a multiple of 4.
	     *
	     * In this case, the last group will have fewer than 4 characters, and
	     * padding will be inferred.  If the group has one or two characters, it decodes
	     * to one byte.  If the group has three characters, it decodes to two bytes.
	     *
	     * @param {string} input Input to decode.
	     * @param {boolean=} opt_webSafe True if we should use the web-safe alphabet.
	     * @return {!Array<number>} bytes representing the decoded value.
	     */
	    decodeStringToByteArray: function (input, opt_webSafe) {
	        this.init_();
	        var charToByteMap = opt_webSafe
	            ? this.charToByteMapWebSafe_
	            : this.charToByteMap_;
	        var output = [];
	        for (var i = 0; i < input.length;) {
	            var byte1 = charToByteMap[input.charAt(i++)];
	            var haveByte2 = i < input.length;
	            var byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
	            ++i;
	            var haveByte3 = i < input.length;
	            var byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
	            ++i;
	            var haveByte4 = i < input.length;
	            var byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
	            ++i;
	            if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
	                throw Error();
	            }
	            var outByte1 = (byte1 << 2) | (byte2 >> 4);
	            output.push(outByte1);
	            if (byte3 != 64) {
	                var outByte2 = ((byte2 << 4) & 0xf0) | (byte3 >> 2);
	                output.push(outByte2);
	                if (byte4 != 64) {
	                    var outByte3 = ((byte3 << 6) & 0xc0) | byte4;
	                    output.push(outByte3);
	                }
	            }
	        }
	        return output;
	    },
	    /**
	     * Lazy static initialization function. Called before
	     * accessing any of the static map variables.
	     * @private
	     */
	    init_: function () {
	        if (!this.byteToCharMap_) {
	            this.byteToCharMap_ = {};
	            this.charToByteMap_ = {};
	            this.byteToCharMapWebSafe_ = {};
	            this.charToByteMapWebSafe_ = {};
	            // We want quick mappings back and forth, so we precompute two maps.
	            for (var i = 0; i < this.ENCODED_VALS.length; i++) {
	                this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
	                this.charToByteMap_[this.byteToCharMap_[i]] = i;
	                this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
	                this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
	                // Be forgiving when decoding and correctly decode both encodings.
	                if (i >= this.ENCODED_VALS_BASE.length) {
	                    this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
	                    this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
	                }
	            }
	        }
	    }
	};
	/**
	 * URL-safe base64 encoding
	 * @param {!string} str
	 * @return {!string}
	 */
	var base64Encode = function (str) {
	    var utf8Bytes = stringToByteArray(str);
	    return base64.encodeByteArray(utf8Bytes, true);
	};
	/**
	 * URL-safe base64 decoding
	 *
	 * NOTE: DO NOT use the global atob() function - it does NOT support the
	 * base64Url variant encoding.
	 *
	 * @param {string} str To be decoded
	 * @return {?string} Decoded result, if possible
	 */
	var base64Decode = function (str) {
	    try {
	        return base64.decodeString(str, true);
	    }
	    catch (e) {
	        console.error('base64Decode failed: ', e);
	    }
	    return null;
	};
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * Do a deep-copy of basic JavaScript Objects or Arrays.
	 */
	function deepCopy(value) {
	    return deepExtend(undefined, value);
	}
	/**
	 * Copy properties from source to target (recursively allows extension
	 * of Objects and Arrays).  Scalar values in the target are over-written.
	 * If target is undefined, an object of the appropriate type will be created
	 * (and returned).
	 *
	 * We recursively copy all child properties of plain Objects in the source- so
	 * that namespace- like dictionaries are merged.
	 *
	 * Note that the target can be a function, in which case the properties in
	 * the source Object are copied onto it as static properties of the Function.
	 */
	function deepExtend(target, source) {
	    if (!(source instanceof Object)) {
	        return source;
	    }
	    switch (source.constructor) {
	        case Date:
	            // Treat Dates like scalars; if the target date object had any child
	            // properties - they will be lost!
	            var dateValue = source;
	            return new Date(dateValue.getTime());
	        case Object:
	            if (target === undefined) {
	                target = {};
	            }
	            break;
	        case Array:
	            // Always copy the array source and overwrite the target.
	            target = [];
	            break;
	        default:
	            // Not a plain Object - treat it as a scalar.
	            return source;
	    }
	    for (var prop in source) {
	        if (!source.hasOwnProperty(prop)) {
	            continue;
	        }
	        target[prop] = deepExtend(target[prop], source[prop]);
	    }
	    return target;
	}
	// TODO: Really needed (for JSCompiler type checking)?
	function patchProperty(obj, prop, value) {
	    obj[prop] = value;
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	var Deferred = /** @class */ (function () {
	    function Deferred() {
	        var _this = this;
	        this.promise = new Promise(function (resolve, reject) {
	            _this.resolve = resolve;
	            _this.reject = reject;
	        });
	    }
	    /**
	     * Our API internals are not promiseified and cannot because our callback APIs have subtle expectations around
	     * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
	     * and returns a node-style callback which will resolve or reject the Deferred's promise.
	     * @param {((?function(?(Error)): (?|undefined))| (?function(?(Error),?=): (?|undefined)))=} callback
	     * @return {!function(?(Error), ?=)}
	     */
	    Deferred.prototype.wrapCallback = function (callback) {
	        var _this = this;
	        return function (error, value) {
	            if (error) {
	                _this.reject(error);
	            }
	            else {
	                _this.resolve(value);
	            }
	            if (typeof callback === 'function') {
	                // Attaching noop handler just in case developer wasn't expecting
	                // promises
	                _this.promise.catch(function () { });
	                // Some of our callbacks don't expect a value and our own tests
	                // assert that the parameter length is 1
	                if (callback.length === 1) {
	                    callback(error);
	                }
	                else {
	                    callback(error, value);
	                }
	            }
	        };
	    };
	    return Deferred;
	}());
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * Returns navigator.userAgent string or '' if it's not defined.
	 * @return {string} user agent string
	 */
	var getUA = function () {
	    if (typeof navigator !== 'undefined' &&
	        typeof navigator['userAgent'] === 'string') {
	        return navigator['userAgent'];
	    }
	    else {
	        return '';
	    }
	};
	/**
	 * Detect Cordova / PhoneGap / Ionic frameworks on a mobile device.
	 *
	 * Deliberately does not rely on checking `file://` URLs (as this fails PhoneGap in the Ripple emulator) nor
	 * Cordova `onDeviceReady`, which would normally wait for a callback.
	 *
	 * @return {boolean} isMobileCordova
	 */
	var isMobileCordova = function () {
	    return (typeof window !== 'undefined' &&
	        !!(window['cordova'] || window['phonegap'] || window['PhoneGap']) &&
	        /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA()));
	};
	/**
	 * Detect React Native.
	 *
	 * @return {boolean} True if ReactNative environment is detected.
	 */
	var isReactNative = function () {
	    return (typeof navigator === 'object' && navigator['product'] === 'ReactNative');
	};
	/**
	 * Detect Node.js.
	 *
	 * @return {boolean} True if Node.js environment is detected.
	 */
	var isNodeSdk = function () {
	    return CONSTANTS.NODE_CLIENT === true || CONSTANTS.NODE_ADMIN === true;
	};
	
	var ERROR_NAME = 'FirebaseError';
	var captureStackTrace = Error
	    .captureStackTrace;
	// Export for faking in tests
	function patchCapture(captureFake) {
	    var result = captureStackTrace;
	    captureStackTrace = captureFake;
	    return result;
	}
	var FirebaseError = /** @class */ (function () {
	    function FirebaseError(code, message) {
	        this.code = code;
	        this.message = message;
	        // We want the stack value, if implemented by Error
	        if (captureStackTrace) {
	            // Patches this.stack, omitted calls above ErrorFactory#create
	            captureStackTrace(this, ErrorFactory.prototype.create);
	        }
	        else {
	            try {
	                // In case of IE11, stack will be set only after error is raised.
	                // https://docs.microsoft.com/en-us/scripting/javascript/reference/stack-property-error-javascript
	                throw Error.apply(this, arguments);
	            }
	            catch (err) {
	                this.name = ERROR_NAME;
	                // Make non-enumerable getter for the property.
	                Object.defineProperty(this, 'stack', {
	                    get: function () {
	                        return err.stack;
	                    }
	                });
	            }
	        }
	    }
	    return FirebaseError;
	}());
	// Back-door inheritance
	FirebaseError.prototype = Object.create(Error.prototype);
	FirebaseError.prototype.constructor = FirebaseError;
	FirebaseError.prototype.name = ERROR_NAME;
	var ErrorFactory = /** @class */ (function () {
	    function ErrorFactory(service, serviceName, errors) {
	        this.service = service;
	        this.serviceName = serviceName;
	        this.errors = errors;
	        // Matches {$name}, by default.
	        this.pattern = /\{\$([^}]+)}/g;
	        // empty
	    }
	    ErrorFactory.prototype.create = function (code, data) {
	        if (data === undefined) {
	            data = {};
	        }
	        var template = this.errors[code];
	        var fullCode = this.service + '/' + code;
	        var message;
	        if (template === undefined) {
	            message = 'Error';
	        }
	        else {
	            message = template.replace(this.pattern, function (match, key) {
	                var value = data[key];
	                return value !== undefined ? value.toString() : '<' + key + '?>';
	            });
	        }
	        // Service: Error message (service/code).
	        message = this.serviceName + ': ' + message + ' (' + fullCode + ').';
	        var err = new FirebaseError(fullCode, message);
	        // Populate the Error object with message parts for programmatic
	        // accesses (e.g., e.file).
	        for (var prop in data) {
	            if (!data.hasOwnProperty(prop) || prop.slice(-1) === '_') {
	                continue;
	            }
	            err[prop] = data[prop];
	        }
	        return err;
	    };
	    return ErrorFactory;
	}());
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * Evaluates a JSON string into a javascript object.
	 *
	 * @param {string} str A string containing JSON.
	 * @return {*} The javascript object representing the specified JSON.
	 */
	function jsonEval(str) {
	    return JSON.parse(str);
	}
	/**
	 * Returns JSON representing a javascript object.
	 * @param {*} data Javascript object to be stringified.
	 * @return {string} The JSON contents of the object.
	 */
	function stringify(data) {
	    return JSON.stringify(data);
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * Decodes a Firebase auth. token into constituent parts.
	 *
	 * Notes:
	 * - May return with invalid / incomplete claims if there's no native base64 decoding support.
	 * - Doesn't check if the token is actually valid.
	 *
	 * @param {?string} token
	 * @return {{header: *, claims: *, data: *, signature: string}}
	 */
	var decode = function (token) {
	    var header = {}, claims = {}, data = {}, signature = '';
	    try {
	        var parts = token.split('.');
	        header = jsonEval(base64Decode(parts[0]) || '');
	        claims = jsonEval(base64Decode(parts[1]) || '');
	        signature = parts[2];
	        data = claims['d'] || {};
	        delete claims['d'];
	    }
	    catch (e) { }
	    return {
	        header: header,
	        claims: claims,
	        data: data,
	        signature: signature
	    };
	};
	/**
	 * Decodes a Firebase auth. token and checks the validity of its time-based claims. Will return true if the
	 * token is within the time window authorized by the 'nbf' (not-before) and 'iat' (issued-at) claims.
	 *
	 * Notes:
	 * - May return a false negative if there's no native base64 decoding support.
	 * - Doesn't check if the token is actually valid.
	 *
	 * @param {?string} token
	 * @return {boolean}
	 */
	var isValidTimestamp = function (token) {
	    var claims = decode(token).claims, now = Math.floor(new Date().getTime() / 1000), validSince, validUntil;
	    if (typeof claims === 'object') {
	        if (claims.hasOwnProperty('nbf')) {
	            validSince = claims['nbf'];
	        }
	        else if (claims.hasOwnProperty('iat')) {
	            validSince = claims['iat'];
	        }
	        if (claims.hasOwnProperty('exp')) {
	            validUntil = claims['exp'];
	        }
	        else {
	            // token will expire after 24h by default
	            validUntil = validSince + 86400;
	        }
	    }
	    return (now && validSince && validUntil && now >= validSince && now <= validUntil);
	};
	/**
	 * Decodes a Firebase auth. token and returns its issued at time if valid, null otherwise.
	 *
	 * Notes:
	 * - May return null if there's no native base64 decoding support.
	 * - Doesn't check if the token is actually valid.
	 *
	 * @param {?string} token
	 * @return {?number}
	 */
	var issuedAtTime = function (token) {
	    var claims = decode(token).claims;
	    if (typeof claims === 'object' && claims.hasOwnProperty('iat')) {
	        return claims['iat'];
	    }
	    return null;
	};
	/**
	 * Decodes a Firebase auth. token and checks the validity of its format. Expects a valid issued-at time and non-empty
	 * signature.
	 *
	 * Notes:
	 * - May return a false negative if there's no native base64 decoding support.
	 * - Doesn't check if the token is actually valid.
	 *
	 * @param {?string} token
	 * @return {boolean}
	 */
	var isValidFormat = function (token) {
	    var decoded = decode(token), claims = decoded.claims;
	    return (!!decoded.signature &&
	        !!claims &&
	        typeof claims === 'object' &&
	        claims.hasOwnProperty('iat'));
	};
	/**
	 * Attempts to peer into an auth token and determine if it's an admin auth token by looking at the claims portion.
	 *
	 * Notes:
	 * - May return a false negative if there's no native base64 decoding support.
	 * - Doesn't check if the token is actually valid.
	 *
	 * @param {?string} token
	 * @return {boolean}
	 */
	var isAdmin = function (token) {
	    var claims = decode(token).claims;
	    return typeof claims === 'object' && claims['admin'] === true;
	};
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	// See http://www.devthought.com/2012/01/18/an-object-is-not-a-hash/
	var contains = function (obj, key) {
	    return Object.prototype.hasOwnProperty.call(obj, key);
	};
	var safeGet = function (obj, key) {
	    if (Object.prototype.hasOwnProperty.call(obj, key))
	        return obj[key];
	    // else return undefined.
	};
	/**
	 * Enumerates the keys/values in an object, excluding keys defined on the prototype.
	 *
	 * @param {?Object.<K,V>} obj Object to enumerate.
	 * @param {!function(K, V)} fn Function to call for each key and value.
	 * @template K,V
	 */
	var forEach = function (obj, fn) {
	    for (var key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key)) {
	            fn(key, obj[key]);
	        }
	    }
	};
	/**
	 * Copies all the (own) properties from one object to another.
	 * @param {!Object} objTo
	 * @param {!Object} objFrom
	 * @return {!Object} objTo
	 */
	var extend = function (objTo, objFrom) {
	    forEach(objFrom, function (key, value) {
	        objTo[key] = value;
	    });
	    return objTo;
	};
	/**
	 * Returns a clone of the specified object.
	 * @param {!Object} obj
	 * @return {!Object} cloned obj.
	 */
	var clone = function (obj) {
	    return extend({}, obj);
	};
	/**
	 * Returns true if obj has typeof "object" and is not null.  Unlike goog.isObject(), does not return true
	 * for functions.
	 *
	 * @param obj {*} A potential object.
	 * @returns {boolean} True if it's an object.
	 */
	var isNonNullObject = function (obj) {
	    return typeof obj === 'object' && obj !== null;
	};
	var isEmpty = function (obj) {
	    for (var key in obj) {
	        return false;
	    }
	    return true;
	};
	var getCount = function (obj) {
	    var rv = 0;
	    for (var key in obj) {
	        rv++;
	    }
	    return rv;
	};
	var map = function (obj, f, opt_obj) {
	    var res = {};
	    for (var key in obj) {
	        res[key] = f.call(opt_obj, obj[key], key, obj);
	    }
	    return res;
	};
	var findKey = function (obj, fn, opt_this) {
	    for (var key in obj) {
	        if (fn.call(opt_this, obj[key], key, obj)) {
	            return key;
	        }
	    }
	    return undefined;
	};
	var findValue = function (obj, fn, opt_this) {
	    var key = findKey(obj, fn, opt_this);
	    return key && obj[key];
	};
	var getAnyKey = function (obj) {
	    for (var key in obj) {
	        return key;
	    }
	};
	var getValues = function (obj) {
	    var res = [];
	    var i = 0;
	    for (var key in obj) {
	        res[i++] = obj[key];
	    }
	    return res;
	};
	/**
	 * Tests whether every key/value pair in an object pass the test implemented
	 * by the provided function
	 *
	 * @param {?Object.<K,V>} obj Object to test.
	 * @param {!function(K, V)} fn Function to call for each key and value.
	 * @template K,V
	 */
	var every = function (obj, fn) {
	    for (var key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key)) {
	            if (!fn(key, obj[key])) {
	                return false;
	            }
	        }
	    }
	    return true;
	};
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * Returns a querystring-formatted string (e.g. &arg=val&arg2=val2) from a params
	 * object (e.g. {arg: 'val', arg2: 'val2'})
	 * Note: You must prepend it with ? when adding it to a URL.
	 *
	 * @param {!Object} querystringParams
	 * @return {string}
	 */
	var querystring = function (querystringParams) {
	    var params = [];
	    forEach(querystringParams, function (key, value) {
	        if (Array.isArray(value)) {
	            value.forEach(function (arrayVal) {
	                params.push(encodeURIComponent(key) + '=' + encodeURIComponent(arrayVal));
	            });
	        }
	        else {
	            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
	        }
	    });
	    return params.length ? '&' + params.join('&') : '';
	};
	/**
	 * Decodes a querystring (e.g. ?arg=val&arg2=val2) into a params object (e.g. {arg: 'val', arg2: 'val2'})
	 *
	 * @param {string} querystring
	 * @return {!Object}
	 */
	var querystringDecode = function (querystring) {
	    var obj = {};
	    var tokens = querystring.replace(/^\?/, '').split('&');
	    tokens.forEach(function (token) {
	        if (token) {
	            var key = token.split('=');
	            obj[key[0]] = key[1];
	        }
	    });
	    return obj;
	};
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	// Copyright 2011 The Closure Library Authors. All Rights Reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	//      http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS-IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	/**
	 * @fileoverview Abstract cryptographic hash interface.
	 *
	 * See Sha1 and Md5 for sample implementations.
	 *
	 */
	/**
	 * Create a cryptographic hash instance.
	 *
	 * @constructor
	 * @struct
	 */
	var Hash = /** @class */ (function () {
	    function Hash() {
	        /**
	         * The block size for the hasher.
	         * @type {number}
	         */
	        this.blockSize = -1;
	    }
	    return Hash;
	}());
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * @fileoverview SHA-1 cryptographic hash.
	 * Variable names follow the notation in FIPS PUB 180-3:
	 * http://csrc.nist.gov/publications/fips/fips180-3/fips180-3_final.pdf.
	 *
	 * Usage:
	 *   var sha1 = new sha1();
	 *   sha1.update(bytes);
	 *   var hash = sha1.digest();
	 *
	 * Performance:
	 *   Chrome 23:   ~400 Mbit/s
	 *   Firefox 16:  ~250 Mbit/s
	 *
	 */
	/**
	 * SHA-1 cryptographic hash constructor.
	 *
	 * The properties declared here are discussed in the above algorithm document.
	 * @constructor
	 * @extends {Hash}
	 * @final
	 * @struct
	 */
	var Sha1 = /** @class */ (function (_super) {
	    tslib_1.__extends(Sha1, _super);
	    function Sha1() {
	        var _this = _super.call(this) || this;
	        /**
	         * Holds the previous values of accumulated variables a-e in the compress_
	         * function.
	         * @type {!Array<number>}
	         * @private
	         */
	        _this.chain_ = [];
	        /**
	         * A buffer holding the partially computed hash result.
	         * @type {!Array<number>}
	         * @private
	         */
	        _this.buf_ = [];
	        /**
	         * An array of 80 bytes, each a part of the message to be hashed.  Referred to
	         * as the message schedule in the docs.
	         * @type {!Array<number>}
	         * @private
	         */
	        _this.W_ = [];
	        /**
	         * Contains data needed to pad messages less than 64 bytes.
	         * @type {!Array<number>}
	         * @private
	         */
	        _this.pad_ = [];
	        /**
	         * @private {number}
	         */
	        _this.inbuf_ = 0;
	        /**
	         * @private {number}
	         */
	        _this.total_ = 0;
	        _this.blockSize = 512 / 8;
	        _this.pad_[0] = 128;
	        for (var i = 1; i < _this.blockSize; ++i) {
	            _this.pad_[i] = 0;
	        }
	        _this.reset();
	        return _this;
	    }
	    Sha1.prototype.reset = function () {
	        this.chain_[0] = 0x67452301;
	        this.chain_[1] = 0xefcdab89;
	        this.chain_[2] = 0x98badcfe;
	        this.chain_[3] = 0x10325476;
	        this.chain_[4] = 0xc3d2e1f0;
	        this.inbuf_ = 0;
	        this.total_ = 0;
	    };
	    /**
	     * Internal compress helper function.
	     * @param {!Array<number>|!Uint8Array|string} buf Block to compress.
	     * @param {number=} opt_offset Offset of the block in the buffer.
	     * @private
	     */
	    Sha1.prototype.compress_ = function (buf, opt_offset) {
	        if (!opt_offset) {
	            opt_offset = 0;
	        }
	        var W = this.W_;
	        // get 16 big endian words
	        if (typeof buf === 'string') {
	            for (var i = 0; i < 16; i++) {
	                // TODO(user): [bug 8140122] Recent versions of Safari for Mac OS and iOS
	                // have a bug that turns the post-increment ++ operator into pre-increment
	                // during JIT compilation.  We have code that depends heavily on SHA-1 for
	                // correctness and which is affected by this bug, so I've removed all uses
	                // of post-increment ++ in which the result value is used.  We can revert
	                // this change once the Safari bug
	                // (https://bugs.webkit.org/show_bug.cgi?id=109036) has been fixed and
	                // most clients have been updated.
	                W[i] =
	                    (buf.charCodeAt(opt_offset) << 24) |
	                        (buf.charCodeAt(opt_offset + 1) << 16) |
	                        (buf.charCodeAt(opt_offset + 2) << 8) |
	                        buf.charCodeAt(opt_offset + 3);
	                opt_offset += 4;
	            }
	        }
	        else {
	            for (var i = 0; i < 16; i++) {
	                W[i] =
	                    (buf[opt_offset] << 24) |
	                        (buf[opt_offset + 1] << 16) |
	                        (buf[opt_offset + 2] << 8) |
	                        buf[opt_offset + 3];
	                opt_offset += 4;
	            }
	        }
	        // expand to 80 words
	        for (var i = 16; i < 80; i++) {
	            var t = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
	            W[i] = ((t << 1) | (t >>> 31)) & 0xffffffff;
	        }
	        var a = this.chain_[0];
	        var b = this.chain_[1];
	        var c = this.chain_[2];
	        var d = this.chain_[3];
	        var e = this.chain_[4];
	        var f, k;
	        // TODO(user): Try to unroll this loop to speed up the computation.
	        for (var i = 0; i < 80; i++) {
	            if (i < 40) {
	                if (i < 20) {
	                    f = d ^ (b & (c ^ d));
	                    k = 0x5a827999;
	                }
	                else {
	                    f = b ^ c ^ d;
	                    k = 0x6ed9eba1;
	                }
	            }
	            else {
	                if (i < 60) {
	                    f = (b & c) | (d & (b | c));
	                    k = 0x8f1bbcdc;
	                }
	                else {
	                    f = b ^ c ^ d;
	                    k = 0xca62c1d6;
	                }
	            }
	            var t = (((a << 5) | (a >>> 27)) + f + e + k + W[i]) & 0xffffffff;
	            e = d;
	            d = c;
	            c = ((b << 30) | (b >>> 2)) & 0xffffffff;
	            b = a;
	            a = t;
	        }
	        this.chain_[0] = (this.chain_[0] + a) & 0xffffffff;
	        this.chain_[1] = (this.chain_[1] + b) & 0xffffffff;
	        this.chain_[2] = (this.chain_[2] + c) & 0xffffffff;
	        this.chain_[3] = (this.chain_[3] + d) & 0xffffffff;
	        this.chain_[4] = (this.chain_[4] + e) & 0xffffffff;
	    };
	    Sha1.prototype.update = function (bytes, opt_length) {
	        // TODO(johnlenz): tighten the function signature and remove this check
	        if (bytes == null) {
	            return;
	        }
	        if (opt_length === undefined) {
	            opt_length = bytes.length;
	        }
	        var lengthMinusBlock = opt_length - this.blockSize;
	        var n = 0;
	        // Using local instead of member variables gives ~5% speedup on Firefox 16.
	        var buf = this.buf_;
	        var inbuf = this.inbuf_;
	        // The outer while loop should execute at most twice.
	        while (n < opt_length) {
	            // When we have no data in the block to top up, we can directly process the
	            // input buffer (assuming it contains sufficient data). This gives ~25%
	            // speedup on Chrome 23 and ~15% speedup on Firefox 16, but requires that
	            // the data is provided in large chunks (or in multiples of 64 bytes).
	            if (inbuf == 0) {
	                while (n <= lengthMinusBlock) {
	                    this.compress_(bytes, n);
	                    n += this.blockSize;
	                }
	            }
	            if (typeof bytes === 'string') {
	                while (n < opt_length) {
	                    buf[inbuf] = bytes.charCodeAt(n);
	                    ++inbuf;
	                    ++n;
	                    if (inbuf == this.blockSize) {
	                        this.compress_(buf);
	                        inbuf = 0;
	                        // Jump to the outer loop so we use the full-block optimization.
	                        break;
	                    }
	                }
	            }
	            else {
	                while (n < opt_length) {
	                    buf[inbuf] = bytes[n];
	                    ++inbuf;
	                    ++n;
	                    if (inbuf == this.blockSize) {
	                        this.compress_(buf);
	                        inbuf = 0;
	                        // Jump to the outer loop so we use the full-block optimization.
	                        break;
	                    }
	                }
	            }
	        }
	        this.inbuf_ = inbuf;
	        this.total_ += opt_length;
	    };
	    /** @override */
	    Sha1.prototype.digest = function () {
	        var digest = [];
	        var totalBits = this.total_ * 8;
	        // Add pad 0x80 0x00*.
	        if (this.inbuf_ < 56) {
	            this.update(this.pad_, 56 - this.inbuf_);
	        }
	        else {
	            this.update(this.pad_, this.blockSize - (this.inbuf_ - 56));
	        }
	        // Add # bits.
	        for (var i = this.blockSize - 1; i >= 56; i--) {
	            this.buf_[i] = totalBits & 255;
	            totalBits /= 256; // Don't use bit-shifting here!
	        }
	        this.compress_(this.buf_);
	        var n = 0;
	        for (var i = 0; i < 5; i++) {
	            for (var j = 24; j >= 0; j -= 8) {
	                digest[n] = (this.chain_[i] >> j) & 255;
	                ++n;
	            }
	        }
	        return digest;
	    };
	    return Sha1;
	}(Hash));
	
	/**
	 * Helper to make a Subscribe function (just like Promise helps make a
	 * Thenable).
	 *
	 * @param executor Function which can make calls to a single Observer
	 *     as a proxy.
	 * @param onNoObservers Callback when count of Observers goes to zero.
	 */
	function createSubscribe(executor, onNoObservers) {
	    var proxy = new ObserverProxy(executor, onNoObservers);
	    return proxy.subscribe.bind(proxy);
	}
	/**
	 * Implement fan-out for any number of Observers attached via a subscribe
	 * function.
	 */
	var ObserverProxy = /** @class */ (function () {
	    /**
	     * @param executor Function which can make calls to a single Observer
	     *     as a proxy.
	     * @param onNoObservers Callback when count of Observers goes to zero.
	     */
	    function ObserverProxy(executor, onNoObservers) {
	        var _this = this;
	        this.observers = [];
	        this.unsubscribes = [];
	        this.observerCount = 0;
	        // Micro-task scheduling by calling task.then().
	        this.task = Promise.resolve();
	        this.finalized = false;
	        this.onNoObservers = onNoObservers;
	        // Call the executor asynchronously so subscribers that are called
	        // synchronously after the creation of the subscribe function
	        // can still receive the very first value generated in the executor.
	        this.task
	            .then(function () {
	            executor(_this);
	        })
	            .catch(function (e) {
	            _this.error(e);
	        });
	    }
	    ObserverProxy.prototype.next = function (value) {
	        this.forEachObserver(function (observer) {
	            observer.next(value);
	        });
	    };
	    ObserverProxy.prototype.error = function (error) {
	        this.forEachObserver(function (observer) {
	            observer.error(error);
	        });
	        this.close(error);
	    };
	    ObserverProxy.prototype.complete = function () {
	        this.forEachObserver(function (observer) {
	            observer.complete();
	        });
	        this.close();
	    };
	    /**
	     * Subscribe function that can be used to add an Observer to the fan-out list.
	     *
	     * - We require that no event is sent to a subscriber sychronously to their
	     *   call to subscribe().
	     */
	    ObserverProxy.prototype.subscribe = function (nextOrObserver, error, complete) {
	        var _this = this;
	        var observer;
	        if (nextOrObserver === undefined &&
	            error === undefined &&
	            complete === undefined) {
	            throw new Error('Missing Observer.');
	        }
	        // Assemble an Observer object when passed as callback functions.
	        if (implementsAnyMethods(nextOrObserver, ['next', 'error', 'complete'])) {
	            observer = nextOrObserver;
	        }
	        else {
	            observer = {
	                next: nextOrObserver,
	                error: error,
	                complete: complete
	            };
	        }
	        if (observer.next === undefined) {
	            observer.next = noop;
	        }
	        if (observer.error === undefined) {
	            observer.error = noop;
	        }
	        if (observer.complete === undefined) {
	            observer.complete = noop;
	        }
	        var unsub = this.unsubscribeOne.bind(this, this.observers.length);
	        // Attempt to subscribe to a terminated Observable - we
	        // just respond to the Observer with the final error or complete
	        // event.
	        if (this.finalized) {
	            this.task.then(function () {
	                try {
	                    if (_this.finalError) {
	                        observer.error(_this.finalError);
	                    }
	                    else {
	                        observer.complete();
	                    }
	                }
	                catch (e) {
	                    // nothing
	                }
	                return;
	            });
	        }
	        this.observers.push(observer);
	        return unsub;
	    };
	    // Unsubscribe is synchronous - we guarantee that no events are sent to
	    // any unsubscribed Observer.
	    ObserverProxy.prototype.unsubscribeOne = function (i) {
	        if (this.observers === undefined || this.observers[i] === undefined) {
	            return;
	        }
	        delete this.observers[i];
	        this.observerCount -= 1;
	        if (this.observerCount === 0 && this.onNoObservers !== undefined) {
	            this.onNoObservers(this);
	        }
	    };
	    ObserverProxy.prototype.forEachObserver = function (fn) {
	        if (this.finalized) {
	            // Already closed by previous event....just eat the additional values.
	            return;
	        }
	        // Since sendOne calls asynchronously - there is no chance that
	        // this.observers will become undefined.
	        for (var i = 0; i < this.observers.length; i++) {
	            this.sendOne(i, fn);
	        }
	    };
	    // Call the Observer via one of it's callback function. We are careful to
	    // confirm that the observe has not been unsubscribed since this asynchronous
	    // function had been queued.
	    ObserverProxy.prototype.sendOne = function (i, fn) {
	        var _this = this;
	        // Execute the callback asynchronously
	        this.task.then(function () {
	            if (_this.observers !== undefined && _this.observers[i] !== undefined) {
	                try {
	                    fn(_this.observers[i]);
	                }
	                catch (e) {
	                    // Ignore exceptions raised in Observers or missing methods of an
	                    // Observer.
	                    // Log error to console. b/31404806
	                    if (typeof console !== 'undefined' && console.error) {
	                        console.error(e);
	                    }
	                }
	            }
	        });
	    };
	    ObserverProxy.prototype.close = function (err) {
	        var _this = this;
	        if (this.finalized) {
	            return;
	        }
	        this.finalized = true;
	        if (err !== undefined) {
	            this.finalError = err;
	        }
	        // Proxy is no longer needed - garbage collect references
	        this.task.then(function () {
	            _this.observers = undefined;
	            _this.onNoObservers = undefined;
	        });
	    };
	    return ObserverProxy;
	}());
	/** Turn synchronous function into one called asynchronously. */
	function async(fn, onError) {
	    return function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        Promise.resolve(true)
	            .then(function () {
	            fn.apply(void 0, args);
	        })
	            .catch(function (error) {
	            if (onError) {
	                onError(error);
	            }
	        });
	    };
	}
	/**
	 * Return true if the object passed in implements any of the named methods.
	 */
	function implementsAnyMethods(obj, methods) {
	    if (typeof obj !== 'object' || obj === null) {
	        return false;
	    }
	    for (var _i = 0, methods_1 = methods; _i < methods_1.length; _i++) {
	        var method = methods_1[_i];
	        if (method in obj && typeof obj[method] === 'function') {
	            return true;
	        }
	    }
	    return false;
	}
	function noop() {
	    // do nothing
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	/**
	 * Check to make sure the appropriate number of arguments are provided for a public function.
	 * Throws an error if it fails.
	 *
	 * @param {!string} fnName The function name
	 * @param {!number} minCount The minimum number of arguments to allow for the function call
	 * @param {!number} maxCount The maximum number of argument to allow for the function call
	 * @param {!number} argCount The actual number of arguments provided.
	 */
	var validateArgCount = function (fnName, minCount, maxCount, argCount) {
	    var argError;
	    if (argCount < minCount) {
	        argError = 'at least ' + minCount;
	    }
	    else if (argCount > maxCount) {
	        argError = maxCount === 0 ? 'none' : 'no more than ' + maxCount;
	    }
	    if (argError) {
	        var error = fnName +
	            ' failed: Was called with ' +
	            argCount +
	            (argCount === 1 ? ' argument.' : ' arguments.') +
	            ' Expects ' +
	            argError +
	            '.';
	        throw new Error(error);
	    }
	};
	/**
	 * Generates a string to prefix an error message about failed argument validation
	 *
	 * @param {!string} fnName The function name
	 * @param {!number} argumentNumber The index of the argument
	 * @param {boolean} optional Whether or not the argument is optional
	 * @return {!string} The prefix to add to the error thrown for validation.
	 */
	function errorPrefix(fnName, argumentNumber, optional) {
	    var argName = '';
	    switch (argumentNumber) {
	        case 1:
	            argName = optional ? 'first' : 'First';
	            break;
	        case 2:
	            argName = optional ? 'second' : 'Second';
	            break;
	        case 3:
	            argName = optional ? 'third' : 'Third';
	            break;
	        case 4:
	            argName = optional ? 'fourth' : 'Fourth';
	            break;
	        default:
	            throw new Error('errorPrefix called with argumentNumber > 4.  Need to update it?');
	    }
	    var error = fnName + ' failed: ';
	    error += argName + ' argument ';
	    return error;
	}
	/**
	 * @param {!string} fnName
	 * @param {!number} argumentNumber
	 * @param {!string} namespace
	 * @param {boolean} optional
	 */
	function validateNamespace(fnName, argumentNumber, namespace, optional) {
	    if (optional && !namespace)
	        return;
	    if (typeof namespace !== 'string') {
	        //TODO: I should do more validation here. We only allow certain chars in namespaces.
	        throw new Error(errorPrefix(fnName, argumentNumber, optional) +
	            'must be a valid firebase namespace.');
	    }
	}
	function validateCallback(fnName, argumentNumber, callback, optional) {
	    if (optional && !callback)
	        return;
	    if (typeof callback !== 'function')
	        throw new Error(errorPrefix(fnName, argumentNumber, optional) +
	            'must be a valid function.');
	}
	function validateContextObject(fnName, argumentNumber, context, optional) {
	    if (optional && !context)
	        return;
	    if (typeof context !== 'object' || context === null)
	        throw new Error(errorPrefix(fnName, argumentNumber, optional) +
	            'must be a valid context object.');
	}
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	// Code originally came from goog.crypt.stringToUtf8ByteArray, but for some reason they
	// automatically replaced '\r\n' with '\n', and they didn't handle surrogate pairs,
	// so it's been modified.
	// Note that not all Unicode characters appear as single characters in JavaScript strings.
	// fromCharCode returns the UTF-16 encoding of a character - so some Unicode characters
	// use 2 characters in Javascript.  All 4-byte UTF-8 characters begin with a first
	// character in the range 0xD800 - 0xDBFF (the first character of a so-called surrogate
	// pair).
	// See http://www.ecma-international.org/ecma-262/5.1/#sec-15.1.3
	/**
	 * @param {string} str
	 * @return {Array}
	 */
	var stringToByteArray$1 = function (str) {
	    var out = [], p = 0;
	    for (var i = 0; i < str.length; i++) {
	        var c = str.charCodeAt(i);
	        // Is this the lead surrogate in a surrogate pair?
	        if (c >= 0xd800 && c <= 0xdbff) {
	            var high = c - 0xd800; // the high 10 bits.
	            i++;
	            assert(i < str.length, 'Surrogate pair missing trail surrogate.');
	            var low = str.charCodeAt(i) - 0xdc00; // the low 10 bits.
	            c = 0x10000 + (high << 10) + low;
	        }
	        if (c < 128) {
	            out[p++] = c;
	        }
	        else if (c < 2048) {
	            out[p++] = (c >> 6) | 192;
	            out[p++] = (c & 63) | 128;
	        }
	        else if (c < 65536) {
	            out[p++] = (c >> 12) | 224;
	            out[p++] = ((c >> 6) & 63) | 128;
	            out[p++] = (c & 63) | 128;
	        }
	        else {
	            out[p++] = (c >> 18) | 240;
	            out[p++] = ((c >> 12) & 63) | 128;
	            out[p++] = ((c >> 6) & 63) | 128;
	            out[p++] = (c & 63) | 128;
	        }
	    }
	    return out;
	};
	/**
	 * Calculate length without actually converting; useful for doing cheaper validation.
	 * @param {string} str
	 * @return {number}
	 */
	var stringLength = function (str) {
	    var p = 0;
	    for (var i = 0; i < str.length; i++) {
	        var c = str.charCodeAt(i);
	        if (c < 128) {
	            p++;
	        }
	        else if (c < 2048) {
	            p += 2;
	        }
	        else if (c >= 0xd800 && c <= 0xdbff) {
	            // Lead surrogate of a surrogate pair.  The pair together will take 4 bytes to represent.
	            p += 4;
	            i++; // skip trail surrogate.
	        }
	        else {
	            p += 3;
	        }
	    }
	    return p;
	};
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	exports.assert = assert;
	exports.assertionError = assertionError;
	exports.base64 = base64;
	exports.base64Decode = base64Decode;
	exports.base64Encode = base64Encode;
	exports.CONSTANTS = CONSTANTS;
	exports.deepCopy = deepCopy;
	exports.deepExtend = deepExtend;
	exports.patchProperty = patchProperty;
	exports.Deferred = Deferred;
	exports.getUA = getUA;
	exports.isMobileCordova = isMobileCordova;
	exports.isNodeSdk = isNodeSdk;
	exports.isReactNative = isReactNative;
	exports.ErrorFactory = ErrorFactory;
	exports.FirebaseError = FirebaseError;
	exports.patchCapture = patchCapture;
	exports.jsonEval = jsonEval;
	exports.stringify = stringify;
	exports.decode = decode;
	exports.isAdmin = isAdmin;
	exports.issuedAtTime = issuedAtTime;
	exports.isValidFormat = isValidFormat;
	exports.isValidTimestamp = isValidTimestamp;
	exports.clone = clone;
	exports.contains = contains;
	exports.every = every;
	exports.extend = extend;
	exports.findKey = findKey;
	exports.findValue = findValue;
	exports.forEach = forEach;
	exports.getAnyKey = getAnyKey;
	exports.getCount = getCount;
	exports.getValues = getValues;
	exports.isEmpty = isEmpty;
	exports.isNonNullObject = isNonNullObject;
	exports.map = map;
	exports.safeGet = safeGet;
	exports.querystring = querystring;
	exports.querystringDecode = querystringDecode;
	exports.Sha1 = Sha1;
	exports.async = async;
	exports.createSubscribe = createSubscribe;
	exports.errorPrefix = errorPrefix;
	exports.validateArgCount = validateArgCount;
	exports.validateCallback = validateCallback;
	exports.validateContextObject = validateContextObject;
	exports.validateNamespace = validateNamespace;
	exports.stringLength = stringLength;
	exports.stringToByteArray = stringToByteArray$1;


/***/ }),

/***/ 19:
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	  Copyright (c) 2017 Jed Watson.
	  Licensed under the MIT License (MIT), see
	  http://jedwatson.github.io/classnames
	*/
	/* global define */
	
	(function () {
		'use strict';
	
		var hasOwn = {}.hasOwnProperty;
	
		function classNames () {
			var classes = [];
	
			for (var i = 0; i < arguments.length; i++) {
				var arg = arguments[i];
				if (!arg) continue;
	
				var argType = typeof arg;
	
				if (argType === 'string' || argType === 'number') {
					classes.push(arg);
				} else if (Array.isArray(arg) && arg.length) {
					var inner = classNames.apply(null, arg);
					if (inner) {
						classes.push(inner);
					}
				} else if (argType === 'object') {
					for (var key in arg) {
						if (hasOwn.call(arg, key) && arg[key]) {
							classes.push(key);
						}
					}
				}
			}
	
			return classes.join(' ');
		}
	
		if (typeof module !== 'undefined' && module.exports) {
			classNames.default = classNames;
			module.exports = classNames;
		} else if (true) {
			// register as 'classnames', consistent with npm package name
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
				return classNames;
			}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else {
			window.classNames = classNames;
		}
	}());


/***/ }),

/***/ 337:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }
	
	__webpack_require__(205);
	var firebase = _interopDefault(__webpack_require__(127));
	
	/**
	 * Copyright 2018 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	module.exports = firebase;


/***/ }),

/***/ 338:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(204);
	
	/**
	 * Copyright 2017 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *   http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */


/***/ }),

/***/ 106:
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Copyright 2015, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 */
	var REACT_STATICS = {
	    childContextTypes: true,
	    contextTypes: true,
	    defaultProps: true,
	    displayName: true,
	    getDefaultProps: true,
	    getDerivedStateFromProps: true,
	    mixins: true,
	    propTypes: true,
	    type: true
	};
	
	var KNOWN_STATICS = {
	    name: true,
	    length: true,
	    prototype: true,
	    caller: true,
	    callee: true,
	    arguments: true,
	    arity: true
	};
	
	var defineProperty = Object.defineProperty;
	var getOwnPropertyNames = Object.getOwnPropertyNames;
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	var getPrototypeOf = Object.getPrototypeOf;
	var objectPrototype = getPrototypeOf && getPrototypeOf(Object);
	
	function hoistNonReactStatics(targetComponent, sourceComponent, blacklist) {
	    if (typeof sourceComponent !== 'string') { // don't hoist over string (html) components
	
	        if (objectPrototype) {
	            var inheritedComponent = getPrototypeOf(sourceComponent);
	            if (inheritedComponent && inheritedComponent !== objectPrototype) {
	                hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
	            }
	        }
	
	        var keys = getOwnPropertyNames(sourceComponent);
	
	        if (getOwnPropertySymbols) {
	            keys = keys.concat(getOwnPropertySymbols(sourceComponent));
	        }
	
	        for (var i = 0; i < keys.length; ++i) {
	            var key = keys[i];
	            if (!REACT_STATICS[key] && !KNOWN_STATICS[key] && (!blacklist || !blacklist[key])) {
	                var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
	                try { // Avoid failures from read-only properties
	                    defineProperty(targetComponent, key, descriptor);
	                } catch (e) {}
	            }
	        }
	
	        return targetComponent;
	    }
	
	    return targetComponent;
	}
	
	module.exports = hoistNonReactStatics;


/***/ }),

/***/ 50:
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	
	
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	
	
	
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;
	
	process.listeners = function (name) { return [] }
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),

/***/ 478:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
	    "use strict";
	
	    if (global.setImmediate) {
	        return;
	    }
	
	    var nextHandle = 1; // Spec says greater than zero
	    var tasksByHandle = {};
	    var currentlyRunningATask = false;
	    var doc = global.document;
	    var registerImmediate;
	
	    function setImmediate(callback) {
	      // Callback can either be a function or a string
	      if (typeof callback !== "function") {
	        callback = new Function("" + callback);
	      }
	      // Copy function arguments
	      var args = new Array(arguments.length - 1);
	      for (var i = 0; i < args.length; i++) {
	          args[i] = arguments[i + 1];
	      }
	      // Store and register the task
	      var task = { callback: callback, args: args };
	      tasksByHandle[nextHandle] = task;
	      registerImmediate(nextHandle);
	      return nextHandle++;
	    }
	
	    function clearImmediate(handle) {
	        delete tasksByHandle[handle];
	    }
	
	    function run(task) {
	        var callback = task.callback;
	        var args = task.args;
	        switch (args.length) {
	        case 0:
	            callback();
	            break;
	        case 1:
	            callback(args[0]);
	            break;
	        case 2:
	            callback(args[0], args[1]);
	            break;
	        case 3:
	            callback(args[0], args[1], args[2]);
	            break;
	        default:
	            callback.apply(undefined, args);
	            break;
	        }
	    }
	
	    function runIfPresent(handle) {
	        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
	        // So if we're currently running a task, we'll need to delay this invocation.
	        if (currentlyRunningATask) {
	            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
	            // "too much recursion" error.
	            setTimeout(runIfPresent, 0, handle);
	        } else {
	            var task = tasksByHandle[handle];
	            if (task) {
	                currentlyRunningATask = true;
	                try {
	                    run(task);
	                } finally {
	                    clearImmediate(handle);
	                    currentlyRunningATask = false;
	                }
	            }
	        }
	    }
	
	    function installNextTickImplementation() {
	        registerImmediate = function(handle) {
	            process.nextTick(function () { runIfPresent(handle); });
	        };
	    }
	
	    function canUsePostMessage() {
	        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
	        // where `global.postMessage` means something completely different and can't be used for this purpose.
	        if (global.postMessage && !global.importScripts) {
	            var postMessageIsAsynchronous = true;
	            var oldOnMessage = global.onmessage;
	            global.onmessage = function() {
	                postMessageIsAsynchronous = false;
	            };
	            global.postMessage("", "*");
	            global.onmessage = oldOnMessage;
	            return postMessageIsAsynchronous;
	        }
	    }
	
	    function installPostMessageImplementation() {
	        // Installs an event handler on `global` for the `message` event: see
	        // * https://developer.mozilla.org/en/DOM/window.postMessage
	        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages
	
	        var messagePrefix = "setImmediate$" + Math.random() + "$";
	        var onGlobalMessage = function(event) {
	            if (event.source === global &&
	                typeof event.data === "string" &&
	                event.data.indexOf(messagePrefix) === 0) {
	                runIfPresent(+event.data.slice(messagePrefix.length));
	            }
	        };
	
	        if (global.addEventListener) {
	            global.addEventListener("message", onGlobalMessage, false);
	        } else {
	            global.attachEvent("onmessage", onGlobalMessage);
	        }
	
	        registerImmediate = function(handle) {
	            global.postMessage(messagePrefix + handle, "*");
	        };
	    }
	
	    function installMessageChannelImplementation() {
	        var channel = new MessageChannel();
	        channel.port1.onmessage = function(event) {
	            var handle = event.data;
	            runIfPresent(handle);
	        };
	
	        registerImmediate = function(handle) {
	            channel.port2.postMessage(handle);
	        };
	    }
	
	    function installReadyStateChangeImplementation() {
	        var html = doc.documentElement;
	        registerImmediate = function(handle) {
	            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	            var script = doc.createElement("script");
	            script.onreadystatechange = function () {
	                runIfPresent(handle);
	                script.onreadystatechange = null;
	                html.removeChild(script);
	                script = null;
	            };
	            html.appendChild(script);
	        };
	    }
	
	    function installSetTimeoutImplementation() {
	        registerImmediate = function(handle) {
	            setTimeout(runIfPresent, 0, handle);
	        };
	    }
	
	    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;
	
	    // Don't get fooled by e.g. browserify environments.
	    if ({}.toString.call(global.process) === "[object process]") {
	        // For Node.js before 0.9
	        installNextTickImplementation();
	
	    } else if (canUsePostMessage()) {
	        // For non-IE10 modern browsers
	        installPostMessageImplementation();
	
	    } else if (global.MessageChannel) {
	        // For web workers, where supported
	        installMessageChannelImplementation();
	
	    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
	        // For IE 6–8
	        installReadyStateChangeImplementation();
	
	    } else {
	        // For older browsers
	        installSetTimeoutImplementation();
	    }
	
	    attachTo.setImmediate = setImmediate;
	    attachTo.clearImmediate = clearImmediate;
	}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(50)))

/***/ }),

/***/ 481:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var scope = (typeof global !== "undefined" && global) ||
	            (typeof self !== "undefined" && self) ||
	            window;
	var apply = Function.prototype.apply;
	
	// DOM APIs, for completeness
	
	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, scope, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, scope, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) {
	  if (timeout) {
	    timeout.close();
	  }
	};
	
	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(scope, this._id);
	};
	
	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};
	
	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};
	
	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);
	
	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};
	
	// setimmediate attaches itself to the global object
	__webpack_require__(478);
	// On some exotic environments, it's not clear which object `setimmediate` was
	// able to install onto.  Search each possibility in the same order as the
	// `setimmediate` library.
	exports.setImmediate = (typeof self !== "undefined" && self.setImmediate) ||
	                       (typeof global !== "undefined" && global.setImmediate) ||
	                       (this && this.setImmediate);
	exports.clearImmediate = (typeof self !== "undefined" && self.clearImmediate) ||
	                         (typeof global !== "undefined" && global.clearImmediate) ||
	                         (this && this.clearImmediate);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),

/***/ 202:
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(global) {/*! *****************************************************************************
	Copyright (c) Microsoft Corporation. All rights reserved.
	Licensed under the Apache License, Version 2.0 (the "License"); you may not use
	this file except in compliance with the License. You may obtain a copy of the
	License at http://www.apache.org/licenses/LICENSE-2.0
	
	THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
	KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
	WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
	MERCHANTABLITY OR NON-INFRINGEMENT.
	
	See the Apache Version 2.0 License for specific language governing permissions
	and limitations under the License.
	***************************************************************************** */
	/* global global, define, System, Reflect, Promise */
	var __extends;
	var __assign;
	var __rest;
	var __decorate;
	var __param;
	var __metadata;
	var __awaiter;
	var __generator;
	var __exportStar;
	var __values;
	var __read;
	var __spread;
	var __await;
	var __asyncGenerator;
	var __asyncDelegator;
	var __asyncValues;
	var __makeTemplateObject;
	var __importStar;
	var __importDefault;
	(function (factory) {
	    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (exports) { factory(createExporter(root, createExporter(exports))); }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    }
	    else if (typeof module === "object" && typeof module.exports === "object") {
	        factory(createExporter(root, createExporter(module.exports)));
	    }
	    else {
	        factory(createExporter(root));
	    }
	    function createExporter(exports, previous) {
	        if (exports !== root) {
	            if (typeof Object.create === "function") {
	                Object.defineProperty(exports, "__esModule", { value: true });
	            }
	            else {
	                exports.__esModule = true;
	            }
	        }
	        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
	    }
	})
	(function (exporter) {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	
	    __extends = function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	
	    __assign = Object.assign || function (t) {
	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments[i];
	            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
	        }
	        return t;
	    };
	
	    __rest = function (s, e) {
	        var t = {};
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
	            t[p] = s[p];
	        if (s != null && typeof Object.getOwnPropertySymbols === "function")
	            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
	                t[p[i]] = s[p[i]];
	        return t;
	    };
	
	    __decorate = function (decorators, target, key, desc) {
	        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	        return c > 3 && r && Object.defineProperty(target, key, r), r;
	    };
	
	    __param = function (paramIndex, decorator) {
	        return function (target, key) { decorator(target, key, paramIndex); }
	    };
	
	    __metadata = function (metadataKey, metadataValue) {
	        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
	    };
	
	    __awaiter = function (thisArg, _arguments, P, generator) {
	        return new (P || (P = Promise))(function (resolve, reject) {
	            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	            step((generator = generator.apply(thisArg, _arguments || [])).next());
	        });
	    };
	
	    __generator = function (thisArg, body) {
	        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	        function verb(n) { return function (v) { return step([n, v]); }; }
	        function step(op) {
	            if (f) throw new TypeError("Generator is already executing.");
	            while (_) try {
	                if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	                if (y = 0, t) op = [0, t.value];
	                switch (op[0]) {
	                    case 0: case 1: t = op; break;
	                    case 4: _.label++; return { value: op[1], done: false };
	                    case 5: _.label++; y = op[1]; op = [0]; continue;
	                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                    default:
	                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                        if (t[2]) _.ops.pop();
	                        _.trys.pop(); continue;
	                }
	                op = body.call(thisArg, _);
	            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	        }
	    };
	
	    __exportStar = function (m, exports) {
	        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	    };
	
	    __values = function (o) {
	        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
	        if (m) return m.call(o);
	        return {
	            next: function () {
	                if (o && i >= o.length) o = void 0;
	                return { value: o && o[i++], done: !o };
	            }
	        };
	    };
	
	    __read = function (o, n) {
	        var m = typeof Symbol === "function" && o[Symbol.iterator];
	        if (!m) return o;
	        var i = m.call(o), r, ar = [], e;
	        try {
	            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
	        }
	        catch (error) { e = { error: error }; }
	        finally {
	            try {
	                if (r && !r.done && (m = i["return"])) m.call(i);
	            }
	            finally { if (e) throw e.error; }
	        }
	        return ar;
	    };
	
	    __spread = function () {
	        for (var ar = [], i = 0; i < arguments.length; i++)
	            ar = ar.concat(__read(arguments[i]));
	        return ar;
	    };
	
	    __await = function (v) {
	        return this instanceof __await ? (this.v = v, this) : new __await(v);
	    };
	
	    __asyncGenerator = function (thisArg, _arguments, generator) {
	        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	        var g = generator.apply(thisArg, _arguments || []), i, q = [];
	        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
	        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
	        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
	        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
	        function fulfill(value) { resume("next", value); }
	        function reject(value) { resume("throw", value); }
	        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
	    };
	
	    __asyncDelegator = function (o) {
	        var i, p;
	        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
	        function verb(n, f) { if (o[n]) i[n] = function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; }; }
	    };
	
	    __asyncValues = function (o) {
	        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	        var m = o[Symbol.asyncIterator];
	        return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
	    };
	
	    __makeTemplateObject = function (cooked, raw) {
	        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
	        return cooked;
	    };
	
	    __importStar = function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
	        result["default"] = mod;
	        return result;
	    };
	
	    __importDefault = function (mod) {
	        return (mod && mod.__esModule) ? mod : { "default": mod };
	    };
	
	    exporter("__extends", __extends);
	    exporter("__assign", __assign);
	    exporter("__rest", __rest);
	    exporter("__decorate", __decorate);
	    exporter("__param", __param);
	    exporter("__metadata", __metadata);
	    exporter("__awaiter", __awaiter);
	    exporter("__generator", __generator);
	    exporter("__exportStar", __exportStar);
	    exporter("__values", __values);
	    exporter("__read", __read);
	    exporter("__spread", __spread);
	    exporter("__await", __await);
	    exporter("__asyncGenerator", __asyncGenerator);
	    exporter("__asyncDelegator", __asyncDelegator);
	    exporter("__asyncValues", __asyncValues);
	    exporter("__makeTemplateObject", __makeTemplateObject);
	    exporter("__importStar", __importStar);
	    exporter("__importDefault", __importDefault);
	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),

/***/ 498:
/***/ (function(module, exports) {

	(function(self) {
	  'use strict';
	
	  if (self.fetch) {
	    return
	  }
	
	  var support = {
	    searchParams: 'URLSearchParams' in self,
	    iterable: 'Symbol' in self && 'iterator' in Symbol,
	    blob: 'FileReader' in self && 'Blob' in self && (function() {
	      try {
	        new Blob()
	        return true
	      } catch(e) {
	        return false
	      }
	    })(),
	    formData: 'FormData' in self,
	    arrayBuffer: 'ArrayBuffer' in self
	  }
	
	  if (support.arrayBuffer) {
	    var viewClasses = [
	      '[object Int8Array]',
	      '[object Uint8Array]',
	      '[object Uint8ClampedArray]',
	      '[object Int16Array]',
	      '[object Uint16Array]',
	      '[object Int32Array]',
	      '[object Uint32Array]',
	      '[object Float32Array]',
	      '[object Float64Array]'
	    ]
	
	    var isDataView = function(obj) {
	      return obj && DataView.prototype.isPrototypeOf(obj)
	    }
	
	    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
	      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
	    }
	  }
	
	  function normalizeName(name) {
	    if (typeof name !== 'string') {
	      name = String(name)
	    }
	    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
	      throw new TypeError('Invalid character in header field name')
	    }
	    return name.toLowerCase()
	  }
	
	  function normalizeValue(value) {
	    if (typeof value !== 'string') {
	      value = String(value)
	    }
	    return value
	  }
	
	  // Build a destructive iterator for the value list
	  function iteratorFor(items) {
	    var iterator = {
	      next: function() {
	        var value = items.shift()
	        return {done: value === undefined, value: value}
	      }
	    }
	
	    if (support.iterable) {
	      iterator[Symbol.iterator] = function() {
	        return iterator
	      }
	    }
	
	    return iterator
	  }
	
	  function Headers(headers) {
	    this.map = {}
	
	    if (headers instanceof Headers) {
	      headers.forEach(function(value, name) {
	        this.append(name, value)
	      }, this)
	    } else if (Array.isArray(headers)) {
	      headers.forEach(function(header) {
	        this.append(header[0], header[1])
	      }, this)
	    } else if (headers) {
	      Object.getOwnPropertyNames(headers).forEach(function(name) {
	        this.append(name, headers[name])
	      }, this)
	    }
	  }
	
	  Headers.prototype.append = function(name, value) {
	    name = normalizeName(name)
	    value = normalizeValue(value)
	    var oldValue = this.map[name]
	    this.map[name] = oldValue ? oldValue+','+value : value
	  }
	
	  Headers.prototype['delete'] = function(name) {
	    delete this.map[normalizeName(name)]
	  }
	
	  Headers.prototype.get = function(name) {
	    name = normalizeName(name)
	    return this.has(name) ? this.map[name] : null
	  }
	
	  Headers.prototype.has = function(name) {
	    return this.map.hasOwnProperty(normalizeName(name))
	  }
	
	  Headers.prototype.set = function(name, value) {
	    this.map[normalizeName(name)] = normalizeValue(value)
	  }
	
	  Headers.prototype.forEach = function(callback, thisArg) {
	    for (var name in this.map) {
	      if (this.map.hasOwnProperty(name)) {
	        callback.call(thisArg, this.map[name], name, this)
	      }
	    }
	  }
	
	  Headers.prototype.keys = function() {
	    var items = []
	    this.forEach(function(value, name) { items.push(name) })
	    return iteratorFor(items)
	  }
	
	  Headers.prototype.values = function() {
	    var items = []
	    this.forEach(function(value) { items.push(value) })
	    return iteratorFor(items)
	  }
	
	  Headers.prototype.entries = function() {
	    var items = []
	    this.forEach(function(value, name) { items.push([name, value]) })
	    return iteratorFor(items)
	  }
	
	  if (support.iterable) {
	    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
	  }
	
	  function consumed(body) {
	    if (body.bodyUsed) {
	      return Promise.reject(new TypeError('Already read'))
	    }
	    body.bodyUsed = true
	  }
	
	  function fileReaderReady(reader) {
	    return new Promise(function(resolve, reject) {
	      reader.onload = function() {
	        resolve(reader.result)
	      }
	      reader.onerror = function() {
	        reject(reader.error)
	      }
	    })
	  }
	
	  function readBlobAsArrayBuffer(blob) {
	    var reader = new FileReader()
	    var promise = fileReaderReady(reader)
	    reader.readAsArrayBuffer(blob)
	    return promise
	  }
	
	  function readBlobAsText(blob) {
	    var reader = new FileReader()
	    var promise = fileReaderReady(reader)
	    reader.readAsText(blob)
	    return promise
	  }
	
	  function readArrayBufferAsText(buf) {
	    var view = new Uint8Array(buf)
	    var chars = new Array(view.length)
	
	    for (var i = 0; i < view.length; i++) {
	      chars[i] = String.fromCharCode(view[i])
	    }
	    return chars.join('')
	  }
	
	  function bufferClone(buf) {
	    if (buf.slice) {
	      return buf.slice(0)
	    } else {
	      var view = new Uint8Array(buf.byteLength)
	      view.set(new Uint8Array(buf))
	      return view.buffer
	    }
	  }
	
	  function Body() {
	    this.bodyUsed = false
	
	    this._initBody = function(body) {
	      this._bodyInit = body
	      if (!body) {
	        this._bodyText = ''
	      } else if (typeof body === 'string') {
	        this._bodyText = body
	      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
	        this._bodyBlob = body
	      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
	        this._bodyFormData = body
	      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	        this._bodyText = body.toString()
	      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
	        this._bodyArrayBuffer = bufferClone(body.buffer)
	        // IE 10-11 can't handle a DataView body.
	        this._bodyInit = new Blob([this._bodyArrayBuffer])
	      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
	        this._bodyArrayBuffer = bufferClone(body)
	      } else {
	        throw new Error('unsupported BodyInit type')
	      }
	
	      if (!this.headers.get('content-type')) {
	        if (typeof body === 'string') {
	          this.headers.set('content-type', 'text/plain;charset=UTF-8')
	        } else if (this._bodyBlob && this._bodyBlob.type) {
	          this.headers.set('content-type', this._bodyBlob.type)
	        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
	        }
	      }
	    }
	
	    if (support.blob) {
	      this.blob = function() {
	        var rejected = consumed(this)
	        if (rejected) {
	          return rejected
	        }
	
	        if (this._bodyBlob) {
	          return Promise.resolve(this._bodyBlob)
	        } else if (this._bodyArrayBuffer) {
	          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
	        } else if (this._bodyFormData) {
	          throw new Error('could not read FormData body as blob')
	        } else {
	          return Promise.resolve(new Blob([this._bodyText]))
	        }
	      }
	
	      this.arrayBuffer = function() {
	        if (this._bodyArrayBuffer) {
	          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
	        } else {
	          return this.blob().then(readBlobAsArrayBuffer)
	        }
	      }
	    }
	
	    this.text = function() {
	      var rejected = consumed(this)
	      if (rejected) {
	        return rejected
	      }
	
	      if (this._bodyBlob) {
	        return readBlobAsText(this._bodyBlob)
	      } else if (this._bodyArrayBuffer) {
	        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
	      } else if (this._bodyFormData) {
	        throw new Error('could not read FormData body as text')
	      } else {
	        return Promise.resolve(this._bodyText)
	      }
	    }
	
	    if (support.formData) {
	      this.formData = function() {
	        return this.text().then(decode)
	      }
	    }
	
	    this.json = function() {
	      return this.text().then(JSON.parse)
	    }
	
	    return this
	  }
	
	  // HTTP methods whose capitalization should be normalized
	  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']
	
	  function normalizeMethod(method) {
	    var upcased = method.toUpperCase()
	    return (methods.indexOf(upcased) > -1) ? upcased : method
	  }
	
	  function Request(input, options) {
	    options = options || {}
	    var body = options.body
	
	    if (input instanceof Request) {
	      if (input.bodyUsed) {
	        throw new TypeError('Already read')
	      }
	      this.url = input.url
	      this.credentials = input.credentials
	      if (!options.headers) {
	        this.headers = new Headers(input.headers)
	      }
	      this.method = input.method
	      this.mode = input.mode
	      if (!body && input._bodyInit != null) {
	        body = input._bodyInit
	        input.bodyUsed = true
	      }
	    } else {
	      this.url = String(input)
	    }
	
	    this.credentials = options.credentials || this.credentials || 'omit'
	    if (options.headers || !this.headers) {
	      this.headers = new Headers(options.headers)
	    }
	    this.method = normalizeMethod(options.method || this.method || 'GET')
	    this.mode = options.mode || this.mode || null
	    this.referrer = null
	
	    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
	      throw new TypeError('Body not allowed for GET or HEAD requests')
	    }
	    this._initBody(body)
	  }
	
	  Request.prototype.clone = function() {
	    return new Request(this, { body: this._bodyInit })
	  }
	
	  function decode(body) {
	    var form = new FormData()
	    body.trim().split('&').forEach(function(bytes) {
	      if (bytes) {
	        var split = bytes.split('=')
	        var name = split.shift().replace(/\+/g, ' ')
	        var value = split.join('=').replace(/\+/g, ' ')
	        form.append(decodeURIComponent(name), decodeURIComponent(value))
	      }
	    })
	    return form
	  }
	
	  function parseHeaders(rawHeaders) {
	    var headers = new Headers()
	    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
	    // https://tools.ietf.org/html/rfc7230#section-3.2
	    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
	    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
	      var parts = line.split(':')
	      var key = parts.shift().trim()
	      if (key) {
	        var value = parts.join(':').trim()
	        headers.append(key, value)
	      }
	    })
	    return headers
	  }
	
	  Body.call(Request.prototype)
	
	  function Response(bodyInit, options) {
	    if (!options) {
	      options = {}
	    }
	
	    this.type = 'default'
	    this.status = options.status === undefined ? 200 : options.status
	    this.ok = this.status >= 200 && this.status < 300
	    this.statusText = 'statusText' in options ? options.statusText : 'OK'
	    this.headers = new Headers(options.headers)
	    this.url = options.url || ''
	    this._initBody(bodyInit)
	  }
	
	  Body.call(Response.prototype)
	
	  Response.prototype.clone = function() {
	    return new Response(this._bodyInit, {
	      status: this.status,
	      statusText: this.statusText,
	      headers: new Headers(this.headers),
	      url: this.url
	    })
	  }
	
	  Response.error = function() {
	    var response = new Response(null, {status: 0, statusText: ''})
	    response.type = 'error'
	    return response
	  }
	
	  var redirectStatuses = [301, 302, 303, 307, 308]
	
	  Response.redirect = function(url, status) {
	    if (redirectStatuses.indexOf(status) === -1) {
	      throw new RangeError('Invalid status code')
	    }
	
	    return new Response(null, {status: status, headers: {location: url}})
	  }
	
	  self.Headers = Headers
	  self.Request = Request
	  self.Response = Response
	
	  self.fetch = function(input, init) {
	    return new Promise(function(resolve, reject) {
	      var request = new Request(input, init)
	      var xhr = new XMLHttpRequest()
	
	      xhr.onload = function() {
	        var options = {
	          status: xhr.status,
	          statusText: xhr.statusText,
	          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
	        }
	        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
	        var body = 'response' in xhr ? xhr.response : xhr.responseText
	        resolve(new Response(body, options))
	      }
	
	      xhr.onerror = function() {
	        reject(new TypeError('Network request failed'))
	      }
	
	      xhr.ontimeout = function() {
	        reject(new TypeError('Network request failed'))
	      }
	
	      xhr.open(request.method, request.url, true)
	
	      if (request.credentials === 'include') {
	        xhr.withCredentials = true
	      } else if (request.credentials === 'omit') {
	        xhr.withCredentials = false
	      }
	
	      if ('responseType' in xhr && support.blob) {
	        xhr.responseType = 'blob'
	      }
	
	      request.headers.forEach(function(value, name) {
	        xhr.setRequestHeader(name, value)
	      })
	
	      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
	    })
	  }
	  self.fetch.polyfill = true
	})(typeof self !== 'undefined' ? self : this);


/***/ }),

/***/ 131:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _propTypes = __webpack_require__(3);
	
	var _propTypes2 = _interopRequireDefault(_propTypes);
	
	var _classnames = __webpack_require__(19);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _gatsbyLink = __webpack_require__(35);
	
	var _gatsbyLink2 = _interopRequireDefault(_gatsbyLink);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var ButtonContent = function ButtonContent(_ref) {
	  var icon = _ref.icon,
	      text = _ref.text;
	  return _react2.default.createElement(
	    'div',
	    { className: 'button__content' },
	    icon && _react2.default.createElement('i', { className: 'icon-' + icon }),
	    text && _react2.default.createElement(
	      'span',
	      null,
	      text
	    )
	  );
	};
	
	var Button = function Button(_ref2) {
	  var className = _ref2.className,
	      empty = _ref2.empty,
	      icon = _ref2.icon,
	      link = _ref2.link,
	      onClick = _ref2.onClick,
	      text = _ref2.text;
	
	  if (!link) {
	    return _react2.default.createElement(
	      'button',
	      { type: 'button', className: (0, _classnames2.default)(className, { empty: empty }), onClick: onClick },
	      _react2.default.createElement(ButtonContent, { icon: icon, text: text })
	    );
	  }
	  if ('/' === link.substring(0, 1)) {
	    return _react2.default.createElement(
	      _gatsbyLink2.default,
	      { to: link, className: (0, _classnames2.default)(className, { empty: empty }) },
	      _react2.default.createElement(ButtonContent, { icon: icon, text: text })
	    );
	  }
	  return _react2.default.createElement(
	    'a',
	    { href: link, target: '_blank', rel: 'noopener noreferrer', className: (0, _classnames2.default)(className, { empty: empty }) },
	    _react2.default.createElement(ButtonContent, { icon: icon, text: text })
	  );
	};
	
	ButtonContent.propTypes = {
	  icon: _propTypes2.default.string,
	  text: _propTypes2.default.string
	};
	
	ButtonContent.defaultProps = {
	  icon: null,
	  text: null
	};
	
	Button.propTypes = {
	  className: _propTypes2.default.string,
	  empty: _propTypes2.default.bool,
	  icon: _propTypes2.default.string,
	  link: _propTypes2.default.string,
	  onClick: _propTypes2.default.func,
	  text: _propTypes2.default.string
	};
	
	Button.defaultProps = {
	  className: 'btn',
	  empty: false,
	  icon: null,
	  link: null,
	  onClick: null,
	  text: null
	};
	
	exports.default = Button;
	module.exports = exports['default'];

/***/ }),

/***/ 213:
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var data = [_react2.default.createElement(
	  "p",
	  null,
	  _react2.default.createElement(
	    "strong",
	    null,
	    "GraphQL"
	  ),
	  ", ",
	  _react2.default.createElement(
	    "strong",
	    null,
	    "Linked data"
	  ),
	  "\xA0 and ",
	  _react2.default.createElement(
	    "strong",
	    null,
	    "Semantic Web"
	  ),
	  " compatible"
	), _react2.default.createElement(
	  "p",
	  null,
	  "Super easy ",
	  _react2.default.createElement(
	    "strong",
	    null,
	    "one click install"
	  ),
	  " with Docker"
	), _react2.default.createElement(
	  "p",
	  null,
	  "Generate your ",
	  _react2.default.createElement(
	    "strong",
	    null,
	    "Progressive Web Apps"
	  ),
	  " and ",
	  _react2.default.createElement(
	    "strong",
	    null,
	    "Native Mobile Apps"
	  )
	), _react2.default.createElement(
	  "p",
	  null,
	  _react2.default.createElement(
	    "strong",
	    null,
	    "Deploy instantly"
	  ),
	  " in the cloud with Kubernetes"
	)];
	
	var circles = data.map(function (content, index) {
	  return _react2.default.createElement(
	    "article",
	    { key: "article" + index, className: "aio__circle" },
	    content
	  );
	});
	
	var AllInOne = function AllInOne() {
	  return _react2.default.createElement(
	    "section",
	    { className: "home__part home__all-in-one" },
	    _react2.default.createElement(
	      "div",
	      { className: "container" },
	      _react2.default.createElement(
	        "h1",
	        { className: "aio__title" },
	        "An ",
	        _react2.default.createElement(
	          "strong",
	          null,
	          "All-in-One solution"
	        ),
	        " for Modern Projects"
	      ),
	      _react2.default.createElement(
	        "div",
	        { className: "aio__circles" },
	        circles
	      )
	    )
	  );
	};
	
	exports.default = AllInOne;
	module.exports = exports["default"];

/***/ }),

/***/ 214:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _spider_home = __webpack_require__(491);
	
	var _spider_home2 = _interopRequireDefault(_spider_home);
	
	var _Flag = __webpack_require__(217);
	
	var _Flag2 = _interopRequireDefault(_Flag);
	
	var _Button = __webpack_require__(131);
	
	var _Button2 = _interopRequireDefault(_Button);
	
	var _Logo = __webpack_require__(60);
	
	var _Logo2 = _interopRequireDefault(_Logo);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Cover = function Cover() {
	  return _react2.default.createElement(
	    'section',
	    { className: 'home__cover full' },
	    _react2.default.createElement(
	      'div',
	      { className: 'container cover__content' },
	      _react2.default.createElement('div', { className: 'cover__circle' }),
	      _react2.default.createElement(
	        'div',
	        { className: 'cover__spider' },
	        _react2.default.createElement('img', { className: 'spider__image', src: _spider_home2.default, alt: 'spider', width: '256', height: '419' })
	      ),
	      _react2.default.createElement(_Logo2.default, { className: 'cover__logo' }),
	      _react2.default.createElement(
	        'h2',
	        null,
	        'REST and GraphQL framework to build modern API-driven projects'
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'cover__buttons' },
	        _react2.default.createElement(_Button2.default, {
	          empty: true,
	          text: 'Download',
	          icon: 'download',
	          link: 'https://github.com/api-platform/api-platform/releases/latest'
	        }),
	        _react2.default.createElement(_Button2.default, { text: 'Get started', icon: 'flag', link: '/docs/distribution' })
	      )
	    ),
	    _react2.default.createElement(_Flag2.default, null)
	  );
	};
	
	exports.default = Cover;
	module.exports = exports['default'];

/***/ }),

/***/ 215:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _propTypes = __webpack_require__(3);
	
	var _propTypes2 = _interopRequireDefault(_propTypes);
	
	var _classnames = __webpack_require__(19);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _admin_component = __webpack_require__(483);
	
	var _admin_component2 = _interopRequireDefault(_admin_component);
	
	var _scaffolding_component = __webpack_require__(489);
	
	var _scaffolding_component2 = _interopRequireDefault(_scaffolding_component);
	
	var _api_component = __webpack_require__(484);
	
	var _api_component2 = _interopRequireDefault(_api_component);
	
	var _schema_component = __webpack_require__(490);
	
	var _schema_component2 = _interopRequireDefault(_schema_component);
	
	var _Button = __webpack_require__(131);
	
	var _Button2 = _interopRequireDefault(_Button);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var EcosystemCard = function EcosystemCard(_ref) {
	  var big = _ref.big,
	      image = _ref.image,
	      link = _ref.link,
	      text = _ref.text,
	      title = _ref.title;
	  return _react2.default.createElement(
	    'div',
	    { className: (0, _classnames2.default)('grid__item', { full: big }) },
	    _react2.default.createElement(
	      'div',
	      { className: (0, _classnames2.default)('card ecosystem__card', { big: big }) },
	      _react2.default.createElement(
	        'div',
	        { className: 'card__circle' },
	        _react2.default.createElement('img', { src: image, alt: title, width: '646', height: '646' })
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'card__content' },
	        _react2.default.createElement(
	          'h3',
	          null,
	          title
	        ),
	        _react2.default.createElement(
	          'article',
	          { className: 'card__autosize' },
	          _react2.default.createElement(
	            'p',
	            null,
	            text
	          )
	        ),
	        _react2.default.createElement(_Button2.default, { text: 'Read more', className: 'btn ecosystem__button small', link: link })
	      )
	    )
	  );
	};
	
	EcosystemCard.propTypes = {
	  big: _propTypes2.default.bool,
	  image: _propTypes2.default.string.isRequired,
	  link: _propTypes2.default.string.isRequired,
	  text: _propTypes2.default.string.isRequired,
	  title: _propTypes2.default.string.isRequired
	};
	
	EcosystemCard.defaultProps = {
	  big: false
	};
	
	var Ecosystem = function Ecosystem() {
	  return _react2.default.createElement(
	    'section',
	    { className: 'home__part home__ecosystem' },
	    _react2.default.createElement(
	      'div',
	      { className: 'container' },
	      _react2.default.createElement(
	        'h1',
	        { className: 'ecosystem__title' },
	        'The API Platform ',
	        _react2.default.createElement(
	          'strong',
	          null,
	          'Framework'
	        )
	      ),
	      _react2.default.createElement(
	        'h5',
	        null,
	        'API Platform is a set of tools to build and consume web APIs'
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'ecosystem__content grid__container' },
	        _react2.default.createElement(EcosystemCard, {
	          big: true,
	          image: _api_component2.default,
	          link: '/docs/core',
	          text: 'Build a fully-featured hypermedia or GraphQL API in minutes. Leverage its awesome features to develop complex and high performance API-first projects. Extend or override everything you want.',
	          title: 'API Component'
	        }),
	        _react2.default.createElement(EcosystemCard, {
	          image: _schema_component2.default,
	          link: '/docs/schema-generator',
	          text: 'Instantly generates a PHP data model from the Schema.org vocabulary. Let the ORM create the related tables.',
	          title: 'Schema Gen Component'
	        }),
	        _react2.default.createElement(EcosystemCard, {
	          image: _admin_component2.default,
	          link: '/docs/admin',
	          text: 'Adds a convenient Material Design administration interface built with React without writing a line of code. It\'s a Progressive Web App!',
	          title: 'Admin Component'
	        }),
	        _react2.default.createElement(EcosystemCard, {
	          image: _scaffolding_component2.default,
	          link: '/docs/client-generator',
	          text: 'Scaffolds a Progressive Web App (React or Vue.js) or a native mobile app (React Native), and edit it to fit your needs.',
	          title: 'Client Gen Component'
	        })
	      )
	    )
	  );
	};
	
	exports.default = Ecosystem;
	module.exports = exports['default'];

/***/ }),

/***/ 216:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _expose = __webpack_require__(485);
	
	var _expose2 = _interopRequireDefault(_expose);
	
	var _HomeList = __webpack_require__(132);
	
	var _HomeList2 = _interopRequireDefault(_HomeList);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var data = ['<strong>Javascript apps</strong> (including but not limited to React and Angular)', '<strong>Native mobile apps</strong> (iOS, Android...)', '<strong>All modern programming languages</strong> (PHP, Java, .Net, Ruby, Python...)'];
	
	var Expose = function Expose() {
	  return _react2.default.createElement(
	    'section',
	    { className: 'home__part home__expose' },
	    _react2.default.createElement(
	      'div',
	      { className: 'container expose__container' },
	      _react2.default.createElement(
	        'article',
	        { className: 'expose__content' },
	        _react2.default.createElement(
	          'h1',
	          { className: 'expose__title' },
	          'Easy to ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'expose'
	          ),
	          ', easy to ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'consume'
	          ),
	          '!'
	        ),
	        _react2.default.createElement(
	          'p',
	          null,
	          'API Platform is agnostic of the client-side technology. Thanks to open web standards, it is compatible with:'
	        ),
	        _react2.default.createElement(_HomeList2.default, { data: data, className: 'expose__list' })
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'expose__spider' },
	        _react2.default.createElement('img', { src: _expose2.default, alt: 'Expose and consume', width: '400', height: '419' })
	      )
	    )
	  );
	};
	
	exports.default = Expose;
	module.exports = exports['default'];

/***/ }),

/***/ 217:
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Flag = function Flag() {
	  return _react2.default.createElement(
	    "svg",
	    { className: "cover__flag", height: "190", width: "268", viewBox: "0 0 267.7 190" },
	    _react2.default.createElement(
	      "a",
	      { href: "https://les-tilleuls.coop/en", target: "_blank", rel: "noopener noreferrer" },
	      _react2.default.createElement("polygon", { fill: "#253032", points: "267.3 186.9 267.3 150.3 52.7 0 0.4 0 " }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M62.8 30.7l2.6-3.7c0.3-0.5 0.4-0.8 0.4-1.2 0-0.4-0.2-0.7-0.6-1 -0.5-0.4-1.1-0.5-1.5-0.4 -0.4 0.1-0.9 0.5-1.4 1.1l-2.2 3.2 -0.9-0.6 2.6-3.7c0.3-0.5 0.4-0.8 0.4-1.2 0-0.4-0.2-0.7-0.6-1C61 21.9 60.5 21.8 60 22s-0.9 0.6-1.5 1.3l-2.1 3 -0.9-0.6 3.9-5.6 0.7 0.5 -0.4 0.8 0.1 0c0.4-0.2 0.7-0.2 1.2-0.2s0.8 0.2 1.2 0.5c0.9 0.6 1.3 1.3 1.1 2.2l0.1 0c0.4-0.2 0.8-0.2 1.2-0.2s0.9 0.3 1.3 0.5c0.6 0.5 1 1 1.1 1.5 0 0.6-0.1 1.2-0.6 1.9l-2.6 3.7C63.7 31.3 62.8 30.7 62.8 30.7z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M68.8 34.9l0.4-0.9 -0.1 0c-0.5 0.1-1 0.2-1.3 0.1 -0.4-0.1-0.8-0.3-1.2-0.6 -0.6-0.4-0.9-0.8-1-1.3 -0.1-0.5 0-1 0.4-1.6 0.8-1.1 2.2-1.1 4 0.1l1 0.6 0.2-0.4c0.3-0.5 0.4-0.8 0.4-1.2 0-0.4-0.3-0.6-0.7-0.9 -0.5-0.3-1.1-0.6-1.9-0.7l0.2-0.8c0.4 0 0.8 0.1 1.2 0.3 0.4 0.2 0.7 0.3 1.1 0.6 0.6 0.5 1 1 1.2 1.5 0.1 0.5-0.1 1.1-0.6 1.8l-2.7 3.9C69.5 35.4 68.8 34.9 68.8 34.9zM67.4 33c0.5 0.4 1 0.5 1.5 0.5 0.5-0.1 1-0.4 1.3-0.9l0.4-0.5 -0.9-0.6C69 31 68.4 30.8 68 30.8c-0.4 0-0.8 0.1-1.1 0.5 -0.2 0.3-0.3 0.6-0.2 0.9C66.8 32.5 67 32.8 67.4 33z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M75.6 38.5L75.6 38.5c-0.9 0.3-1.7 0.1-2.4-0.4 -0.8-0.5-1.1-1.1-1.2-1.9 0-0.8 0.3-1.6 0.9-2.6s1.4-1.5 2.2-1.7c0.8-0.2 1.5-0.1 2.2 0.4 0.8 0.5 1.1 1.2 1.2 2l0.1 0 0.2-0.5 0.3-0.4 1.6-2.3 0.9 0.6 -5.6 8 -0.7-0.5L75.6 38.5zM73.9 37.5c0.6 0.4 1.1 0.5 1.6 0.4 0.4-0.1 1-0.5 1.5-1.2l0.1-0.2c0.6-0.8 0.8-1.4 0.8-2 0-0.6-0.3-1-0.9-1.4 -0.5-0.4-1-0.4-1.6-0.2 -0.6 0.2-1.1 0.6-1.6 1.4S73 35.6 73 36.1C73.1 36.7 73.3 37.1 73.9 37.5z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M80 42.9c-0.8-0.6-1.3-1.3-1.5-2.2 -0.1-0.9 0.2-1.7 0.8-2.6 0.7-0.9 1.4-1.5 2.2-1.7 0.8-0.2 1.6-0.1 2.4 0.5 0.7 0.5 1.1 1.1 1.2 1.9 0.1 0.8-0.1 1.5-0.6 2.3l-0.4 0.5 -3.9-2.7c-0.5 0.6-0.6 1.3-0.5 1.9 0.1 0.6 0.4 1.1 1 1.5 0.6 0.4 1.3 0.7 2.1 0.9l-0.5 0.8c-0.4-0.1-0.7-0.2-1.1-0.3C80.7 43.3 80.4 43.2 80 42.9zM83.4 37.6c-0.5-0.3-0.9-0.4-1.4-0.3 -0.5 0.1-0.9 0.4-1.3 0.9l2.9 2c0.4-0.5 0.5-1 0.5-1.5C84.1 38.3 83.8 37.9 83.4 37.6z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M91 50.4l1.3-4.1c0.1-0.2 0.3-0.8 0.6-1.7l-0.1 0c-0.5 0.5-1 0.9-1.3 1.2l-3.3 2.5 -1-0.7 2.4-6.7 0.9 0.6c-0.6 1.7-1.1 3-1.4 3.8 -0.4 0.9-0.6 1.4-0.7 1.8l0.1 0c0.2-0.1 0.4-0.4 0.7-0.6 0.3-0.3 0.6-0.5 0.8-0.6l3.3-2.5 0.9 0.7L92.8 48c-0.2 0.7-0.4 1.4-0.6 1.7l0.1 0c0.1-0.1 0.3-0.3 0.5-0.5 0.3-0.3 1.6-1.4 4-3.4l0.9 0.6L92.1 51 91 50.3 91 50.4z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M99.5 45.7c0.1-0.2 0.3-0.3 0.4-0.3 0.2 0 0.3 0 0.4 0.1s0.2 0.2 0.3 0.4c0.1 0.1 0 0.4-0.1 0.5s-0.3 0.3-0.5 0.3c-0.2 0-0.3 0-0.4-0.1 -0.1-0.1-0.3-0.3-0.3-0.4C99.3 46.1 99.3 45.9 99.5 45.7zM95.4 53.5l-0.9-0.6 3.9-5.6 0.9 0.6L95.4 53.5z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M99.4 55.5c0.2 0.1 0.3 0.2 0.5 0.2 0.1 0.1 0.3 0.1 0.4 0.2l-0.5 0.6c-0.2 0-0.3-0.1-0.5-0.2 -0.2-0.1-0.4-0.2-0.5-0.3 -1.1-0.8-1.2-1.7-0.5-2.8l2.3-3.3 -0.8-0.6 0.3-0.4 1.1 0.2 1.2-1 0.5 0.3 -0.9 1.3 1.6 1.1 -0.5 0.6 -1.6-1.1 -2.3 3.3c-0.2 0.4-0.4 0.6-0.3 0.9C99 55 99.1 55.3 99.4 55.5z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M104.8 60.1l2.5-3.6c0.3-0.5 0.5-0.9 0.4-1.3 0-0.4-0.3-0.7-0.7-1 -0.6-0.4-1.2-0.6-1.6-0.4 -0.5 0.1-1 0.6-1.5 1.3l-2 2.9 -0.9-0.6 5.6-8 0.9 0.6 -1.7 2.4c-0.2 0.3-0.4 0.5-0.6 0.7l0.1 0c0.4-0.2 0.7-0.2 1.2-0.2 0.4 0 0.8 0.2 1.2 0.5 0.7 0.5 1.1 1 1.3 1.6 0.1 0.6 0 1.2-0.6 1.9l-2.6 3.7L104.8 60.1 104.8 60.1z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M138.7 75.3c0.8 0.5 1.1 1.1 1.2 1.9 0 0.8-0.3 1.6-0.9 2.6 -0.7 0.9-1.4 1.5-2.2 1.7 -0.8 0.2-1.5 0.1-2.2-0.4 -0.4-0.2-0.7-0.6-0.9-0.9s-0.3-0.8-0.3-1.2l-0.1 0 -0.7 0.6 -0.6-0.4 5.6-8 0.9 0.6 -1.4 1.9c-0.3 0.4-0.6 0.8-0.9 1.1l0.1 0C137.1 74.6 137.9 74.7 138.7 75.3zM138 75.9c-0.6-0.4-1.1-0.5-1.7-0.4 -0.5 0.2-1 0.6-1.6 1.4s-0.8 1.4-0.8 2c0 0.6 0.3 1 0.9 1.4 0.5 0.4 1.1 0.5 1.6 0.2 0.5-0.2 1.1-0.6 1.6-1.4 0.5-0.8 0.8-1.4 0.7-1.9S138.6 76.3 138 75.9z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M141.5 77.4l0.9 0.7 -1 4.1c-0.2 1-0.4 1.6-0.6 1.9l0.1 0c0.2-0.1 0.4-0.4 0.9-0.7 0.4-0.3 1.8-1.3 4.1-2.9l0.9 0.7L140 86c-0.7 0.5-1.3 0.7-1.8 0.8 -0.5 0.1-1-0.1-1.5-0.4 -0.2-0.2-0.5-0.4-0.7-0.6l0.5-0.7c0.1 0.2 0.4 0.3 0.6 0.5 0.6 0.4 1.2 0.3 1.9-0.1l0.9-0.6L141.5 77.4z"
	      }),
	      _react2.default.createElement("path", {
	        d: "M129.4 64c-0.3-0.7-0.8-1.3-1.5-1.7 -1.2-0.8-2.5-1-3.8-0.7 -0.1-1.3-0.8-2.5-1.9-3.4 -0.6-0.5-1.4-0.7-2.1-0.8 -1.6-0.2-3.2 0.5-4.2 1.9 -0.3 0.4-0.5 0.8-0.6 1.3 -1.4 3.3 1.9 11 1.9 11s8.3 0.4 11-2c0.4-0.3 0.7-0.6 1-1C130 67.2 130.1 65.4 129.4 64L129.4 64z",
	        fill: "#C34536"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M151.5 90.7c0.1 0 0.3 0 0.4 0 0.2 0 0.4 0 0.8 0 0.3 0 0.6 0 0.9 0 0.4 0 0.7 0 1 0l0.4-0.4c0.8-0.9 1.5-1.6 2.3-2.3 0.8-0.7 1.5-1.2 2.3-1.6 0.7-0.4 1.5-0.8 2.2-1 0.7-0.2 1.3-0.4 2-0.5 0.6-0.1 1.2-0.1 1.6 0 0.5 0.1 0.9 0.3 1.2 0.5 0.2 0.2 0.4 0.4 0.6 0.6 0.1 0.2 0.2 0.5 0.2 0.7 0 0.3-0.1 0.6-0.1 0.9 0 0.3-0.3 0.7-0.5 1 -0.3 0.4-0.7 0.8-1.1 1.2 -0.4 0.4-0.9 0.7-1.5 1 -0.6 0.3-1.2 0.6-1.8 0.8 -0.7 0.2-1.4 0.4-2.1 0.6 -0.7 0.2-1.4 0.3-2.1 0.3 -0.8 0.1-1.5 0.1-2.2 0 -0.2 0.3-0.4 0.5-0.5 0.6 -0.1 0.2-0.2 0.3-0.2 0.4s-0.1 0.1-0.1 0.2c0 0.1 0 0.1 0 0.1 0 0.1 0 0.1-0.1 0.1s0 0.1 0.1 0.1c0.1 0 0.1 0.1 0.1 0.2 0.1 0 0.2 0.1 0.4 0.2 0.2 0.2 0.5 0.3 0.9 0.4l2.7 1c0.1 0 0.1 0 0.1 0.1 0.1 0 0.1 0 0.1 0.1 0.1 0.1 0.2 0.2 0.3 0.3 0 0.1 0.1 0.2 0.1 0.3 0 0.1 0 0.3 0 0.3 -0.1 0.1-0.1 0.2-0.1 0.3 -0.1 0.1-0.1 0.2-0.3 0.3 0 0.1-0.2 0.1-0.3 0.2s-0.2 0-0.4 0c-0.1 0-0.3 0-0.4-0.1 -0.6-0.2-1.1-0.3-1.7-0.5 -0.2-0.1-0.5-0.2-0.8-0.3 -0.3-0.1-0.6-0.2-0.8-0.3 -0.3-0.1-0.5-0.3-0.8-0.4 -0.2-0.2-0.5-0.3-0.7-0.4 -0.4-0.2-0.6-0.5-0.7-0.7 -0.2-0.3-0.2-0.6-0.2-0.8 0-0.3 0.1-0.6 0.2-0.9 0.1-0.3 0.3-0.6 0.5-0.9 -0.6 0-1.1 0-1.5 0 -0.4 0-0.6-0.1-0.7-0.1 -0.1 0-0.2-0.1-0.2-0.2 0-0.1 0-0.2 0-0.4 0-0.1 0-0.3 0.1-0.4 0-0.2 0.1-0.3 0.1-0.3 0-0.1 0.1-0.2 0.2-0.2C151.3 90.7 151.4 90.7 151.5 90.7zM157.1 91.1c0.4-0.1 0.8-0.2 1.3-0.3 0.4-0.1 0.9-0.2 1.4-0.3s0.9-0.3 1.4-0.4c0.5-0.2 0.9-0.3 1.3-0.5 0.4-0.2 0.8-0.4 1.1-0.6 0.3-0.2 0.6-0.4 0.8-0.7 0.1-0.1 0.1-0.2 0.2-0.3 0-0.1 0.1-0.2 0.2-0.2 0.2-0.2 0.3-0.5 0.3-0.7 0-0.2-0.1-0.3-0.2-0.4s-0.3-0.1-0.7-0.1c-0.3 0.1-0.7 0.1-1.1 0.2s-0.9 0.4-1.4 0.6c-0.5 0.2-1 0.6-1.5 0.9s-1.1 0.8-1.6 1.3C158.1 89.9 157.6 90.4 157.1 91.1z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M161.1 100.9c-0.4-0.3-0.8-0.6-0.9-1 -0.2-0.4-0.3-0.8-0.4-1.2s0.1-0.8 0.2-1.3c0.1-0.4 0.3-0.8 0.6-1.2 0.2-0.2 0.4-0.5 0.6-0.8 0.3-0.3 0.5-0.5 0.8-0.7 0.3-0.2 0.6-0.4 0.9-0.5 0.3-0.1 0.7-0.2 1-0.3 0.4 0 0.7 0 1 0 0.3 0 0.6 0.2 1 0.4 0.2 0.2 0.4 0.4 0.6 0.6 0.2 0.2 0.3 0.5 0.3 0.8 0.1 0.3 0 0.6 0 0.8 0 0.3-0.2 0.6-0.4 0.8 -0.2 0.3-0.5 0.5-0.8 0.7 -0.3 0.2-0.7 0.3-1.2 0.4 -0.4 0.1-0.9 0.1-1.3 0 -0.5-0.1-0.9-0.1-1.4-0.3 0 0.2 0 0.3 0 0.4 0 0.1 0 0.2 0.1 0.3 0 0.1 0.1 0.1 0.2 0.3 0.1 0 0.2 0.1 0.2 0.2 0.3 0.2 0.6 0.4 1 0.4s0.7 0.2 1.2 0.2c0.4 0 0.8 0.1 1.2 0s0.7 0 1-0.1l0.2 1.6c-0.7 0.1-1.4 0.2-2.1 0.2 -0.3 0-0.6 0-0.9 0s-0.6-0.1-0.9-0.1c-0.3 0-0.6-0.2-0.9-0.3C161.7 101.2 161.4 101 161.1 100.9zM162.5 97c0.2 0.1 0.4 0.2 0.6 0.3s0.5 0.1 0.8 0c0.3 0 0.5-0.1 0.7-0.1 0.2-0.1 0.4-0.2 0.5-0.3 0.2-0.2 0.2-0.4 0.3-0.6 0-0.2-0.1-0.3-0.2-0.4 -0.2-0.1-0.4-0.2-0.6-0.3 -0.2 0-0.4 0-0.6 0 -0.2 0-0.3 0.1-0.5 0.2 -0.2 0.1-0.3 0.2-0.4 0.4 -0.2 0.1-0.3 0.3-0.4 0.4C162.6 96.7 162.5 96.9 162.5 97z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M166 100.3c0.4-0.1 0.8-0.1 1-0.1 0.3 0 0.5-0.1 0.7-0.1 0.2 0 0.4-0.1 0.5-0.1 0.2 0 0.4-0.2 0.7-0.2 0.2-0.1 0.5-0.1 0.9-0.3 0.3-0.1 0.8-0.2 1.4-0.4 0.1 0 0.2-0.1 0.3-0.1 0.1 0 0.3-0.1 0.4-0.1 0.2 0 0.3 0 0.4 0 0.2 0 0.3 0.1 0.4 0.2 0.2 0.2 0.4 0.3 0.5 0.4 0.1 0.1 0.2 0.3 0.1 0.3 0 0.1 0 0.2 0 0.3 0 0.1-0.1 0.1-0.1 0.2 -0.1 0.1-0.2 0.2-0.4 0.3 -0.1 0.1-0.3 0.1-0.6 0.2 -0.2 0-0.3 0.1-0.5 0.1 -0.2 0-0.3 0.1-0.3 0.1 -0.1 0.1-0.2 0.3-0.2 0.5 -0.1 0.1-0.1 0.3-0.2 0.4 0 0.2-0.1 0.3-0.1 0.4 0 0.2-0.1 0.3-0.2 0.5 -0.1 0.2-0.2 0.4-0.4 0.6 -0.2 0.2-0.3 0.5-0.5 0.8 0.3 0 0.5 0 0.7 0.1 0.3 0 0.5 0.1 0.8 0.1 0.3 0 0.5 0.1 0.8 0.2 0.3 0 0.6 0.1 0.9 0l-1.1 1.5c-0.5 0-0.9 0-1.4-0.1 -0.5-0.1-1-0.2-1.5-0.3 -0.5-0.2-1-0.3-1.5-0.5 -0.5-0.2-0.9-0.5-1.3-0.7 -0.3-0.2-0.5-0.4-0.7-0.6s-0.3-0.4-0.4-0.6c-0.1-0.2-0.1-0.4-0.1-0.7 0-0.3 0.1-0.5 0.3-0.8 -0.1 0-0.1-0.1-0.2-0.1 -0.1 0-0.1-0.1-0.2-0.1 -0.1 0-0.1-0.1-0.2-0.2 -0.1 0-0.1-0.1-0.1-0.2 0-0.1 0-0.1 0-0.2 0-0.1 0.1-0.2 0.1-0.3 0.1-0.1 0.2-0.2 0.3-0.3 0.1-0.1 0.2-0.1 0.3-0.1 0.1 0 0.2 0 0.4 0C165.8 100.3 165.9 100.3 166 100.3zM166.2 101.8c0.1 0 0.1 0.1 0.1 0.2 0 0.1 0 0.2 0.1 0.4 0 0.1 0.1 0.3 0.1 0.4 0.1 0.1 0.2 0.3 0.3 0.4 0.2 0.1 0.4 0.2 0.6 0.2 0.2 0 0.3 0 0.5 0 0.1-0.1 0.3-0.2 0.4-0.3 0.1-0.1 0.3-0.3 0.3-0.4s0.2-0.2 0.2-0.4 0.1-0.3 0.2-0.4 0.1-0.3 0.2-0.4c0-0.2 0.1-0.2 0.1-0.3L166.2 101.8z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M181.2 101.3c0.3-0.4 0.6-0.7 0.9-0.8 0.4-0.2 0.7-0.3 1.1-0.3 0.4 0 0.9 0.1 1.4 0.3 0.5 0.2 1 0.3 1.6 0.6 0.5 0.3 1.1 0.6 1.6 0.9 0.6 0.3 1.2 0.7 1.7 1.1 0.8 0.6 1.6 1.2 2.4 1.9 0.8 0.7 1.6 1.4 2.5 2.3 0.2 0.2 0.3 0.4 0.3 0.6 0 0.2 0 0.3-0.2 0.5 -0.1 0.1-0.1 0.2-0.3 0.3 -0.1 0-0.2 0.1-0.3 0.1 -0.1 0-0.3 0-0.4 0 -0.2 0-0.2-0.1-0.3-0.1 -0.4-0.2-0.7-0.5-1.1-0.8 -0.4-0.3-0.7-0.6-1.1-0.9 -0.4-0.3-0.7-0.7-1.2-1 -0.4-0.4-0.8-0.7-1.3-1.1 -0.4 0.5-0.9 0.9-1.4 1.4 -0.5 0.5-1.1 1-1.7 1.5 -0.6 0.6-1.2 1-1.7 1.5s-1.2 0.9-1.7 1.4c-0.5 0.4-1 0.8-1.5 1.2 -0.4 0.4-0.8 0.7-1.2 1 -0.2 0.1-0.3 0.2-0.5 0.3 -0.1 0.1-0.3 0.1-0.5 0.2 -0.2 0-0.3 0.1-0.5 0 -0.2 0-0.2-0.1-0.3-0.1 -0.2-0.2-0.4-0.4-0.5-0.6 -0.1-0.2 0-0.5 0.2-0.7 0-0.1 0.1-0.2 0.3-0.3 0.3-0.4 0.7-0.7 1.1-1.1 0.4-0.3 0.8-0.7 1.3-1 0.4-0.3 0.9-0.7 1.5-1.1 0.5-0.3 1.1-0.8 1.7-1.2s1.3-0.9 2-1.5 1.6-1.2 2.4-1.8c-0.2-0.2-0.5-0.3-0.8-0.5 -0.2-0.2-0.5-0.3-0.8-0.4 -0.3-0.1-0.6-0.2-0.8-0.3 -0.2-0.1-0.5-0.2-0.7-0.1 -0.3 0-0.4 0-0.6 0.1 -0.2 0-0.3 0.2-0.4 0.4 0 0 0 0.1-0.1 0.2 -0.1 0.1-0.2 0.1-0.3 0.2 -0.1 0.1-0.3 0.1-0.6 0 -0.3 0-0.4-0.1-0.7-0.3s-0.4-0.4-0.6-0.6c-0.1-0.2-0.1-0.3-0.1-0.5C181 101.6 181 101.4 181.2 101.3z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M190.1 119c-0.3 0.1-0.6 0-0.9 0.1 -0.4 0-0.8 0-1.1-0.1 -0.4-0.1-0.8-0.1-1.1-0.3 -0.4-0.1-0.7-0.3-0.9-0.5 -0.2-0.2-0.4-0.3-0.5-0.5 -0.1-0.2-0.2-0.4-0.2-0.6s0-0.4 0.1-0.6c0.1-0.2 0.2-0.4 0.4-0.6 0.2-0.3 0.5-0.6 0.8-0.9 0.3-0.4 0.7-0.6 1.1-1 0.4-0.3 0.7-0.7 1.2-1 0.4-0.3 0.7-0.6 1.1-0.9 0.1-0.1 0.3-0.2 0.4-0.2 0.2 0 0.3-0.1 0.5 0 0.2 0 0.3 0 0.4 0.1 0.1 0.1 0.3 0.1 0.4 0.2 0.2 0.1 0.3 0.3 0.3 0.4 0 0.1 0 0.3-0.1 0.4 -0.1 0.1-0.2 0.2-0.3 0.4 -0.2 0.1-0.4 0.3-0.6 0.5 -0.2 0.2-0.5 0.4-0.8 0.6 -0.3 0.3-0.5 0.4-0.8 0.7 -0.3 0.3-0.5 0.4-0.7 0.7 -0.3 0.3-0.4 0.5-0.6 0.7 -0.2 0.2-0.2 0.4-0.3 0.5 0 0.2 0 0.3 0.2 0.4s0.4 0.2 0.6 0.2 0.6 0.1 0.9 0c0.4 0 0.7-0.1 1-0.1s0.6-0.1 0.9-0.1L190.1 119 190.1 119zM192 109.8c0.1-0.1 0.2-0.2 0.3-0.3 0.1-0.1 0.3-0.2 0.5-0.2 0.2 0 0.4-0.1 0.6 0 0.2 0.1 0.5 0.2 0.7 0.3 0.2 0.1 0.3 0.2 0.4 0.4 0.1 0.1 0.2 0.3 0.2 0.4 0.1 0.1 0.1 0.3 0 0.5 0 0.2-0.1 0.4-0.2 0.6s-0.2 0.3-0.4 0.4c-0.1 0.1-0.3 0.2-0.5 0.2 -0.2 0-0.4 0.1-0.6 0 -0.2-0.1-0.4-0.1-0.7-0.3 -0.4-0.3-0.6-0.6-0.7-0.9C191.8 110.4 191.8 110.1 192 109.8z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M190.3 121.3c-0.2-0.2-0.4-0.4-0.5-0.8 -0.1-0.4 0-0.8 0.1-1.2 0.1-0.5 0.2-1 0.6-1.5 0.2-0.6 0.6-1.1 0.9-1.6 0.3-0.4 0.7-0.8 1.1-1.3 0.4-0.4 0.8-0.9 1.3-1.3 0.5-0.4 0.9-0.8 1.5-1.2 0.5-0.4 1-0.7 1.6-1.1 0.5-0.3 1.1-0.6 1.6-0.9 0.5-0.2 1-0.4 1.5-0.5 0.4-0.1 0.9-0.2 1.3-0.1 0.4 0 0.7 0.2 1 0.4 0.2 0.1 0.3 0.3 0.4 0.4 0 0.2 0.1 0.4 0 0.6 0 0.2-0.1 0.4-0.2 0.6 -0.1 0.2-0.2 0.4-0.4 0.6 -0.3 0.4-0.7 0.8-1.1 1.2 -0.4 0.4-0.8 0.7-1.4 1.1 -0.5 0.3-1 0.6-1.5 0.9 -0.6 0.3-1.1 0.5-1.6 0.9 -0.6 0.3-1.1 0.5-1.6 0.8 -0.5 0.2-1.1 0.5-1.6 0.8 0 0.1-0.1 0.1-0.2 0.1s-0.2 0.1-0.2 0.2 -0.2 0.1-0.3 0.3c-0.1 0.1-0.2 0.1-0.3 0.3l-0.1 0.1c-0.1 0.1-0.2 0.2-0.2 0.4 -0.1 0.1-0.1 0.3-0.1 0.4 0 0.2-0.1 0.2 0 0.3 0 0.1 0 0.1 0.1 0.1 0.1 0 0.2 0.1 0.3 0.1 0.2 0 0.3 0.1 0.5 0.1 0.2 0 0.3 0 0.6 0.1 0.2 0 0.4 0 0.6 0.1 0.4 0 0.9 0 1.3 0l-0.4 1.9c-0.6 0-1.2 0-1.8-0.1 -0.3 0-0.5-0.1-0.7-0.1 -0.3 0-0.5-0.1-0.7-0.2 -0.2-0.1-0.4-0.1-0.6-0.2C190.7 121.4 190.5 121.4 190.3 121.3zM194.2 115.8c0.5-0.2 0.9-0.5 1.5-0.8 0.6-0.3 1.1-0.6 1.6-1 0.6-0.3 1.1-0.7 1.6-1.1 0.5-0.3 0.9-0.8 1.2-1.1 0.1-0.1 0.2-0.2 0.2-0.4 0.1-0.1 0.1-0.1 0-0.2 -0.1-0.1-0.3-0.1-0.6-0.1 -0.3 0.1-0.6 0.2-1 0.4s-0.7 0.4-1.2 0.7c-0.4 0.2-0.9 0.6-1.2 1 -0.3 0.4-0.8 0.8-1.2 1.2C194.8 114.9 194.5 115.3 194.2 115.8z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M194.4 124.1c-0.2-0.2-0.4-0.4-0.5-0.8 -0.1-0.4 0-0.8 0.1-1.2 0.1-0.5 0.2-1 0.6-1.5 0.2-0.6 0.6-1.1 0.9-1.6 0.3-0.4 0.7-0.8 1.1-1.3 0.4-0.4 0.8-0.9 1.3-1.3 0.5-0.4 0.9-0.8 1.5-1.2 0.5-0.4 1-0.7 1.6-1.1 0.5-0.3 1.1-0.6 1.6-0.9s1-0.4 1.5-0.5c0.4-0.1 0.9-0.2 1.3-0.1 0.4 0 0.7 0.2 1 0.4 0.2 0.1 0.3 0.3 0.4 0.4 0 0.2 0.1 0.4 0 0.6 0 0.2-0.1 0.4-0.2 0.6 -0.1 0.2-0.2 0.4-0.4 0.6 -0.3 0.4-0.7 0.8-1.1 1.2 -0.4 0.4-0.8 0.7-1.4 1.1 -0.5 0.3-1 0.6-1.5 0.9 -0.6 0.3-1.1 0.5-1.6 0.9 -0.6 0.3-1.1 0.5-1.6 0.8 -0.5 0.2-1.1 0.5-1.6 0.8 0 0.1-0.1 0.1-0.2 0.1 0 0.1-0.2 0.1-0.2 0.2 0 0.1-0.2 0.1-0.3 0.3s-0.2 0.1-0.3 0.3l-0.1 0.1c-0.1 0.1-0.2 0.2-0.2 0.4 -0.1 0.1-0.1 0.3-0.1 0.4 0 0.2-0.1 0.2 0 0.3 0 0.1 0 0.1 0.1 0.1s0.2 0.1 0.3 0.1c0.2 0 0.3 0.1 0.5 0.1 0.2 0 0.3 0 0.6 0.1 0.2 0 0.4 0 0.6 0.1 0.4 0 0.9 0 1.3 0L199 125c-0.6 0-1.2 0-1.8-0.1 -0.3 0-0.5-0.1-0.7-0.1 -0.3 0-0.5-0.1-0.7-0.2 -0.2-0.1-0.4-0.1-0.6-0.2C194.8 124.3 194.5 124.2 194.4 124.1zM198.3 118.7c0.5-0.2 0.9-0.5 1.5-0.8 0.6-0.3 1.1-0.6 1.6-1 0.6-0.3 1.1-0.7 1.6-1.1 0.5-0.3 0.9-0.8 1.2-1.1 0.1-0.1 0.2-0.2 0.2-0.4 0.1-0.1 0.1-0.1 0-0.2 -0.1-0.1-0.3-0.1-0.6-0.1 -0.3 0.1-0.6 0.2-1 0.4s-0.7 0.4-1.2 0.7c-0.4 0.3-0.9 0.6-1.2 1 -0.3 0.4-0.8 0.8-1.2 1.2C198.9 117.8 198.6 118.2 198.3 118.7z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M199.3 127.6c-0.4-0.3-0.8-0.6-0.9-1 -0.2-0.4-0.3-0.8-0.4-1.2 -0.1-0.4 0.1-0.8 0.2-1.3 0.1-0.4 0.3-0.8 0.6-1.2 0.2-0.2 0.4-0.5 0.6-0.8 0.3-0.3 0.5-0.5 0.8-0.7 0.3-0.2 0.6-0.4 0.9-0.5 0.3-0.1 0.7-0.2 1-0.3 0.4 0 0.7 0 1 0 0.3 0 0.6 0.2 1 0.4 0.2 0.2 0.4 0.4 0.6 0.6 0.2 0.2 0.3 0.5 0.3 0.8s0 0.6 0 0.8c0 0.3-0.2 0.6-0.4 0.8 -0.2 0.3-0.5 0.5-0.8 0.7 -0.3 0.2-0.7 0.3-1.2 0.4 -0.4 0.1-0.9 0.1-1.3 0 -0.5-0.1-0.9-0.1-1.4-0.3 0 0.2 0 0.3 0 0.4 0 0.1 0 0.2 0.1 0.3 0 0.1 0.1 0.1 0.2 0.3 0.1 0 0.2 0.1 0.2 0.2 0.3 0.2 0.6 0.4 1 0.4 0.4 0.1 0.7 0.2 1.2 0.2 0.4 0 0.8 0.1 1.2 0s0.7 0 1-0.1l0.2 1.6c-0.7 0.1-1.4 0.2-2.1 0.2 -0.3 0-0.6 0-0.9 0s-0.6-0.1-0.9-0.1c-0.3 0-0.6-0.2-0.9-0.3C199.9 127.9 199.5 127.7 199.3 127.6zM200.6 123.7c0.2 0.1 0.4 0.2 0.6 0.3 0.2 0.1 0.5 0.1 0.8 0 0.3 0 0.5-0.1 0.7-0.1 0.2-0.1 0.4-0.2 0.5-0.3 0.2-0.2 0.2-0.4 0.3-0.6 0-0.2-0.1-0.3-0.2-0.4 -0.2-0.1-0.4-0.2-0.6-0.3 -0.2-0.1-0.4 0-0.6 0 -0.2 0-0.3 0.1-0.5 0.2 -0.2 0.1-0.3 0.2-0.4 0.4 -0.2 0.1-0.3 0.3-0.4 0.4C200.8 123.5 200.7 123.6 200.6 123.7z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M211.9 127.2c-0.1 0.1-0.2 0.3-0.4 0.5 -0.2 0.2-0.4 0.4-0.6 0.6 -0.2 0.2-0.5 0.4-0.6 0.7 -0.3 0.3-0.5 0.4-0.6 0.7 -0.2 0.2-0.3 0.4-0.5 0.5 -0.1 0.2-0.3 0.3-0.3 0.3 -0.1 0.1-0.2 0.2-0.2 0.4s-0.1 0.2-0.1 0.3c0 0.1 0 0.2 0 0.3 0 0.1 0.1 0.1 0.2 0.2 0.1 0.1 0.2 0.2 0.4 0.2 0.2 0 0.4 0.1 0.6 0.2 0.2 0.1 0.5 0.1 0.7 0 0.3 0 0.5 0 0.7 0 0.3 0 0.5 0 0.7-0.1 0.2 0 0.4-0.1 0.5-0.1 -0.1 0.2-0.2 0.3-0.3 0.4s-0.2 0.2-0.2 0.4c-0.1 0.1-0.2 0.2-0.2 0.4s-0.2 0.2-0.3 0.4c-0.2 0-0.4 0.1-0.6 0.1 -0.3 0-0.5 0-0.7 0 -0.3 0-0.5 0-0.8-0.1 -0.3 0-0.5-0.1-0.8-0.1 -0.3-0.1-0.5-0.2-0.7-0.2s-0.5-0.2-0.6-0.4c-0.2-0.1-0.3-0.3-0.4-0.4 -0.1-0.1-0.1-0.3-0.1-0.5 0-0.2 0-0.4 0.1-0.6 0.1-0.2 0.1-0.4 0.2-0.7 -0.3 0.1-0.6 0.2-0.9 0.2 -0.3 0.1-0.6 0.1-0.9 0.1 -0.3 0-0.6-0.1-0.8-0.1s-0.5-0.2-0.7-0.3c-0.2-0.1-0.3-0.2-0.4-0.3s-0.2-0.3-0.2-0.5c0-0.2 0-0.4 0.1-0.6 0.1-0.2 0.2-0.5 0.4-0.8 0.2-0.4 0.6-0.8 1.1-1.3 0.4-0.5 1-1 1.6-1.7 0-0.1 0.1-0.2 0.3-0.3 0.1-0.1 0.2-0.2 0.4-0.3 0.1-0.1 0.3-0.2 0.5-0.3 0.1-0.1 0.3-0.2 0.5-0.2 0.1-0.1 0.3-0.1 0.5-0.1 0.2 0 0.3 0 0.5 0.2 0.2 0.2 0.4 0.3 0.4 0.5 0.1 0.1 0.1 0.2 0.1 0.3 -0.2 0.2-0.4 0.5-0.7 0.7 -0.3 0.3-0.5 0.5-0.8 0.8 -0.3 0.3-0.5 0.5-0.7 0.8 -0.3 0.3-0.4 0.5-0.6 0.7 -0.2 0.2-0.3 0.4-0.4 0.5s-0.2 0.2-0.2 0.2c0 0.1-0.1 0.2-0.2 0.2 0 0.1 0 0.2-0.1 0.2 0 0.1 0 0.2 0 0.2 0 0.1 0.1 0.1 0.1 0.2 0.1 0.1 0.2 0.1 0.3 0.1s0.3 0 0.5 0c0.2 0 0.3-0.1 0.5-0.2s0.3-0.2 0.5-0.3l3.2-3c0.1-0.1 0.2-0.1 0.5-0.1 0.2 0.1 0.4 0.1 0.6 0.3 0.2 0.2 0.4 0.3 0.4 0.5C212 127 212 127.1 211.9 127.2z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M210.8 135.6c-0.2-0.2-0.4-0.4-0.5-0.8 -0.1-0.4 0-0.8 0.1-1.2 0.1-0.5 0.2-1 0.6-1.5 0.2-0.6 0.6-1.1 0.9-1.6 0.3-0.4 0.7-0.8 1.1-1.3 0.4-0.4 0.8-0.9 1.3-1.3 0.5-0.4 0.9-0.8 1.5-1.2 0.5-0.4 1-0.7 1.6-1.1 0.5-0.3 1.1-0.6 1.6-0.9 0.5-0.2 1-0.4 1.5-0.5 0.4-0.1 0.9-0.2 1.3-0.1 0.4 0 0.7 0.2 1 0.4 0.2 0.1 0.3 0.3 0.4 0.4 0 0.2 0.1 0.4 0 0.6 0 0.2-0.1 0.4-0.2 0.6s-0.2 0.4-0.4 0.6c-0.3 0.4-0.7 0.8-1.1 1.2 -0.4 0.4-0.8 0.7-1.4 1.1 -0.5 0.3-1 0.6-1.5 0.9 -0.6 0.3-1.1 0.5-1.6 0.9 -0.6 0.3-1.1 0.5-1.6 0.8 -0.5 0.2-1.1 0.5-1.6 0.8 0 0.1-0.1 0.1-0.2 0.1 0 0.1-0.2 0.1-0.2 0.2 0 0.1-0.2 0.1-0.3 0.3s-0.2 0.1-0.3 0.3l-0.1 0.1c-0.1 0.1-0.2 0.2-0.2 0.4 -0.1 0.1-0.1 0.3-0.1 0.4 0 0.2-0.1 0.2 0 0.3 0 0.1 0 0.1 0.1 0.1s0.2 0.1 0.3 0.1c0.2 0 0.3 0.1 0.5 0.1 0.2 0 0.3 0 0.6 0.1 0.2 0 0.4 0 0.6 0.1 0.4 0 0.9 0 1.3 0l-0.4 1.9c-0.6 0-1.2 0-1.8-0.1 -0.3 0-0.5-0.1-0.7-0.1 -0.3 0-0.5-0.1-0.7-0.2 -0.2-0.1-0.4-0.1-0.6-0.2C211.1 135.8 210.9 135.7 210.8 135.6zM214.6 130.1c0.5-0.2 0.9-0.5 1.5-0.8s1.1-0.6 1.6-1c0.6-0.3 1.1-0.7 1.6-1.1 0.5-0.3 0.9-0.8 1.2-1.1 0.1-0.1 0.2-0.2 0.2-0.4 0.1-0.1 0.1-0.1 0-0.2 -0.1-0.1-0.3-0.1-0.6-0.1 -0.3 0.1-0.6 0.2-1 0.4s-0.7 0.4-1.2 0.7c-0.4 0.3-0.9 0.6-1.2 1 -0.3 0.4-0.8 0.8-1.2 1.2C215.3 129.3 214.9 129.6 214.6 130.1z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M214.9 134.6c0.4-0.1 0.8-0.1 1-0.1 0.3 0 0.5-0.1 0.7-0.1 0.2 0 0.4-0.1 0.5-0.1 0.2 0 0.4-0.2 0.7-0.2 0.2-0.1 0.5-0.1 0.9-0.3 0.3-0.1 0.8-0.2 1.4-0.4 0.1 0 0.2-0.1 0.3-0.1 0.1 0 0.3-0.1 0.4-0.1 0.2 0 0.3 0 0.4 0 0.2 0 0.3 0.1 0.4 0.2 0.2 0.2 0.4 0.3 0.5 0.4 0.1 0.1 0.2 0.3 0.1 0.3 0 0.1 0 0.2 0 0.3 0 0.1-0.1 0.1-0.1 0.2 -0.1 0.1-0.2 0.2-0.4 0.3 -0.1 0.1-0.3 0.1-0.6 0.2 -0.2 0-0.3 0.1-0.5 0.1 -0.2 0-0.3 0.1-0.3 0.1 -0.1 0.1-0.2 0.3-0.2 0.5 -0.1 0.1-0.1 0.3-0.2 0.4 0 0.2-0.1 0.3-0.1 0.4s-0.1 0.3-0.2 0.5c-0.1 0.2-0.2 0.4-0.4 0.6s-0.3 0.5-0.5 0.8c0.3 0 0.5 0 0.7 0.1 0.3 0 0.5 0.1 0.8 0.1 0.3 0 0.5 0.1 0.8 0.2s0.6 0.1 0.9 0l-1.1 1.5c-0.5 0-0.9 0-1.4-0.1 -0.5-0.1-1-0.2-1.5-0.3 -0.5-0.1-1-0.3-1.5-0.5 -0.5-0.2-0.9-0.5-1.3-0.7 -0.3-0.2-0.5-0.4-0.7-0.6 -0.2-0.2-0.3-0.4-0.4-0.6 -0.1-0.2-0.1-0.4-0.1-0.7 0-0.3 0.1-0.5 0.3-0.8 -0.1 0-0.1-0.1-0.2-0.1 -0.1 0-0.1-0.1-0.2-0.1 -0.1 0-0.1-0.1-0.2-0.2 -0.1 0-0.1-0.1-0.1-0.2 0-0.1 0-0.1 0-0.2 0-0.1 0.1-0.2 0.1-0.3 0.1-0.1 0.2-0.2 0.3-0.3 0.1-0.1 0.2-0.1 0.3-0.1 0.1 0 0.2 0 0.4 0C214.8 134.6 214.9 134.6 214.9 134.6zM215.2 136.1c0.1 0 0.1 0.1 0.1 0.2 0 0.1 0 0.2 0.1 0.4 0 0.2 0.1 0.3 0.1 0.4s0.2 0.3 0.3 0.4c0.2 0.1 0.4 0.2 0.6 0.2 0.2 0 0.3 0 0.5 0 0.1-0.1 0.3-0.2 0.4-0.3 0.1-0.1 0.3-0.3 0.3-0.4s0.2-0.2 0.2-0.4 0.1-0.3 0.2-0.4 0.1-0.3 0.2-0.4c0-0.2 0.1-0.2 0.1-0.3L215.2 136.1z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M224 142.9c0 0 0 0.1-0.1 0.1 0 0.1-0.1 0.2-0.2 0.2 -0.1 0.1-0.2 0.1-0.3 0.2 -0.1 0.1-0.3 0.2-0.4 0.1 -0.2 0-0.4 0-0.5 0 -0.2 0-0.4-0.1-0.6-0.3 -0.2-0.1-0.4-0.2-0.4-0.4s-0.2-0.3-0.2-0.4c0-0.2-0.1-0.3 0-0.5 0-0.2 0.1-0.3 0.3-0.6 0.1-0.2 0.2-0.4 0.4-0.4 0.2-0.1 0.3-0.2 0.5-0.2 0.2 0 0.4-0.1 0.6 0 0.2 0.1 0.4 0.1 0.7 0.3 0.4 0.2 0.6 0.6 0.7 0.9C224.4 142.2 224.3 142.5 224 142.9z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M226.5 146.6c-0.4-0.3-0.7-0.6-0.9-1 -0.2-0.4-0.3-0.8-0.4-1.2 -0.1-0.4 0.1-0.8 0.1-1.2 0.1-0.4 0.3-0.8 0.6-1.2 0.2-0.3 0.4-0.5 0.6-0.8 0.3-0.3 0.5-0.5 0.8-0.7 0.3-0.2 0.6-0.4 1-0.5 0.3-0.1 0.7-0.2 1-0.3 0.4 0 0.7 0 1 0 0.3 0 0.6 0.2 0.9 0.4 0.2 0.2 0.5 0.4 0.6 0.6 0.2 0.2 0.3 0.5 0.3 0.8 0.1 0.2 0.1 0.5 0 0.8 0 0.3-0.2 0.5-0.3 0.7 -0.1 0.2-0.2 0.3-0.4 0.4 -0.2 0.1-0.3 0.2-0.5 0.3 -0.1 0.1-0.3 0.1-0.5 0.1 -0.2 0-0.3 0-0.5-0.2 -0.2-0.2-0.3-0.3-0.3-0.5 0-0.2 0.1-0.4 0.2-0.6 0-0.1 0.1-0.2 0.2-0.2 0.1-0.1 0.1-0.2 0.2-0.2 0.1-0.1 0.1-0.2 0.1-0.3 0-0.1 0-0.2-0.1-0.2 -0.2-0.1-0.4-0.2-0.6-0.2 -0.2 0-0.4 0.1-0.6 0.1 -0.2 0-0.4 0.2-0.6 0.3 -0.2 0.1-0.4 0.3-0.5 0.4 -0.2 0.1-0.3 0.3-0.4 0.5s-0.2 0.3-0.3 0.4c-0.1 0.2-0.2 0.4-0.3 0.6s-0.2 0.4-0.2 0.6c-0.1 0.2 0 0.4 0.1 0.6 0 0.2 0.2 0.4 0.4 0.5 0.2 0.2 0.5 0.3 0.8 0.3 0.4 0.1 0.7 0.1 1.2 0 0.5 0 0.8 0 1.3-0.2 0.4-0.1 0.8-0.1 1.1-0.3l-0.1 1.1c-0.7 0.2-1.4 0.4-2 0.5 -0.3 0.1-0.6 0.1-0.9 0.1 -0.3 0.1-0.6 0-0.9 0 -0.3 0-0.6-0.1-0.9-0.2C227 146.9 226.7 146.8 226.5 146.6z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M237.4 146.5c-0.1 0.4-0.1 0.7-0.3 1s-0.3 0.7-0.5 0.9c-0.2 0.3-0.4 0.5-0.7 0.7 -0.3 0.3-0.5 0.4-0.8 0.7 -0.3 0.2-0.6 0.3-0.9 0.4 -0.3 0.1-0.6 0.2-0.9 0.2 -0.4 0-0.6 0-1-0.1 -0.3 0-0.6-0.3-0.8-0.4 -0.4-0.3-0.7-0.6-0.8-1 -0.2-0.4-0.2-0.8-0.2-1.2 0-0.4 0.1-0.8 0.2-1.2 0.2-0.4 0.4-0.8 0.7-1.2 0.4-0.5 0.8-1 1.2-1.2 0.5-0.3 0.9-0.6 1.4-0.7 0.5-0.1 1.1-0.1 1.6 0 0.5 0.1 1.1 0.3 1.6 0.6 0.4 0.3 0.8 0.6 1.1 1 0.3 0.4 0.6 0.8 0.7 1.3 0.2 0.5 0.3 0.9 0.4 1.4s0.1 1 0.2 1.5l-0.8 0.9c0-0.3 0-0.6-0.2-0.9 -0.1-0.3-0.2-0.6-0.2-1 -0.1-0.3-0.2-0.7-0.3-1 -0.1-0.3-0.2-0.6-0.3-0.8L237.4 146.5zM232.6 148.9c0.2 0.1 0.3 0.1 0.6 0.1 0.2-0.1 0.5-0.1 0.8-0.3 0.3-0.2 0.5-0.4 0.9-0.6 0.3-0.3 0.5-0.5 0.7-0.7 0.2-0.2 0.3-0.4 0.4-0.6 0.1-0.2 0.2-0.4 0.2-0.6 0-0.2 0-0.3 0-0.5 -0.1-0.1-0.2-0.3-0.3-0.4 -0.2-0.1-0.4-0.2-0.7-0.1 -0.3 0.1-0.5 0.1-0.9 0.3 -0.3 0.2-0.6 0.4-0.9 0.6 -0.3 0.3-0.5 0.5-0.7 0.8 -0.1 0.2-0.2 0.4-0.3 0.6 -0.1 0.2-0.1 0.4-0.2 0.6 0 0.2 0 0.4 0.1 0.5C232.3 148.6 232.4 148.8 232.6 148.9z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M243.5 150.9c-0.1 0.4-0.1 0.7-0.3 1 -0.1 0.3-0.3 0.7-0.5 0.9 -0.2 0.3-0.4 0.5-0.7 0.7 -0.3 0.3-0.5 0.4-0.8 0.7 -0.3 0.2-0.6 0.3-0.9 0.4 -0.3 0.1-0.6 0.2-0.9 0.2 -0.4 0-0.6 0-1-0.1 -0.3 0-0.6-0.3-0.8-0.4 -0.4-0.3-0.7-0.6-0.8-1 -0.2-0.4-0.2-0.8-0.2-1.2 0-0.4 0.1-0.8 0.2-1.2 0.2-0.4 0.4-0.8 0.7-1.2 0.4-0.5 0.8-1 1.2-1.2 0.5-0.3 0.9-0.6 1.4-0.7 0.5-0.1 1.1-0.1 1.6 0 0.5 0.1 1.1 0.3 1.6 0.6 0.4 0.3 0.8 0.6 1.1 1 0.3 0.4 0.6 0.8 0.7 1.3 0.2 0.5 0.3 0.9 0.4 1.4 0.1 0.5 0.1 1 0.2 1.5l-0.8 0.9c0-0.3 0-0.6-0.2-0.9s-0.2-0.6-0.2-1c-0.1-0.3-0.2-0.7-0.3-1 -0.1-0.3-0.2-0.6-0.3-0.8L243.5 150.9zM238.7 153.1c0.2 0.1 0.3 0.1 0.6 0.1 0.2-0.1 0.5-0.1 0.8-0.3 0.3-0.2 0.5-0.4 0.9-0.6 0.3-0.3 0.5-0.5 0.7-0.7 0.2-0.2 0.3-0.4 0.4-0.6 0.1-0.2 0.2-0.4 0.2-0.6 0-0.2 0-0.3 0-0.5 -0.1-0.1-0.2-0.3-0.3-0.4 -0.2-0.1-0.4-0.2-0.7-0.1 -0.3 0.1-0.5 0.1-0.9 0.3 -0.3 0.2-0.6 0.4-0.9 0.6 -0.3 0.3-0.5 0.5-0.7 0.8 -0.1 0.2-0.2 0.4-0.3 0.6 -0.1 0.2-0.1 0.4-0.2 0.6 0 0.2 0 0.4 0.1 0.5C238.4 152.9 238.5 153 238.7 153.1z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M245.4 158c0.5 0.3 0.9 0.6 1.4 0.8 0.4 0.1 0.9 0.3 1.3 0.4 0.4 0 0.8 0.1 1.2 0 0.4-0.1 0.8-0.1 1.2-0.2l-1 1.6c-0.2 0.1-0.6 0.1-0.9 0.2 -0.4 0-0.6 0-1 0 -0.3 0-0.7-0.1-1-0.2 -0.3-0.1-0.6-0.3-0.9-0.5 -0.1 0-0.1 0-0.1-0.1 -0.1 0-0.1-0.1-0.2-0.2 -0.1-0.1-0.3-0.3-0.4-0.5 -0.2-0.2-0.5-0.4-0.8-0.7l-0.1 0.1c-0.6 0.8-1.2 1.5-1.8 2.1 -0.6 0.6-1.3 1-1.8 1.3 -0.6 0.3-1.1 0.5-1.6 0.5 -0.5 0-0.9 0-1.2-0.2 -0.2-0.2-0.4-0.4-0.5-0.6 -0.1-0.2-0.1-0.5 0-0.8 0-0.3 0.2-0.6 0.3-0.9 0.1-0.3 0.4-0.6 0.6-1 0.1-0.2 0.3-0.4 0.6-0.6 0.2-0.2 0.4-0.4 0.8-0.6 0.3-0.2 0.6-0.4 0.9-0.5 0.3-0.2 0.6-0.4 0.9-0.5 0.7-0.4 1.5-0.7 2.3-1.1 0.3-0.3 0.6-0.6 1-1 0.3-0.3 0.6-0.7 1-1 0.3-0.3 0.7-0.6 1-0.8 0.3-0.2 0.7-0.4 1-0.5 0.3-0.1 0.7-0.1 1.1 0 0.4 0.1 0.7 0.2 1.1 0.4 0.3 0.2 0.5 0.4 0.7 0.6 0.2 0.2 0.3 0.5 0.4 0.8s0.1 0.7 0 0.9c-0.1 0.4-0.2 0.7-0.5 1.1 -0.2 0.3-0.5 0.5-0.7 0.8 -0.3 0.2-0.6 0.4-1 0.5 -0.4 0.2-0.8 0.2-1.3 0.2C246.5 158.2 246 158.1 245.4 158L245.4 158zM239.3 160c0 0.1-0.1 0.1-0.1 0.2 0 0.1-0.1 0.2-0.1 0.3 0 0.1-0.1 0.2 0 0.3 0 0.1 0 0.2 0.2 0.3 0.1 0 0.2 0 0.3 0 0.1 0 0.2-0.1 0.4-0.3 0.1-0.2 0.3-0.3 0.4-0.4 0.1-0.2 0.2-0.4 0.4-0.5 0.1-0.2 0.2-0.4 0.4-0.5 0.1-0.2 0.2-0.4 0.3-0.5 0.2-0.2 0.3-0.5 0.5-0.6 0.1-0.2 0.2-0.3 0.3-0.4s0.2-0.2 0.2-0.4c-0.2 0.1-0.4 0.2-0.6 0.4 -0.2 0.1-0.5 0.3-0.7 0.5 -0.2 0.2-0.4 0.3-0.6 0.5 -0.2 0.2-0.4 0.3-0.6 0.5 -0.2 0.1-0.3 0.3-0.4 0.4C239.3 159.9 239.3 159.9 239.3 160zM245 156.7c0.4 0.1 0.7 0.1 1 0s0.6-0.1 0.9-0.2c0.2-0.1 0.5-0.2 0.8-0.3 0.3-0.2 0.5-0.3 0.7-0.5 0.1-0.1 0.2-0.2 0.3-0.3 0.1-0.1 0.2-0.2 0.2-0.5 0-0.2 0-0.3 0-0.4 0-0.1-0.1-0.2-0.3-0.4s-0.3-0.1-0.6-0.2c-0.2 0-0.4 0.1-0.6 0.2 -0.2 0.1-0.4 0.2-0.6 0.4 -0.2 0.2-0.4 0.4-0.7 0.6 -0.2 0.2-0.4 0.5-0.6 0.7C245.5 156.2 245.3 156.4 245 156.7z"
	      }),
	      _react2.default.createElement("path", {
	        fill: "#fff",
	        d: "M177.6 107.9c0.1 0 0.1 0.1 0.2 0.1 0.1 0 0.1 0.1 0.1 0.2 0.1 0 0.1 0.1 0 0.2 0 0.1 0 0.2-0.1 0.2 0 0.1-0.1 0.1-0.2 0.2 0 0.1-0.1 0.1-0.2 0.1 -0.1 0-0.2 0-0.3 0 -0.1 0-0.2-0.1-0.4-0.2l-2.2-1.5c-0.1-0.1-0.2-0.1-0.2-0.2 0-0.1-0.1-0.1-0.1-0.2 0-0.1 0-0.2 0.1-0.2s0.1-0.1 0.1-0.2 0.1-0.1 0.1-0.1c0-0.1 0.1-0.1 0.1-0.1 0.1 0 0.1 0 0.3 0 0.1 0 0.2 0.1 0.3 0.1C175.4 106.4 177.6 107.9 177.6 107.9z"
	      })
	    )
	  );
	};
	
	exports.default = Flag;
	module.exports = exports["default"];

/***/ }),

/***/ 218:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _giants = __webpack_require__(486);
	
	var _giants2 = _interopRequireDefault(_giants);
	
	var _HomeList = __webpack_require__(132);
	
	var _HomeList2 = _interopRequireDefault(_HomeList);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var data = ['extend the framework with thousands of existing <a href="https://symfony.com/doc/bundles/" target="_blank" rel="noopener noreferrer nofollow">Symfony bundles</a> and <a href="https://reactjs.org/community/ui-components.html" target="_blank" rel="noopener noreferrer nofollow">React components</a>', 'use the server library in any existing Symfony or PHP app, use client components with any Hydra-enabled API, regardless of its programming language', 'reuse all your Symfony, React and Docker skills and benefit of their high quality docs; you are in known territory'];
	
	var Giants = function Giants() {
	  return _react2.default.createElement(
	    'section',
	    { className: 'home__part home__giants' },
	    _react2.default.createElement(
	      'div',
	      { className: 'container giants__container' },
	      _react2.default.createElement(
	        'h1',
	        { className: 'giants__title' },
	        'Built on the Shoulders of ',
	        _react2.default.createElement(
	          'strong',
	          null,
	          'Giants'
	        )
	      ),
	      _react2.default.createElement(
	        'article',
	        { className: 'giants__content' },
	        _react2.default.createElement(
	          'p',
	          { className: 'hidden-small' },
	          'API Platform is built on top of ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'battle-tested products'
	          ),
	          '. The server skeleton includes the famous ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'Symfony 4'
	          ),
	          ' microframework and the ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'Doctrine'
	          ),
	          ' ORM. Client-side components use Facebook\'s ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'React'
	          ),
	          ' (a Vue.js integration is also available). The development environment and the deployment mechanism leverage ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'Docker, Kubernetes and Helm'
	          ),
	          '.'
	        ),
	        _react2.default.createElement(_HomeList2.default, { data: data, className: 'giants__list' }),
	        _react2.default.createElement(
	          'p',
	          { className: 'hidden-small' },
	          'API Platform is also designed as a set of independent and reusable components. You can perfectly use them in a standalone way, or integrate them by yourself in your own project.'
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'giants__spider' },
	        _react2.default.createElement('img', { src: _giants2.default, alt: 'Built on the shoulders of giants', width: '371', height: '344' })
	      )
	    )
	  );
	};
	
	exports.default = Giants;
	module.exports = exports['default'];

/***/ }),

/***/ 132:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _propTypes = __webpack_require__(3);
	
	var _propTypes2 = _interopRequireDefault(_propTypes);
	
	var _classnames = __webpack_require__(19);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var HomeList = function HomeList(_ref) {
	  var data = _ref.data,
	      className = _ref.className;
	  return _react2.default.createElement(
	    'div',
	    { className: (0, _classnames2.default)('home__list', className) },
	    data.map(function (item, index) {
	      return _react2.default.createElement(
	        'div',
	        { key: 'point' + index, className: 'home__point' },
	        _react2.default.createElement('i', { className: 'icon-circle-chevron-right point__arrow' }),
	        _react2.default.createElement('p', { className: 'point__text', dangerouslySetInnerHTML: { __html: item } })
	      );
	    })
	  );
	};
	
	HomeList.propTypes = {
	  data: _propTypes2.default.array,
	  className: _propTypes2.default.string
	};
	
	HomeList.defaultProps = {
	  data: [],
	  className: null
	};
	
	exports.default = HomeList;
	module.exports = exports['default'];

/***/ }),

/***/ 219:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _logos = __webpack_require__(226);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var openSourceList = _logos.openSourceData.map(function (_ref) {
	  var name = _ref.name,
	      logo = _ref.logo,
	      link = _ref.link;
	  return _react2.default.createElement(
	    'a',
	    { key: name, href: link, target: '_blank', rel: 'noopener noreferrer', className: 'references__item big' },
	    _react2.default.createElement('img', { src: '/references/' + logo + '.png', alt: name, width: '300', height: '300' }),
	    _react2.default.createElement(
	      'p',
	      { className: 'logo__title' },
	      name
	    )
	  );
	});
	
	var otherList = _logos.otherData.map(function (_ref2) {
	  var name = _ref2.name,
	      logo = _ref2.logo,
	      link = _ref2.link;
	  return _react2.default.createElement(
	    'a',
	    {
	      href: link,
	      title: name + ' (new window)',
	      key: name,
	      target: '_blank',
	      rel: 'nofollow noreferrer noopener',
	      className: 'references__item'
	    },
	    _react2.default.createElement('img', { src: '/references/' + logo + '.png', alt: name, width: '300', height: '110' })
	  );
	});
	
	var References = function References() {
	  return _react2.default.createElement(
	    'section',
	    { className: 'home__part home__references' },
	    _react2.default.createElement(
	      'div',
	      { className: 'container references__container' },
	      _react2.default.createElement(
	        'h1',
	        { className: 'references__title' },
	        'They use ',
	        _react2.default.createElement(
	          'strong',
	          null,
	          'API Platform'
	        )
	      ),
	      _react2.default.createElement(
	        'h4',
	        null,
	        'Open source projects'
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'references__list' },
	        openSourceList
	      ),
	      _react2.default.createElement(
	        'h4',
	        null,
	        'Companies'
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'references__list list__other' },
	        otherList
	      )
	    )
	  );
	};
	
	exports.default = References;
	module.exports = exports['default'];

/***/ }),

/***/ 220:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _gatsbyLink = __webpack_require__(35);
	
	var _gatsbyLink2 = _interopRequireDefault(_gatsbyLink);
	
	var _schema = __webpack_require__(227);
	
	var _schema2 = _interopRequireDefault(_schema);
	
	var _spider_schema = __webpack_require__(493);
	
	var _spider_schema2 = _interopRequireDefault(_spider_schema);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/* eslint-disable react/prop-types */
	
	var SchemaItem = function SchemaItem(_ref) {
	  var icon = _ref.icon,
	      link = _ref.link,
	      text = _ref.text,
	      title = _ref.title;
	  return _react2.default.createElement(
	    _gatsbyLink2.default,
	    { to: link, className: 'schema__item' },
	    _react2.default.createElement(
	      'div',
	      { className: 'schema__card' },
	      _react2.default.createElement('i', { className: 'schema__icon icon-line-' + icon }),
	      _react2.default.createElement(
	        'div',
	        { className: 'schema__content' },
	        _react2.default.createElement(
	          'h3',
	          null,
	          title
	        ),
	        _react2.default.createElement(
	          'p',
	          null,
	          text
	        )
	      )
	    )
	  );
	};
	
	var SchemaPart = function SchemaPart(_ref2) {
	  var title = _ref2.title,
	      items = _ref2.items;
	  return _react2.default.createElement(
	    'div',
	    { className: 'schema__part' },
	    _react2.default.createElement(
	      'div',
	      { className: 'part__title' },
	      _react2.default.createElement(
	        'h4',
	        null,
	        title
	      )
	    ),
	    _react2.default.createElement(
	      'div',
	      { className: 'schema__group' },
	      items.map(function (item) {
	        return _react2.default.createElement(SchemaItem, _extends({ key: item.title }, item));
	      }),
	      _react2.default.createElement(Lines, null)
	    )
	  );
	};
	
	var Lines = function Lines() {
	  return _react2.default.createElement(
	    'svg',
	    { className: 'lines', width: '100%', height: '100%' },
	    _react2.default.createElement('line', { className: 'line', x1: '50%', y1: '0', x2: '0', y2: '0', stroke: '#000' }),
	    _react2.default.createElement('line', { className: 'line', x1: '50%', y1: '0', x2: '100%', y2: '0', stroke: '#000' }),
	    _react2.default.createElement('line', { className: 'line', x1: '0', y1: '0', x2: '0', y2: '100%', stroke: '#000' }),
	    _react2.default.createElement('line', { className: 'line', x1: '100%', y1: '0', x2: '100%', y2: '100%', stroke: '#000' }),
	    _react2.default.createElement('line', { className: 'line', x1: '0%', y1: '100%', x2: '50%', y2: '100%', stroke: '#000' }),
	    _react2.default.createElement('line', { className: 'line', x1: '100%', y1: '100%', x2: '50%', y2: '100%', stroke: '#000' })
	  );
	};
	
	var Schema = function Schema() {
	  return _react2.default.createElement(
	    'section',
	    { className: 'home__part home__schema' },
	    _react2.default.createElement(
	      'div',
	      { className: 'container schema__container' },
	      _react2.default.createElement(
	        'h1',
	        { className: 'schema__title' },
	        'Creating Linked Data ',
	        _react2.default.createElement(
	          'strong',
	          null,
	          'REST'
	        ),
	        ' APIs has Never Been so Easy'
	      ),
	      _schema2.default.map(function (part) {
	        return _react2.default.createElement(SchemaPart, _extends({ key: part.title }, part));
	      })
	    ),
	    _react2.default.createElement(
	      'div',
	      { className: 'schema__spider' },
	      _react2.default.createElement('img', { src: _spider_schema2.default, alt: 'spider', width: '256', height: '422' })
	    )
	  );
	};
	
	exports.default = Schema;
	module.exports = exports['default'];

/***/ }),

/***/ 221:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _seoCode = __webpack_require__(228);
	
	var _seoCode2 = _interopRequireDefault(_seoCode);
	
	var _laptop = __webpack_require__(487);
	
	var _laptop2 = _interopRequireDefault(_laptop);
	
	var _Prism = __webpack_require__(236);
	
	var _Prism2 = _interopRequireDefault(_Prism);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Seo = function Seo() {
	  return _react2.default.createElement(
	    'section',
	    { className: 'home__seo home__part' },
	    _react2.default.createElement(
	      'div',
	      { className: 'container seo__container' },
	      _react2.default.createElement(
	        'h1',
	        { className: 'seo__title' },
	        'Enhance ',
	        _react2.default.createElement(
	          'strong',
	          null,
	          'SEO'
	        ),
	        ' and Interoperability'
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'seo__code' },
	        _react2.default.createElement('img', { src: _laptop2.default, alt: 'interoperability', width: '505', height: '445' }),
	        _react2.default.createElement(
	          'pre',
	          { className: 'language-json' },
	          _react2.default.createElement('code', {
	            dangerouslySetInnerHTML: {
	              __html: _Prism2.default.highlight(_seoCode2.default, _Prism2.default.languages.json)
	            }
	          })
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'seo__content' },
	        _react2.default.createElement(
	          'p',
	          null,
	          'Adding',
	          ' ',
	          _react2.default.createElement(
	            'a',
	            { href: 'http://schema.org/', target: '_blank', rel: 'noopener noreferrer' },
	            'Schema.org'
	          ),
	          ' ',
	          'markup to websites and apps increase their ranking in search engines results and enable awesome features such as',
	          ' ',
	          _react2.default.createElement(
	            'a',
	            { href: 'https://developers.google.com/structured-data/', target: '_blank', rel: 'noopener noreferrer' },
	            'Google Rich Snippets'
	          ),
	          ' ',
	          'and',
	          ' ',
	          _react2.default.createElement(
	            'a',
	            { href: 'https://developers.google.com/gmail/markup/', target: '_blank', rel: 'noopener noreferrer' },
	            'Gmail markup'
	          ),
	          '.'
	        ),
	        _react2.default.createElement(
	          'p',
	          { className: 'hidden-small' },
	          'Mapping your app data model to Schema.org structures can be a tedious task. Using',
	          ' ',
	          _react2.default.createElement(
	            'a',
	            { href: '/docs/schema-generator' },
	            'the generator'
	          ),
	          ', your data model will be a derived from Schema.org. Serializing your data as JSON-LD will not require specific mapping nor adaptation.'
	        ),
	        _react2.default.createElement(
	          'p',
	          null,
	          'Simply include a JSON-LD file in your page instead of enriching the DOM:',
	          ' ',
	          _react2.default.createElement(
	            'strong',
	            null,
	            'it\u2019s a matter of minutes before being SEO Ready'
	          ),
	          '.'
	        ),
	        _react2.default.createElement(
	          'p',
	          { className: 'hidden-small' },
	          'Schema.org improves the interoperability of your applications. Used with hypermedia technologies such as',
	          ' ',
	          _react2.default.createElement(
	            'a',
	            { href: 'http://www.hydra-cg.com/', target: '_blank', rel: 'noopener noreferrer' },
	            'Hydra'
	          ),
	          ' ',
	          'it\'s a big step towards the semantic and machine readable web. It opens the way to generic web API clients able to extract and process data from any website or app using such technologies.'
	        )
	      )
	    )
	  );
	};
	
	exports.default = Seo;
	module.exports = exports['default'];

/***/ }),

/***/ 60:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _propTypes = __webpack_require__(3);
	
	var _propTypes2 = _interopRequireDefault(_propTypes);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/* eslint-disable max-len */
	
	var Logo = function Logo(_ref) {
	  var className = _ref.className;
	  return _react2.default.createElement(
	    'svg',
	    { className: className, xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 782.34 88.31' },
	    _react2.default.createElement('defs', null),
	    _react2.default.createElement(
	      'title',
	      null,
	      'test1'
	    ),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M40.87,3.84,57.1,17.09c4.71,4,7.31,7.18,7.68,13.25V77.29A10.57,10.57,0,0,1,54.12,87.94a10.71,10.71,0,0,1-10.9-10.65V66.76L21.67,46.82V77.29A10.68,10.68,0,0,1,10.9,87.94,10.78,10.78,0,0,1,0,77.29V30.34c.5-6.07,3.34-9.29,7.93-13.25L23.78,3.84C30.1-1.11,34.68-1.36,40.87,3.84Zm2.35,41.37V22.67H21.67V45.21Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M97.11,66.14v10.4c0,6.07-4.46,11-10.53,11a11,11,0,0,1-10.9-11V19A18.45,18.45,0,0,1,94,.62h16.47A18.08,18.08,0,0,1,123.24,5.7l11.89,11.89c7.8,7.43,6.44,25.76-1.12,33.07L123.24,60.94a17.19,17.19,0,0,1-12.76,5.2Zm20.81-21.67V22.29L97.36,22V44.46Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M147.77,78.05v-40c0-5.44,4.58-10.23,10.9-10.23s11,4.35,11,9.68V78.05c0,5.33-4.83,9.79-11,9.79C152.72,87.85,147.77,83.38,147.77,78.05Zm21.45-55.21h-21V.85h21Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M245.3,66.14v10.4c0,6.07-4.46,11-10.53,11a11,11,0,0,1-10.9-11V19A18.45,18.45,0,0,1,242.21.62h16.47A18.08,18.08,0,0,1,271.44,5.7l11.89,11.89c7.8,7.43,6.44,25.76-1.11,33.07L271.44,60.94a17.19,17.19,0,0,1-12.76,5.2Zm20.81-21.67V22.29L245.55,22V44.46Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M294.84,68.74V10.9A11,11,0,0,1,305.74.25a10.82,10.82,0,0,1,11,10.65v55c10.9,0,7.8-.25,18.58-.25,14.24,0,14.24,21.8,0,21.8H313.67A18.87,18.87,0,0,1,294.84,68.74Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M392.56,3.84l16.23,13.25c4.71,4,7.31,7.18,7.68,13.25V77.29a10.57,10.57,0,0,1-10.65,10.65,10.71,10.71,0,0,1-10.9-10.65V66.76L373.37,46.82V77.29a10.84,10.84,0,0,1-21.67,0V30.35c.5-6.07,3.34-9.29,7.93-13.25L375.47,3.84C381.79-1.11,386.37-1.36,392.56,3.84Zm2.35,41.37V22.67H373.37V45.21Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M467.87.74c14,0,14,21.55,0,21.55h-9.29V77.16c0,14.61-21.67,14.61-21.67,0V22.29h-9.29c-14.12,0-14.12-21.55,0-21.55Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M506,22.42V36.79h19.45a10.86,10.86,0,0,1,10.78,10.78,11.1,11.1,0,0,1-11,10.9H506V77.41c0,14.12-21.67,14.12-21.67,0V19.07A18.26,18.26,0,0,1,502.55.74h27.62a10.79,10.79,0,0,1,10.9,10.65,11.19,11.19,0,0,1-10.9,11Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M566.34.87h24.77A18.45,18.45,0,0,1,609.44,19.2V69c0,8.92-8.55,18.33-17.71,18.33H565.84c-9.17,0-18.33-9.41-18.33-18.33V19.2C547.51,8.42,556.43.87,566.34.87Zm21.43,21.68H569.19V65.89h18.58Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M670.25,52.14c7.68,4.71,10.4,10.65,10.4,18.45v6.32a10.59,10.59,0,1,1-21.18,0V70.85L638.3,45.08V76.91a10.68,10.68,0,0,1-10.65,10.78,10.81,10.81,0,0,1-10.9-10.78V11.64A10.84,10.84,0,0,1,627.65.74H651.8a18.36,18.36,0,0,1,13,5.33l10.53,10.16a18.27,18.27,0,0,1,5.82,13.38v4.83C681.15,43,677.19,48.68,670.25,52.14Zm-32-29.73V43.23h21.18V22.42Z'
	    }),
	    _react2.default.createElement('path', {
	      className: 'a',
	      d: 'M725.74,4.09l9.41,10,9.41-10c5.2-5.45,12.63-5.45,17.46,0l12.63,13.13c3.84,4.33,7.06,7.06,7.68,13.13V77.53c0,14-21.8,14-21.8,0V22.67H746.05V77.53c0,14.37-21.67,14.37-21.67,0V22.67H710.13V77.53c0,14-21.8,14-21.8,0V30.35c.25-6.07,3.72-8.79,7.68-13.13L708.65,4.09C713.48-1.36,720.91-1.36,725.74,4.09Z'
	    })
	  );
	};
	
	Logo.defaultProps = {
	  className: ''
	};
	
	Logo.propTypes = {
	  className: _propTypes2.default.string
	};
	
	exports.default = Logo;
	module.exports = exports['default'];

/***/ }),

/***/ 226:
/***/ (function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	var openSourceData = exports.openSourceData = [{
	  name: 'CoopCycle',
	  logo: 'coopcycle',
	  link: 'https://coopcycle.org/fr/'
	}, {
	  name: 'PartKeepr',
	  logo: 'partkeepr',
	  link: 'https://partkeepr.org/'
	}, {
	  name: 'Digital State',
	  logo: 'digital-state',
	  link: 'http://www.digitalstate.ca/'
	}, {
	  name: 'AudienceHero',
	  logo: 'audiencehero',
	  link: 'http://www.audiencehero.org/'
	}];
	
	var otherData = exports.otherData = [{
	  name: '24 Sèvres',
	  logo: '24-sevres',
	  link: 'https://www.24sevres.com/'
	}, {
	  name: 'Adeo',
	  logo: 'adeo',
	  link: 'https://www.adeo.com/'
	}, {
	  name: 'Alstom',
	  logo: 'alstom',
	  link: 'http://www.alstom.com/'
	}, {
	  name: 'beIN SPORTS',
	  logo: 'bein-sports',
	  link: 'http://www.beinsports.com/'
	}, {
	  name: 'BiiG',
	  logo: 'biig',
	  link: 'https://www.biig.fr/'
	}, {
	  name: 'BNP',
	  logo: 'bnp',
	  link: 'https://mabanque.bnpparibas/'
	}, {
	  name: 'Decathlon',
	  logo: 'decathlon',
	  link: 'https://www.decathlon.fr/'
	}, {
	  name: 'eVaali.fi',
	  logo: 'evaali',
	  link: 'https://www.evaali.fi/'
	}, {
	  name: 'Exaqtworld',
	  logo: 'exaqtworld',
	  link: 'http://www.exaqtworld.com/'
	}, {
	  name: 'The Fork',
	  logo: 'fork',
	  link: 'https://www.thefork.com/'
	}, {
	  name: 'France 24',
	  logo: 'france-24',
	  link: 'http://www.france24.com/'
	}, {
	  name: 'General Electric',
	  logo: 'general-electric',
	  link: 'https://www.ge.com/'
	}, {
	  name: 'HoHey.fr',
	  logo: 'hohey',
	  link: 'http://hohey.fr/'
	}, {
	  name: 'M6',
	  logo: 'm6',
	  link: 'http://www.groupem6.fr/'
	}, {
	  name: 'MEL',
	  logo: 'mel',
	  link: 'http://www.lillemetropole.fr/'
	}, {
	  name: 'Microdon',
	  logo: 'microdon',
	  link: 'https://www.microdon.org/'
	}, {
	  name: 'Orange',
	  logo: 'orange',
	  link: 'https://www.orange.fr/'
	}, {
	  name: 'Parti de gauche',
	  logo: 'parti-de-gauche',
	  link: 'https://www.lepartidegauche.fr/'
	}, {
	  name: 'Quotatis',
	  logo: 'quotatis',
	  link: 'https://www.quotatis.fr/'
	}, {
	  name: 'Racepack',
	  logo: 'racepack',
	  link: 'https://www.racepack.com/'
	}, {
	  name: 'Renault',
	  logo: 'renault',
	  link: 'https://www.renault.fr/'
	}, {
	  name: 'Ville de Roubaix',
	  logo: 'roubaix',
	  link: 'http://www.ville-roubaix.fr/'
	}, {
	  name: 'Saveur Bière',
	  logo: 'saveur-biere',
	  link: 'https://www.saveur-biere.com/'
	}, {
	  name: 'Sensio Labs',
	  logo: 'sensio-labs',
	  link: 'https://sensiolabs.com/'
	}, {
	  name: 'Smile',
	  logo: 'smile',
	  link: 'https://www.smile.eu/'
	}, {
	  name: 'Les-Tilleuls.coop',
	  logo: 'les-tilleuls',
	  link: 'https://les-tilleuls.coop/'
	}, {
	  name: 'TMM',
	  logo: 'tmm',
	  link: 'http://www.tmm-groupe.com/'
	}, {
	  name: 'YouSign',
	  logo: 'yousign',
	  link: 'https://yousign.com/'
	}];

/***/ }),

/***/ 227:
/***/ (function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	var schema = [{
	  title: 'Shape the data',
	  items: [{
	    icon: 'data',
	    link: '/docs/schema-generator',
	    title: 'Create a Model',
	    text: 'Design your own data model as plain old PHP classes or import an existing structure from the Schema.org vocabulary.'
	  }]
	}, {
	  title: 'Build the Server',
	  items: [{
	    icon: 'expose',
	    link: '/docs/core',
	    title: 'Expose your API',
	    text: 'Embrace the open web: JSON-LD/Hydra, GraphQL, JSON API, HAL, YAML, JSON, XML and CSV are supported out of the box.'
	  }, {
	    icon: 'security',
	    link: '/docs/core/security',
	    title: 'Add Auth',
	    text: 'Add JSON Web Token or OAuth authentication in a breath. CORS support is built-in. OWASP’s best practices are automatically enforced.'
	  }, {
	    icon: 'doc',
	    link: '/docs/core/swagger',
	    title: 'Browse the Docs',
	    text: 'Enjoy the beautiful, automatically generated, API documentation (Swagger/OpenAPI).'
	  }]
	}, {
	  title: 'Add clients',
	  items: [{
	    icon: 'app',
	    link: '/docs/client-generator',
	    title: 'PWA and Mobile',
	    text: 'Generate React, React Native and Vue.js apps from the API docs.'
	  }, {
	    icon: 'admin',
	    link: '/docs/admin',
	    title: 'Create an Admin',
	    text: 'A nice Material UI admin interface built with React is automatically available!'
	  }]
	}, {
	  title: 'Test',
	  items: [{
	    icon: 'test',
	    link: '/docs/distribution/testing',
	    title: 'Specs & Tests',
	    text: 'Add unit tests with PHPUnit. Create specs and tests with a developer friendly API testing tool on top of Behat. A Postman integration is also provided.'
	  }]
	}, {
	  title: 'Deploy',
	  items: [{
	    icon: 'deploy',
	    link: '/docs/deployment',
	    title: 'Cloud Native',
	    text: 'Install a development environment and deploy your project in production using Docker, Kubernetes and the Helm package manager.'
	  }]
	}];
	
	exports.default = schema;
	module.exports = exports['default'];

/***/ }),

/***/ 228:
/***/ (function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	var code = '<script type="application/ld+json">\r\n{\r\n  "@context": "http://schema.org/",\r\n  "@type": "Product",\r\n  "name": "Executive Anvil",\r\n  "image": "http://www.example.com/anvil_executive.jpg",\r\n  "description": "Sleeker than ACME\\\'s Classic Anvil.",\r\n  "mpn": "925872",\r\n  "brand": {\r\n    "@type": "Thing",\r\n    "name": "ACME"\r\n  },\r\n  "aggregateRating": {\r\n    "@type": "AggregateRating",\r\n    "ratingValue": "4.4",\r\n    "reviewCount": "89"\r\n  },\r\n  "offers": {\r\n    "@type": "Offer",\r\n    "priceCurrency": "USD",\r\n    "price": "119.99",\r\n    "priceValidUntil": "2020-11-05",\r\n    "itemCondition": "http://schema.org/UsedCondition",\r\n    "availability": "http://schema.org/InStock",\r\n    "seller": {\r\n      "@type": "Organization",\r\n      "name": "Executive Objects"\r\n    }\r\n  }\r\n}\r\n</script>';
	
	exports.default = code;
	module.exports = exports['default'];

/***/ }),

/***/ 483:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "static/admin_component.ab900e62.svg";

/***/ }),

/***/ 484:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "static/api_component.82c31685.svg";

/***/ }),

/***/ 485:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "static/expose.d658bda9.svg";

/***/ }),

/***/ 486:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "static/giants.dc2186b8.svg";

/***/ }),

/***/ 487:
/***/ (function(module, exports) {

	module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDUiIGhlaWdodD0iNDQ1IiB2aWV3Qm94PSIwIDAgNTA1IDQ0NSI+PHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe29wYWNpdHk6MC4zO2ZpbGw6IzAyMDIwMzt9DQoJLnN0MXtmaWxsOiNCNkJEQkU7fQ0KCS5zdDJ7ZmlsbDojREZERkRGO30NCgkuc3Qze2ZpbGw6IzFBMkQyRjt9DQoJLnN0NHtmaWxsOiMxNjUwNTQ7fQ0KCS5zdDV7b3BhY2l0eTowLjI7ZmlsbDojMDIwMjAzO30NCjwvc3R5bGU+PGVsbGlwc2UgY2xhc3M9InN0MCIgY3g9IjI1MS45IiBjeT0iNDExLjEiIHJ4PSIyMzcuNiIgcnk9IjE2LjciLz48cmVjdCB4PSIxNzguOSIgeT0iMzMwLjEiIGNsYXNzPSJzdDEiIHdpZHRoPSIxNDYuMSIgaGVpZ2h0PSI2MSIvPjxyZWN0IHg9IjEyMi44IiB5PSIzOTEuMSIgY2xhc3M9InN0MiIgd2lkdGg9IjI1Ny4zIiBoZWlnaHQ9IjE3LjIiLz48cGF0aCBjbGFzcz0ic3QyIiBkPSJNNDg3LjIgMzA1LjdjMCAyNS4zLTIwLjUgNDUuOC00NS44IDQ1LjhINjIuNWMtMjUuMyAwLTQ1LjgtMjAuNS00NS44LTQ1LjhWNjcuOEMxNi43IDQyLjUgMzcuMiAyMiA2Mi41IDIyaDM3OC45YzI1LjMgMCA0NS44IDIwLjUgNDUuOCA0NS44VjMwNS43eiIvPjxwYXRoIGNsYXNzPSJzdDMiIGQ9Ik00NDEuNCAyMkg2Mi41Yy0yNS4zIDAtNDUuOCAyMC41LTQ1LjggNDUuOHYyMzcuOWg0NzAuNVY2Ny44QzQ4Ny4yIDQyLjUgNDY2LjcgMjIgNDQxLjQgMjJ6Ii8+PHJlY3QgeD0iNDAuMyIgeT0iNDkuNiIgY2xhc3M9InN0NCIgd2lkdGg9IjQyNi41IiBoZWlnaHQ9IjIyNy45Ii8+PGNpcmNsZSBjbGFzcz0ic3QzIiBjeD0iMjUxLjYiIGN5PSIzMjIiIHI9IjguNiIvPjxwb2x5Z29uIGNsYXNzPSJzdDUiIHBvaW50cz0iMTc4LjkgMzUxLjUgMTc4LjkgMzkxLjEgMzI1IDM2Ny44IDMyNSAzNTEuNSAiLz48L3N2Zz4NCiANCg=="

/***/ }),

/***/ 489:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "static/scaffolding_component.7b31545d.svg";

/***/ }),

/***/ 490:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "static/schema_component.a676edde.svg";

/***/ }),

/***/ 491:
/***/ (function(module, exports) {

	module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYuMjUiIGhlaWdodD0iNDE5LjM4IiB2aWV3Qm94PSIwIDAgMjU2LjI1IDQxOS4zOCI+PHRpdGxlPkFQSSBwbGF0Zm9ybSBib3JkZWwyPC90aXRsZT48ZyBpZD0ic3BpZGVyX2Rlc2NlbmRpbmciIGRhdGEtbmFtZT0ic3BpZGVyIGRlc2NlbmRpbmciPjxnIGlkPSJfR3JvdXBlXyIgZGF0YS1uYW1lPSImbHQ7R3JvdXBlJmd0OyI+PHBhdGggaWQ9Il9UcmFjw6lfIiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kmZ3Q7IiBkPSJNMTI3LjgsOTlsNC40Ny01LjEyTDE3MiwxNDEuMjdsLTIyLjY5LDM4LjQ4YTMuODMsMy44MywwLDAsMS01LjczLS43NmwtLjcxLTEuMDhhMy44MywzLjgzLDAsMCwxLC43MS01bDE5LjcyLTMxLjA1WiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjwvZz48cGF0aCBkPSJNMTMwLjU3LDEwMi4xNnMxNy42NC0yMSwxMi43Ni0zMC42OS03LTguOS0xNC4xNy03Ljc1LTExLjc2LDUuNjMtMTAuNzMsMTMuODJBNDAuMTcsNDAuMTcsMCwwLDAsMTMwLjU3LDEwMi4xNloiIHN0eWxlPSJmaWxsOiMxZDFlMWMiLz48ZyBpZD0iX0dyb3VwZV8yIiBkYXRhLW5hbWU9IiZsdDtHcm91cGUmZ3Q7Ij48cGF0aCBpZD0iX1RyYWPDqV8yIiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kmZ3Q7IiBkPSJNMTE4LjUzLDk5bC00LjQ3LTUuMTJMNzQuMjksMTQxLjI3LDk3LDE3Ny43NGEzLjgzLDMuODMsMCwwLDAsNS43My0uNzZsLjcxLTEuMDhhMy44MywzLjgzLDAsMCwwLS43MS01TDgzLDE0MS44MVoiIHN0eWxlPSJmaWxsOiMxZDFlMWMiLz48L2c+PHBhdGggZD0iTTExNS43NiwxMDIuMTZTOTguMTEsODEuMTIsMTAzLDcxLjQ3czctOC45LDE0LjE3LTcuNzUsMTEuNzYsNS42MywxMC43MywxMy44MkE0MC4xNyw0MC4xNywwLDAsMSwxMTUuNzYsMTAyLjE2WiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjxnIGlkPSJfR3JvdXBlXzMiIGRhdGEtbmFtZT0iJmx0O0dyb3VwZSZndDsiPjxwb2x5Z29uIGlkPSJfVHJhY8OpXzMiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIHBvaW50cz0iMTMyLjggNDIuMDIgMTM3LjI3IDM2LjkgMjI0LjA0IDE0MC4yNiAxNjkuMDUgMTkxLjY1IDE2NC4wMyAxODcuMDcgMjE0LjM0IDE0MC44MSAxMzIuOCA0Mi4wMiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjwvZz48cGF0aCBkPSJNMTM2LjE3LDQ1czE3LjE1LTI2LjMsMTAuMjktMzYuNTktOS4xNS05LjE1LTE3LjE1LTYuODZTMTE2LjczLDkuNTUsMTE5LDE4LjdBNDUuOTMsNDUuOTMsMCwwLDAsMTM2LjE3LDQ1WiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjxnIGlkPSJfR3JvdXBlXzQiIGRhdGEtbmFtZT0iJmx0O0dyb3VwZSZndDsiPjxwb2x5Z29uIGlkPSJfVHJhY8OpXzQiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIHBvaW50cz0iMTEzLjUzIDQyLjAyIDEwOS4wNiAzNi45IDIyLjI5IDE0MC4yNiA3Ny4yOSAxOTEuNjUgODIuMyAxODcuMDcgMzIgMTQwLjgxIDExMy41MyA0Mi4wMiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjwvZz48cGF0aCBkPSJNMTEwLjE2LDQ1UzkzLDE4LjcsOTkuODcsOC40MSwxMDktLjc0LDExNywxLjU1czEyLjU4LDgsMTAuMjksMTcuMTVBNDUuOTMsNDUuOTMsMCwwLDEsMTEwLjE2LDQ1WiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjxnIGlkPSJfR3JvdXBlXzUiIGRhdGEtbmFtZT0iJmx0O0dyb3VwZSZndDsiPjxwb2x5Z29uIGlkPSJfVHJhY8OpXzUiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIHBvaW50cz0iNDAuNjYgMzIxLjA4IDIzLjY3IDI0OC4xIDU0Ljk5IDI0OC42NiA1Ni43NiAyNTYuMDkgMzIuNTUgMjU1LjU5IDQ3LjkxIDMxOC42NyA0MC42NiAzMjEuMDgiIHN0eWxlPSJmaWxsOiMxZDFlMWMiLz48cGF0aCBpZD0iX1RyYWPDqV82IiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kmZ3Q7IiBkPSJNMzYuODEsMzMxcy02LjIxLDExLjczLDUuMzYsMTYuNTYsMTctNS41MSwxNy01LjUxLjg5LTQuNDktNC43OS0xNC4zMlM0NywzMTUuODMsNDMuODIsMzE1LjMsMzYuODEsMzMxLDM2LjgxLDMzMVoiIHN0eWxlPSJmaWxsOiMxZDFlMWMiLz48L2c+PGcgaWQ9Il9Hcm91cGVfNiIgZGF0YS1uYW1lPSImbHQ7R3JvdXBlJmd0OyI+PHBvbHlnb24gaWQ9Il9UcmFjw6lfNyIgZGF0YS1uYW1lPSImbHQ7VHJhY8OpJmd0OyIgcG9pbnRzPSIyMS4yNyAzODMuOTMgMCAyNDYuMDUgNTcuMDcgMjIwLjU0IDU2LjM0IDIyOC4xMyA4LjU1IDI1MC40NCAyOC45IDM4NCAyMS4yNyAzODMuOTMiIHN0eWxlPSJmaWxsOiMxZDFlMWMiLz48cGF0aCBpZD0iX1RyYWPDqV84IiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kmZ3Q7IiBkPSJNMTQuNTcsMzk2LjE5cy05LjI4LDEzLDMuNzUsMjAuNTksMjEuMTctMy44NCwyMS4xNy0zLjg0LDEuNzgtNS4yMS0zLjQzLTE3LjgzLTYuOTEtMTUuNC0xMC42My0xNi41NFMxNC41NywzOTYuMTksMTQuNTcsMzk2LjE5WiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjwvZz48ZyBpZD0iX0dyb3VwZV83IiBkYXRhLW5hbWU9IiZsdDtHcm91cGUmZ3Q7Ij48cG9seWdvbiBpZD0iX1RyYWPDqV85IiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kmZ3Q7IiBwb2ludHM9IjIxNS41OSAzMjAuMDggMjMyLjU4IDI0Ny4xIDIwMS4yNiAyNDcuNjYgMTk5LjQ5IDI1NS4wOSAyMjMuNyAyNTQuNTkgMjA4LjM0IDMxNy42NyAyMTUuNTkgMzIwLjA4IiBzdHlsZT0iZmlsbDojMWQxZTFjIi8+PHBhdGggaWQ9Il9UcmFjw6lfMTAiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIGQ9Ik0yMTkuNDQsMzMwczYuMjEsMTEuNzMtNS4zNiwxNi41Ni0xNy01LjUxLTE3LTUuNTEtLjg5LTQuNDksNC43OS0xNC4zMiw3LjQtMTEuOTMsMTAuNTktMTIuNDZTMjE5LjQ0LDMzMCwyMTkuNDQsMzMwWiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjwvZz48ZyBpZD0iX0dyb3VwZV84IiBkYXRhLW5hbWU9IiZsdDtHcm91cGUmZ3Q7Ij48cG9seWdvbiBpZD0iX1RyYWPDqV8xMSIgZGF0YS1uYW1lPSImbHQ7VHJhY8OpJmd0OyIgcG9pbnRzPSIyMzQuOTggMzgyLjkzIDI1Ni4yNSAyNDUuMDUgMTk5LjE4IDIxOS41NCAxOTkuOTEgMjI3LjEzIDI0Ny43MSAyNDkuNDQgMjI3LjM2IDM4MyAyMzQuOTggMzgyLjkzIiBzdHlsZT0iZmlsbDojMWQxZTFjIi8+PHBhdGggaWQ9Il9UcmFjw6lfMTIiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIGQ9Ik0yNDEuNjgsMzk1LjE5czkuMjgsMTMtMy43NSwyMC41OS0yMS4xNy0zLjg0LTIxLjE3LTMuODQtMS43OC01LjIxLDMuNDMtMTcuODMsNi45MS0xNS40LDEwLjYzLTE2LjU0UzI0MS42OCwzOTUuMTksMjQxLjY4LDM5NS4xOVoiIHN0eWxlPSJmaWxsOiMxZDFlMWMiLz48L2c+PGcgaWQ9Il9Hcm91cGVfOSIgZGF0YS1uYW1lPSImbHQ7R3JvdXBlJmd0OyI+PHBhdGggaWQ9Il9UcmFjw6lfMTMiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIGQ9Ik0yMDcuMjMsMjE5LjYzYzAsNDEtMzUuNzcsNjIuNjktNzkuOSw2Mi42OXMtNzcuNjctMjEuNjktNzcuNjctNjIuNjksMzMuNTQtNzEuMjIsNzcuNjctNzEuMjJTMjA3LjIzLDE3OC42MywyMDcuMjMsMjE5LjYzWiIgc3R5bGU9ImZpbGw6IzM4YTliNCIvPjxwYXRoIGlkPSJfVHJhY8OpX3RyYW5zcGFyZW50XyIgZGF0YS1uYW1lPSImbHQ7VHJhY8OpIHRyYW5zcGFyZW50Jmd0OyIgZD0iTTEyNi4zMywyODUuNzJDMTAzLDI4NS43Miw4MywyNzkuOTMsNjguNTgsMjY5Yy0xNS40Ni0xMS43My0yMy42My0yOC43OS0yMy42My00OS4zNCwwLTM4LjM1LDI4LjE0LTc0LjYyLDgxLjM4LTc0LjYyLDUzLjkyLDAsODMuNjIsMzYuODIsODMuNjIsNzQuNjIsMCwyMC40Ny04LjU4LDM3LjU0LTI0LjgsNDkuMzhDMTcwLjM3LDI3OS43OSwxNDkuNDksMjg1LjcyLDEyNi4zMywyODUuNzJabTAtMTMzLjkxYy00OS4wNywwLTc0LDMzLjQ0LTc0LDY3LjgyLDAsMzYuNTgsMjguMzQsNTkuMyw3NCw1OS4zLDQ2LjI4LDAsNzYuMTgtMjMuMjgsNzYuMTgtNTkuM0MyMDIuNTEsMTc2LjgsMTYxLjA5LDE1MS44MSwxMjYuMzMsMTUxLjgxWiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjwvZz48ZyBpZD0iX0dyb3VwZV8xMCIgZGF0YS1uYW1lPSImbHQ7R3JvdXBlJmd0OyI+PGVsbGlwc2UgaWQ9Il9UcmFjw6lfMTQiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIGN4PSI5Mi4yOSIgY3k9IjE2NS43NyIgcng9IjM3LjU1IiByeT0iMzYuODIiIHN0eWxlPSJmaWxsOiNmZmYiLz48cGF0aCBpZD0iX1RyYWPDqV90cmFuc3BhcmVudF8yIiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kgdHJhbnNwYXJlbnQmZ3Q7IiBkPSJNOTEuMjksMjA1Yy0yMiwwLTM5LjkyLTE3LjU5LTM5LjkyLTM5LjJzMTcuOTEtMzkuMiwzOS45Mi0zOS4yLDM5LjkzLDE3LjU5LDM5LjkzLDM5LjJTMTEzLjMsMjA1LDkxLjI5LDIwNVptMC03My42NWMtMTkuMzksMC0zNS4xNywxNS40NS0zNS4xNywzNC40NXMxNS43OCwzNC40NSwzNS4xNywzNC40NSwzNS4xNy0xNS40NSwzNS4xNy0zNC40NVMxMTAuNjgsMTMxLjMzLDkxLjI5LDEzMS4zM1oiIHN0eWxlPSJmaWxsOiMxZDFlMWMiLz48L2c+PGVsbGlwc2UgaWQ9Il9UcmFjw6lfMTUiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIGN4PSI5NS4xOSIgY3k9IjE2Ny45NSIgcng9IjE2Ljk5IiByeT0iMTYuMyIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjxjaXJjbGUgaWQ9Il9UcmFjw6lfMTYiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIGN4PSI5Mi4wMiIgY3k9IjE2NS4wNCIgcj0iNC42OCIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxnIGlkPSJfR3JvdXBlXzExIiBkYXRhLW5hbWU9IiZsdDtHcm91cGUmZ3Q7Ij48ZWxsaXBzZSBpZD0iX1RyYWPDqV8xNyIgZGF0YS1uYW1lPSImbHQ7VHJhY8OpJmd0OyIgY3g9IjE2Ni4yOSIgY3k9IjE3MS4wOSIgcng9IjQ1LjUxIiByeT0iNDcuMDciIHN0eWxlPSJmaWxsOiNmZmYiLz48cGF0aCBpZD0iX1RyYWPDqV90cmFuc3BhcmVudF8zIiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kgdHJhbnNwYXJlbnQmZ3Q7IiBkPSJNMTY1LjI5LDIyMC41M2MtMjYuNDEsMC00Ny44OS0yMi4xOC00Ny44OS00OS40NHMyMS40OC00OS40NCw0Ny44OS00OS40NCw0Ny44OSwyMi4xOCw0Ny44OSw0OS40NFMxOTEuNywyMjAuNTMsMTY1LjI5LDIyMC41M1ptMC05NC4xM2MtMjMuNzgsMC00My4xNCwyMC00My4xNCw0NC42OXMxOS4zNSw0NC42OSw0My4xNCw0NC42OSw0My4xMy0yMCw0My4xMy00NC42OVMxODkuMDgsMTI2LjQsMTY1LjI5LDEyNi40WiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjwvZz48Y2lyY2xlIGlkPSJfVHJhY8OpXzE4IiBkYXRhLW5hbWU9IiZsdDtUcmFjw6kmZ3Q7IiBjeD0iMTY5LjEzIiBjeT0iMTczLjU3IiByPSIyMC45NiIgc3R5bGU9ImZpbGw6IzFkMWUxYyIvPjxjaXJjbGUgaWQ9Il9UcmFjw6lfMTkiIGRhdGEtbmFtZT0iJmx0O1RyYWPDqSZndDsiIGN4PSIxODAuNDgiIGN5PSIxNzAuMzkiIHI9IjUuNzgiIHN0eWxlPSJmaWxsOiNmZmYiLz48L2c+PC9zdmc+"

/***/ }),

/***/ 493:
/***/ (function(module, exports) {

	module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iNDIyIiB2aWV3Qm94PSIwIDAgMjU2IDQyMiI+PHN0eWxlPi5he2ZpbGw6IzFEMUUxQzt9LmJ7ZmlsbDojRkZGO308L3N0eWxlPjx0aXRsZT4gIEFQSSBwbGF0Zm9ybSBib3JkZWwyPC90aXRsZT48cGF0aCBkPSJNMTI3LjcgMTAwLjZsNC41LTUuMSAzOS44IDQ3LjMgLTIyLjcgMzguNWMtMS43IDEuNS00LjQgMS4yLTUuNy0wLjhsLTAuNy0xLjFjLTEuMS0xLjYtMC44LTMuOCAwLjctNWwxOS43LTMxLjFMMTI3LjcgMTAwLjZ6IiBjbGFzcz0iYSIvPjxwYXRoIGQ9Ik0xMzAuNCAxMDMuN2MwIDAgMTcuNi0yMSAxMi44LTMwLjdzLTctOC45LTE0LjItNy44Yy03LjIgMS4xLTExLjggNS42LTEwLjcgMTMuOEMxMTkuNSA4Ny4yIDEyMi40IDk1LjcgMTMwLjQgMTAzLjd6IiBjbGFzcz0iYSIvPjxwYXRoIGQ9Ik0xMTguNCAxMDAuNmwtNC41LTUuMSAtMzkuOCA0Ny4zIDIyLjggMzYuNGMxLjcgMS41IDQuNCAxLjIgNS43LTAuOGwwLjctMS4xYzEuMS0xLjYgMC44LTMuOC0wLjctNWwtMTkuNy0yOUwxMTguNCAxMDAuNnoiIGNsYXNzPSJhIi8+PHBhdGggZD0iTTExNS43IDEwMy43YzAgMC0xNy42LTIxLTEyLjgtMzAuNyA0LjgtOS43IDctOC45IDE0LjItNy44IDcuMiAxLjEgMTEuOCA1LjYgMTAuNyAxMy44QzEyNi44IDg3LjMgMTIzLjggOTUuNyAxMTUuNyAxMDMuN3oiIGNsYXNzPSJhIi8+PHBvbHlnb24gcG9pbnRzPSIxMzIuNiA0My42IDEzNy4xIDM4LjUgMjIzLjcgMTQxLjcgMTY4LjggMTkzLjEgMTYzLjggMTg4LjUgMjE0IDE0Mi4zICIgY2xhc3M9ImEiLz48cGF0aCBkPSJNMTM2IDQ2LjZjMCAwIDE3LjItMjYuMyAxMC4zLTM2LjYgLTYuOS0xMC4zLTkuMS05LjEtMTcuMi02LjkgLTguMSAyLjItMTIuNiA4LTEwLjMgMTcuMkMxMjEuMiAyOS41IDEyNS44IDM4LjYgMTM2IDQ2LjZ6IiBjbGFzcz0iYSIvPjxwb2x5Z29uIHBvaW50cz0iMTEzLjQgNDMuNiAxMDkgMzguNSAyMi4zIDE0MS43IDc3LjIgMTkzLjEgODIuMiAxODguNSAzMiAxNDIuMyAiIGNsYXNzPSJhIi8+PHBhdGggZD0iTTExMC4xIDQ2LjZjMCAwLTE3LjItMjYuMy0xMC4zLTM2LjYgNi45LTEwLjMgOS4xLTkuMiAxNy4xLTYuOXMxMi42IDggMTAuMyAxNy4yQzEyNC45IDI5LjYgMTIwLjQgMzguNiAxMTAuMSA0Ni42eiIgY2xhc3M9ImEiLz48cG9seWdvbiBwb2ludHM9IjQwLjcgMzIyLjMgMjMuNyAyNDkuNCA1NC45IDI1MCA1Ni43IDI1Ny40IDMyLjYgMjU2LjkgNDcuOCAzMTkuOSAiIGNsYXNzPSJhIi8+PHBhdGggZD0iTTM2LjggMzMyLjNjMCAwLTYuMiAxMS43IDUuNCAxNi42czE3LTUuNSAxNy01LjUgMC45LTQuNS00LjgtMTQuMyAtNy40LTExLjktMTAuNi0xMi41QzQwLjYgMzE2IDM2LjggMzMyLjMgMzYuOCAzMzIuM3oiIGNsYXNzPSJhIi8+PHBvbHlnb24gcG9pbnRzPSIyMS4zIDM4NS4xIDAgMjQ3LjQgNTcgMjIxLjkgNTYuMiAyMjkuNSA4LjUgMjUxLjggMjguOSAzODUuMiAiIGNsYXNzPSJhIi8+PHBhdGggZD0iTTE0LjYgMzk3LjNjMCAwLTkuMyAxMyAzLjcgMjAuNiAxMyA3LjYgMjEuMi0zLjggMjEuMi0zLjhzMS44LTUuMi0zLjQtMTcuOGMtNS4yLTEyLjYtNi45LTE1LjQtMTAuNi0xNi41UzE0LjYgMzk3LjMgMTQuNiAzOTcuM3oiIGNsYXNzPSJhIi8+PHBvbHlnb24gcG9pbnRzPSIyMTUuMyAzMjEuMyAyMzIuMyAyNDguNCAyMDEuMSAyNDkgMTk5LjMgMjU2LjQgMjIzLjQgMjU1LjkgMjA4LjEgMzE4LjkgIiBjbGFzcz0iYSIvPjxwYXRoIGQ9Ik0yMTkuMSAzMzEuM2MwIDAgNi4yIDExLjctNS40IDE2LjYgLTExLjYgNC45LTE3LTUuNS0xNy01LjVzLTAuOS00LjUgNC44LTE0LjNjNS43LTkuOCA3LjQtMTEuOSAxMC42LTEyLjVDMjE1LjMgMzE1IDIxOS4xIDMzMS4zIDIxOS4xIDMzMS4zeiIgY2xhc3M9ImEiLz48cG9seWdvbiBwb2ludHM9IjIzNC43IDM4NC4xIDI1NiAyNDYuNCAxOTkgMjIwLjkgMTk5LjcgMjI4LjUgMjQ3LjQgMjUwLjggMjI3LjEgMzg0LjIgIiBjbGFzcz0iYSIvPjxwYXRoIGQ9Ik0yNDEuNCAzOTYuM2MwIDAgOS4zIDEzLTMuNyAyMC42IC0xMyA3LjYtMjEuMi0zLjgtMjEuMi0zLjhzLTEuOC01LjIgMy40LTE3LjggNi45LTE1LjQgMTAuNi0xNi41UzI0MS40IDM5Ni4zIDI0MS40IDM5Ni4zeiIgY2xhc3M9ImEiLz48cGF0aCBkPSJNMjA3IDIyMWMwIDQxLTM1LjggNjIuNi03OS44IDYyLjZTNDkuNSAyNjIgNDkuNSAyMjFzMzMuNS03MS4xIDc3LjYtNzEuMVMyMDcgMTgwLjEgMjA3IDIyMXoiIGZpbGw9IiMzOEE5QjQiLz48cGF0aCBkPSJNMTI2LjIgMjg3LjFjLTIzLjMgMC00My4yLTUuOC01Ny43LTE2LjggLTE1LjUtMTEuNy0yMy42LTI4LjgtMjMuNi00OS4yIDAtMzguMyAyOC4xLTc0LjUgODEuMy03NC41IDUzLjggMCA4My41IDM2LjggODMuNSA3NC41IDAgMjAuNS04LjYgMzcuNS0yNC44IDQ5LjNDMTcwLjIgMjgxLjEgMTQ5LjMgMjg3LjEgMTI2LjIgMjg3LjF6TTEyNi4yIDE1My4zYy00OSAwLTczLjkgMzMuNC03My45IDY3LjcgMCAzNi42IDI4LjMgNTkuMiA3My45IDU5LjIgNDYuMiAwIDc2LjEtMjMuMyA3Ni4xLTU5LjJDMjAyLjMgMTc4LjMgMTYwLjkgMTUzLjMgMTI2LjIgMTUzLjN6IiBjbGFzcz0iYSIvPjxlbGxpcHNlIGN4PSI4OS4yIiBjeT0iMjc3LjEiIHJ4PSIzNy41IiByeT0iMzYuOCIgY2xhc3M9ImIiLz48cGF0aCBkPSJNODguMiAzMTYuMmMtMjIgMC0zOS45LTE3LjYtMzkuOS0zOS4yIDAtMjEuNiAxNy45LTM5LjIgMzkuOS0zOS4yczM5LjkgMTcuNiAzOS45IDM5LjJDMTI4IDI5OC42IDExMC4yIDMxNi4yIDg4LjIgMzE2LjJ6TTg4LjIgMjQyLjdjLTE5LjQgMC0zNS4yIDE1LjUtMzUuMiAzNC40IDAgMTkgMTUuOCAzNC40IDM1LjIgMzQuNHMzNS4yLTE1LjUgMzUuMi0zNC40QzEyMy40IDI1OC4xIDEwNy42IDI0Mi43IDg4LjIgMjQyLjd6IiBjbGFzcz0iYSIvPjxlbGxpcHNlIGN4PSI5Mi4xIiBjeT0iMjc5LjMiIHJ4PSIxNyIgcnk9IjE2LjMiIGNsYXNzPSJhIi8+PGNpcmNsZSBjeD0iODguOSIgY3k9IjI3Ni40IiByPSI0LjciIGNsYXNzPSJiIi8+PGVsbGlwc2UgY3g9IjE2My4xIiBjeT0iMjgyLjQiIHJ4PSI0NS40IiByeT0iNDciIGNsYXNzPSJiIi8+PHBhdGggZD0iTTE2Mi4xIDMzMS44Yy0yNi40IDAtNDcuOC0yMi4yLTQ3LjgtNDkuMyAwLTI3LjMgMjEuNS00OS4zIDQ3LjgtNDkuM3M0Ny44IDIyLjIgNDcuOCA0OS4zQzIxMCAzMDkuNiAxODguNSAzMzEuOCAxNjIuMSAzMzEuOHpNMTYyLjEgMjM3LjhjLTIzLjggMC00MyAyMC00MyA0NC42IDAgMjQuNiAxOS40IDQ0LjYgNDMgNDQuNnM0My0yMCA0My00NC42QzIwNS4yIDI1Ny44IDE4NS45IDIzNy44IDE2Mi4xIDIzNy44eiIgY2xhc3M9ImEiLz48Y2lyY2xlIGN4PSIxNjUuOSIgY3k9IjI4NC45IiByPSIyMSIgY2xhc3M9ImEiLz48Y2lyY2xlIGN4PSIxNzcuMyIgY3k9IjI4MS43IiByPSI1LjgiIGNsYXNzPSJiIi8+PC9zdmc+DQo="

/***/ }),

/***/ 232:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _react = __webpack_require__(1);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactHelmet = __webpack_require__(55);
	
	var _reactHelmet2 = _interopRequireDefault(_reactHelmet);
	
	var _Cover = __webpack_require__(214);
	
	var _Cover2 = _interopRequireDefault(_Cover);
	
	var _Ecosystem = __webpack_require__(215);
	
	var _Ecosystem2 = _interopRequireDefault(_Ecosystem);
	
	var _AllInOne = __webpack_require__(213);
	
	var _AllInOne2 = _interopRequireDefault(_AllInOne);
	
	var _Giants = __webpack_require__(218);
	
	var _Giants2 = _interopRequireDefault(_Giants);
	
	var _Expose = __webpack_require__(216);
	
	var _Expose2 = _interopRequireDefault(_Expose);
	
	var _Schema = __webpack_require__(220);
	
	var _Schema2 = _interopRequireDefault(_Schema);
	
	var _References = __webpack_require__(219);
	
	var _References2 = _interopRequireDefault(_References);
	
	var _Seo = __webpack_require__(221);
	
	var _Seo2 = _interopRequireDefault(_Seo);
	
	var _firebase = __webpack_require__(235);
	
	var _firebase2 = _interopRequireDefault(_firebase);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var IndexPage = function (_React$Component) {
	  _inherits(IndexPage, _React$Component);
	
	  function IndexPage() {
	    var _temp, _this, _ret;
	
	    _classCallCheck(this, IndexPage);
	
	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }
	
	    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _React$Component.call.apply(_React$Component, [this].concat(args))), _this), _this.render = function () {
	      return _react2.default.createElement(
	        'div',
	        { className: 'home' },
	        _react2.default.createElement(_reactHelmet2.default, { title: 'Innovaci\xF3n continua' }),
	        _react2.default.createElement(_Cover2.default, null),
	        _react2.default.createElement(_Ecosystem2.default, null),
	        _react2.default.createElement(_AllInOne2.default, null),
	        _react2.default.createElement(_Giants2.default, null),
	        _react2.default.createElement(_Schema2.default, null),
	        _react2.default.createElement(_Expose2.default, null),
	        _react2.default.createElement(_Seo2.default, null),
	        _react2.default.createElement(_References2.default, null)
	      );
	    }, _temp), _possibleConstructorReturn(_this, _ret);
	  }
	
	  IndexPage.prototype.componentDidMount = function componentDidMount() {
	    try {
	      this.firebase = new _firebase2.default();
	      this.firebase.fbase().askForPermissioToReceiveNotifications();
	    } catch (e) {
	      console.log("error: " + e);
	    }
	  };
	
	  return IndexPage;
	}(_react2.default.Component);
	
	exports.default = IndexPage;
	module.exports = exports['default'];

/***/ }),

/***/ 235:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _app = __webpack_require__(337);
	
	var _app2 = _interopRequireDefault(_app);
	
	var _messaging = __webpack_require__(338);
	
	var _messaging2 = _interopRequireDefault(_messaging);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var Firebase = function Firebase() {
	  var _this = this;
	
	  _classCallCheck(this, Firebase);
	
	  this.fbase = function () {
	    if (_this.instance) {
	      return _this.instance;
	    }
	    _app2.default.initializeApp({ messagingSenderId: "824440442769" });
	
	    _this.instance = _this;
	    return _this.instance;
	  };
	
	  this.askForPermissioToReceiveNotifications = _asyncToGenerator(function* () {
	    try {
	      console.log("ask to");
	      var messaging = _app2.default.messaging();
	
	      yield messaging.requestPermission();
	      var token = yield messaging.getToken();
	      console.log('user token: ', token);
	      console.log("https://iid.googleapis.com/iid/v1/" + token + "/rel/topics/all");
	      _asyncToGenerator(function* () {
	        try {
	          yield fetch("https://iid.googleapis.com/iid/v1/" + token + "/rel/topics/all", {
	            headers: {
	              'Authorization': 'key=AAAAv_R6z5E:APA91bHLXWzm5oMfs44Q6iZRxOQhI9-kQKaxpeY497zYE_XamXGlPymImjGhXpst_zjv89h4zrRWh7DmoPpw8rCnHXhmHAIcSWl75A6d5sPq0TNgLDGaemewxe7BIhW4fqLt5nLFekDX',
	              'Content-Type': 'application/json'
	            },
	            method: "POST"
	          }).then(function (res) {
	            return console.log(res);
	          }).catch(function (error) {
	            return console.error('Error:', error);
	          }).then(function (response) {
	            return console.log('Success:', response);
	          });
	          return token;
	        } catch (e) {
	          console.log("Booo");
	        }
	      })();
	    } catch (error) {
	      console.error(error);
	    };
	  });
	};
	
	exports.default = Firebase;
	module.exports = exports['default'];

/***/ }),

/***/ 236:
/***/ (function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	/* http://prismjs.com/download.html?themes=prism&languages=markup+css+clike+javascript+json */
	var _self = 'undefined' !== typeof window ? window : 'undefined' !== typeof WorkerGlobalScope && self instanceof WorkerGlobalScope ? self : {},
	    Prism = function () {
	  var e = /\blang(?:uage)?-(\w+)\b/i,
	      t = 0,
	      n = _self.Prism = {
	    manual: _self.Prism && _self.Prism.manual,
	    util: {
	      encode: function encode(e) {
	        return e instanceof a ? new a(e.type, n.util.encode(e.content), e.alias) : 'Array' === n.util.type(e) ? e.map(n.util.encode) : e.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
	      },
	      type: function type(e) {
	        return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1];
	      },
	      objId: function objId(e) {
	        return e.__id || Object.defineProperty(e, '__id', { value: ++t }), e.__id;
	      },
	      clone: function clone(e) {
	        var t = n.util.type(e);
	        switch (t) {
	          case 'Object':
	            var a = {};
	            for (var _r in e) {
	              e.hasOwnProperty(_r) && (a[_r] = n.util.clone(e[_r]));
	            }
	            return a;
	          case 'Array':
	            return e.map(function (e) {
	              return n.util.clone(e);
	            });
	        }
	        return e;
	      }
	    },
	    languages: {
	      extend: function extend(e, t) {
	        var a = n.util.clone(n.languages[e]);
	        for (var _r2 in t) {
	          a[_r2] = t[_r2];
	        }return a;
	      },
	      insertBefore: function insertBefore(e, t, a, r) {
	        r = r || n.languages;
	        var i = r[e];
	        if (2 == arguments.length) {
	          a = arguments[1];
	          for (var l in a) {
	            a.hasOwnProperty(l) && (i[l] = a[l]);
	          }return i;
	        }
	        var o = {};
	        for (var s in i) {
	          if (i.hasOwnProperty(s)) {
	            if (s == t) {
	              for (var l in a) {
	                a.hasOwnProperty(l) && (o[l] = a[l]);
	              }
	            }
	            o[s] = i[s];
	          }
	        }
	        return n.languages.DFS(n.languages, function (t, n) {
	          n === r[e] && t != e && (this[t] = o);
	        }), r[e] = o;
	      },
	      DFS: function DFS(e, t, a, r) {
	        r = r || {};
	        for (var i in e) {
	          e.hasOwnProperty(i) && (t.call(e, i, e[i], a || i), 'Object' !== n.util.type(e[i]) || r[n.util.objId(e[i])] ? 'Array' !== n.util.type(e[i]) || r[n.util.objId(e[i])] || (r[n.util.objId(e[i])] = !0, n.languages.DFS(e[i], t, i, r)) : (r[n.util.objId(e[i])] = !0, n.languages.DFS(e[i], t, null, r)));
	        }
	      }
	    },
	    plugins: {},
	    highlightAll: function highlightAll(e, t) {
	      var a = {
	        callback: t,
	        selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
	      };
	      n.hooks.run('before-highlightall', a);
	      for (var r, i = a.elements || document.querySelectorAll(a.selector), l = 0; r = i[l++];) {
	        n.highlightElement(r, e === !0, a.callback);
	      }
	    },
	    highlightElement: function highlightElement(t, a, r) {
	      for (var i, l, o = t; o && !e.test(o.className);) {
	        o = o.parentNode;
	      }o && (i = (o.className.match(e) || [, ''])[1].toLowerCase(), l = n.languages[i]), t.className = t.className.replace(e, '').replace(/\s+/g, ' ') + ' language-' + i, o = t.parentNode, /pre/i.test(o.nodeName) && (o.className = o.className.replace(e, '').replace(/\s+/g, ' ') + ' language-' + i);
	      var s = t.textContent,
	          u = { element: t, language: i, grammar: l, code: s };
	      if (n.hooks.run('before-sanity-check', u), !u.code || !u.grammar) {
	        return u.code && (n.hooks.run('before-highlight', u), u.element.textContent = u.code, n.hooks.run('after-highlight', u)), n.hooks.run('complete', u), void 0;
	      }
	      if (n.hooks.run('before-highlight', u), a && _self.Worker) {
	        var g = new Worker(n.filename);
	        g.onmessage = function (e) {
	          u.highlightedCode = e.data, n.hooks.run('before-insert', u), u.element.innerHTML = u.highlightedCode, r && r.call(u.element), n.hooks.run('after-highlight', u), n.hooks.run('complete', u);
	        }, g.postMessage(JSON.stringify({
	          language: u.language,
	          code: u.code,
	          immediateClose: !0
	        }));
	      } else {
	        u.highlightedCode = n.highlight(u.code, u.grammar, u.language), n.hooks.run('before-insert', u), u.element.innerHTML = u.highlightedCode, r && r.call(t), n.hooks.run('after-highlight', u), n.hooks.run('complete', u);
	      }
	    },
	    highlight: function highlight(e, t, r) {
	      var i = n.tokenize(e, t);
	      return a.stringify(n.util.encode(i), r);
	    },
	    matchGrammar: function matchGrammar(e, t, a, r, i, l, o) {
	      var s = n.Token;
	      for (var u in a) {
	        if (a.hasOwnProperty(u) && a[u]) {
	          if (u == o) return;
	          var g = a[u];
	          g = 'Array' === n.util.type(g) ? g : [g];
	          for (var c = 0; c < g.length; ++c) {
	            var h = g[c],
	                f = h.inside,
	                d = !!h.lookbehind,
	                m = !!h.greedy,
	                p = 0,
	                y = h.alias;
	            if (m && !h.pattern.global) {
	              var v = h.pattern.toString().match(/[imuy]*$/)[0];
	              h.pattern = RegExp(h.pattern.source, v + 'g');
	            }
	            h = h.pattern || h;
	            for (var b = r, k = i; b < t.length; k += t[b].length, ++b) {
	              var w = t[b];
	              if (t.length > e.length) return;
	              if (!(w instanceof s)) {
	                h.lastIndex = 0;
	                var _ = h.exec(w),
	                    P = 1;
	                if (!_ && m && b != t.length - 1) {
	                  if (h.lastIndex = k, _ = h.exec(e), !_) break;
	                  for (var A = _.index + (d ? _[1].length : 0), j = _.index + _[0].length, x = b, O = k, S = t.length; S > x && (j > O || !t[x].type && !t[x - 1].greedy); ++x) {
	                    O += t[x].length, A >= O && (++b, k = O);
	                  }
	                  if (t[b] instanceof s || t[x - 1].greedy) continue;
	                  P = x - b, w = e.slice(k, O), _.index -= k;
	                }
	                if (_) {
	                  d && (p = _[1].length);
	                  var A = _.index + p,
	                      _ = _[0].slice(p),
	                      j = A + _.length,
	                      N = w.slice(0, A),
	                      C = w.slice(j),
	                      E = [b, P];
	                  N && (++b, k += N.length, E.push(N));
	                  var I = new s(u, f ? n.tokenize(_, f) : _, y, _, m);
	                  if (E.push(I), C && E.push(C), Array.prototype.splice.apply(t, E), 1 != P && n.matchGrammar(e, t, a, b, k, !0, u), l) {
	                    break;
	                  }
	                } else if (l) break;
	              }
	            }
	          }
	        }
	      }
	    },
	    tokenize: function tokenize(e, t) {
	      var a = [e],
	          r = t.rest;
	      if (r) {
	        for (var i in r) {
	          t[i] = r[i];
	        }delete t.rest;
	      }
	      return n.matchGrammar(e, a, t, 0, 0, !1), a;
	    },
	
	    hooks: {
	      all: {},
	      add: function add(e, t) {
	        var a = n.hooks.all;
	        a[e] = a[e] || [], a[e].push(t);
	      },
	      run: function run(e, t) {
	        var a = n.hooks.all[e];
	        if (a && a.length) for (var r, i = 0; r = a[i++];) {
	          r(t);
	        }
	      }
	    }
	  },
	      a = n.Token = function (e, t, n, a, r) {
	    this.type = e, this.content = t, this.alias = n, this.length = 0 | (a || '').length, this.greedy = !!r;
	  };
	  if (a.stringify = function (e, t, r) {
	    if ('string' === typeof e) return e;
	    if ('Array' === n.util.type(e)) {
	      return e.map(function (n) {
	        return a.stringify(n, t, e);
	      }).join('');
	    }
	    var i = {
	      type: e.type,
	      content: a.stringify(e.content, t, r),
	      tag: 'span',
	      classes: ['token', e.type],
	      attributes: {},
	      language: t,
	      parent: r
	    };
	    if (e.alias) {
	      var l = 'Array' === n.util.type(e.alias) ? e.alias : [e.alias];
	      Array.prototype.push.apply(i.classes, l);
	    }
	    n.hooks.run('wrap', i);
	    var o = Object.keys(i.attributes).map(function (e) {
	      return e + '="' + (i.attributes[e] || '').replace(/"/g, '&quot;') + '"';
	    }).join(' ');
	    return '<' + i.tag + ' class="' + i.classes.join(' ') + '"' + (o ? ' ' + o : '') + '>' + i.content + '</' + i.tag + '>';
	  }, !_self.document) {
	    return _self.addEventListener ? (_self.addEventListener('message', function (e) {
	      var t = JSON.parse(e.data),
	          a = t.language,
	          r = t.code,
	          i = t.immediateClose;
	      _self.postMessage(n.highlight(r, n.languages[a], a)), i && _self.close();
	    }, !1), _self.Prism) : _self.Prism;
	  }
	  var r = document.currentScript || [].slice.call(document.getElementsByTagName('script')).pop();
	  return r && (n.filename = r.src, n.manual || r.hasAttribute('data-manual') || ('loading' !== document.readyState ? window.requestAnimationFrame ? window.requestAnimationFrame(n.highlightAll) : window.setTimeout(n.highlightAll, 16) : document.addEventListener('DOMContentLoaded', n.highlightAll))), _self.Prism;
	}();
	'undefined' !== typeof module && module.exports && (module.exports = Prism), 'undefined' !== typeof global && (global.Prism = Prism);
	Prism.languages.markup = {
	  comment: /<!--[\s\S]*?-->/,
	  prolog: /<\?[\s\S]+?\?>/,
	  doctype: /<!DOCTYPE[\s\S]+?>/i,
	  cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
	  tag: {
	    pattern: /<\/?(?!\d)[^\s>\/=$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,
	    inside: {
	      tag: {
	        pattern: /^<\/?[^\s>\/]+/i,
	        inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ }
	      },
	      'attr-value': {
	        pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,
	        inside: {
	          punctuation: [/^=/, { pattern: /(^|[^\\])["']/, lookbehind: !0 }]
	        }
	      },
	      punctuation: /\/?>/,
	      'attr-name': {
	        pattern: /[^\s>\/]+/,
	        inside: { namespace: /^[^\s>\/:]+:/ }
	      }
	    }
	  },
	  entity: /&#?[\da-z]{1,8};/i
	}, Prism.languages.markup.tag.inside['attr-value'].inside.entity = Prism.languages.markup.entity, Prism.hooks.add('wrap', function (a) {
	  'entity' === a.type && (a.attributes.title = a.content.replace(/&amp;/, '&'));
	}), Prism.languages.xml = Prism.languages.markup, Prism.languages.html = Prism.languages.markup, Prism.languages.mathml = Prism.languages.markup, Prism.languages.svg = Prism.languages.markup;
	Prism.languages.css = {
	  comment: /\/\*[\s\S]*?\*\//,
	  atrule: {
	    pattern: /@[\w-]+?.*?(?:;|(?=\s*\{))/i,
	    inside: { rule: /@[\w-]+/ }
	  },
	  url: /url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	  selector: /[^{}\s][^{};]*?(?=\s*\{)/,
	  string: {
	    pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
	    greedy: !0
	  },
	  property: /[\w-]+(?=\s*:)/i,
	  important: /\B!important\b/i,
	  function: /[-a-z0-9]+(?=\()/i,
	  punctuation: /[(){};:]/
	}, Prism.languages.css.atrule.inside.rest = Prism.util.clone(Prism.languages.css), Prism.languages.markup && (Prism.languages.insertBefore('markup', 'tag', {
	  style: {
	    pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
	    lookbehind: !0,
	    inside: Prism.languages.css,
	    alias: 'language-css'
	  }
	}), Prism.languages.insertBefore('inside', 'attr-value', {
	  'style-attr': {
	    pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
	    inside: {
	      'attr-name': {
	        pattern: /^\s*style/i,
	        inside: Prism.languages.markup.tag.inside
	      },
	      punctuation: /^\s*=\s*['"]|['"]\s*$/,
	      'attr-value': { pattern: /.+/i, inside: Prism.languages.css }
	    },
	    alias: 'language-css'
	  }
	}, Prism.languages.markup.tag));
	Prism.languages.clike = {
	  comment: [{ pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: !0 }, { pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0 }],
	  string: {
	    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
	    greedy: !0
	  },
	  'class-name': {
	    pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
	    lookbehind: !0,
	    inside: { punctuation: /[.\\]/ }
	  },
	  keyword: /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	  boolean: /\b(?:true|false)\b/,
	  function: /[a-z0-9_]+(?=\()/i,
	  number: /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
	  operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	  punctuation: /[{}[\];(),.:]/
	};
	Prism.languages.javascript = Prism.languages.extend('clike', {
	  keyword: /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	  number: /\b-?(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|\d*\.?\d+(?:[Ee][+-]?\d+)?|NaN|Infinity)\b/,
	  function: /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\s*\()/i,
	  operator: /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
	}), Prism.languages.insertBefore('javascript', 'keyword', {
	  regex: {
	    pattern: /(^|[^\/])\/(?!\/)(\[[^\]\r\n]+]|\\.|[^\/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
	    lookbehind: !0,
	    greedy: !0
	  },
	  'function-variable': {
	    pattern: /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)\s*=>))/i,
	    alias: 'function'
	  }
	}), Prism.languages.insertBefore('javascript', 'string', {
	  'template-string': {
	    pattern: /`(?:\\[\s\S]|[^\\`])*`/,
	    greedy: !0,
	    inside: {
	      interpolation: {
	        pattern: /\$\{[^}]+\}/,
	        inside: {
	          'interpolation-punctuation': {
	            pattern: /^\$\{|\}$/,
	            alias: 'punctuation'
	          },
	          rest: Prism.languages.javascript
	        }
	      },
	      string: /[\s\S]+/
	    }
	  }
	}), Prism.languages.markup && Prism.languages.insertBefore('markup', 'tag', {
	  script: {
	    pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
	    lookbehind: !0,
	    inside: Prism.languages.javascript,
	    alias: 'language-javascript'
	  }
	}), Prism.languages.js = Prism.languages.javascript;
	Prism.languages.json = {
	  property: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/i,
	  string: { pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/, greedy: !0 },
	  number: /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee][+-]?\d+)?)\b/,
	  punctuation: /[{}[\]);,]/,
	  operator: /:/g,
	  boolean: /\b(?:true|false)\b/i,
	  null: /\bnull\b/i
	}, Prism.languages.jsonp = Prism.languages.json;
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ })

});
//# sourceMappingURL=component---src-pages-index-js-52519c5124d37c4decb1.js.map