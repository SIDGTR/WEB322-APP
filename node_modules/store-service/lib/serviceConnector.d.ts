import { StoreService } from "./StoreService";
declare type FunctionComponent<PROPS_TYPE> = (props: PROPS_TYPE) => any;
export declare type ComponentType<PROPS_TYPE> = (props: PROPS_TYPE) => any | {
    props: PROPS_TYPE;
};
declare class ReactComponent<T = {}> {
    state: any;
    props: any;
    constructor(props: any);
    setState(state: any): void;
}
export interface IReact {
    Component: new <T>(props: any) => ReactComponent<T>;
    createElement: (element: any, props: any, children: any[]) => any;
    cloneElement: (element: any, props: any[], children: any[]) => any;
}
export declare function serviceConnector<SERVICE_TYPE extends StoreService<any> = StoreService<any>>(React: IReact, service: SERVICE_TYPE): (component: FunctionComponent<any>) => {
    new (props: any): {
        state: {
            isMounted: boolean;
        };
        componentDidMount(): void;
        componentWillUnmount(): void;
        updateState(): void;
        render(): any;
        props: any;
        setState(state: any): void;
    };
};
export declare function multiServiceConnector<PROP_TYPE, SERVICE_TYPE extends StoreService<any> = StoreService<any>, SERVICE_MAP extends Record<string, SERVICE_TYPE> = Record<string, SERVICE_TYPE>>(React: IReact, services: SERVICE_MAP): (component: FunctionComponent<PROP_TYPE>) => {
    new (props: any): {
        state: {
            isMounted: boolean;
        };
        unsubscribe: () => void;
        componentDidMount(): void;
        componentWillUnmount(): void;
        updateState(): void;
        render(): any;
        props: any;
        setState(state: any): void;
    };
};
export default serviceConnector;
