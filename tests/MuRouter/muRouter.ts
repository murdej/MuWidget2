import {MuRouter} from "../../lib/MuRouter";

const router = new MuRouter();

const callback = (ev: any) => console.log(ev);

// console.log(window);
// window = {};

router.addRoute(
    'aa',
    'foo/<slug>/<id>',
    callback
);


// @ts-ignore
console.log(router.routes.aa);

for (const url of [
    'foo/bar/123',
    'foo/bar',
    'none',
]) {
    console.log("Trying: " + url);
    router.route(url);
}