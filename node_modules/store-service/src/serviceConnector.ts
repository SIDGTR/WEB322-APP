import { StoreService } from "./StoreService";

type FunctionComponent<PROPS_TYPE> = (props: PROPS_TYPE) => any;

export type ComponentType<PROPS_TYPE> = (props: PROPS_TYPE) => any | { props: PROPS_TYPE };

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

export function serviceConnector<
  SERVICE_TYPE extends StoreService<any> = StoreService<any>
>(React: IReact, service: SERVICE_TYPE) {
  return (component: FunctionComponent<typeof service.state & { service: typeof service }>) => {
    return class ServiceComponent extends React.Component<typeof service.state & { service: SERVICE_TYPE }> {
      state = { isMounted: false };
      constructor(props: any) {
        super(props);
        this.updateState = this.updateState.bind(this);
      }
      componentDidMount() {
        service.subscribe(this.updateState);
        this.setState({ isMounted: true });
        setTimeout(this.updateState, 0);
      }
      componentWillUnmount() {
        service.unsubscribe(this.updateState);
        this.setState({ isMounted: false });
      }
      updateState() {
        if (this.state.isMounted) {
          this.setState({});
        }
      }
      render() {
        const wrappedProps = { ...service.state, service };
        const renderComp = (component as any).WrappedComponent || component;
        if (!renderComp) {
          return null;
        }
        if (renderComp instanceof React.Component) {
          return React.cloneElement(renderComp, [wrappedProps], null);
        }
        return React.createElement(renderComp, wrappedProps, null);
      }
    };
  };
}

export function multiServiceConnector<
  PROP_TYPE,
  SERVICE_TYPE extends StoreService<any> = StoreService<any>,
  SERVICE_MAP extends Record<string, SERVICE_TYPE> = Record<string, SERVICE_TYPE>
>(React: IReact, services: SERVICE_MAP) {
  return (component: FunctionComponent<PROP_TYPE>) => {
    return class MultiServiceComponent extends React.Component<PROP_TYPE> {
      state = { isMounted: false };
      unsubscribe = () => {};
      constructor(props: any) {
        super(props);
        this.updateState = this.updateState.bind(this);
      }
      componentDidMount() {
        const unsubs: (() => void)[] = [];
        for (const key in services) {
          if (services.hasOwnProperty(key)) {
            unsubs.push(services[key].subscribe(this.updateState));
          }
        }
        this.unsubscribe = () => unsubs.forEach(x => x());
        this.setState({ isMounted: true });
        setTimeout(this.updateState, 0);
      }
      componentWillUnmount() {
        if (this.unsubscribe) {
          this.unsubscribe();
        }
        this.setState({ isMounted: false });
      }
      updateState() {
        if (this.state.isMounted) {
          this.setState({});
        }
      }
      render() {
        const wrappedProps = { ...this.props, ...services };
        const renderComp = (component as any).WrappedComponent || component;
        if (!renderComp) {
          return null;
        }
        if (renderComp instanceof React.Component) {
          return React.cloneElement(renderComp, [wrappedProps], null);
        }
        return React.createElement(renderComp, wrappedProps, null);
      }
    };
  };
}

export default serviceConnector;
