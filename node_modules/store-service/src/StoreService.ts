import {
  IReact,
  serviceConnector,
} from "./serviceConnector";

import utils from "./utils";
import { StoreDispatcher } from "./StoreDispatcher";

/** Service state snapshot */
export interface IServiceStateAction<T> {
  type: string,
  payload: Partial<T>
}

export interface IStoreAction<T = any> { type: string, payload: T };
export type StoreReducer<TState = any, TPayload = any> = (state: TState, action: IStoreAction<TPayload>) => TState;
export type StoreDispatch<TPayload = any> = (action: IStoreAction<TPayload>) => void;
export type StoreMiddleware = (store: IStore) => (next: StoreDispatch) => (action: IStoreAction) => any;
export interface IStore<TState = any> {
  dispatch: StoreDispatch;
  getState: () => TState;
  subscribe: (listener: () => void) => () => void;
  replaceReducer: (nextReducers: StoreReducer) => StoreReducer;
}

export type ServiceMap = Record<string, StoreService<any>>;

/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
export class StoreService<STATE extends Record<string, any> = {}> {

  /**
   * Create a static, global StoreService singleton
   * @param serviceClassDefinition The class definition for the service.
   */
  static define<T extends StoreService>(id: string, serviceClassDefinition: new() => T): T {
    const serviceMap = this.getServiceMap();
    const service = serviceMap[id] = serviceMap[id] || new serviceClassDefinition();
    return service as T;
  }

  /**
   * Retreive a service by class name
   * @param className the class name of the service
   */
  static get<T extends StoreService>(className: string): T {
    return this.getServiceMap()[className] as T || null;
  }

  /**
   * Retreive the core service mapping
   * @param className the class name of the service
   * @returns the map of all services
   */
  static getServiceMap() {
    const mapParent: any = typeof window !== "undefined" ? window : this;
    if (!mapParent.services) {
      mapParent.services = {};
    }
    return mapParent.services as ServiceMap;
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
  static wrapReducer(storeReducer: StoreReducer, matchPaths?: string[]): StoreReducer {
    const serviceReducer = this.getReducer(matchPaths);
    return (state: any, action: IStoreAction<any>) => {
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
  static getMiddleware(name: string = "default"): StoreMiddleware {
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
  static getReducer(matchPaths?: string[]): StoreReducer {
    return (state: any, action: IStoreAction<any>) => {
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

  static getServices(matchPath?: string[]): StoreService[] {
    if (typeof matchPath === "string") {
      matchPath = [matchPath];
    }
    const result: StoreService[] = [];
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

  /** A reference to the stores used */
  static staticStore: Record<string, IStore> = {};

  static readonly diffLevel = 3;

  /** The name of the action  */
  public get ACTION_TYPE(): string {
    return utils.pascalCase("Service_" + this.constructor.name.toLowerCase());
  }

  /** Returns a copy of the state, based on last known and changes */
  public get state(): STATE {
    return { ...this.stateLast, ...this.stateChanges };
  }

  public route: string;

  protected readonly stateInitial: STATE;

  private stateLast: STATE;
  private stateChanges: Partial<STATE>;
  private subscriptions: Array<(state: STATE) => void> = [];

  private storeStateInternal: any;
  get storeState(): any { return this.storeStateInternal; }

  public storePath: string;

  private store: IStore;
  protected dispatcher: StoreDispatcher;
  public hasInited = false;
  private isReducing = false;
  private timerUpdateState: any;

  constructor(storePath: string, stateInitial: STATE) {
    if (utils.isDotPath(storePath) === false) {
      throw new Error("Service slice name must be dot path - got " + storePath);
    }
    this.storePath = storePath;
    this.stateInitial = Object.freeze(stateInitial);
    this.stateLast = { ...stateInitial };
    this.stateChanges = {};

    this.handleRouteChanges = this.handleRouteChanges.bind(this);
    this.dispatcher = new StoreDispatcher();
  }

  /**
   * Get the middleware for this service.
   * It's recommended to use the static StoreService.getMiddleware() method
   * over this one for single-store applications.
   * @returns the middleware for this single service.
   */
  public get middleware(): StoreMiddleware {
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
  public get reducer(): StoreReducer {
    return this.reduce.bind(this) as StoreReducer;
  }

  /**
   * Connect the service to a component as a HOC
   * @returns a connector ready for running on a component or in a compose tree
   */
  public connect<T = this>(React: IReact): (comp: (props: STATE & {service: T}) => any) => any {
    return serviceConnector(React, this);
  }

  /**
   * subscribe to the state changes of this service
   * @param listener a callback that takes a new state as its only argument
   * @returns a method that can be used for unsubscribing
   */
  public subscribe(listener: (state: STATE) => void) {
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
  public unsubscribe(listener: (state: STATE) => void) {
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
  public setState(stateChanges: Partial<STATE>): void {
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
      } else {
        this.dispatcher.dispatch({
          type: this.ACTION_TYPE,
          payload: this.stateChanges
        });
      }
      this.scheduleStateChanged();
    }
  }

  private init() {
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
  public onInit() {}

  /**
   * Lifecycle method: overide to react to component connections
   */
  public onConnect() {}

  /**
   * Lifecycle method: overide to react to incoming state changes
   * @param stateChanges the full snapshot of changes properties
   */
  protected onStateChanging(stateChanges: Partial<STATE>): Partial<STATE> {
    return stateChanges;
  }

  protected callStateChanged(newState?: STATE) {
    this.onStateChanged();
    for (const subcription of this.subscriptions) {
      subcription(newState || this.state);
    }
  }

  protected scheduleStateChanged(newState?: STATE) {
    clearTimeout(this.timerUpdateState);
    if (this.hasInited) {
      this.timerUpdateState = setTimeout(() => this.callStateChanged(newState), 0);
    }
  }

  protected onStateChanged() {}

  protected onReduce() {}

  /**
   * Lifecycle method: overide to react to route updates
   * @param route the pathname of the new location, sans hash
   */
  public onRoute(route: string) {}

  private getSubscriptionIndex(callback: (state: STATE) => void) {
    for (let i = this.subscriptions.length - 1; i >= 0; i--) {
      if (this.subscriptions[i] === callback) {
        return i;
      }
    }
    return -1;
  }

  private handleRouteChanges() {
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
  private reduce(storeState: any, action: IStoreAction) {
    if (storeState) {
      this.storeStateInternal = storeState;
    } else {
      storeState = {};
    }

    this.isReducing = true;
    this.onReduce();
    const incomingState = utils.lookup(storeState, this.storePath);
    const currentState = this.state;
    const incomingDiff = utils.valueDiff(currentState, incomingState, 3);

    // apply external changes
    if (incomingDiff || utils.collectKeys(this.stateChanges).length > 0) {
      const combinedChanges = { ...incomingState, ...this.stateChanges };
      const parsedChanges = { ...this.onStateChanging(combinedChanges) };
      this.stateLast = {
        ...this.stateLast,
        ...parsedChanges
      };
      this.stateChanges = {};
      utils.set(storeState, this.storePath, this.stateLast);
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

export default StoreService;
