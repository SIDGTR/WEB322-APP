import { IReact } from "./serviceConnector";
import { StoreDispatcher } from "./StoreDispatcher";
/** Service state snapshot */
export interface IServiceStateAction<T> {
    type: string;
    payload: Partial<T>;
}
export interface IStoreAction<T = any> {
    type: string;
    payload: T;
}
export declare type StoreReducer<TState = any, TPayload = any> = (state: TState, action: IStoreAction<TPayload>) => TState;
export declare type StoreDispatch<TPayload = any> = (action: IStoreAction<TPayload>) => void;
export declare type StoreMiddleware = (store: IStore) => (next: StoreDispatch) => (action: IStoreAction) => any;
export interface IStore<TState = any> {
    dispatch: StoreDispatch;
    getState: () => TState;
    subscribe: (listener: () => void) => () => void;
    replaceReducer: (nextReducers: StoreReducer) => StoreReducer;
}
export declare type ServiceMap = Record<string, StoreService<any>>;
/**
 * StoreService is takes a small slice of the redux state and augments it with
 * business logic. It handles actions and reducers automatically, creating
 * state management that is react-like
 */
export declare class StoreService<STATE extends Record<string, any> = {}> {
    /**
     * Create a static, global StoreService singleton
     * @param serviceClassDefinition The class definition for the service.
     */
    static define<T extends StoreService>(id: string, serviceClassDefinition: new () => T): T;
    /**
     * Retreive a service by class name
     * @param className the class name of the service
     */
    static get<T extends StoreService>(className: string): T;
    /**
     * Retreive the core service mapping
     * @param className the class name of the service
     * @returns the map of all services
     */
    static getServiceMap(): Record<string, StoreService<any>>;
    /**
     * Wrap the main store's reducer, for using the inbuilt service mechanisms.
     * This should be your first point of entry.
     * Although matchPaths can be specified, it's recommended for single stores
     * (which are most applciations) to provide none, matching all services
     * automatically.
     * @param matchPaths paths of the reducers to match (not recommended)
     * @returns a custom reducer, calling all matching paths
     */
    static wrapReducer(storeReducer: StoreReducer, matchPaths?: string[]): StoreReducer;
    /**
     * To attach to the main store - this is required for dispatching to work.
     * @param name specify a store name, for specific stores. default "default".
     * @returns the middleware for all services
     */
    static getMiddleware(name?: string): StoreMiddleware;
    /**
     * Generate a custom service reducer matching the specified paths. This is
     * for more advanced composing, wrapReducer is preferred.
     * @param matchPaths paths of the reducers to match
     * @returns a custom reducer, calling all matching paths
     */
    static getReducer(matchPaths?: string[]): StoreReducer;
    static getServices(matchPath?: string[]): StoreService[];
    /** A reference to the stores used */
    static staticStore: Record<string, IStore>;
    static readonly diffLevel = 3;
    /** The name of the action  */
    get ACTION_TYPE(): string;
    /** Returns a copy of the state, based on last known and changes */
    get state(): STATE;
    route: string;
    protected readonly stateInitial: STATE;
    private stateLast;
    private stateChanges;
    private subscriptions;
    private storeStateInternal;
    get storeState(): any;
    storePath: string;
    private store;
    protected dispatcher: StoreDispatcher;
    hasInited: boolean;
    private isReducing;
    private timerUpdateState;
    constructor(storePath: string, stateInitial: STATE);
    /**
     * Get the middleware for this service.
     * It's recommended to use the static StoreService.getMiddleware() method
     * over this one for single-store applications.
     * @returns the middleware for this single service.
     */
    get middleware(): StoreMiddleware;
    /**
     * Get the reducer for this service.
     * It's recommended to use the static StoreService.wrapReducer() method
     * over this one for single-store applications.
     * @returns the reducer for this single service.
     */
    get reducer(): StoreReducer;
    /**
     * Connect the service to a component as a HOC
     * @returns a connector ready for running on a component or in a compose tree
     */
    connect<T = this>(React: IReact): (comp: (props: STATE & {
        service: T;
    }) => any) => any;
    /**
     * subscribe to the state changes of this service
     * @param listener a callback that takes a new state as its only argument
     * @returns a method that can be used for unsubscribing
     */
    subscribe(listener: (state: STATE) => void): () => void;
    /**
     * unsubscribe from the state changes of this service
     * @param listener the callback that was subscribed to this service
     */
    unsubscribe(listener: (state: STATE) => void): void;
    /**
     * Update the state, similar to a React component
     * @param stateChanges The properties to alter on the state
     */
    setState(stateChanges: Partial<STATE>): void;
    private init;
    /**
     * Lifecycle method: overide to react to service initialisation
     */
    onInit(): void;
    /**
     * Lifecycle method: overide to react to component connections
     */
    onConnect(): void;
    /**
     * Lifecycle method: overide to react to incoming state changes
     * @param stateChanges the full snapshot of changes properties
     */
    protected onStateChanging(stateChanges: Partial<STATE>): Partial<STATE>;
    protected callStateChanged(newState?: STATE): void;
    protected scheduleStateChanged(newState?: STATE): void;
    protected onStateChanged(): void;
    protected onReduce(): void;
    /**
     * Lifecycle method: overide to react to route updates
     * @param route the pathname of the new location, sans hash
     */
    onRoute(route: string): void;
    private getSubscriptionIndex;
    private handleRouteChanges;
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
    private reduce;
}
export default StoreService;
