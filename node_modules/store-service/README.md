# StoreService

*"Get your Store out of your Component tree"*

StoreService is a convenient wrapper for redux that allows for easy creation
and management of state slices, actions and reducers, seperately from 
components, Higher Order Components (HOCs) and providers. By emulating the
behaviour of React Component state management, and interacting with the redux 
store, each StoreService has the power and consistency of Redux, with the 
convenience of a Component and the independence of a data-only model.

**Version 2.0 changes.**
Version 2.0 has been hardened by some real world projects and as a result some
breaking changes have been introduced:
  - The service declaration requires a name as the first parameter

That's it - it shouldn't take long to adapt.

### Goals
 - To simplify state management and propagation
 - To be an alternative to HOCs and component->property->component propagation
 - To be a first class Redux citizen
 - To be useful in existing Redux-based toolchains
 - To require no specific React binding, but provide it
 - To be compatable with Preact
 - To be compatable with non-JSX component libraries
 - One dependency: redux

### Why?
Sometimes you may want your state and model management in once place: it can be
time consuming and error-prone to wire in properties from Higher Order 
Components (HOCs) to their children. It'd probably be easier just to avoid the
whole thing and have a dedicated place for model and state management.

### An Alternative To...
StoreService is as an alternative to redux-toolkit and react-redux. It isn't a
drop-in replacement but will work nicely alongside those tools.

### How?

#### Declaring a StoreService
Service declaration should be easy: extend the `StoreService` class and wrap it
in a `StoreService.define()`:
```javascript
const service = StoreService.define(
  "serviceName",
  class TestService extends StoreService {
    constructor() {
      super("testData", { a: 1, b: 2 });
    }

    increaseA() {
      return this.setState({ a: this.state.a + 1 });
    }
  }
);
```

#### Plugging into a single store (recommended)
The recommended method for using StoreServices is to wrap your top level
reducer and append to middleware using the static method
```javascript
const store = createStore(
  StoreService.getStoreReducer(
    existingReducer
  ),
  applyMiddleware([
    ...existingMiddleware
    ...StoreService.getMiddlewares()
  ])
);
```

#### Plugging into an existing store / stores manually
If you want to try it out or use it on an existing project without tampering
with the store, you can add it to your existing reducers and middleware. It's 
probably best to add StoreServices _after_ your existing store definitions.
```javascript
  const store = createStore(
    combineReducers(
      ...existingReducers
      // all other existing reducers
      c: serviceC.reducer,
      d: serviceD.reducer,
    ),
    applyMiddleware([
      ...existingMiddlewarre
      // all other existing middleware
      serviceC.middleware,
      serviceD.middleware,
    ])
  );
```

#### Using as a (p)react HOC
```javascript
function TitleComponentLayout({ title }) {
  return <h1>{title}</h1>;
}
const TitleComponent = titleService.connect(React)(TitleComponentLayout);
```

#### Composing into (p)react HOCs with connect
```javascript
function TitleComponentLayout({ title }) {
  return <h1>{title}</h1>;
}
const TitleComponent = compose(
  middleware(),
  titleService.connect(React)
)(TitleLayoutComponent)
```

### Changes
**2.0.0**
  - Breaking: services require names on construction
  - own internal state management for better Observable run
  - subscription optimisation for better Observable run
  - convenient multiServiceConnector HOC to connect multiple services
  - better diffing

**1.0.1**
  - React-Redux-like connect method provided through HOCs
  - React/Preact abstractions

### Roadmap
**2.1.0**
  - read-only mode (can influence store but not vice versa)