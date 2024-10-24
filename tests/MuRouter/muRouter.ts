import {MuRouter} from "../../src/MuRouter";

const router = new MuRouter();

const callback = (ev: any) => {
    console.log('Gen url:' + router.makeUrl(ev.routeName, ev.parameters));
    console.log(ev);
}

// console.log(window);
// window = {};

router.addRoute(
    'aa',
    'foo/<slug [barfo]+></+id=123></edit-+idEdit=>',
    callback
);


// @ts-ignore
console.log(router.routes.aa);

for (const url of [
    'foo/bar/456',
    'foo/bar/123',
    'foo/bar',
    'foo/goo',
    'foo/ffoo',
    'foo/rfrf/eee/edit-7896',
    'none',
]) {
    console.log("Trying: " + url);
    router.route(url);
    console.log("\n");
}