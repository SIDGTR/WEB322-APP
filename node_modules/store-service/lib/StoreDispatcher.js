"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StoreService_1 = require("./StoreService");
class StoreDispatcher {
    constructor() {
        this.timers = {};
        /**
         * Updates the redux store at the end of the stack-frame
         */
        this.dispatch = (action) => {
            clearTimeout(this.timers[action.type]);
            const store = this.store || StoreService_1.StoreService.staticStore.default;
            if (store) {
                if (typeof action === "function") {
                    return action(store.dispatch);
                }
                return store.dispatch(action);
            }
        };
        this.dispatchNext = (action) => {
            clearTimeout(this.timers[action.type]);
            return new Promise(resolve => {
                this.timers[action.type] = setTimeout(() => {
                    clearTimeout(this.timers[action.type]);
                    this.dispatch(action);
                    resolve();
                }, 1);
            });
        };
    }
}
exports.StoreDispatcher = StoreDispatcher;
