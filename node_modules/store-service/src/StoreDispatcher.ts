import { IStore, IStoreAction, StoreService } from "./StoreService";

export class StoreDispatcher {

  public store: IStore;
  private timers: any = {};

  /**
   * Updates the redux store at the end of the stack-frame
   */
  public dispatch = (action: IStoreAction) => {
    clearTimeout(this.timers[action.type]);
    const store = this.store || StoreService.staticStore.default;
    if (store) {
      if (typeof action === "function") {
        return (action as any)(store.dispatch);
      }
      return store.dispatch(action);
    }
  }

  public dispatchNext = (action: IStoreAction) => {
    clearTimeout(this.timers[action.type]);
    return new Promise(resolve => {
      this.timers[action.type] = setTimeout(() => {
        clearTimeout(this.timers[action.type]);
        this.dispatch(action);
        resolve();
      }, 1);
    });
  }

}
