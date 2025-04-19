"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serviceConnector_1 = require("./serviceConnector");
const utils_1 = __importDefault(require("./utils"));
const StoreDispatcher_1 = require("./StoreDispatcher");
;
/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
class StoreService {
    constructor(storePath, stateInitial) {
        this.subscriptions = [];
        this.hasInited = false;
        this.isReducing = false;
        if (utils_1.default.isDotPath(storePath) === false) {
            throw new Error("Service slice name must be dot path - got " + storePath);
        }
        this.storePath = storePath;
        this.stateInitial = Object.freeze(stateInitial);
        this.stateLast = Object.assign({}, stateInitial);
        this.stateChanges = {};
        this.handleRouteChanges = this.handleRouteChanges.bind(this);
        this.dispatcher = new StoreDispatcher_1.StoreDispatcher();
    }
    /**
     * Create a static, global StoreService singleton
     * @param serviceClassDefinition The class definition for the service.
     */
    static define(id, serviceClassDefinition) {
        const serviceMap = this.getServiceMap();
        const service = serviceMap[id] = serviceMap[id] || new serviceClassDefinition();
        return service;
    }
    /**
     * Retreive a service by class name
     * @param className the class name of the service
     */
    static get(className) {
        return this.getServiceMap()[className] || null;
    }
    /**
     * Retreive the core service mapping
     * @param className the class name of the service
     * @returns the map of all services
     */
    static getServiceMap() {
        const mapParent = typeof window !== "undefined" ? window : this;
        if (!mapParent.services) {
            mapParent.services = {};
        }
        return mapParent.services;
    }
    /**
     * Wrap the main store's reducer, for using the inbuilt service mechanisms.
     * This should be your first point of entry.
     * Although matchPaths can be specified, it's recommended for single stores
     * (which are most applciations) to provide none, matching all services
     * automatically.
     * @param matchPaths paths of the reducers to match (not recommended)
     * @returns a custom reducer, calling all matching paths
     */
    static wrapReducer(storeReducer, matchPaths) {
        const serviceReducer = this.getReducer(matchPaths);
        return (state, action) => {
            state = storeReducer(state, action);
            state = serviceReducer(state, action);
            return state;
        };
    }
    /**
     * To attach to the main store - this is required for dispatching to work.
     * @param name specify a store name, for specific stores. default "default".
     * @returns the middleware for all services
     */
    static getMiddleware(name = "default") {
        return store => {
            this.staticStore[name] = store;
            return next => action => next(action);
        };
    }
    /**
     * Generate a custom service reducer matching the specified paths. This is
     * for more advanced composing, wrapReducer is preferred.
     * @param matchPaths paths of the reducers to match
     * @returns a custom reducer, calling all matching paths
     */
    static getReducer(matchPaths) {
        return (state, action) => {
            const services = this.getServices(matchPaths);
            for (const service of services) {
                const reducer = service.reducer;
                if (reducer) {
                    state = reducer(state, action);
                }
            }
            return state;
        };
    }
    static getServices(matchPath) {
        if (typeof matchPath === "string") {
            matchPath = [matchPath];
        }
        const result = [];
        const serviceMap = this.getServiceMap();
        for (const key in serviceMap) {
            if (serviceMap.hasOwnProperty(key)) {
                const service = serviceMap[key];
                if (matchPath) {
                    const match = matchPath.find(x => service.storePath.includes(x));
                    if (!match) {
                        continue;
                    }
                }
                result.push(serviceMap[key]);
            }
        }
        return result;
    }
    /** The name of the action  */
    get ACTION_TYPE() {
        return utils_1.default.pascalCase("Service_" + this.constructor.name.toLowerCase());
    }
    /** Returns a copy of the state, based on last known and changes */
    get state() {
        return Object.assign(Object.assign({}, this.stateLast), this.stateChanges);
    }
    get storeState() { return this.storeStateInternal; }
    /**
     * Get the middleware for this service.
     * It's recommended to use the static StoreService.getMiddleware() method
     * over this one for single-store applications.
     * @returns the middleware for this single service.
     */
    get middleware() {
        return store => {
            this.store = store;
            this.dispatcher.store = store;
            return next => action => next(action);
        };
    }
    /**
     * Get the reducer for this service.
     * It's recommended to use the static StoreService.wrapReducer() method
     * over this one for single-store applications.
     * @returns the reducer for this single service.
     */
    get reducer() {
        return this.reduce.bind(this);
    }
    /**
     * Connect the service to a component as a HOC
     * @returns a connector ready for running on a component or in a compose tree
     */
    connect(React) {
        return serviceConnector_1.serviceConnector(React, this);
    }
    /**
     * subscribe to the state changes of this service
     * @param listener a callback that takes a new state as its only argument
     * @returns a method that can be used for unsubscribing
     */
    subscribe(listener) {
        const index = this.getSubscriptionIndex(listener);
        if (index >= 0) {
            return;
        }
        this.subscriptions.push(listener);
        listener(this.state);
        return () => this.unsubscribe(listener);
    }
    /**
     * unsubscribe from the state changes of this service
     * @param listener the callback that was subscribed to this service
     */
    unsubscribe(listener) {
        const index = this.getSubscriptionIndex(listener);
        if (index < 0) {
            return;
        }
        this.subscriptions.splice(index, 1);
    }
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges) {
        this.stateChanges = this.stateChanges || {};
        let hasChanged = false;
        for (const key in stateChanges) {
            if (typeof stateChanges[key] !== "undefined") {
                if (this.stateChanges.hasOwnProperty(key)) {
                    delete this.stateChanges[key];
                }
                if (this.stateLast[key] === stateChanges[key]) {
                    continue;
                }
                this.stateChanges[key] = stateChanges[key];
                hasChanged = true;
            }
        }
        if (hasChanged) {
            if (this.isReducing) {
                this.dispatcher.dispatchNext({
                    type: this.ACTION_TYPE,
                    payload: this.stateChanges
                });
            }
            else {
                this.dispatcher.dispatch({
                    type: this.ACTION_TYPE,
                    payload: this.stateChanges
                });
            }
            this.scheduleStateChanged();
        }
    }
    init() {
        if (typeof location !== "undefined") {
            let lastPathname = location.pathname;
            const checkLocation = () => {
                if (lastPathname !== location.pathname) {
                    lastPathname = location.pathname;
                    this.handleRouteChanges();
                }
                setTimeout(checkLocation, 100);
            };
            checkLocation();
        }
        this.onInit();
        this.handleRouteChanges();
    }
    /**
     * Lifecycle method: overide to react to service initialisation
     */
    onInit() { }
    /**
     * Lifecycle method: overide to react to component connections
     */
    onConnect() { }
    /**
     * Lifecycle method: overide to react to incoming state changes
     * @param stateChanges the full snapshot of changes properties
     */
    onStateChanging(stateChanges) {
        return stateChanges;
    }
    callStateChanged(newState) {
        this.onStateChanged();
        for (const subcription of this.subscriptions) {
            subcription(newState || this.state);
        }
    }
    scheduleStateChanged(newState) {
        clearTimeout(this.timerUpdateState);
        if (this.hasInited) {
            this.timerUpdateState = setTimeout(() => this.callStateChanged(newState), 0);
        }
    }
    onStateChanged() { }
    onReduce() { }
    /**
     * Lifecycle method: overide to react to route updates
     * @param route the pathname of the new location, sans hash
     */
    onRoute(route) { }
    getSubscriptionIndex(callback) {
        for (let i = this.subscriptions.length - 1; i >= 0; i--) {
            if (this.subscriptions[i] === callback) {
                return i;
            }
        }
        return -1;
    }
    handleRouteChanges() {
        if (typeof location === "undefined") {
            return;
        }
        let route = location.pathname;
        route = route.replace(/\\/g, "/");
        if (route.charAt(0) === "#") {
            route = route.substr(1);
        }
        while (route.charAt(0) === "/") {
            route = route.substr(1);
        }
        this.route = route;
        this.onRoute(route);
    }
    /**
     * The redux reducer / handler
     * @param newState the full redux state
     * @param action the acton updating
     */
    /**
     * The redux reducer / handler
     * @param newState the full redux state
     * @param action the acton updating
     */
    reduce(storeState, action) {
        if (storeState) {
            this.storeStateInternal = storeState;
        }
        else {
            storeState = {};
        }
        this.isReducing = true;
        this.onReduce();
        const incomingState = utils_1.default.lookup(storeState, this.storePath);
        const currentState = this.state;
        const incomingDiff = utils_1.default.valueDiff(currentState, incomingState, 3);
        // apply external changes
        if (incomingDiff || utils_1.default.collectKeys(this.stateChanges).length > 0) {
            const combinedChanges = Object.assign(Object.assign({}, incomingState), this.stateChanges);
            const parsedChanges = Object.assign({}, this.onStateChanging(combinedChanges));
            this.stateLast = Object.assign(Object.assign({}, this.stateLast), parsedChanges);
            this.stateChanges = {};
            utils_1.default.set(storeState, this.storePath, this.stateLast);
            this.scheduleStateChanged();
        }
        if (this.hasInited === false) {
            this.hasInited = true;
            this.init();
        }
        this.isReducing = false;
        return storeState;
    }
}
exports.StoreService = StoreService;
/** A reference to the stores used */
StoreService.staticStore = {};
StoreService.diffLevel = 3;
exports.default = StoreService;
