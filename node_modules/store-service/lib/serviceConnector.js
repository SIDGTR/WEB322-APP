"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function serviceConnector(React, service) {
    return (component) => {
        return class ServiceComponent extends React.Component {
            constructor(props) {
                super(props);
                this.state = { isMounted: false };
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
                const wrappedProps = Object.assign(Object.assign({}, service.state), { service });
                const renderComp = component.WrappedComponent || component;
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
exports.serviceConnector = serviceConnector;
function multiServiceConnector(React, services) {
    return (component) => {
        return class MultiServiceComponent extends React.Component {
            constructor(props) {
                super(props);
                this.state = { isMounted: false };
                this.unsubscribe = () => { };
                this.updateState = this.updateState.bind(this);
            }
            componentDidMount() {
                const unsubs = [];
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
                const wrappedProps = Object.assign(Object.assign({}, this.props), services);
                const renderComp = component.WrappedComponent || component;
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
exports.multiServiceConnector = multiServiceConnector;
exports.default = serviceConnector;
