
var React = require('react');
var ReactDOM = require('react-dom');
var ReactTestUtils = require('react-addons-test-utils');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var IndexRoute = ReactRouter.IndexRoute;

var ReactRouterNamedRoutes = require("../build/index");
var NamedURLResolverClass = ReactRouterNamedRoutes.NamedURLResolverClass;
var NamedURLResolver = ReactRouterNamedRoutes.NamedURLResolver;
var Link = ReactRouterNamedRoutes.Link;
var createBrowserHistory = require('history/lib/createBrowserHistory');

var expect = require('chai').expect;

var Component = React.createClass({
    render: function() {}
});

var createComplexRouteTree = function() {
    return (
        React.createElement(Route, {component: Component, name: 'root', path: '/'}, [
            React.createElement(Route, {component: Component, path: '/app'}, [
                React.createElement(IndexRoute, {name: 'app.index'}),
                React.createElement(Route, {name: 'app.list'})
            ]),

            React.createElement(Route, {name: 'users', path: '/users'}, [
                React.createElement(IndexRoute, {name: 'users.index'}),
                React.createElement(Route, {name: 'users.list', path: '/list'}),
                React.createElement(Route, {name: 'users.show', path: '/:id'}),
                React.createElement(Route, {path: '/:id/edit'})
            ])
        ])
    );
};

describe('NamedURLResolver', function() {

    var resolver;
    beforeEach(() => {
        resolver = new NamedURLResolverClass();
    });

    it('correctly maps route tree #1', function() {
        resolver = new NamedURLResolverClass();
        resolver.mergeRouteTree(
            React.createElement(Route, {}, [
                React.createElement(Route, {name: 'users.show', path: '/users/:id'}),
                React.createElement(Route, {path: '/user/:id-parent/:id', name: 'test1'}),
                React.createElement(Route, {path: '/user/semi:colon/:colon', name: 'test2'})
            ])
        );

        expect(resolver.routesMap).to.deep.equal({
            'users.show': '/users/:id',
            'test1': '/user/:id-parent/:id',
            'test2': '/user/semi:colon/:colon'
        });
    });

    it('correctly maps route tree #2', function() {
        resolver = new NamedURLResolverClass();
        resolver.mergeRouteTree([
            React.createElement(Route, {name: 'users.show', path: '/users/:id'}),
            React.createElement(Route, {path: '/user/:id-parent/:id', name: 'test1'}),
            React.createElement(Route, {path: '/user/semi:colon/:colon', name: 'test2'})
        ]);

        expect(resolver.routesMap).to.deep.equal({
            'users.show': '/users/:id',
            'test1': '/user/:id-parent/:id',
            'test2': '/user/semi:colon/:colon'
        });
    });

    it('correctly maps route tree #3', function() {
        resolver = new NamedURLResolverClass();
        resolver.mergeRouteTree((
            React.createElement(Route, {component: Component, path: '/'}, [
                React.createElement(Route, {component: Component}, [
                    React.createElement(IndexRoute, {component: Component}),
                    React.createElement(Route, {name: 'deeply-nested', component: Component})
                ]),
                React.createElement(Route, {path: '*', component: Component}),
                React.createElement(Route)
            ])
        ));

        expect(resolver.routesMap).to.deep.equal({'deeply-nested': '/'});
    });

    it('correctly maps route tree #4', function() {
        resolver.mergeRouteTree(createComplexRouteTree());
        expect(resolver.routesMap).to.deep.equal({
            'root': '/',
            'app.index': '/app',
            'app.list': '/app',

            'users': '/users',
            'users.index': '/users',
            'users.list': '/users/list',
            'users.show': '/users/:id'
        });
    });

    it('correctly escapes route parameters', function() {
        expect(resolver.escape(':abc')).to.equal('_abc');
        expect(resolver.escape(':abc/:zxd')).to.equal('_abc__zxd');
        expect(resolver.escape(undefined)).to.equal("");
    });

    it('correctly resolve named routes', function() {
        resolver.mergeRouteTree(createComplexRouteTree());
        expect(resolver.resolve("root")).to.equal("/");
        expect(resolver.resolve("app.index")).to.equal("/app");
        expect(resolver.resolve("app.list")).to.equal("/app");

        expect(resolver.resolve("users")).to.equal("/users");
        expect(resolver.resolve("users.index")).to.equal("/users");
        expect(resolver.resolve("users.list")).to.equal("/users/list");
        expect(resolver.resolve("users.show")).to.equal("/users/:id");
    });

    it('correctly formats named routes', function() {
        resolver.mergeRouteTree([
            React.createElement(Route, {name: 'users.show', path: '/users/:id'}),
            React.createElement(Route, {path: '/users/:id-parent/:id', name: 'test1'}),
            React.createElement(Route, {path: '/users/semi:colon/:colon', name: 'test2'})
        ]);

        expect(resolver.resolve("users.show", {id: 4})).to.equal("/users/4");
        expect(resolver.resolve("test1", {id: 4, 'id-parent': 5})).to.equal("/users/5/4");
        expect(resolver.resolve("test2", {colon: 7})).to.equal("/users/semi:colon/7");

        expect(resolver.resolve("users.show", {id: 'id/:id'})).to.equal("/users/id__id");
        expect(resolver.resolve("test1", {id: 'id/:id', 'id-parent': 'idp:id'})).to.equal("/users/idp_id/id__id");
        expect(resolver.resolve("test2", {colon: 'colon:colon'})).to.equal("/users/semi:colon/colon_colon");
    });

});


describe('Link', function() {

    afterEach(() => {
        NamedURLResolver.reset();
        // document.body.removeChild(document.body.children[0]);
    });

    function render(element, tag) {
        var DOMComponent = ReactTestUtils.renderIntoDocument(
            element
        );
        var RenderedComponent = ReactTestUtils.findRenderedDOMComponentWithTag(
            DOMComponent,
            tag
        );
        return RenderedComponent;
    };

    it('correctly renders <Link /> elements', function() {
        NamedURLResolver.mergeRouteTree(createComplexRouteTree());

        var TestComponent = React.createClass({
            render: function() {
                return (
                    React.createElement('div', {}, [
                        React.createElement(Link, {to: 'root'}),
                        React.createElement(Link, {to: 'app.index'}),
                        React.createElement(Link, {to: 'app.list'}),
                        React.createElement(Link, {to: 'users'}),
                        React.createElement(Link, {to: 'users.index'}),
                        React.createElement(Link, {to: 'users.list'}),
                        React.createElement(Link, {to: 'users.show'}),
                        React.createElement(Link, {to: 'users.show', params: {id: 4}}),
                        React.createElement(Link, {to: 'users.show', params: {id: ':mal/ici/:ous'}}),

                        React.createElement(Link, {to: '/some-unnamed-path'}),
                        React.createElement(Link, {to: '/'}),
                        React.createElement(Link, {to: '/users'}),
                        React.createElement(Link, {to: '/users/5'})
                    ])
                )
            }
        });

        var root = render(
            React.createElement(Router, {}, [
                React.createElement(Route, {path: '/', component: TestComponent})
            ]),
            'div'
        );
        expect(root).to.be.ok;

        expect(root.children.length).to.equal(13);
        var i = 0;
        expect(root.children[i++].getAttribute('href')).to.equal('#/');
        expect(root.children[i++].getAttribute('href')).to.equal('#/app');
        expect(root.children[i++].getAttribute('href')).to.equal('#/app');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users/list');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users/:id');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users/4');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users/_mal_ici__ous');

        expect(root.children[i++].getAttribute('href')).to.equal('#/some-unnamed-path');
        expect(root.children[i++].getAttribute('href')).to.equal('#/');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users');
        expect(root.children[i++].getAttribute('href')).to.equal('#/users/5');
    });

    it('correctly renders <Link /> elements with custom resolver', function() {
        var resolver = new NamedURLResolverClass();
        resolver.mergeRouteTree([
            React.createElement(Route, {path: '/users/:id', name: 'users.show'}),
            React.createElement(Route, {path: '/user/:id-parent/:id', name: 'test1'}),
            React.createElement(Route, {path: '/user/semi:colon/:colon', name: 'test2'})
        ]);

        var TestComponent = React.createClass({
            render: function() {
                return (
                    React.createElement('div', {}, [
                        React.createElement(Link, {to: 'users.show', resolver: resolver}),
                        React.createElement(Link, {to: 'test1', resolver: resolver}),
                        React.createElement(Link, {to: 'test2', resolver: resolver})
                    ])
                )
            }
        });

        var root = render(
            React.createElement(Router, {}, [
                React.createElement(Route, {path: '/', component: TestComponent})
            ]),
            'div'
        );
        expect(root).to.be.ok;

        expect(root.children.length).to.equal(3);
        var i = 0;
        expect(root.children[i++].getAttribute('href')).to.equal('#/users/:id');
        expect(root.children[i++].getAttribute('href')).to.equal('#/user/:id-parent/:id');
        expect(root.children[i++].getAttribute('href')).to.equal('#/user/semi:colon/:colon');
    });

});