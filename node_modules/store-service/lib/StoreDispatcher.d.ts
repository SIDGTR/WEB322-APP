import { IStore, IStoreAction } from "./StoreService";
export declare class StoreDispatcher {
    store: IStore;
    private timers;
    /**
     * Updates the redux store at the end of the stack-frame
     */
    dispatch: (action: IStoreAction<any>) => any;
    dispatchNext: (action: IStoreAction<any>) => Promise<unknown>;
}
